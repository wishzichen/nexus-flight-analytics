# PeerJ Resubmission Checklist

This checklist maps the editor's requested changes to files in this repository
and to actions in the PeerJ submission system.

## 1. README File Required

Completed in:

```text
README.md
```

The README now includes:

- project title and description;
- dataset information;
- code information;
- requirements;
- usage instructions;
- methodology summary;
- citations and data sources;
- license and contribution notes.

## 2. Datasets Required

Completed locally in:

```text
DATA_AVAILABILITY.md
modeling_data/bts_nyc_weather_sample_2024_01.csv
modeling_data/bts_nyc_weather_sample_2024_01_summary.csv
data/module8/full_data_chunk_*.json
analysis_results/full_journal_experiment/*.csv
analysis_results/derived_analysis/*.csv
```

Action still needed in PeerJ:

Upload the large constructed dataset to Figshare, Zenodo, or PeerJ
Supplemental Files:

```text
modeling_data/full_2018_2025/flight_delay_features_2018_2025.parquet
```

Use a supplemental-file legend containing the term "raw data", for example:

```text
Raw data - constructed full feature table for the 2018-2025 U.S. flight delay
risk-ranking experiment. The table joins BTS flight records with hourly IEM
ASOS weather, airport infrastructure, dynamic congestion, route reliability,
graph/network features, and the departure-delay target used in the manuscript
analysis.
```

Select file type:

```text
Dataset
```

If the large prediction files are also uploaded, use:

```text
Raw data - validation and test model prediction scores for the 2024 validation
year and 2025 independent test year. These files support the risk-ranking,
threshold, top-k, and calibration analyses reported in the manuscript.
```

## 3. Computer Code Required

Completed in:

```text
CODE_AVAILABILITY.md
requirements.txt
scripts/download_flight_delay_datasets.py
scripts/build_delay_modeling_sample.py
scripts/run_advanced_model_pilot.py
scripts/run_full_journal_experiment.py
scripts/*.R
src/
simple-server.mjs
package.json
```

Action still needed in PeerJ:

Provide the GitHub repository URL or a DOI-linked archived release.

Suggested statement:

```text
Computer code is available at https://github.com/wishzichen/nexus-flight-analytics.
The repository includes public-data download scripts, feature construction,
model training and evaluation scripts, result tables, and the Nexus Flight
Analytics dashboard prototype.
```

For a stronger archival record, create a GitHub release and archive it with
Zenodo to obtain a DOI, then enter that DOI in the PeerJ data/code declaration.

## 4. Submission-System Metadata

Before clicking resubmit, verify the following directly in the PeerJ submission
system. PeerJ states that it uses the submission-system metadata, not the
manuscript file, and that these items cannot be changed after acceptance:

- author list and author order;
- equal first-author notes;
- corresponding author designation;
- author contributions;
- affiliations;
- funding and grant disclosures;
- competing interests;
- data availability statement;
- code availability statement.

## 5. Recommended Resubmission Sequence

1. Commit and push this repository update to GitHub.
2. Confirm the GitHub page shows `README.md` at the repository root.
3. Upload the large constructed raw data file to Figshare/Zenodo or PeerJ
   Supplemental Files.
4. Add the GitHub URL or archived DOI in the code availability field.
5. Add the dataset DOI or supplemental raw-data file in the data availability
   field.
6. Recheck author, affiliation, funding, competing-interest, and contribution
   metadata in PeerJ.
7. Click Edit and Resubmit.
