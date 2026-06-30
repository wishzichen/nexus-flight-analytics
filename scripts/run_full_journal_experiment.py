"""Full 2018-2025 journal-grade flight delay experiment.

Pipeline:
1. Build a full feature table from BTS monthly zips + IEM ASOS weather files.
2. Train and compare advanced models on temporal splits.
3. Produce model metrics, stacking results, SHAP explanations, and summary files.

The full public data are large, so this script is chunk-friendly. Heavy models
can be capped with --heavy-model-max-rows while the feature table and evaluation
remain based on the full selected airport set.
"""

from __future__ import annotations

import argparse
import gc
import json
import math
import re
import zipfile
from pathlib import Path

import catboost as cb
import lightgbm as lgb
import matplotlib.pyplot as plt
import networkx as nx
import numpy as np
import pandas as pd
import shap
import xgboost as xgb
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import ExtraTreesClassifier, HistGradientBoostingClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression, SGDClassifier
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    log_loss,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, OrdinalEncoder, StandardScaler
from tqdm import tqdm


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "external_datasets"
OUT = ROOT / "analysis_results" / "full_journal_experiment"
FEATURE_DIR = ROOT / "modeling_data" / "full_2018_2025"
FEATURE_FILE = FEATURE_DIR / "flight_delay_features_2018_2025.parquet"
WEATHER_CACHE = FEATURE_DIR / "weather_hourly_2018_2025.parquet"

TARGET_AIRPORTS = [
    "ATL",
    "LAX",
    "ORD",
    "DFW",
    "DEN",
    "JFK",
    "SFO",
    "SEA",
    "LAS",
    "MCO",
    "EWR",
    "CLT",
    "PHX",
    "IAH",
    "MIA",
    "BOS",
    "MSP",
    "FLL",
    "DTW",
    "PHL",
    "LGA",
    "BWI",
    "SLC",
    "DCA",
    "SAN",
    "IAD",
    "TPA",
    "HNL",
    "MDW",
    "BNA",
    "DAL",
    "AUS",
    "RDU",
    "STL",
    "MSY",
    "SMF",
    "SJC",
    "OAK",
    "PDX",
    "CLE",
]

BTS_COLUMNS = [
    "Year",
    "Month",
    "DayofMonth",
    "DayOfWeek",
    "FlightDate",
    "Reporting_Airline",
    "Tail_Number",
    "Flight_Number_Reporting_Airline",
    "Origin",
    "Dest",
    "CRSDepTime",
    "DepDelayMinutes",
    "DepDel15",
    "TaxiOut",
    "CRSArrTime",
    "ArrDelayMinutes",
    "ArrDel15",
    "Cancelled",
    "CancellationCode",
    "Diverted",
    "CRSElapsedTime",
    "AirTime",
    "Distance",
    "CarrierDelay",
    "WeatherDelay",
    "NASDelay",
    "SecurityDelay",
    "LateAircraftDelay",
]

NUMERIC_FEATURES = [
    "Year",
    "Month",
    "DayofMonth",
    "DayOfWeek",
    "sched_dep_hour",
    "sched_arr_hour",
    "dep_hour_sin",
    "dep_hour_cos",
    "arr_hour_sin",
    "arr_hour_cos",
    "dow_sin",
    "dow_cos",
    "month_sin",
    "month_cos",
    "Distance",
    "CRSElapsedTime",
    "TaxiOut",
    "tmpf",
    "dwpf",
    "relh",
    "drct",
    "sknt",
    "vsby",
    "skyl1",
    "airport_hour_departures",
    "airport_hour_arrivals",
    "airport_hour_total",
    "airport_prev_hour_delay_rate",
    "airport_prev_hour_mean_delay",
    "airport_prev_hour_cancel_rate",
    "airport_rolling_6h_delay_rate",
    "airport_rolling_6h_volume",
    "airport_rolling_24h_delay_rate",
    "airport_rolling_24h_volume",
    "route_month_count",
    "carrier_origin_month_count",
    "route_prev_month_delay_rate",
    "route_rolling_3m_delay_rate",
    "route_prev_month_mean_delay",
    "carrier_origin_prev_month_delay_rate",
    "carrier_origin_rolling_3m_delay_rate",
    "origin_prev_month_delay_rate",
    "dest_prev_month_delay_rate",
    "origin_capacity_ratio",
    "route_share_at_origin",
    "dest_in_degree",
    "dest_out_degree",
    "dest_pagerank",
    "origin_out_degree",
    "origin_pagerank",
    "runway_count",
    "max_runway_length_ft",
    "mean_runway_length_ft",
    "weather_capacity_risk_index",
]

CATEGORICAL_FEATURES = [
    "Reporting_Airline",
    "Origin",
    "Dest",
    "route",
    "carrier_origin",
    "dep_time_block",
    "arr_time_block",
    "weather_flag",
    "skyc1",
]

TARGET = "dep_delay_15"


def hhmm_hour(value: object) -> float:
    if pd.isna(value):
        return np.nan
    try:
        return min(int(float(value)) // 100, 23)
    except Exception:
        return np.nan


def time_block(hour: object) -> str:
    if pd.isna(hour):
        return "UNKNOWN"
    h = int(hour)
    return f"{h:02d}00-{h:02d}59"


def parse_year_month(path: Path) -> tuple[int, int]:
    match = re.search(r"_(\d{4})_(\d{1,2})\.zip$", path.name)
    if not match:
        raise ValueError(path.name)
    return int(match.group(1)), int(match.group(2))


def read_bts_zip(path: Path) -> pd.DataFrame:
    with zipfile.ZipFile(path) as zf:
        csv_name = next(name for name in zf.namelist() if name.lower().endswith(".csv"))
        with zf.open(csv_name) as handle:
            return pd.read_csv(handle, usecols=lambda c: c in BTS_COLUMNS, low_memory=False)


def load_weather() -> pd.DataFrame:
    FEATURE_DIR.mkdir(parents=True, exist_ok=True)
    if WEATHER_CACHE.exists():
        return pd.read_parquet(WEATHER_CACHE)
    frames = []
    for path in tqdm(sorted((DATA / "weather_iem").glob("asos_*_20*.csv")), desc="weather"):
        if path.name == "nyc_asos_2024_01.csv":
            continue
        df = pd.read_csv(path, na_values=["M"], low_memory=False)
        df["valid_hour"] = pd.to_datetime(df["valid"], utc=True, errors="coerce").dt.floor("h").dt.tz_localize(None)
        numeric = ["tmpf", "dwpf", "relh", "drct", "sknt", "vsby", "feel", "skyl1"]
        for col in numeric:
            df[col] = pd.to_numeric(df[col], errors="coerce")
        df = df[df["station"].isin(TARGET_AIRPORTS)]
        agg = (
            df.groupby(["station", "valid_hour"], as_index=False)
            .agg(
                tmpf=("tmpf", "mean"),
                dwpf=("dwpf", "mean"),
                relh=("relh", "mean"),
                drct=("drct", "mean"),
                sknt=("sknt", "mean"),
                vsby=("vsby", "mean"),
                skyl1=("skyl1", "mean"),
                skyc1=("skyc1", lambda s: s.dropna().mode().iloc[0] if not s.dropna().empty else "UNKNOWN"),
                wxcodes=("wxcodes", lambda s: ";".join(sorted({str(x) for x in s.dropna() if str(x) != "nan"}))),
            )
        )
        frames.append(agg)
    weather = pd.concat(frames, ignore_index=True)
    weather["weather_flag"] = np.where(weather["wxcodes"].fillna("").eq(""), "NONE", "WX")
    weather = weather.drop_duplicates(["station", "valid_hour"])
    weather.to_parquet(WEATHER_CACHE, index=False)
    return weather


def load_runway_features() -> pd.DataFrame:
    airports = pd.read_csv(DATA / "ourairports_airports.csv", low_memory=False)
    runways = pd.read_csv(DATA / "ourairports_runways.csv", low_memory=False)
    airport_map = airports[["id", "iata_code"]].dropna().rename(columns={"id": "airport_ref"})
    merged = runways.merge(airport_map, on="airport_ref", how="left")
    features = (
        merged[merged["iata_code"].isin(TARGET_AIRPORTS)]
        .groupby("iata_code", as_index=False)
        .agg(
            runway_count=("id", "count"),
            max_runway_length_ft=("length_ft", "max"),
            mean_runway_length_ft=("length_ft", "mean"),
        )
        .rename(columns={"iata_code": "Origin"})
    )
    return features


def build_route_graph_features(route_counts: pd.DataFrame) -> pd.DataFrame:
    graph = nx.DiGraph()
    for row in route_counts.itertuples(index=False):
        graph.add_edge(row.Origin, row.Dest, weight=float(row.route_month_count))
    in_degree = dict(graph.in_degree(weight="weight"))
    out_degree = dict(graph.out_degree(weight="weight"))
    pagerank = nx.pagerank(graph, weight="weight") if graph.number_of_edges() else {}
    airports = sorted(set(route_counts["Origin"]).union(set(route_counts["Dest"])))
    return pd.DataFrame(
        {
            "airport": airports,
            "in_degree": [in_degree.get(a, 0.0) for a in airports],
            "out_degree": [out_degree.get(a, 0.0) for a in airports],
            "pagerank": [pagerank.get(a, 0.0) for a in airports],
        }
    )


def build_features() -> None:
    FEATURE_DIR.mkdir(parents=True, exist_ok=True)
    weather = load_weather()
    runway_features = load_runway_features()
    monthly_frames = []
    bts_paths = sorted((DATA / "bts").glob("*.zip"), key=parse_year_month)
    for path in tqdm(bts_paths, desc="bts months"):
        year, month = parse_year_month(path)
        df = read_bts_zip(path)
        df = df[df["Origin"].isin(TARGET_AIRPORTS)].copy()
        if df.empty:
            continue
        df["FlightDate"] = pd.to_datetime(df["FlightDate"], errors="coerce")
        df["sched_dep_hour"] = df["CRSDepTime"].map(hhmm_hour)
        df["sched_arr_hour"] = df["CRSArrTime"].map(hhmm_hour)
        df["dep_time_block"] = df["sched_dep_hour"].map(time_block)
        df["arr_time_block"] = df["sched_arr_hour"].map(time_block)
        df["dep_hour_sin"] = np.sin(2 * np.pi * df["sched_dep_hour"].fillna(0) / 24)
        df["dep_hour_cos"] = np.cos(2 * np.pi * df["sched_dep_hour"].fillna(0) / 24)
        df["arr_hour_sin"] = np.sin(2 * np.pi * df["sched_arr_hour"].fillna(0) / 24)
        df["arr_hour_cos"] = np.cos(2 * np.pi * df["sched_arr_hour"].fillna(0) / 24)
        df["dow_sin"] = np.sin(2 * np.pi * df["DayOfWeek"].fillna(1) / 7)
        df["dow_cos"] = np.cos(2 * np.pi * df["DayOfWeek"].fillna(1) / 7)
        df["month_sin"] = np.sin(2 * np.pi * df["Month"].fillna(1) / 12)
        df["month_cos"] = np.cos(2 * np.pi * df["Month"].fillna(1) / 12)
        df["sched_dep_datetime_utc"] = df["FlightDate"] + pd.to_timedelta(df["sched_dep_hour"].fillna(0), unit="h")
        df["cancel_or_divert"] = ((df["Cancelled"].fillna(0) == 1) | (df["Diverted"].fillna(0) == 1)).astype(int)
        df[TARGET] = (df["DepDelayMinutes"].fillna(0) >= 15).astype(int)
        df["route"] = df["Origin"].astype(str) + "-" + df["Dest"].astype(str)
        df["carrier_origin"] = df["Reporting_Airline"].astype(str) + "-" + df["Origin"].astype(str)

        df = df.merge(
            weather,
            left_on=["Origin", "sched_dep_datetime_utc"],
            right_on=["station", "valid_hour"],
            how="left",
        )
        df = df.merge(runway_features, on="Origin", how="left")

        # Month-level route/carrier counts are known from the schedule, not future outcomes.
        route_counts = df.groupby(["Origin", "Dest"], as_index=False, observed=True).size().rename(columns={"size": "route_month_count"})
        carrier_counts = (
            df.groupby(["Reporting_Airline", "Origin"], as_index=False, observed=True)
            .size()
            .rename(columns={"size": "carrier_origin_month_count"})
        )
        graph_features = build_route_graph_features(route_counts)
        df = df.merge(route_counts, on=["Origin", "Dest"], how="left")
        df = df.merge(carrier_counts, on=["Reporting_Airline", "Origin"], how="left")
        df = df.merge(
            graph_features.add_prefix("dest_"),
            left_on="Dest",
            right_on="dest_airport",
            how="left",
        ).drop(columns=["dest_airport"])
        df = df.merge(
            graph_features[["airport", "out_degree", "pagerank"]].rename(
                columns={"airport": "origin_airport", "out_degree": "origin_out_degree", "pagerank": "origin_pagerank"}
            ),
            left_on="Origin",
            right_on="origin_airport",
            how="left",
        ).drop(columns=["origin_airport"])

        keep = df[
                [
                    "Year",
                    "Month",
                    "DayofMonth",
                    "DayOfWeek",
                    "FlightDate",
                    "Reporting_Airline",
                    "Tail_Number",
                    "Origin",
                    "Dest",
                    "route",
                    "carrier_origin",
                    "sched_dep_hour",
                    "sched_arr_hour",
                    "dep_hour_sin",
                    "dep_hour_cos",
                    "arr_hour_sin",
                    "arr_hour_cos",
                    "dow_sin",
                    "dow_cos",
                    "month_sin",
                    "month_cos",
                    "dep_time_block",
                    "arr_time_block",
                    "Distance",
                    "CRSElapsedTime",
                    "TaxiOut",
                    "DepDelayMinutes",
                    "ArrDelayMinutes",
                    TARGET,
                    "ArrDel15",
                    "cancel_or_divert",
                    "tmpf",
                    "dwpf",
                    "relh",
                    "drct",
                    "sknt",
                    "vsby",
                    "skyl1",
                    "skyc1",
                    "weather_flag",
                    "route_month_count",
                    "carrier_origin_month_count",
                    "dest_in_degree",
                    "dest_out_degree",
                    "dest_pagerank",
                    "origin_out_degree",
                    "origin_pagerank",
                    "runway_count",
                    "max_runway_length_ft",
                    "mean_runway_length_ft",
                ]
            ].copy()
        for col in [
            "Year",
            "Month",
            "DayofMonth",
            "DayOfWeek",
            "sched_dep_hour",
            "sched_arr_hour",
            "dep_hour_sin",
            "dep_hour_cos",
            "arr_hour_sin",
            "arr_hour_cos",
            "dow_sin",
            "dow_cos",
            "month_sin",
            "month_cos",
            TARGET,
            "ArrDel15",
            "cancel_or_divert",
        ]:
            keep[col] = pd.to_numeric(keep[col], errors="coerce").astype("float32")
        for col in [
            "Distance",
            "CRSElapsedTime",
            "TaxiOut",
            "DepDelayMinutes",
            "ArrDelayMinutes",
            "tmpf",
            "dwpf",
            "relh",
            "drct",
            "sknt",
            "vsby",
            "skyl1",
            "route_month_count",
            "carrier_origin_month_count",
            "dest_in_degree",
            "dest_out_degree",
            "dest_pagerank",
            "origin_out_degree",
            "origin_pagerank",
            "runway_count",
            "max_runway_length_ft",
            "mean_runway_length_ft",
        ]:
            keep[col] = pd.to_numeric(keep[col], errors="coerce").astype("float32")
        for col in ["Reporting_Airline", "Tail_Number", "Origin", "Dest", "route", "carrier_origin", "dep_time_block", "arr_time_block", "skyc1", "weather_flag"]:
            keep[col] = keep[col].fillna("UNKNOWN").astype("category")
        monthly_frames.append(keep)
        del keep
        del df
        gc.collect()

    all_df = pd.concat(monthly_frames, ignore_index=True)

    all_df["_origin_code"] = all_df["Origin"].cat.codes.astype("int64")
    all_df["_hour_index"] = ((all_df["FlightDate"].astype("int64") // 86_400_000_000_000) * 24 + all_df["sched_dep_hour"].fillna(0).astype("int64")).astype("int64")
    all_df["_airport_hour_key"] = all_df["_hour_index"] * 100 + all_df["_origin_code"]

    airport_hour = (
        all_df.groupby(["_airport_hour_key", "FlightDate", "Origin", "sched_dep_hour"], as_index=False, observed=True)
        .agg(
            airport_hour_departures=("Origin", "size"),
            airport_hour_arrivals=("Dest", lambda s: s.isin(TARGET_AIRPORTS).sum()),
            airport_hour_delay_rate=(TARGET, "mean"),
            airport_hour_mean_delay=("DepDelayMinutes", "mean"),
            airport_hour_cancel_rate=("cancel_or_divert", "mean"),
        )
        .sort_values(["Origin", "FlightDate", "sched_dep_hour"])
    )
    airport_hour["airport_hour_total"] = airport_hour["airport_hour_departures"] + airport_hour["airport_hour_arrivals"]
    airport_hour["airport_prev_hour_delay_rate"] = airport_hour.groupby("Origin", observed=True)["airport_hour_delay_rate"].shift(1)
    airport_hour["airport_prev_hour_mean_delay"] = airport_hour.groupby("Origin", observed=True)["airport_hour_mean_delay"].shift(1)
    airport_hour["airport_prev_hour_cancel_rate"] = airport_hour.groupby("Origin", observed=True)["airport_hour_cancel_rate"].shift(1)
    airport_hour["airport_rolling_6h_delay_rate"] = (
        airport_hour.groupby("Origin", observed=True)["airport_hour_delay_rate"].transform(lambda s: s.shift(1).rolling(6, min_periods=1).mean())
    )
    airport_hour["airport_rolling_6h_volume"] = (
        airport_hour.groupby("Origin", observed=True)["airport_hour_total"].transform(lambda s: s.shift(1).rolling(6, min_periods=1).sum())
    )
    airport_hour["airport_rolling_24h_delay_rate"] = (
        airport_hour.groupby("Origin", observed=True)["airport_hour_delay_rate"].transform(lambda s: s.shift(1).rolling(24, min_periods=3).mean())
    )
    airport_hour["airport_rolling_24h_volume"] = (
        airport_hour.groupby("Origin", observed=True)["airport_hour_total"].transform(lambda s: s.shift(1).rolling(24, min_periods=3).sum())
    )
    hour_lookup = airport_hour.set_index("_airport_hour_key")
    for col in [
        "airport_hour_departures",
        "airport_hour_arrivals",
        "airport_hour_total",
        "airport_prev_hour_delay_rate",
        "airport_prev_hour_mean_delay",
        "airport_prev_hour_cancel_rate",
        "airport_rolling_6h_delay_rate",
        "airport_rolling_6h_volume",
        "airport_rolling_24h_delay_rate",
        "airport_rolling_24h_volume",
    ]:
        all_df[col] = all_df["_airport_hour_key"].map(hour_lookup[col]).astype("float32")
    del hour_lookup
    del airport_hour
    gc.collect()
    all_df["year_month"] = (all_df["Year"].astype(int) * 12 + all_df["Month"].astype(int)).astype("int32")
    monthly_history_specs = [
        ("route", "route"),
        ("carrier_origin", "carrier_origin"),
        ("Origin", "origin"),
        ("Dest", "dest"),
    ]
    for key_col, prefix in monthly_history_specs:
        key_codes = pd.factorize(all_df[key_col].astype("string"), sort=False)[0].astype("int64")
        all_df[f"_{prefix}_code"] = key_codes
        all_df[f"_{prefix}_month_key"] = key_codes * 10_000 + all_df["year_month"].astype("int64")
        month_stats = (
            all_df.groupby([f"_{prefix}_code", "year_month"], as_index=False, observed=True)
            .agg(month_delay_rate=(TARGET, "mean"), month_mean_delay=("DepDelayMinutes", "mean"))
            .sort_values([f"_{prefix}_code", "year_month"])
        )
        month_stats[f"_{prefix}_month_key"] = month_stats[f"_{prefix}_code"].astype("int64") * 10_000 + month_stats["year_month"].astype("int64")
        group_obj = month_stats.groupby(f"_{prefix}_code", observed=True)
        month_stats[f"{prefix}_prev_month_delay_rate"] = group_obj["month_delay_rate"].shift(1)
        month_stats[f"{prefix}_rolling_3m_delay_rate"] = group_obj["month_delay_rate"].transform(lambda s: s.shift(1).rolling(3, min_periods=1).mean())
        if prefix == "route":
            month_stats["route_prev_month_mean_delay"] = group_obj["month_mean_delay"].shift(1)
            value_cols = [f"{prefix}_prev_month_delay_rate", f"{prefix}_rolling_3m_delay_rate", "route_prev_month_mean_delay"]
        else:
            value_cols = [f"{prefix}_prev_month_delay_rate", f"{prefix}_rolling_3m_delay_rate"]
        lookup = month_stats.set_index(f"_{prefix}_month_key")
        for col in value_cols:
            all_df[col] = all_df[f"_{prefix}_month_key"].map(lookup[col]).astype("float32")
        all_df.drop(columns=[f"_{prefix}_code", f"_{prefix}_month_key"], inplace=True)
        del lookup
        del month_stats
        gc.collect()

    severity = (
        (10 - all_df["vsby"].clip(0, 10).fillna(10)) / 10
        + (all_df["sknt"].fillna(0).clip(0, 50) / 50)
        + all_df["weather_flag"].eq("WX").astype(float)
    )
    capacity = all_df["airport_hour_total"].fillna(0) / all_df.groupby("Origin", observed=True)["airport_hour_total"].transform("quantile", 0.95).replace(0, np.nan)
    all_df["origin_capacity_ratio"] = capacity.astype(float)
    all_df["route_share_at_origin"] = (
        all_df["route_month_count"].fillna(0)
        / all_df.groupby(["Origin", "Year", "Month"], observed=True)["route_month_count"].transform("sum").replace(0, np.nan)
    ).astype(float)
    upstream = all_df["airport_prev_hour_delay_rate"].fillna(0)
    all_df["weather_capacity_risk_index"] = (severity * capacity.fillna(0) * (1 + upstream)).astype(float)

    for col in CATEGORICAL_FEATURES:
        all_df[col] = all_df[col].astype("string").fillna("UNKNOWN").astype("category")
    for col in NUMERIC_FEATURES + ["DepDelayMinutes", "ArrDelayMinutes", TARGET, "cancel_or_divert"]:
        all_df[col] = pd.to_numeric(all_df[col], errors="coerce")
    all_df.drop(columns=["_origin_code", "_hour_index", "_airport_hour_key", "year_month"], errors="ignore", inplace=True)

    all_df.to_parquet(FEATURE_FILE, index=False)
    summary = {
        "rows": int(len(all_df)),
        "origins": sorted(all_df["Origin"].astype(str).unique().tolist()),
        "date_min": str(all_df["FlightDate"].min().date()),
        "date_max": str(all_df["FlightDate"].max().date()),
        "target_rate": float(all_df[TARGET].mean()),
        "weather_match_rate": float(all_df["tmpf"].notna().mean()),
        "feature_file": str(FEATURE_FILE),
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "feature_build_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


def temporal_split(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    train = df[df["Year"] <= 2023]
    val = df[df["Year"] == 2024]
    test = df[df["Year"] == 2025]
    return train, val, test


def sample_rows(df: pd.DataFrame, max_rows: int, seed: int = 42) -> pd.DataFrame:
    if max_rows <= 0 or len(df) <= max_rows:
        return df
    return df.sample(max_rows, random_state=seed)


def metrics_row(model: str, split: str, y: np.ndarray, proba: np.ndarray) -> dict[str, float | str]:
    proba = np.clip(proba, 1e-6, 1 - 1e-6)
    pred = (proba >= 0.5).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, pred, labels=[0, 1]).ravel()
    return {
        "model": model,
        "split": split,
        "roc_auc": roc_auc_score(y, proba),
        "pr_auc": average_precision_score(y, proba),
        "f1": f1_score(y, pred, zero_division=0),
        "precision": precision_score(y, pred, zero_division=0),
        "recall": recall_score(y, pred, zero_division=0),
        "specificity": tn / (tn + fp) if (tn + fp) else np.nan,
        "brier": brier_score_loss(y, proba),
        "log_loss": log_loss(y, proba),
    }


def sklearn_preprocessor(kind: str = "onehot") -> ColumnTransformer:
    if kind == "ordinal":
        cat = Pipeline([("imputer", SimpleImputer(strategy="most_frequent")), ("ordinal", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1))])
    else:
        cat = Pipeline([("imputer", SimpleImputer(strategy="most_frequent")), ("onehot", OneHotEncoder(handle_unknown="ignore", min_frequency=20, sparse_output=True))])
    return ColumnTransformer(
        [
            ("num", Pipeline([("imputer", SimpleImputer(strategy="mean")), ("scaler", StandardScaler())]), NUMERIC_FEATURES),
            ("cat", cat, CATEGORICAL_FEATURES),
        ]
    )


def threshold_tuning(val_pred: pd.DataFrame, test_pred: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for col in [c for c in val_pred.columns if c != "y_true"]:
        thresholds = np.linspace(0.05, 0.95, 181)
        scores = [f1_score(val_pred["y_true"], (val_pred[col] >= t).astype(int), zero_division=0) for t in thresholds]
        t = float(thresholds[int(np.argmax(scores))])
        pred = (test_pred[col] >= t).astype(int)
        tn, fp, fn, tp = confusion_matrix(test_pred["y_true"], pred, labels=[0, 1]).ravel()
        rows.append(
            {
                "model": col,
                "threshold_from_validation": t,
                "test_f1_tuned": f1_score(test_pred["y_true"], pred, zero_division=0),
                "test_precision_tuned": precision_score(test_pred["y_true"], pred, zero_division=0),
                "test_recall_tuned": recall_score(test_pred["y_true"], pred, zero_division=0),
                "test_specificity_tuned": tn / (tn + fp) if (tn + fp) else np.nan,
            }
        )
    return pd.DataFrame(rows).sort_values("test_f1_tuned", ascending=False)


def predict_pipeline_in_chunks(pipe: Pipeline, df: pd.DataFrame, features: list[str], chunk_size: int = 50_000) -> np.ndarray:
    preds = []
    for start in range(0, len(df), chunk_size):
        part = df.iloc[start : start + chunk_size]
        preds.append(pipe.predict_proba(part[features])[:, 1])
    return np.concatenate(preds)


def transform_predict_in_chunks(prep: ColumnTransformer, model, df: pd.DataFrame, features: list[str], chunk_size: int = 50_000) -> np.ndarray:
    preds = []
    for start in range(0, len(df), chunk_size):
        part = df.iloc[start : start + chunk_size]
        x_part = prep.transform(part[features])
        preds.append(model.predict_proba(x_part)[:, 1])
        del x_part
        gc.collect()
    return np.concatenate(preds)


def predict_frame_model_in_chunks(model, df: pd.DataFrame, features: list[str], chunk_size: int = 750_000) -> np.ndarray:
    preds = []
    for start in range(0, len(df), chunk_size):
        part = df.iloc[start : start + chunk_size]
        preds.append(model.predict_proba(part[features])[:, 1])
    return np.concatenate(preds)


def predict_lgbm_in_chunks(model, df: pd.DataFrame, features: list[str], category_maps: dict[str, pd.Index], chunk_size: int = 500_000) -> np.ndarray:
    preds = []
    for start in range(0, len(df), chunk_size):
        part = df.iloc[start : start + chunk_size][features].copy()
        for col, cats in category_maps.items():
            part[col] = pd.Categorical(part[col].astype(str), categories=cats)
        preds.append(model.predict_proba(part)[:, 1])
        del part
        gc.collect()
    return np.concatenate(preds)


def predict_catboost_in_chunks(model, df: pd.DataFrame, features: list[str], cat_features: list[str], chunk_size: int = 500_000) -> np.ndarray:
    preds = []
    for start in range(0, len(df), chunk_size):
        part = df.iloc[start : start + chunk_size][features].copy()
        for col in cat_features:
            part[col] = part[col].astype(str)
        preds.append(model.predict_proba(part)[:, 1])
        del part
        gc.collect()
    return np.concatenate(preds)


def train_models(heavy_model_max_rows: int, shap_rows: int, fast_main_models: bool = False) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    df = pd.read_parquet(FEATURE_FILE)
    train, val, test = temporal_split(df)
    y_train = train[TARGET].astype(int).to_numpy()
    y_val = val[TARGET].astype(int).to_numpy()
    y_test = test[TARGET].astype(int).to_numpy()
    features = NUMERIC_FEATURES + CATEGORICAL_FEATURES
    metrics = []
    val_pred = pd.DataFrame({"y_true": y_val})
    test_pred = pd.DataFrame({"y_true": y_test})

    prior = np.repeat(y_train.mean(), len(test))
    metrics.append(metrics_row("Naive_train_prior", "test", y_test, prior))

    # Heavy models use a sampled train set when requested, but validation/test
    # evaluation stays full. This keeps the formal experiment runnable locally.
    train_h = sample_rows(train, heavy_model_max_rows, seed=42)
    y_train_h = train_h[TARGET].astype(int).to_numpy()

    print("training SGD_Logistic sampled")
    sgd_source = sample_rows(train_h, min(100_000, len(train_h)), seed=11)
    y_sgd = sgd_source[TARGET].astype(int).to_numpy()
    sgd = Pipeline(
        [
            ("prep", sklearn_preprocessor("ordinal")),
            ("clf", SGDClassifier(loss="log_loss", alpha=1e-5, class_weight="balanced", random_state=42, max_iter=30, n_jobs=-1)),
        ]
    )
    sgd.fit(sgd_source[features], y_sgd)
    for split, part, y, pred_df in [("val", val, y_val, val_pred), ("test", test, y_test, test_pred)]:
        p = predict_pipeline_in_chunks(sgd, part, features)
        pred_df["SGD_Logistic"] = p
        metrics.append(metrics_row("SGD_Logistic", split, y, p))
    del sgd
    del sgd_source
    del y_sgd
    gc.collect()

    print("training LightGBM")
    lgb_train = train_h[features].copy()
    lgb_eval_source = sample_rows(val, min(500_000, len(val)), seed=31)
    lgb_val_eval = lgb_eval_source[features].copy()
    y_lgb_eval = lgb_eval_source[TARGET].astype(int).to_numpy()
    lgb_category_maps = {}
    for col in CATEGORICAL_FEATURES:
        cats = pd.Categorical(pd.concat([lgb_train[col], lgb_val_eval[col]], ignore_index=True).astype(str)).categories
        lgb_category_maps[col] = cats
        for part in [lgb_train, lgb_val_eval]:
            part[col] = pd.Categorical(part[col].astype(str), categories=cats)
    lgb_shap_category_maps = lgb_category_maps.copy()
    lgbm = lgb.LGBMClassifier(
        objective="binary",
        metric="average_precision",
        n_estimators=1100,
        learning_rate=0.025,
        num_leaves=63,
        min_child_samples=120,
        reg_alpha=0.05,
        reg_lambda=0.2,
        subsample=0.85,
        colsample_bytree=0.85,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    lgbm.fit(
        lgb_train,
        y_train_h,
        eval_set=[(lgb_val_eval, y_lgb_eval)],
        eval_metric="average_precision",
        callbacks=[lgb.early_stopping(90, first_metric_only=True), lgb.log_evaluation(100)],
    )
    for split, part, y, pred_df in [("val", val, y_val, val_pred), ("test", test, y_test, test_pred)]:
        p = predict_lgbm_in_chunks(lgbm, part, features, lgb_category_maps)
        pred_df["LightGBM"] = p
        metrics.append(metrics_row("LightGBM", split, y, p))
    del lgb_train
    del lgb_val_eval
    del lgb_eval_source
    del y_lgb_eval
    del lgb_category_maps
    gc.collect()

    print("training XGBoost")
    xgb_prep = sklearn_preprocessor("ordinal")
    x_train = xgb_prep.fit_transform(train_h[features])
    xgb_eval_source = sample_rows(val, min(300_000, len(val)), seed=37)
    x_val_eval = xgb_prep.transform(xgb_eval_source[features])
    y_xgb_eval = xgb_eval_source[TARGET].astype(int).to_numpy()
    pos_weight = (len(y_train_h) - y_train_h.sum()) / max(y_train_h.sum(), 1)
    xgbm = xgb.XGBClassifier(
        n_estimators=650,
        max_depth=6,
        learning_rate=0.035,
        min_child_weight=8,
        reg_alpha=0.05,
        reg_lambda=1.5,
        subsample=0.85,
        colsample_bytree=0.85,
        objective="binary:logistic",
        eval_metric="aucpr",
        tree_method="hist",
        scale_pos_weight=pos_weight,
        random_state=42,
        n_jobs=-1,
    )
    xgbm.fit(x_train, y_train_h, eval_set=[(x_val_eval, y_xgb_eval)], verbose=100)
    del x_train
    del x_val_eval
    del xgb_eval_source
    del y_xgb_eval
    gc.collect()
    p = transform_predict_in_chunks(xgb_prep, xgbm, val, features)
    val_pred["XGBoost"] = p
    metrics.append(metrics_row("XGBoost", "val", y_val, p))
    p = transform_predict_in_chunks(xgb_prep, xgbm, test, features)
    test_pred["XGBoost"] = p
    metrics.append(metrics_row("XGBoost", "test", y_test, p))
    del xgb_prep
    del xgbm
    gc.collect()

    if not fast_main_models:
        print("training CatBoost")
        cat_source = sample_rows(train_h, min(100_000, len(train_h)), seed=23)
        cat_train = cat_source[features].copy()
        cat_y = cat_source[TARGET].astype(int).to_numpy()
        cat_eval = sample_rows(val, min(50_000, len(val)), seed=19)
        cat_eval_x = cat_eval[features].copy()
        cat_eval_y = cat_eval[TARGET].astype(int).to_numpy()
        for col in CATEGORICAL_FEATURES:
            cat_train[col] = cat_train[col].astype(str)
            cat_eval_x[col] = cat_eval_x[col].astype(str)
        cat_idx = [features.index(c) for c in CATEGORICAL_FEATURES]
        catm = cb.CatBoostClassifier(
            iterations=220,
            learning_rate=0.045,
            depth=4,
            loss_function="Logloss",
            eval_metric="PRAUC",
            auto_class_weights="Balanced",
            random_seed=42,
            verbose=100,
            allow_writing_files=False,
        )
        catm.fit(cat_train, cat_y, cat_features=cat_idx, eval_set=(cat_eval_x, cat_eval_y), use_best_model=True)
        for split, part, y, pred_df in [("val", val, y_val, val_pred), ("test", test, y_test, test_pred)]:
            p = predict_catboost_in_chunks(catm, part, features, CATEGORICAL_FEATURES)
            pred_df["CatBoost"] = p
            metrics.append(metrics_row("CatBoost", split, y, p))
        del catm, cat_train, cat_source, cat_eval, cat_eval_x, cat_eval_y, cat_y
        gc.collect()

        print("training HistGradientBoosting + ExtraTrees sampled")
        for name, clf, max_rows in [
            ("HistGradientBoosting", HistGradientBoostingClassifier(max_iter=260, learning_rate=0.045, max_leaf_nodes=31, random_state=42), min(heavy_model_max_rows, 300_000)),
            ("ExtraTrees", ExtraTreesClassifier(n_estimators=180, max_depth=22, min_samples_leaf=10, class_weight="balanced", n_jobs=1, random_state=42), min(heavy_model_max_rows, 200_000)),
        ]:
            part_train = sample_rows(train_h, max_rows, seed=7)
            y_part = part_train[TARGET].astype(int).to_numpy()
            pipe = Pipeline([("prep", sklearn_preprocessor("ordinal")), ("clf", clf)])
            pipe.fit(part_train[features], y_part)
            for split, part, y, pred_df in [("val", val, y_val, val_pred), ("test", test, y_test, test_pred)]:
                p = predict_pipeline_in_chunks(pipe, part, features)
                pred_df[name] = p
                metrics.append(metrics_row(name, split, y, p))
            del pipe, part_train, y_part
            gc.collect()

    print("training stacker")
    base_cols = [c for c in val_pred.columns if c != "y_true"]
    stacker = LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42)
    stacker.fit(val_pred[base_cols], y_val)
    p_stack = stacker.predict_proba(test_pred[base_cols])[:, 1]
    test_pred["Stacked_Ensemble"] = p_stack
    metrics.append(metrics_row("Stacked_Ensemble", "test", y_test, p_stack))

    metrics_df = pd.DataFrame(metrics).sort_values(["split", "pr_auc"], ascending=[True, False])
    metrics_df.to_csv(OUT / "full_classification_metrics.csv", index=False)
    val_pred.to_parquet(OUT / "validation_predictions.parquet", index=False)
    test_pred.to_parquet(OUT / "test_predictions.parquet", index=False)
    threshold_tuning(val_pred, test_pred).to_csv(OUT / "full_threshold_tuned_metrics.csv", index=False)

    if shap_rows > 0:
        print("computing SHAP sample for LightGBM")
        try:
            shap_sample = sample_rows(test.assign(_y=y_test), shap_rows, seed=99)
            x_shap = shap_sample[features].copy()
            for col in CATEGORICAL_FEATURES:
                x_shap[col] = pd.Categorical(x_shap[col].astype(str), categories=lgb_shap_category_maps[col])
            explainer = shap.TreeExplainer(lgbm)
            shap_values = explainer.shap_values(x_shap)
            if isinstance(shap_values, list):
                shap_values = shap_values[-1]
            shap_importance = pd.DataFrame({"feature": features, "mean_abs_shap": np.abs(shap_values).mean(axis=0)}).sort_values("mean_abs_shap", ascending=False)
            shap_importance.to_csv(OUT / "lightgbm_shap_importance.csv", index=False)
        except Exception as exc:
            print(f"SHAP skipped: {exc}")

    test_metrics = metrics_df[metrics_df["split"] == "test"].sort_values("pr_auc", ascending=False)
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.barh(test_metrics["model"], test_metrics["pr_auc"], color="#2a9d8f")
    ax.invert_yaxis()
    ax.set_xlabel("PR-AUC")
    ax.set_title("Full 2018-2025 Test PR-AUC")
    fig.tight_layout()
    fig.savefig(OUT / "full_test_pr_auc.png", dpi=180)
    plt.close(fig)

    summary = {
        "rows": int(len(df)),
        "train_rows": int(len(train)),
        "validation_rows": int(len(val)),
        "test_rows": int(len(test)),
        "train_target_rate": float(y_train.mean()),
        "validation_target_rate": float(y_val.mean()),
        "test_target_rate": float(y_test.mean()),
        "heavy_model_train_rows": int(len(train_h)),
        "best_test_model_by_pr_auc": str(test_metrics.iloc[0]["model"]),
        "best_test_pr_auc": float(test_metrics.iloc[0]["pr_auc"]),
        "feature_file": str(FEATURE_FILE),
    }
    (OUT / "full_run_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", choices=["build", "train", "all"], default="all")
    parser.add_argument("--heavy-model-max-rows", type=int, default=2_000_000)
    parser.add_argument("--shap-rows", type=int, default=6000)
    parser.add_argument("--fast-main-models", action="store_true", help="Run the memory-stable main-model experiment: SGD, LightGBM, XGBoost, and stacking.")
    args = parser.parse_args()
    if args.stage in {"build", "all"}:
        build_features()
    if args.stage in {"train", "all"}:
        train_models(args.heavy_model_max_rows, args.shap_rows, args.fast_main_models)


if __name__ == "__main__":
    main()
