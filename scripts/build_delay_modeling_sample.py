"""Build a flight-weather modeling sample from downloaded public data.

The default sample joins BTS January 2024 flights for NYC airports with IEM
ASOS/METAR observations rounded to the scheduled departure hour.
"""

from __future__ import annotations

import zipfile
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "external_datasets"
OUT_DIR = ROOT / "modeling_data"


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
    "DepTime",
    "DepDelay",
    "DepDelayMinutes",
    "DepDel15",
    "TaxiOut",
    "CRSArrTime",
    "ArrTime",
    "ArrDelay",
    "ArrDelayMinutes",
    "ArrDel15",
    "Cancelled",
    "CancellationCode",
    "Diverted",
    "CRSElapsedTime",
    "ActualElapsedTime",
    "AirTime",
    "Distance",
    "CarrierDelay",
    "WeatherDelay",
    "NASDelay",
    "SecurityDelay",
    "LateAircraftDelay",
]


def read_bts_zip(path: Path) -> pd.DataFrame:
    with zipfile.ZipFile(path) as archive:
        csv_name = next(name for name in archive.namelist() if name.lower().endswith(".csv"))
        with archive.open(csv_name) as handle:
            return pd.read_csv(handle, usecols=lambda col: col in BTS_COLUMNS, low_memory=False)


def hhmm_to_hour(value: object) -> int | None:
    if pd.isna(value):
        return None
    try:
        value_int = int(float(value))
    except ValueError:
        return None
    hour = min(value_int // 100, 23)
    return hour


def add_scheduled_departure_hour(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["sched_dep_hour"] = df["CRSDepTime"].map(hhmm_to_hour)
    df["sched_dep_datetime_utc"] = pd.to_datetime(df["FlightDate"]) + pd.to_timedelta(
        df["sched_dep_hour"].fillna(0).astype(int), unit="h"
    )
    return df


def read_weather(path: Path) -> pd.DataFrame:
    weather = pd.read_csv(path, na_values=["M"])
    weather["valid_hour"] = pd.to_datetime(weather["valid"], utc=True).dt.floor("h").dt.tz_localize(None)
    numeric_cols = ["tmpf", "dwpf", "relh", "drct", "sknt", "vsby", "feel", "skyl1"]
    for col in numeric_cols:
        weather[col] = pd.to_numeric(weather[col], errors="coerce")
    weather = weather.sort_values("valid_hour")
    agg = {
        "tmpf": "mean",
        "dwpf": "mean",
        "relh": "mean",
        "drct": "mean",
        "sknt": "mean",
        "vsby": "mean",
        "feel": "mean",
        "skyl1": "mean",
        "wxcodes": lambda s: ";".join(sorted({str(x) for x in s.dropna() if str(x) != "nan"})) or None,
        "skyc1": lambda s: s.dropna().mode().iloc[0] if not s.dropna().empty else None,
    }
    return weather.groupby(["station", "valid_hour"], as_index=False).agg(agg)


def add_targets(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["dep_delay_15"] = (df["DepDelayMinutes"].fillna(0) >= 15).astype(int)
    df["arr_delay_15"] = (df["ArrDelayMinutes"].fillna(0) >= 15).astype(int)
    df["cancel_or_divert"] = ((df["Cancelled"].fillna(0) == 1) | (df["Diverted"].fillna(0) == 1)).astype(int)
    df["total_delay_minutes"] = df[["DepDelayMinutes", "ArrDelayMinutes"]].fillna(0).max(axis=1)
    return df


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    bts_zip = DATA_DIR / "bts" / "On_Time_Reporting_Carrier_On_Time_Performance_1987_present_2024_1.zip"
    weather_csv = DATA_DIR / "weather_iem" / "nyc_asos_2024_01.csv"

    flights = read_bts_zip(bts_zip)
    flights = flights[flights["Origin"].isin(["JFK", "EWR", "LGA"])].copy()
    flights = add_scheduled_departure_hour(flights)
    weather = read_weather(weather_csv)

    sample = flights.merge(
        weather,
        left_on=["Origin", "sched_dep_datetime_utc"],
        right_on=["station", "valid_hour"],
        how="left",
    )
    sample = add_targets(sample)
    sample.to_csv(OUT_DIR / "bts_nyc_weather_sample_2024_01.csv", index=False)

    summary = pd.DataFrame(
        [
            {"metric": "rows", "value": len(sample)},
            {"metric": "origins", "value": sample["Origin"].nunique()},
            {"metric": "destinations", "value": sample["Dest"].nunique()},
            {"metric": "weather_match_rate", "value": sample["tmpf"].notna().mean()},
            {"metric": "departure_delay_15_rate", "value": sample["dep_delay_15"].mean()},
            {"metric": "arrival_delay_15_rate", "value": sample["arr_delay_15"].mean()},
            {"metric": "cancel_or_divert_rate", "value": sample["cancel_or_divert"].mean()},
        ]
    )
    summary.to_csv(OUT_DIR / "bts_nyc_weather_sample_2024_01_summary.csv", index=False)
    print(summary.to_string(index=False))


if __name__ == "__main__":
    main()
