"""
Download raw OpenF1 data and save it as Parquet files.

Step 1 - schedule (one file per year):
    data/raw/meetings/year=YYYY/meetings.parquet
    data/raw/sessions/year=YYYY/sessions.parquet

Step 2 - per-session data (one file per session, cancelled sessions skipped):
    data/raw/<endpoint>/year=YYYY/session_<session_key>.parquet
    for endpoint in drivers, laps, stints, session_result

Examples (run from anywhere):
    python pipeline/ingest.py                              # everything, 2023-2026
    python pipeline/ingest.py --year 2025                  # one year only
    python pipeline/ingest.py --year 2025 --skip-schedule \
        --session-name Race --limit 2                      # quick test run
"""

import argparse
import json
import time
from pathlib import Path

import pandas as pd
import pyarrow as pa
import requests

# --- Settings -----------------------------------------------------------------

BASE_URL = "https://api.openf1.org/v1"
YEARS = range(2023, 2027)          # 2023, 2024, 2025, 2026
SCHEDULE_ENDPOINTS = ["meetings", "sessions"]
SESSION_ENDPOINTS = ["drivers", "laps", "stints", "session_result"]
DELAY_SECONDS = 1                  # pause between requests to be polite to the API

# Columns that are always saved as JSON text, so they have the same type in
# every file. Their shape varies by session: a number in races ("12.4"),
# text for lapped cars ("+1 LAP"), and a [Q1, Q2, Q3] list in qualifying.
ALWAYS_JSON = {
    "session_result": ["duration", "gap_to_leader"],
}

# data/raw lives at the repo root, one level above this pipeline/ folder,
# so the script works no matter which folder you run it from.
REPO_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = REPO_ROOT / "data" / "raw"


# --- Command-line options -----------------------------------------------------

def parse_args():
    """Read the command-line options."""
    parser = argparse.ArgumentParser(description="Download raw OpenF1 data to Parquet.")
    parser.add_argument("--year", type=int, choices=list(YEARS),
                        help="only process this one year (default: all years)")
    parser.add_argument("--limit", type=int,
                        help="only process the first N sessions (in date order)")
    parser.add_argument("--skip-schedule", action="store_true",
                        help="don't re-download meetings and sessions; use the saved files")
    # Filter on session_name, not session_type: OpenF1 labels Sprints as
    # session_type "Race", so only session_name separates them from Grands Prix.
    parser.add_argument("--session-name",
                        help='only process sessions with this name, e.g. "Race", "Sprint", "Qualifying"')
    return parser.parse_args()


# --- Helpers ------------------------------------------------------------------

# Remember when the last request happened so we can always wait between calls.
_last_request_time = None


def fetch_json(endpoint, params):
    """Request one endpoint with the given query params and return the JSON list.

    Waits DELAY_SECONDS since the previous request first.
    Stops with an error on any HTTP failure (no retries yet).
    """
    global _last_request_time
    if _last_request_time is not None:
        elapsed = time.monotonic() - _last_request_time
        if elapsed < DELAY_SECONDS:
            time.sleep(DELAY_SECONDS - elapsed)

    url = f"{BASE_URL}/{endpoint}"
    response = requests.get(url, params=params, timeout=60)
    _last_request_time = time.monotonic()

    response.raise_for_status()
    return response.json()


def is_missing(value):
    """True for None or NaN (but not for lists, which pd.isna can't handle)."""
    return value is None or (isinstance(value, float) and pd.isna(value))


def to_json_text(series):
    """Encode every value in a column as JSON text; missing values stay null.

    JSON (not str()) keeps structure readable later: a list becomes
    '[0.123, null, "+1 LAP"]', which DuckDB and Python can parse back.
    The result is a pandas string column, so it's saved as Parquet text even
    when every value is missing (a plain object column would save as "null").
    """
    encoded = series.map(lambda v: None if is_missing(v) else json.dumps(v))
    return encoded.astype("string")


def make_parquet_safe(df, endpoint):
    """Make sure every column can be saved to Parquet, without losing values.

    1. Columns listed in ALWAYS_JSON for this endpoint are always JSON text,
       so their type is the same in every file.
    2. Any other column is kept as-is if Parquet accepts it. If Parquet rejects
       it (e.g. mixed numbers and text, or lists with mixed items), it's
       stored as JSON text instead.
    """
    always_json = ALWAYS_JSON.get(endpoint, [])

    for col in df.columns:
        if col in always_json:
            df[col] = to_json_text(df[col])
            continue

        # Ask pyarrow (the Parquet library) whether it can convert this column.
        try:
            pa.array(df[col], from_pandas=True)
        except (pa.ArrowInvalid, pa.ArrowTypeError):
            print(f"  note: {endpoint}.{col} has mixed types; storing as JSON text")
            df[col] = to_json_text(df[col])

    return df


def save_parquet(records, endpoint, out_path):
    """Turn a list of JSON records into a DataFrame and write it as Parquet.

    Every field the API returns becomes a column; nothing is dropped or renamed.
    Prints one line with the row count.
    """
    df = make_parquet_safe(pd.DataFrame(records), endpoint)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(out_path, index=False)
    print(f"Saved {out_path.relative_to(REPO_ROOT)} ({len(df)} rows)")


# --- Step 1: schedule (meetings and sessions) ---------------------------------

def download_schedule(years):
    """Download meetings and sessions for each year, one file per year."""
    for year in years:
        for endpoint in SCHEDULE_ENDPOINTS:
            records = fetch_json(endpoint, {"year": year})
            # Hive-style folder name (year=YYYY) so DuckDB can read the year
            # back out of the path later.
            out_path = RAW_DIR / endpoint / f"year={year}" / f"{endpoint}.parquet"
            save_parquet(records, endpoint, out_path)


# --- Step 2: pick which sessions to process -----------------------------------

def load_sessions(years, session_name=None, limit=None):
    """Read the saved session files and return the sessions to process.

    Skips cancelled sessions, optionally filters by session_name, sorts by
    start time, and optionally keeps only the first `limit` rows.
    """
    frames = []
    for year in years:
        path = RAW_DIR / "sessions" / f"year={year}" / "sessions.parquet"
        frames.append(pd.read_parquet(path))
    sessions = pd.concat(frames, ignore_index=True)

    # Skip cancelled sessions. fillna(False) treats a missing flag as "not cancelled".
    cancelled = sessions["is_cancelled"].fillna(False).astype(bool)
    print(f"Skipping {cancelled.sum()} cancelled session(s)")
    sessions = sessions[~cancelled]

    if session_name:
        sessions = sessions[sessions["session_name"] == session_name]

    sessions = sessions.sort_values("date_start")
    if limit is not None:
        sessions = sessions.head(limit)

    return sessions


# --- Step 3: per-session data (drivers, laps, stints, session_result) ---------

def download_session_data(sessions):
    """For each session, download every per-session endpoint to its own file."""
    for session in sessions.itertuples():
        print(f"\nSession {session.session_key}: {session.year} "
              f"{session.location} - {session.session_name}")

        for endpoint in SESSION_ENDPOINTS:
            records = fetch_json(endpoint, {"session_key": session.session_key})
            out_path = (RAW_DIR / endpoint / f"year={session.year}"
                        / f"session_{session.session_key}.parquet")
            save_parquet(records, endpoint, out_path)


# --- Main ---------------------------------------------------------------------

def main():
    args = parse_args()
    years = [args.year] if args.year else list(YEARS)

    # Step 1: refresh the schedule unless told to reuse the saved files.
    if args.skip_schedule:
        print("Skipping schedule download (using saved meetings/sessions files)")
    else:
        download_schedule(years)

    # Step 2: decide which sessions to fetch.
    sessions = load_sessions(years, args.session_name, args.limit)
    print(f"Processing {len(sessions)} session(s)")

    # Step 3: fetch the per-session endpoints.
    download_session_data(sessions)


if __name__ == "__main__":
    main()
