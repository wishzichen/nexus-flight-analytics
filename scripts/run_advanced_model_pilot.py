"""Advanced pilot modeling pipeline for flight delay prediction.

This script runs a complete, journal-style pilot experiment on the already
joined BTS + ASOS sample. It intentionally avoids non-installed packages such
as LightGBM/XGBoost/CatBoost, while still providing a strong comparison set:

- Naive historical baseline
- Logistic regression
- Random forest
- ExtraTrees
- HistGradientBoosting
- MLP
- PyTorch tabular transformer
- Validation-trained stacking ensemble

Outputs are written to analysis_results/model_pilot/.
"""

from __future__ import annotations

import json
import math
import random
from dataclasses import dataclass
from pathlib import Path

import matplotlib.pyplot as plt
import networkx as nx
import numpy as np
import pandas as pd
import torch
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import ExtraTreesClassifier, HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    log_loss,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "modeling_data" / "bts_nyc_weather_sample_2024_01.csv"
OUT_DIR = ROOT / "analysis_results" / "model_pilot"
RANDOM_STATE = 42


NUMERIC_FEATURES = [
    "DayofMonth",
    "DayOfWeek",
    "sched_dep_hour",
    "Distance",
    "CRSElapsedTime",
    "tmpf",
    "dwpf",
    "relh",
    "drct",
    "sknt",
    "vsby",
    "skyl1",
    "origin_hour_flights",
    "origin_hour_cancel_rate",
    "origin_prev_hour_delay_rate",
    "origin_prev_hour_mean_dep_delay",
    "dest_in_degree",
    "dest_out_degree",
    "dest_pagerank",
    "route_scheduled_count",
    "carrier_origin_scheduled_count",
]

CATEGORICAL_FEATURES = [
    "Reporting_Airline",
    "Origin",
    "Dest",
    "DepTimeBlk",
    "ArrTimeBlk",
    "skyc1",
    "weather_flag",
]

TARGET = "dep_delay_15"
REG_TARGET = "DepDelayMinutes"


def set_seed(seed: int = RANDOM_STATE) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)


def load_and_engineer() -> pd.DataFrame:
    df = pd.read_csv(DATA_PATH, low_memory=False)
    df["FlightDate"] = pd.to_datetime(df["FlightDate"])
    df["sched_dep_hour"] = pd.to_numeric(df["sched_dep_hour"], errors="coerce").fillna(0).astype(int)
    if "DepTimeBlk" not in df.columns:
        df["DepTimeBlk"] = df["sched_dep_hour"].map(lambda h: f"{int(h):02d}00-{int(h):02d}59")
    if "ArrTimeBlk" not in df.columns:
        arr_hour = pd.to_numeric(df.get("CRSArrTime"), errors="coerce").fillna(0).astype(int).floordiv(100).clip(0, 23)
        df["ArrTimeBlk"] = arr_hour.map(lambda h: f"{int(h):02d}00-{int(h):02d}59")
    df["weather_flag"] = np.where(df["wxcodes"].fillna("").astype(str).isin(["", "M", "nan"]), "NONE", "WX")
    df["route"] = df["Origin"].astype(str) + "-" + df["Dest"].astype(str)

    # Airport-hour pressure features. The shifted delay feature avoids using
    # the current airport-hour outcome as a predictor.
    hour_group = (
        df.groupby(["FlightDate", "Origin", "sched_dep_hour"], as_index=False)
        .agg(
            origin_hour_flights=("Flight_Number_Reporting_Airline", "count"),
            origin_hour_cancel_rate=("cancel_or_divert", "mean"),
            origin_hour_delay_rate=("dep_delay_15", "mean"),
            origin_hour_mean_dep_delay=("DepDelayMinutes", "mean"),
        )
        .sort_values(["Origin", "FlightDate", "sched_dep_hour"])
    )
    hour_group["origin_prev_hour_delay_rate"] = hour_group.groupby("Origin")["origin_hour_delay_rate"].shift(1)
    hour_group["origin_prev_hour_mean_dep_delay"] = hour_group.groupby("Origin")[
        "origin_hour_mean_dep_delay"
    ].shift(1)
    df = df.merge(
        hour_group[
            [
                "FlightDate",
                "Origin",
                "sched_dep_hour",
                "origin_hour_flights",
                "origin_hour_cancel_rate",
                "origin_prev_hour_delay_rate",
                "origin_prev_hour_mean_dep_delay",
            ]
        ],
        on=["FlightDate", "Origin", "sched_dep_hour"],
        how="left",
    )

    route_counts = df.groupby("route").size().rename("route_scheduled_count")
    carrier_origin_counts = (
        df.groupby(["Reporting_Airline", "Origin"]).size().rename("carrier_origin_scheduled_count")
    )
    df = df.join(route_counts, on="route")
    df = df.join(carrier_origin_counts, on=["Reporting_Airline", "Origin"])

    # Build a directed airport graph from observed traffic in the sample.
    graph = nx.DiGraph()
    for (origin, dest), weight in df.groupby(["Origin", "Dest"]).size().items():
        graph.add_edge(origin, dest, weight=float(weight))
    in_degree = dict(graph.in_degree(weight="weight"))
    out_degree = dict(graph.out_degree(weight="weight"))
    pagerank = nx.pagerank(graph, weight="weight")
    df["dest_in_degree"] = df["Dest"].map(in_degree).fillna(0)
    df["dest_out_degree"] = df["Dest"].map(out_degree).fillna(0)
    df["dest_pagerank"] = df["Dest"].map(pagerank).fillna(0)

    for col in NUMERIC_FEATURES:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    for col in CATEGORICAL_FEATURES:
        df[col] = df[col].fillna("UNKNOWN").astype(str)
    df[TARGET] = df[TARGET].astype(int)
    df[REG_TARGET] = pd.to_numeric(df[REG_TARGET], errors="coerce").fillna(0).clip(lower=0)
    return df


def split_by_time(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    train = df[df["DayofMonth"] <= 18].copy()
    val = df[(df["DayofMonth"] >= 19) & (df["DayofMonth"] <= 24)].copy()
    test = df[df["DayofMonth"] >= 25].copy()
    return train, val, test


def build_preprocessor(sparse: bool = False) -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("num", Pipeline([("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler())]), NUMERIC_FEATURES),
            (
                "cat",
                Pipeline(
                    [
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=sparse, min_frequency=3)),
                    ]
                ),
                CATEGORICAL_FEATURES,
            ),
        ],
        sparse_threshold=0.0,
    )


def evaluate_classifier(name: str, y_true: np.ndarray, proba: np.ndarray) -> dict[str, float | str]:
    pred = (proba >= 0.5).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, pred, labels=[0, 1]).ravel()
    return {
        "model": name,
        "roc_auc": roc_auc_score(y_true, proba),
        "pr_auc": average_precision_score(y_true, proba),
        "f1": f1_score(y_true, pred, zero_division=0),
        "precision": precision_score(y_true, pred, zero_division=0),
        "recall": recall_score(y_true, pred, zero_division=0),
        "specificity": tn / (tn + fp) if (tn + fp) else np.nan,
        "brier": brier_score_loss(y_true, proba),
        "log_loss": log_loss(y_true, np.clip(proba, 1e-6, 1 - 1e-6)),
    }


def build_sklearn_models() -> dict[str, Pipeline]:
    return {
        "Logistic_L2": Pipeline(
            [
                ("prep", build_preprocessor()),
                ("clf", LogisticRegression(max_iter=1000, class_weight="balanced", n_jobs=-1, random_state=RANDOM_STATE)),
            ]
        ),
        "RandomForest": Pipeline(
            [
                ("prep", build_preprocessor()),
                (
                    "clf",
                    RandomForestClassifier(
                        n_estimators=240,
                        max_depth=16,
                        min_samples_leaf=8,
                        class_weight="balanced_subsample",
                        n_jobs=-1,
                        random_state=RANDOM_STATE,
                    ),
                ),
            ]
        ),
        "ExtraTrees": Pipeline(
            [
                ("prep", build_preprocessor()),
                (
                    "clf",
                    ExtraTreesClassifier(
                        n_estimators=300,
                        max_depth=18,
                        min_samples_leaf=5,
                        class_weight="balanced",
                        n_jobs=-1,
                        random_state=RANDOM_STATE,
                    ),
                ),
            ]
        ),
        "HistGradientBoosting": Pipeline(
            [
                ("prep", build_preprocessor()),
                (
                    "clf",
                    HistGradientBoostingClassifier(
                        max_iter=260,
                        learning_rate=0.045,
                        max_leaf_nodes=31,
                        l2_regularization=0.05,
                        random_state=RANDOM_STATE,
                    ),
                ),
            ]
        ),
        "MLP": Pipeline(
            [
                ("prep", build_preprocessor()),
                (
                    "clf",
                    MLPClassifier(
                        hidden_layer_sizes=(96, 48),
                        activation="relu",
                        alpha=0.001,
                        batch_size=512,
                        learning_rate_init=0.001,
                        max_iter=120,
                        early_stopping=True,
                        random_state=RANDOM_STATE,
                    ),
                ),
            ]
        ),
    }


@dataclass
class TorchData:
    x_num: torch.Tensor
    x_cat: torch.Tensor
    y: torch.Tensor


class TabTransformer(torch.nn.Module):
    def __init__(self, num_numeric: int, cat_cardinalities: list[int], emb_dim: int = 16):
        super().__init__()
        self.embeddings = torch.nn.ModuleList(
            [torch.nn.Embedding(cardinality, emb_dim) for cardinality in cat_cardinalities]
        )
        self.cls = torch.nn.Parameter(torch.zeros(1, 1, emb_dim))
        encoder_layer = torch.nn.TransformerEncoderLayer(
            d_model=emb_dim, nhead=4, dim_feedforward=64, dropout=0.10, batch_first=True
        )
        self.transformer = torch.nn.TransformerEncoder(encoder_layer, num_layers=2)
        self.num_net = torch.nn.Sequential(
            torch.nn.Linear(num_numeric, 48), torch.nn.ReLU(), torch.nn.BatchNorm1d(48), torch.nn.Dropout(0.10)
        )
        self.head = torch.nn.Sequential(
            torch.nn.Linear(emb_dim + 48, 64),
            torch.nn.ReLU(),
            torch.nn.Dropout(0.15),
            torch.nn.Linear(64, 1),
        )

    def forward(self, x_num: torch.Tensor, x_cat: torch.Tensor) -> torch.Tensor:
        tokens = [emb(x_cat[:, idx]) for idx, emb in enumerate(self.embeddings)]
        x_tokens = torch.stack(tokens, dim=1)
        cls = self.cls.expand(x_tokens.shape[0], -1, -1)
        x_tokens = torch.cat([cls, x_tokens], dim=1)
        x_tokens = self.transformer(x_tokens)
        cat_repr = x_tokens[:, 0, :]
        num_repr = self.num_net(x_num)
        return self.head(torch.cat([cat_repr, num_repr], dim=1)).squeeze(1)


class TorchTabularWrapper:
    def __init__(self, epochs: int = 18, batch_size: int = 512, lr: float = 0.001):
        self.epochs = epochs
        self.batch_size = batch_size
        self.lr = lr
        self.num_medians: pd.Series | None = None
        self.num_mean: pd.Series | None = None
        self.num_std: pd.Series | None = None
        self.cat_maps: dict[str, dict[str, int]] = {}
        self.model: TabTransformer | None = None

    def _fit_transform(self, df: pd.DataFrame, fit: bool) -> TorchData:
        x_num = df[NUMERIC_FEATURES].copy()
        if fit:
            self.num_medians = x_num.median()
            x_num = x_num.fillna(self.num_medians)
            self.num_mean = x_num.mean()
            self.num_std = x_num.std().replace(0, 1)
        assert self.num_medians is not None and self.num_mean is not None and self.num_std is not None
        x_num = x_num.fillna(self.num_medians)
        x_num = (x_num - self.num_mean) / self.num_std

        cat_arrays = []
        for col in CATEGORICAL_FEATURES:
            vals = df[col].fillna("UNKNOWN").astype(str)
            if fit:
                vocab = {value: idx + 1 for idx, value in enumerate(sorted(vals.unique()))}
                vocab["__UNK__"] = 0
                self.cat_maps[col] = vocab
            vocab = self.cat_maps[col]
            cat_arrays.append(vals.map(lambda v: vocab.get(v, 0)).astype(int).to_numpy())
        x_cat = np.vstack(cat_arrays).T
        y = df[TARGET].to_numpy(dtype=np.float32)
        return TorchData(
            torch.tensor(x_num.to_numpy(dtype=np.float32)),
            torch.tensor(x_cat, dtype=torch.long),
            torch.tensor(y, dtype=torch.float32),
        )

    def fit(self, train: pd.DataFrame, val: pd.DataFrame) -> "TorchTabularWrapper":
        train_data = self._fit_transform(train, fit=True)
        val_data = self._fit_transform(val, fit=False)
        cat_cards = [max(mapping.values()) + 1 for mapping in self.cat_maps.values()]
        self.model = TabTransformer(len(NUMERIC_FEATURES), cat_cards)
        pos_weight = torch.tensor([(len(train) - train[TARGET].sum()) / max(train[TARGET].sum(), 1)])
        criterion = torch.nn.BCEWithLogitsLoss(pos_weight=pos_weight)
        optimizer = torch.optim.AdamW(self.model.parameters(), lr=self.lr, weight_decay=1e-4)
        best_state = None
        best_auc = -np.inf
        patience = 4
        stale = 0
        n = len(train_data.y)
        for _epoch in range(self.epochs):
            self.model.train()
            order = torch.randperm(n)
            for start in range(0, n, self.batch_size):
                idx = order[start : start + self.batch_size]
                optimizer.zero_grad()
                logits = self.model(train_data.x_num[idx], train_data.x_cat[idx])
                loss = criterion(logits, train_data.y[idx])
                loss.backward()
                optimizer.step()
            proba = self._predict_tensor(val_data)
            auc = roc_auc_score(val_data.y.numpy(), proba)
            if auc > best_auc:
                best_auc = auc
                best_state = {k: v.detach().clone() for k, v in self.model.state_dict().items()}
                stale = 0
            else:
                stale += 1
                if stale >= patience:
                    break
        if best_state is not None:
            self.model.load_state_dict(best_state)
        return self

    def _predict_tensor(self, data: TorchData) -> np.ndarray:
        assert self.model is not None
        self.model.eval()
        probs = []
        with torch.no_grad():
            for start in range(0, len(data.y), self.batch_size):
                logits = self.model(data.x_num[start : start + self.batch_size], data.x_cat[start : start + self.batch_size])
                probs.append(torch.sigmoid(logits).cpu().numpy())
        return np.concatenate(probs)

    def predict_proba(self, df: pd.DataFrame) -> np.ndarray:
        data = self._fit_transform(df, fit=False)
        return self._predict_tensor(data)


def regression_baseline(train: pd.DataFrame, val: pd.DataFrame, test: pd.DataFrame, val_preds: pd.DataFrame, test_preds: pd.DataFrame) -> pd.DataFrame:
    # A lightweight stacked regression target: delay minutes. Uses classifier
    # probabilities as risk features plus original numeric/categorical features.
    rows = []
    prep = build_preprocessor()
    x_train = prep.fit_transform(train[NUMERIC_FEATURES + CATEGORICAL_FEATURES])
    x_val = prep.transform(val[NUMERIC_FEATURES + CATEGORICAL_FEATURES])
    x_test = prep.transform(test[NUMERIC_FEATURES + CATEGORICAL_FEATURES])
    models = {
        "Ridge_minutes": Ridge(alpha=3.0),
    }
    for name, model in models.items():
        model.fit(x_train, train[REG_TARGET])
        for split, x, y in [("val", x_val, val[REG_TARGET]), ("test", x_test, test[REG_TARGET])]:
            pred = np.clip(model.predict(x), 0, None)
            rows.append(
                {
                    "model": name,
                    "split": split,
                    "mae": mean_absolute_error(y, pred),
                    "rmse": math.sqrt(mean_squared_error(y, pred)),
                }
            )
    # A risk-to-minutes stacked regressor, trained on validation and tested on test.
    meta = Ridge(alpha=1.0)
    common_cols = [col for col in val_preds.columns if col != "y_true" and col in test_preds.columns]
    meta.fit(val_preds[common_cols], val[REG_TARGET])
    pred = np.clip(meta.predict(test_preds[common_cols]), 0, None)
    rows.append(
        {
            "model": "RiskStack_minutes",
            "split": "test",
            "mae": mean_absolute_error(test[REG_TARGET], pred),
            "rmse": math.sqrt(mean_squared_error(test[REG_TARGET], pred)),
        }
    )
    return pd.DataFrame(rows)


def plot_metrics(metrics: pd.DataFrame) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    test = metrics[metrics["split"] == "test"].sort_values("pr_auc", ascending=False)
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.barh(test["model"], test["pr_auc"], color="#2a9d8f")
    ax.set_xlabel("PR-AUC")
    ax.set_title("Test PR-AUC by Model")
    ax.invert_yaxis()
    fig.tight_layout()
    fig.savefig(OUT_DIR / "classification_pr_auc.png", dpi=180)
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(10, 5))
    ax.barh(test["model"], test["roc_auc"], color="#457b9d")
    ax.set_xlabel("ROC-AUC")
    ax.set_title("Test ROC-AUC by Model")
    ax.invert_yaxis()
    fig.tight_layout()
    fig.savefig(OUT_DIR / "classification_roc_auc.png", dpi=180)
    plt.close(fig)


def main() -> None:
    set_seed()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    df = load_and_engineer()
    train, val, test = split_by_time(df)

    y_train = train[TARGET].to_numpy()
    y_val = val[TARGET].to_numpy()
    y_test = test[TARGET].to_numpy()
    metrics: list[dict[str, float | str]] = []

    prior = np.repeat(y_train.mean(), len(test))
    metrics.append({"split": "test", **evaluate_classifier("Naive_train_prior", y_test, prior)})

    val_base = pd.DataFrame({"y_true": y_val})
    test_base = pd.DataFrame({"y_true": y_test})
    models = build_sklearn_models()
    trained_models: dict[str, Pipeline] = {}
    for name, model in models.items():
        print(f"training {name}")
        model.fit(train[NUMERIC_FEATURES + CATEGORICAL_FEATURES], y_train)
        trained_models[name] = model
        for split_name, split_df, y in [("val", val, y_val), ("test", test, y_test)]:
            proba = model.predict_proba(split_df[NUMERIC_FEATURES + CATEGORICAL_FEATURES])[:, 1]
            metrics.append({"split": split_name, **evaluate_classifier(name, y, proba)})
            if split_name == "val":
                val_base[name] = proba
            else:
                test_base[name] = proba

    print("training TabTransformer")
    tab = TorchTabularWrapper()
    tab.fit(train, val)
    for split_name, split_df, y in [("val", val, y_val), ("test", test, y_test)]:
        proba = tab.predict_proba(split_df)
        metrics.append({"split": split_name, **evaluate_classifier("Torch_TabTransformer", y, proba)})
        if split_name == "val":
            val_base["Torch_TabTransformer"] = proba
        else:
            test_base["Torch_TabTransformer"] = proba

    print("training validation stacker")
    meta_features = [col for col in val_base.columns if col != "y_true"]
    stacker = LogisticRegression(max_iter=1000, class_weight="balanced", random_state=RANDOM_STATE)
    stacker.fit(val_base[meta_features], y_val)
    stack_proba = stacker.predict_proba(test_base[meta_features])[:, 1]
    metrics.append({"split": "test", **evaluate_classifier("Validation_Stacked_Ensemble", y_test, stack_proba)})
    test_base["Validation_Stacked_Ensemble"] = stack_proba

    metrics_df = pd.DataFrame(metrics).sort_values(["split", "pr_auc"], ascending=[True, False])
    metrics_df.to_csv(OUT_DIR / "classification_metrics.csv", index=False)
    val_base.to_csv(OUT_DIR / "validation_base_predictions.csv", index=False)
    test_base.to_csv(OUT_DIR / "test_base_predictions.csv", index=False)

    reg_df = regression_baseline(train, val, test, val_base, test_base)
    reg_df.to_csv(OUT_DIR / "regression_minutes_metrics.csv", index=False)

    # Permutation importance for the best available sklearn model on test PR-AUC.
    sklearn_test = metrics_df[(metrics_df["split"] == "test") & (metrics_df["model"].isin(trained_models.keys()))]
    best_name = sklearn_test.sort_values("pr_auc", ascending=False).iloc[0]["model"]
    best_model = trained_models[str(best_name)]
    print(f"permutation importance for {best_name}")
    perm = permutation_importance(
        best_model,
        test[NUMERIC_FEATURES + CATEGORICAL_FEATURES],
        y_test,
        n_repeats=5,
        random_state=RANDOM_STATE,
        scoring="average_precision",
        n_jobs=-1,
    )
    importance = pd.DataFrame(
        {
            "feature": NUMERIC_FEATURES + CATEGORICAL_FEATURES,
            "importance_mean": perm.importances_mean,
            "importance_std": perm.importances_std,
        }
    ).sort_values("importance_mean", ascending=False)
    importance.to_csv(OUT_DIR / "permutation_importance.csv", index=False)

    plot_metrics(metrics_df)
    summary = {
        "rows": int(len(df)),
        "train_rows": int(len(train)),
        "validation_rows": int(len(val)),
        "test_rows": int(len(test)),
        "target_rate_train": float(y_train.mean()),
        "target_rate_validation": float(y_val.mean()),
        "target_rate_test": float(y_test.mean()),
        "best_test_model_by_pr_auc": str(metrics_df[metrics_df["split"] == "test"].sort_values("pr_auc", ascending=False).iloc[0]["model"]),
        "best_test_pr_auc": float(metrics_df[metrics_df["split"] == "test"]["pr_auc"].max()),
        "best_sklearn_for_importance": str(best_name),
    }
    (OUT_DIR / "run_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
