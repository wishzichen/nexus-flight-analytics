# Code Availability

This repository contains the code required to inspect and reproduce the
reported flight delay risk-ranking experiments and the Nexus Flight Analytics
prototype.

Suggested PeerJ code legend:

```text
Code - reproducible scripts and dashboard source code for the flight delay
prediction, risk-ranking, calibration, and decision-support analyses. The
repository includes public-data download scripts, feature construction,
model training and evaluation scripts, result tables, and the Nexus Flight
Analytics dashboard prototype.
```

## Main Python Scripts

| Script | Purpose |
| --- | --- |
| `scripts/download_flight_delay_datasets.py` | Downloads public input datasets. Defaults to a small January 2024 NYC sample and can be expanded to more years, months, and stations. |
| `scripts/build_delay_modeling_sample.py` | Builds `modeling_data/bts_nyc_weather_sample_2024_01.csv` from BTS and IEM source files. |
| `scripts/run_advanced_model_pilot.py` | Runs a lightweight pilot model comparison on the included sample. Produces metrics, prediction files, and feature importance outputs in `analysis_results/model_pilot/`. |
| `scripts/run_full_journal_experiment.py` | Builds the full 2018-2025 feature table and runs the main temporal model experiment. Produces full metrics and summary outputs in `analysis_results/full_journal_experiment/`. |

## Dashboard and Prototype Code

| Path | Purpose |
| --- | --- |
| `src/` | React/TypeScript dashboard source code. |
| `simple-server.mjs` | Node/Express local API and static server. |
| `scripts/00_collect_multi_year_data.R` to `scripts/09_module8_explorer_full.R` | R scripts that build the dashboard exploratory data artifacts. |
| `data/` | Dashboard-ready data artifacts. |

## Result Artifacts Included for Review

| Folder | Contents |
| --- | --- |
| `analysis_results/full_journal_experiment/` | Full-experiment summary JSON, test metrics, threshold-tuned metrics, SHAP feature importance, and PR-AUC figure. |
| `analysis_results/model_pilot/` | Pilot model metrics, validation/test predictions, regression metrics, feature importance, and figures. |
| `analysis_results/derived_analysis/` | Calibration, risk-decile, threshold, top-k, model-correlation, and model-difference tables used for manuscript reporting. |

## Reproduction Commands

Install Python dependencies:

```bash
python -m pip install -r requirements.txt
```

Download and build the small included sample:

```bash
python scripts/download_flight_delay_datasets.py --bts-years 2024 --bts-months 1 --weather-years 2024 --weather-months 1 --stations JFK,EWR,LGA
python scripts/build_delay_modeling_sample.py
```

Run the pilot experiment:

```bash
python scripts/run_advanced_model_pilot.py
```

Build the full constructed feature table:

```bash
python scripts/run_full_journal_experiment.py --stage build
```

Train and evaluate the full temporal experiment:

```bash
python scripts/run_full_journal_experiment.py --stage train --fast-main-models --heavy-model-max-rows 500000 --shap-rows 6000
```

Run the dashboard:

```bash
npm install
npm run dev
```

Build the static dashboard:

```bash
npm run build
```

## Notes for Reviewers

The included sample is intentionally small so reviewers can run the pipeline on
ordinary hardware. The full constructed dataset and full validation/test
prediction parquet files are large and should be downloaded from the DOI-linked
data repository or regenerated from public sources using the scripts above.
