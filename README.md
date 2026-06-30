# Nexus Flight Analytics

Code, data artifacts, and reproducibility notes for a flight-delay prediction,
risk-ranking, and decision-support workflow.

This repository accompanies the PeerJ Computer Science submission on flight
delay prediction and recovery/risk prioritization. It contains:

- public-data download scripts;
- feature engineering for BTS flight records, IEM ASOS weather, airport
  infrastructure, and route-network features;
- pilot and full-scale temporal model experiments;
- result tables used for manuscript reporting;
- a React/Node dashboard prototype for exploratory flight-delay analytics.

The repository is intended to make the statistical analysis auditable by
reviewers. Very large constructed datasets are documented here and should be
uploaded to Figshare, Zenodo, or PeerJ Supplemental Files with a DOI or
descriptive "raw data" legend.

## Project Scope

The main modeling task predicts whether a scheduled departure will experience
a departure delay of at least 15 minutes. The full experiment uses a
chronological design:

| Split | Period | Role |
| --- | --- | --- |
| Train | 2018-2023 | fit base models |
| Validation | 2024 | tune thresholds, stacking, and calibration |
| Test | 2025 | independent out-of-time evaluation |

The dashboard prototype uses a smaller NYC-focused exploratory dataset for
visual analysis of delay patterns, route performance, airborne recovery,
airline comparison, propagation, attribution, and flight-level audit views.

## Repository Structure

```text
nexus-flight-analytics/
  analysis_results/
    full_journal_experiment/   Full-experiment metrics and summary tables
    model_pilot/               Lightweight pilot metrics and figures
    derived_analysis/          Calibration, top-k, risk-decile, and audit tables
  data/                        Dashboard-ready JSON/RDS data artifacts
  modeling_data/               Small constructed sample dataset for review
  scripts/
    download_flight_delay_datasets.py
    build_delay_modeling_sample.py
    run_advanced_model_pilot.py
    run_full_journal_experiment.py
    00_collect_multi_year_data.R ... 09_module8_explorer_full.R
  src/                         React dashboard source code
  simple-server.mjs            Node/Express API and static server
  package.json                 Node scripts and dashboard dependencies
  requirements.txt             Python modeling dependencies
  DATA_AVAILABILITY.md         Data release and supplemental-upload notes
  CODE_AVAILABILITY.md         Code inventory and reproducibility commands
```

## Dataset Information

### Included in this Repository

| File or folder | Format | Purpose |
| --- | --- | --- |
| `modeling_data/bts_nyc_weather_sample_2024_01.csv` | CSV | Small constructed raw-data sample joining January 2024 BTS NYC flights with hourly IEM ASOS weather. Suitable for quick review and pilot reproduction. |
| `modeling_data/bts_nyc_weather_sample_2024_01_summary.csv` | CSV | Summary of the included sample dataset. |
| `data/module8/full_data_chunk_*.json` | JSON | Dashboard exploratory flight-level data chunks for the NYC prototype. |
| `analysis_results/full_journal_experiment/*.csv` | CSV | Main model metrics, threshold-tuned metrics, and SHAP summaries. |
| `analysis_results/derived_analysis/*.csv` | CSV | Calibration, risk-decile, threshold, top-k, and model-comparison tables used for manuscript reporting. |

### Large Constructed Dataset to Upload Separately

The full constructed modeling table is too large for ordinary GitHub review:

- `modeling_data/full_2018_2025/flight_delay_features_2018_2025.parquet`
- 38,298,113 rows
- 40 U.S. origin airports
- date range: 2018-01-01 to 2025-12-31
- target rate: 0.1941
- weather match rate: 0.9564
- local size: about 1.77 GB

This file should be deposited as a dataset in Figshare, Zenodo, or PeerJ
Supplemental Files. Use a legend containing the words "raw data", for example:

> Raw data - constructed full feature table for the 2018-2025 U.S. flight
> delay risk-ranking experiment. The table joins BTS flight records with
> hourly IEM ASOS weather, airport infrastructure, dynamic congestion, route
> reliability, graph/network features, and the departure-delay target used in
> the manuscript analysis.

See `DATA_AVAILABILITY.md` for exact upload notes and suggested legends.

## Code Information

The core reproducibility scripts are:

| Script | Description |
| --- | --- |
| `scripts/download_flight_delay_datasets.py` | Downloads public source datasets: BTS, IEM ASOS, OurAirports, OpenFlights, NOAA Storm Events, and Australia OTP. |
| `scripts/build_delay_modeling_sample.py` | Builds the included January 2024 NYC BTS-weather sample. |
| `scripts/run_advanced_model_pilot.py` | Runs a lightweight pilot experiment on the included sample. |
| `scripts/run_full_journal_experiment.py` | Builds the full 2018-2025 feature table and trains/evaluates the main temporal experiment. |
| `scripts/00_collect_multi_year_data.R` to `scripts/09_module8_explorer_full.R` | Builds the dashboard exploratory data artifacts. |
| `simple-server.mjs` and `src/` | Runs the local dashboard/API prototype. |

See `CODE_AVAILABILITY.md` for a fuller inventory.

## Requirements

### Python Modeling

Use Python 3.11 or newer. Install the modeling dependencies with:

```bash
python -m pip install -r requirements.txt
```

The full experiment uses pandas, numpy, scikit-learn, pyarrow, LightGBM,
XGBoost, CatBoost, SHAP, NetworkX, matplotlib, torch, and tqdm. The exact
versions used locally are listed in `requirements.txt`.

### Dashboard

Use Node.js 18 or newer, then install dependencies:

```bash
npm install
```

### R Dashboard-Data Scripts

The dashboard data scripts require R 4.0 or newer and packages such as
`dplyr`, `tidyr`, `jsonlite`, `nycflights13`, `lubridate`, and `DBI`.

## Usage Instructions

### 1. Reproduce the Small Sample Dataset

```bash
python scripts/download_flight_delay_datasets.py --bts-years 2024 --bts-months 1 --weather-years 2024 --weather-months 1 --stations JFK,EWR,LGA
python scripts/build_delay_modeling_sample.py
```

Expected outputs:

- `modeling_data/bts_nyc_weather_sample_2024_01.csv`
- `modeling_data/bts_nyc_weather_sample_2024_01_summary.csv`

### 2. Run the Pilot Model Experiment

```bash
python scripts/run_advanced_model_pilot.py
```

Expected outputs are written to `analysis_results/model_pilot/`.

### 3. Rebuild the Full Feature Table

The full build requires the complete BTS and weather source files and enough
disk space for a multi-GB parquet file:

```bash
python scripts/run_full_journal_experiment.py --stage build
```

Expected output:

- `modeling_data/full_2018_2025/flight_delay_features_2018_2025.parquet`

### 4. Run the Full Temporal Experiment

```bash
python scripts/run_full_journal_experiment.py --stage train --fast-main-models --heavy-model-max-rows 500000 --shap-rows 6000
```

Expected outputs are written to `analysis_results/full_journal_experiment/`.
The included CSV/JSON/PNG files are the lightweight result artifacts; the full
validation/test prediction parquet files should be regenerated or deposited
separately because they are large.

### 5. Run the Dashboard Prototype

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

For a static build:

```bash
npm run build
```

## Methodology Summary

1. Download public flight, weather, airport, runway, route, and optional
   severe-weather datasets.
2. Join scheduled flights with hourly origin-airport weather observations.
3. Engineer schedule, cyclic time, airport congestion, rolling-delay,
   carrier-origin, route reliability, runway-capacity proxy, and graph/network
   features.
4. Define the binary target as departure delay of at least 15 minutes.
5. Split chronologically into 2018-2023 training, 2024 validation, and 2025
   test sets.
6. Compare linear, gradient-boosting, tree-ensemble, neural tabular, and
   stacked models.
7. Evaluate ranking, threshold-tuned warning, calibration, top-k capture,
   risk deciles, and feature importance.
8. Use the dashboard as a decision-support and audit prototype.

## Citation and Data Sources

Please cite the public data providers if this repository is reused:

- U.S. Bureau of Transportation Statistics, Airline On-Time Performance Data:
  https://transtats.bts.gov/
- Iowa Environmental Mesonet ASOS/METAR archive:
  https://mesonet.agron.iastate.edu/request/download.phtml
- OurAirports data:
  https://ourairports.com/data/
- OpenFlights data:
  https://openflights.org/data.php
- NOAA Storm Events Database:
  https://www.ncei.noaa.gov/products/storm-events
- Australian Government domestic airline on-time performance dataset:
  https://data.gov.au/
- nycflights13 R package:
  https://github.com/hadley/nycflights13

## License and Contributions

Code is released under the MIT License; see `LICENSE`.

For peer review, please open an issue or contact the corresponding author
listed in the PeerJ submission system before submitting changes. Author names,
affiliations, funding, grant disclosures, and competing-interest declarations
must be kept accurate in the PeerJ submission system.
