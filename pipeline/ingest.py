"""
Download raw OpenF1 data and save it as Parquet files.

This step only fetches two endpoints, meetings and sessions, for 2023-2026.
Output layout (relative to the repo root):
    data/raw/meetings/year=YYYY/meetings.parquet
    data/raw/sessions/year=YYYY/sessions.parquet

Run from anywhere:
    python pipeline/ingest.py
"""

import time
from pathlib import Path

import pandas as pd
import requests

# --- Settings -----------------------------------------------------------------

BASE_URL = "https://api.openf1.org/v1"
YEARS = range(2023, 2027)          # 2023, 2024, 2025, 2026
ENDPOINTS = ["meetings", "sessions"]
DELAY_SECONDS = 1                  # pause between requests to be polite to the API

# data/raw lives at the repo root, one level above this pipeline/ folder,
# so the script works no matter which folder you run it from.
REPO_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = REPO_ROOT / "data" / "raw"


# --- Helpers ------------------------------------------------------------------

def fetch_json(endpoint, year):
    """Request one endpoint for one year and return the parsed JSON list."""
    url = f"{BASE_URL}/{endpoint}"
    response = requests.get(url, params={"year": year}, timeout=30)
    response.raise_for_status()  # stop with a clear error on any HTTP failure
    return response.json()


def save_parquet(records, endpoint, year):
    """Turn a list of JSON records into a DataFrame and write it as Parquet.

    Every field the API returns becomes a column; nothing is dropped or renamed.
    Returns the path written and the number of rows.
    """
    df = pd.DataFrame(records)

    # Hive-style folder name (year=YYYY) so tools like DuckDB can read the
    # year back out of the path later.
    out_dir = RAW_DIR / endpoint / f"year={year}"
    out_dir.mkdir(parents=True, exist_ok=True)

    out_path = out_dir / f"{endpoint}.parquet"
    df.to_parquet(out_path, index=False)
    return out_path, len(df)


# --- Main ---------------------------------------------------------------------

def main():
    first_request = True

    for year in YEARS:
        for endpoint in ENDPOINTS:
            # Wait between requests (but not before the very first one).
            if not first_request:
                time.sleep(DELAY_SECONDS)
            first_request = False

            records = fetch_json(endpoint, year)
            out_path, row_count = save_parquet(records, endpoint, year)

            # One line per file saved, path shown relative to the repo root.
            print(f"Saved {out_path.relative_to(REPO_ROOT)} ({row_count} rows)")


if __name__ == "__main__":
    main()
