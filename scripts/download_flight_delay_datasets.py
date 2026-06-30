"""Download reproducible public datasets for the flight-delay project.

The script defaults to a small, verifiable sample so it can be run on an
ordinary laptop. Expand --bts-years/--bts-months and --stations when moving
from proof-of-data to the full journal experiment.
"""

from __future__ import annotations

import argparse
import calendar
import re
import urllib.parse
import urllib.request
from pathlib import Path
from urllib.error import ContentTooShortError, HTTPError, URLError


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "external_datasets"


STATIC_DOWNLOADS = {
    "ourairports_airports.csv": "https://davidmegginson.github.io/ourairports-data/airports.csv",
    "ourairports_runways.csv": "https://davidmegginson.github.io/ourairports-data/runways.csv",
    "openflights_routes.dat": "https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat",
    "openflights_airports.dat": "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat",
    "australia_otp_time_series.csv": "https://data.gov.au/data/dataset/29128ebd-dbaa-4ff5-8b86-d9f30de56452/resource/cf663ed1-0c5e-497f-aea9-e74bfda9cf44/download/otp_time_series_web.csv",
}


IEM_FIELDS = [
    "tmpf",
    "dwpf",
    "relh",
    "drct",
    "sknt",
    "vsby",
    "feel",
    "skyc1",
    "skyl1",
    "wxcodes",
]


def download(url: str, out_path: Path, overwrite: bool = False, retries: int = 3) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    if out_path.exists() and not overwrite:
        print(f"exists: {out_path.relative_to(ROOT)}")
        return
    tmp_path = out_path.with_suffix(out_path.suffix + ".part")
    if tmp_path.exists():
        tmp_path.unlink()
    for attempt in range(1, retries + 1):
        try:
            print(f"download: {url}")
            urllib.request.urlretrieve(url, tmp_path)
            tmp_path.replace(out_path)
            print(f"saved: {out_path.relative_to(ROOT)} ({out_path.stat().st_size:,} bytes)")
            return
        except (ContentTooShortError, HTTPError, URLError, TimeoutError) as exc:
            if tmp_path.exists():
                tmp_path.unlink()
            if attempt == retries:
                raise
            print(f"retry {attempt}/{retries - 1}: {exc}")


def download_static(overwrite: bool) -> None:
    for filename, url in STATIC_DOWNLOADS.items():
        download(url, DATA_DIR / filename, overwrite)


def download_bts(years: list[int], months: list[int], overwrite: bool) -> None:
    bts_dir = DATA_DIR / "bts"
    for year in years:
        for month in months:
            filename = f"On_Time_Reporting_Carrier_On_Time_Performance_1987_present_{year}_{month}.zip"
            url = f"https://transtats.bts.gov/PREZIP/{filename}"
            download(url, bts_dir / filename, overwrite)


def iem_url(stations: list[str], year: int, month: int) -> str:
    last_day = calendar.monthrange(year, month)[1]
    params: list[tuple[str, str | int]] = []
    params.extend(("station", station.upper()) for station in stations)
    params.extend(("data", field) for field in IEM_FIELDS)
    params.extend(
        [
            ("year1", year),
            ("month1", month),
            ("day1", 1),
            ("year2", year),
            ("month2", month),
            ("day2", last_day),
            ("tz", "Etc/UTC"),
            ("format", "onlycomma"),
            ("latlon", "yes"),
            ("elev", "yes"),
            ("missing", "M"),
            ("trace", "T"),
            ("direct", "no"),
            ("report_type", 1),
            ("report_type", 2),
        ]
    )
    return "https://mesonet.agron.iastate.edu/cgi-bin/request/asos.py?" + urllib.parse.urlencode(params)


def download_iem_weather(stations: list[str], years: list[int], months: list[int], overwrite: bool) -> None:
    weather_dir = DATA_DIR / "weather_iem"
    station_tag = "_".join(s.upper() for s in stations)
    for year in years:
        for month in months:
            out = weather_dir / f"asos_{station_tag}_{year}_{month:02d}.csv"
            download(iem_url(stations, year, month), out, overwrite)


def chunks(values: list[str], size: int) -> list[list[str]]:
    return [values[i : i + size] for i in range(0, len(values), size)]


def latest_storm_events_url(year: int) -> str:
    index_url = "https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/"
    with urllib.request.urlopen(index_url) as response:
        html = response.read().decode("utf-8", errors="replace")
    pattern = rf"StormEvents_details-ftp_v1\.0_d{year}_c\d+\.csv\.gz"
    matches = sorted(set(re.findall(pattern, html)))
    if not matches:
        raise RuntimeError(f"No Storm Events details file found for {year}")
    return urllib.parse.urljoin(index_url, matches[-1])


def download_storm_events(years: list[int], overwrite: bool) -> None:
    storm_dir = DATA_DIR / "storm_events"
    for year in years:
        url = latest_storm_events_url(year)
        download(url, storm_dir / f"StormEvents_details_{year}.csv.gz", overwrite)


def parse_csv_ints(value: str) -> list[int]:
    return [int(part.strip()) for part in value.split(",") if part.strip()]


def parse_csv_strings(value: str) -> list[str]:
    return [part.strip().upper() for part in value.split(",") if part.strip()]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--bts-years", default="2024")
    parser.add_argument("--bts-months", default="1")
    parser.add_argument("--weather-years", default="2024")
    parser.add_argument("--weather-months", default="1")
    parser.add_argument("--stations", default="JFK,EWR,LGA")
    parser.add_argument("--station-chunk-size", type=int, default=15)
    parser.add_argument("--storm-years", default="2024")
    parser.add_argument("--overwrite", action="store_true")
    parser.add_argument("--skip-static", action="store_true")
    parser.add_argument("--skip-bts", action="store_true")
    parser.add_argument("--skip-weather", action="store_true")
    parser.add_argument("--skip-storm", action="store_true")
    args = parser.parse_args()

    if not args.skip_static:
        download_static(args.overwrite)
    if not args.skip_bts:
        download_bts(parse_csv_ints(args.bts_years), parse_csv_ints(args.bts_months), args.overwrite)
    if not args.skip_weather:
        station_list = parse_csv_strings(args.stations)
        for station_chunk in chunks(station_list, args.station_chunk_size):
            download_iem_weather(
                station_chunk,
                parse_csv_ints(args.weather_years),
                parse_csv_ints(args.weather_months),
                args.overwrite,
            )
    if not args.skip_storm:
        download_storm_events(parse_csv_ints(args.storm_years), args.overwrite)


if __name__ == "__main__":
    main()
