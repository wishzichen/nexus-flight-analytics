# Data Availability

This file is written for PeerJ review and resubmission. It separates data that
are included in the GitHub repository from large constructed datasets that
should be uploaded to a data repository or to PeerJ Supplemental Files.

## Included Dataset Files

| File | Type | Description |
| --- | --- | --- |
| `modeling_data/bts_nyc_weather_sample_2024_01.csv` | CSV raw data sample | Constructed flight-weather sample for JFK, EWR, and LGA origin flights in January 2024. Built from BTS flight records and IEM ASOS hourly weather. |
| `modeling_data/bts_nyc_weather_sample_2024_01_summary.csv` | CSV summary | Row counts, weather match rate, delay rates, and other checks for the included sample. |
| `data/module8/full_data_chunk_*.json` | JSON raw data for dashboard | Flight-level exploratory dataset used by the dashboard data explorer. |
| `analysis_results/full_journal_experiment/*.csv` | CSV analysis outputs | Main temporal model metrics, threshold-tuned metrics, and SHAP feature importance. |
| `analysis_results/derived_analysis/*.csv` | CSV analysis outputs | Risk deciles, top-k lift, calibration, model-correlation, and threshold analysis tables. |

## Large Constructed Dataset

The full constructed modeling table used in the manuscript is:

```text
modeling_data/full_2018_2025/flight_delay_features_2018_2025.parquet
```

Local summary from `analysis_results/full_journal_experiment/feature_build_summary.json`:

| Item | Value |
| --- | ---: |
| Rows | 38,298,113 |
| Origin airports | 40 |
| Date range | 2018-01-01 to 2025-12-31 |
| Target rate | 0.1941235065 |
| Weather match rate | 0.9564396815 |
| Approximate local size | 1.77 GB |

Because this file is much larger than 30 MB, it should be uploaded to Figshare,
Zenodo, or PeerJ Supplemental Files rather than committed to GitHub.

Suggested PeerJ legend:

```text
Raw data - constructed full feature table for the 2018-2025 U.S. flight delay
risk-ranking experiment. The table joins BTS flight records with hourly IEM
ASOS weather, airport infrastructure, dynamic congestion, route reliability,
graph/network features, and the departure-delay target used in the manuscript
analysis.
```

Suggested file type in PeerJ:

```text
Dataset
```

## Large Prediction Outputs

The full validation and test prediction files are also large:

```text
analysis_results/full_journal_experiment/validation_predictions.parquet
analysis_results/full_journal_experiment/test_predictions.parquet
```

They can be regenerated with:

```bash
python scripts/run_full_journal_experiment.py --stage train --fast-main-models --heavy-model-max-rows 500000 --shap-rows 6000
```

If uploaded, use a legend such as:

```text
Raw data - validation and test model prediction scores for the 2024 validation
year and 2025 independent test year. These files support the risk-ranking,
threshold, top-k, and calibration analyses reported in the manuscript.
```

## Public Source Data

The constructed datasets are derived from public sources:

| Source | URL | Role |
| --- | --- | --- |
| U.S. BTS Airline On-Time Performance | https://transtats.bts.gov/ | Flight records, delays, cancellations, diversions |
| Iowa Environmental Mesonet ASOS/METAR | https://mesonet.agron.iastate.edu/request/download.phtml | Hourly airport weather |
| OurAirports | https://ourairports.com/data/ | Airport and runway attributes |
| OpenFlights | https://openflights.org/data.php | Route-network lookup |
| NOAA Storm Events | https://www.ncei.noaa.gov/products/storm-events | Optional severe-weather validation windows |
| Australia OTP | https://data.gov.au/ | Optional aggregate external validation |
| nycflights13 | https://github.com/hadley/nycflights13 | Dashboard prototype and NYC exploratory data |

The default downloader command for a small sample is:

```bash
python scripts/download_flight_delay_datasets.py --bts-years 2024 --bts-months 1 --weather-years 2024 --weather-months 1 --stations JFK,EWR,LGA
```

For the full study, expand the years, months, and station list as documented in
`scripts/run_full_journal_experiment.py`.
