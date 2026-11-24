"""
Download raw OpenF1 data and save it as Parquet files.

Step 1 - schedule (one file per year):
    data/raw/meetings/year=YYYY/meetings.parquet
    data/raw/sessions/year=YYYY/sessions.parquet
    The current season (today's UTC year) is always re-downloaded; a past
    season is downloaded only if its file is missing. --skip-schedule skips both.

Step 2 - per-session data (one file per session, cancelled sessions skipped):
    data/raw/<endpoint>/year=YYYY/session_<session_key>.parquet
    for each endpoint in SESSION_ENDPOINTS (or just those given with --endpoints)

Which endpoints are requested depends on the session (ENDPOINTS_BY_SESSION_NAME);
sessions not in that map, cancelled sessions, and sessions that finished less
than --min-age-hours ago (default 24) are skipped.

Runs are incremental. A session + endpoint is skipped when:
    - its Parquet file already exists (unless --force, which needs --session-keys)
    - it's listed in data/raw/_no_data.csv (unless --retry-no-data; a retry that
      finds data saves it and removes the row from _no_data.csv)

Examples (run from anywhere):
    python pipeline/ingest.py                              # everything new, 2023-2026
    python pipeline/ingest.py --year 2025,2026 \
        --session-name Race,Qualifying                     # GP races + qualifying
    python pipeline/ingest.py --session-keys 9689,9693 \
        --skip-schedule                                    # exact sessions
    python pipeline/ingest.py --year 2025 --dry-run        # plan only, no requests
    python pipeline/ingest.py --force --session-keys 11420 # re-download one session
    python pipeline/ingest.py --retry-no-data              # retry logged 404s
"""

import argparse
import csv
import hashlib
import json
import math
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
import requests

# --- Settings -----------------------------------------------------------------

BASE_URL = "https://api.openf1.org/v1"
YEARS = range(2023, 2027)          # 2023, 2024, 2025, 2026
SCHEDULE_ENDPOINTS = ["meetings", "sessions"]
# Per-session endpoints, each requested as /<endpoint>?session_key=KEY.
# Per the OpenF1 docs none of these need any other parameter.
SESSION_ENDPOINTS = [
    "drivers", "laps", "stints", "session_result",
    "pit", "position", "race_control", "weather",
    "starting_grid", "team_radio", "overtakes",
]


def all_except(*excluded):
    """All per-session endpoints except the ones named, in the usual order."""
    return [e for e in SESSION_ENDPOINTS if e not in excluded]


# Which endpoints to request for each session_name (matched exactly).
# Sessions whose name isn't here are skipped with a note.
ENDPOINTS_BY_SESSION_NAME = {
    # starting_grid is filed under the qualifying session, so it 404s here.
    "Race": all_except("starting_grid"),
    # overtakes only exist for races; starting_grid lives here.
    "Qualifying": all_except("overtakes"),
    # To add later, for example:
    # "Sprint": all_except("starting_grid"),
    # "Sprint Qualifying": all_except("overtakes"),   # holds the Sprint grid
    # "Practice 1": all_except("starting_grid", "overtakes"),
}

# OpenF1 free tier allows 3 requests/second and 30 requests/minute.
# Each request starts at least 2.1 s after the previous one started
# (start-to-start), so there are never more than about 28.5 per minute.
DELAY_SECONDS = 2.1

# On HTTP 429 (rate limited): retry up to this many times. Use the server's
# Retry-After header if it sends one, otherwise wait 5 s, then 10, 20, 40, 80.
MAX_RETRIES = 5
FIRST_BACKOFF_SECONDS = 5

# Only process sessions that ended at least this many hours ago, so OpenF1 has
# had time to fill in late fields (e.g. pit.stop_duration). --min-age-hours.
DEFAULT_MIN_AGE_HOURS = 24

# Declared schema for every endpoint: each known column and its type. Applied
# to every column present when saving, so a column has the same type in every
# file, even when it's entirely empty in one (which would otherwise save with
# no type at all). Columns are never added or dropped. A column the API sends
# that isn't listed here keeps its inferred type, with a printed warning, and
# should be added here.
#
# Built from the types observed in files where each column has values
# (test sample + schedule, 23 November 2026). Types:
#   "Int64"   - whole numbers, missing values allowed
#   "float64" - decimals
#   "string"  - text (dates are ISO 8601 text, as the API sends them)
#   "boolean" - true/false, missing values allowed
#   "list"    - a list per row (e.g. mini-sector codes); kept as sent
#   "json"    - JSON text, for fields whose shape varies by session
_MEETING_COLUMNS = {
    "meeting_key": "Int64", "meeting_name": "string", "meeting_official_name": "string",
    "location": "string", "country_key": "Int64", "country_code": "string",
    "country_name": "string", "country_flag": "string", "circuit_key": "Int64",
    "circuit_short_name": "string", "circuit_type": "string",
    "circuit_info_url": "string", "circuit_image": "string", "gmt_offset": "string",
    "date_start": "string", "date_end": "string", "year": "Int64",
    "is_cancelled": "boolean",
}
SCHEMAS = {
    "meetings": _MEETING_COLUMNS,
    "sessions": {
        "session_key": "Int64", "session_type": "string", "session_name": "string",
        "date_start": "string", "date_end": "string", "meeting_key": "Int64",
        "circuit_key": "Int64", "circuit_short_name": "string", "country_key": "Int64",
        "country_code": "string", "country_name": "string", "location": "string",
        "gmt_offset": "string", "year": "Int64", "is_cancelled": "boolean",
    },
    "drivers": {
        "meeting_key": "Int64", "session_key": "Int64", "driver_number": "Int64",
        "broadcast_name": "string", "full_name": "string", "name_acronym": "string",
        "team_name": "string", "team_colour": "string", "first_name": "string",
        "last_name": "string", "headshot_url": "string",
        # Always null so far, so never observed; text per the OpenF1 docs.
        "country_code": "string",
    },
    "laps": {
        "meeting_key": "Int64", "session_key": "Int64", "driver_number": "Int64",
        "lap_number": "Int64", "date_start": "string",
        "duration_sector_1": "float64", "duration_sector_2": "float64",
        "duration_sector_3": "float64", "i1_speed": "Int64", "i2_speed": "Int64",
        "is_pit_out_lap": "boolean", "lap_duration": "float64",
        "segments_sector_1": "list", "segments_sector_2": "list",
        "segments_sector_3": "list", "st_speed": "Int64",
    },
    "stints": {
        "meeting_key": "Int64", "session_key": "Int64", "stint_number": "Int64",
        "driver_number": "Int64", "lap_start": "Int64", "lap_end": "Int64",
        "compound": "string", "tyre_age_at_start": "Int64",
    },
    "session_result": {
        # Usually a number, but can be a text code such as "RT" (retired;
        # Marina Bay 2026 Qualifying), so it's JSON text in every file.
        "position": "json", "driver_number": "Int64", "number_of_laps": "Int64",
        "points": "float64",          # races only
        "dnf": "boolean", "dns": "boolean", "dsq": "boolean",
        # A number in races ("12.4"), text for lapped cars ("+1 LAP"), and a
        # [Q1, Q2, Q3] list in qualifying.
        "duration": "json", "gap_to_leader": "json",
        "meeting_key": "Int64", "session_key": "Int64",
    },
    "pit": {
        "date": "string", "session_key": "Int64", "meeting_key": "Int64",
        "driver_number": "Int64", "lap_number": "Int64",
        "lane_duration": "float64",
        "stop_duration": "float64",   # empty in qualifying and before late 2024
        "pit_duration": "float64",    # deprecated duplicate of lane_duration
    },
    "position": {
        "date": "string", "session_key": "Int64", "meeting_key": "Int64",
        "driver_number": "Int64", "position": "Int64",
    },
    "race_control": {
        "meeting_key": "Int64", "session_key": "Int64", "date": "string",
        "driver_number": "Int64",     # empty in qualifying so far
        "lap_number": "Int64",        # races only
        "category": "string", "flag": "string", "scope": "string",
        "sector": "Int64",
        "qualifying_phase": "Int64",  # qualifying only
        "message": "string",
    },
    "weather": {
        "date": "string", "session_key": "Int64", "meeting_key": "Int64",
        "air_temperature": "float64", "track_temperature": "float64",
        "humidity": "float64", "pressure": "float64",
        "rainfall": "Int64",          # 0/1, not true/false
        "wind_direction": "Int64", "wind_speed": "float64",
    },
    "starting_grid": {
        "position": "Int64", "driver_number": "Int64", "lap_duration": "float64",
        "meeting_key": "Int64", "session_key": "Int64",
    },
    "team_radio": {
        "meeting_key": "Int64", "session_key": "Int64", "driver_number": "Int64",
        "date": "string", "recording_url": "string",
    },
    "overtakes": {
        "meeting_key": "Int64", "session_key": "Int64",
        "overtaking_driver_number": "Int64", "overtaken_driver_number": "Int64",
        "date": "string", "position": "Int64",
    },
}

# Undeclared columns already warned about in this run (warn once each).
_warned_columns = set()

# data/raw lives at the repo root, one level above this pipeline/ folder,
# so the script works no matter which folder you run it from.
REPO_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = REPO_ROOT / "data" / "raw"

# Run logs (CSV, appended to on every run).
NO_DATA_LOG = RAW_DIR / "_no_data.csv"
RATE_LIMIT_LOG = RAW_DIR / "_rate_limit_log.csv"

# Counters for the end-of-run summary.
STATS = {
    "requests": 0, "files_saved": 0, "no_data": 0, "rate_limited": 0,
    "skipped_exists": 0,       # per-session file already saved
    "skipped_no_data": 0,      # listed in _no_data.csv (no --retry-no-data)
    "schedule_kept": 0,        # past-season schedule file already saved
    "retry_found": 0,          # --retry-no-data: data found, row removed
    "retry_still_none": 0,     # --retry-no-data: still 404
    "fingerprints_ok": 0,      # --resave-local: values unchanged
}


# --- Command-line options -----------------------------------------------------

def parse_args():
    """Read the command-line options."""
    parser = argparse.ArgumentParser(description="Download raw OpenF1 data to Parquet.")
    parser.add_argument("--year", type=parse_year_list, default=list(YEARS),
                        help="comma-separated years, e.g. 2025,2026 (default: all years)")
    parser.add_argument("--limit", type=int,
                        help="only process the first N sessions (in date order)")
    parser.add_argument("--skip-schedule", action="store_true",
                        help="don't re-download meetings and sessions; use the saved files")
    # Filter on session_name, not session_type: OpenF1 labels Sprints as
    # session_type "Race", so only session_name separates them from Grands Prix.
    parser.add_argument("--session-name", type=parse_text_list,
                        help='comma-separated exact session names, e.g. "Race,Qualifying" '
                             '(matches Grands Prix only, not "Sprint" or "Sprint Qualifying")')
    parser.add_argument("--session-keys", type=parse_int_list,
                        help="comma-separated session_keys to process, e.g. 9689,9693")
    parser.add_argument("--endpoints", type=parse_endpoint_list, default=SESSION_ENDPOINTS,
                        help="comma-separated per-session endpoints to download, "
                             "e.g. pit,weather (default: all of them)")
    parser.add_argument("--dry-run", action="store_true",
                        help="don't contact the API; use the saved schedule to list "
                             "the requests this run would make, with a time estimate")
    parser.add_argument("--resave-local", action="store_true",
                        help="don't contact the API; re-apply the declared schemas to raw "
                             "files already on disk and save them back (honours --year, "
                             "--session-name and --session-keys); stops if any file's "
                             "values would change")
    parser.add_argument("--min-age-hours", type=float, default=DEFAULT_MIN_AGE_HOURS,
                        help="only process sessions that ended at least this many hours "
                             f"ago (default: {DEFAULT_MIN_AGE_HOURS})")
    parser.add_argument("--retry-no-data", action="store_true",
                        help="re-request session + endpoint pairs listed in _no_data.csv "
                             "(found data is saved and its row removed)")
    parser.add_argument("--force", action="store_true",
                        help="re-download the selected sessions even if their files exist "
                             "(requires --session-keys)")
    args = parser.parse_args()
    # Guard against an accidental full re-download (thousands of requests).
    if args.force and not args.session_keys:
        parser.error("--force must be combined with --session-keys")
    return args


def parse_text_list(text):
    """Turn "Race, Qualifying" into ["Race", "Qualifying"]."""
    items = [item.strip() for item in text.split(",") if item.strip()]
    if not items:
        raise argparse.ArgumentTypeError("expected at least one value")
    return items


def parse_int_list(text):
    """Turn "9689, 9693" into [9689, 9693]."""
    try:
        return [int(item) for item in parse_text_list(text)]
    except ValueError:
        raise argparse.ArgumentTypeError(f"expected comma-separated numbers, got {text!r}")


def parse_year_list(text):
    """Turn "2025,2026" into [2025, 2026], rejecting years outside YEARS."""
    years = parse_int_list(text)
    bad = [y for y in years if y not in YEARS]
    if bad:
        raise argparse.ArgumentTypeError(
            f"unsupported year(s) {bad}; choose from {YEARS.start}-{YEARS.stop - 1}")
    return years


def parse_endpoint_list(text):
    """Turn "pit, weather" into ["pit", "weather"], rejecting unknown names."""
    names = parse_text_list(text)
    unknown = [name for name in names if name not in SESSION_ENDPOINTS]
    if unknown:
        raise argparse.ArgumentTypeError(
            f"unknown endpoint(s) {unknown}; choose from: {', '.join(SESSION_ENDPOINTS)}")
    return names


# --- Logging helpers ----------------------------------------------------------

def append_csv_row(path, row):
    """Append one dict as a row to a CSV file, writing the header if it's new."""
    path.parent.mkdir(parents=True, exist_ok=True)
    is_new = not path.exists()
    with path.open("a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(row))
        if is_new:
            writer.writeheader()
        writer.writerow(row)


def now_utc():
    """Current time as an ISO 8601 UTC string, for log timestamps."""
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def log_no_data(endpoint, session_key="", session_name="", year=""):
    """Record a 404 (no data) result in _no_data.csv and print a line."""
    STATS["no_data"] += 1
    append_csv_row(NO_DATA_LOG, {
        "logged_at": now_utc(),
        "endpoint": endpoint,
        "session_key": session_key,
        "session_name": session_name,
        "year": year,
    })
    print(f"No data for {endpoint} (session {session_key or '-'}, year {year})")


def load_no_data_pairs():
    """The (endpoint, session_key) pairs logged in _no_data.csv as 404 / no data.

    Schedule rows (no session_key) are left out.
    """
    if not NO_DATA_LOG.exists():
        return set()
    log = pd.read_csv(NO_DATA_LOG)
    log = log[pd.to_numeric(log["session_key"], errors="coerce").notna()]
    return set(zip(log["endpoint"], log["session_key"].astype(int)))


def remove_no_data_rows(endpoint, session_key):
    """Delete every _no_data.csv row for this endpoint + session (data was found)."""
    with NO_DATA_LOG.open(newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        keep = [row for row in reader
                if not (row["endpoint"] == endpoint and row["session_key"] == str(session_key))]
    with NO_DATA_LOG.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(keep)
    print(f"  removed {endpoint} / session {session_key} from "
          f"{NO_DATA_LOG.relative_to(REPO_ROOT)}")


# --- HTTP ---------------------------------------------------------------------

# When the previous request *started* (time.monotonic()), for pacing.
_last_request_time = None


def wait_for_rate_limit():
    """Sleep until at least DELAY_SECONDS have passed since the previous
    request started. A slow response uses up part of the gap, so it doesn't
    add extra time, but the gap is never shorter than DELAY_SECONDS."""
    if _last_request_time is not None:
        elapsed = time.monotonic() - _last_request_time
        if elapsed < DELAY_SECONDS:
            time.sleep(DELAY_SECONDS - elapsed)


def retry_wait_seconds(response, retry_number):
    """How long to wait before retry number 1, 2, 3...

    Uses the Retry-After header (in seconds) if the server sent one,
    otherwise 5 s, then doubling: 5, 10, 20, 40, 80.
    """
    retry_after = response.headers.get("Retry-After")
    if retry_after and retry_after.strip().isdigit():
        return int(retry_after)
    return FIRST_BACKOFF_SECONDS * 2 ** (retry_number - 1)


def fetch_json(endpoint, params):
    """Request one endpoint and return the JSON list, or None if there's no data.

    - Waits DELAY_SECONDS since the previous request first.
    - HTTP 404: OpenF1's way of saying "no results", so returns None.
    - HTTP 429: rate limited, so waits and retries up to MAX_RETRIES times,
      logging each one. Stops the script if every retry is rate limited.
    - Any other HTTP error stops the script.
    """
    global _last_request_time
    url = f"{BASE_URL}/{endpoint}"

    for attempt in range(MAX_RETRIES + 1):   # first try + up to 5 retries
        wait_for_rate_limit()
        # Record the start time before sending, so pacing is start-to-start.
        _last_request_time = time.monotonic()
        response = requests.get(url, params=params, timeout=60)
        STATS["requests"] += 1

        if response.status_code == 404:
            return None

        if response.status_code != 429:
            response.raise_for_status()       # stop on any other HTTP error
            return response.json()

        # Rate limited: log it, then wait before the next try.
        STATS["rate_limited"] += 1
        append_csv_row(RATE_LIMIT_LOG, {"logged_at": now_utc(), "url": response.url,
                                        "attempt": attempt + 1})
        if attempt == MAX_RETRIES:
            break
        wait = retry_wait_seconds(response, attempt + 1)
        print(f"  rate limited (429); waiting {wait}s, retry {attempt + 1} of {MAX_RETRIES}")
        time.sleep(wait)

    sys.exit(f"Stopping: still rate limited (HTTP 429) after {MAX_RETRIES} retries "
             f"for {response.url}. See {RATE_LIMIT_LOG.relative_to(REPO_ROOT)}.")


# --- Saving -------------------------------------------------------------------


def is_missing(value):
    """True for None, pandas' NA or NaN (but not for lists, which pd.isna can't handle)."""
    return value is None or value is pd.NA or (isinstance(value, float) and pd.isna(value))


def to_plain_python(value):
    """json.dumps fallback: numpy numbers (as read back from Parquet) to Python ones."""
    if hasattr(value, "item"):
        return value.item()
    if hasattr(value, "tolist"):
        return value.tolist()
    raise TypeError(f"can't encode {type(value).__name__} as JSON")


def to_json_text(series):
    """Encode every value in a column as JSON text; missing values stay null.

    JSON (not str()) keeps structure readable later: a list becomes
    '[0.123, null, "+1 LAP"]', which DuckDB and Python can parse back.
    The result is a pandas string column, so it's saved as Parquet text even
    when every value is missing (a plain object column would save as "null").
    """
    encoded = series.map(lambda v: None if is_missing(v)
                         else json.dumps(v, default=to_plain_python))
    return encoded.astype("string")


def find_whole_number_columns(records):
    """Return the columns whose non-missing values are all JSON integers.

    Checked on the raw API records, before pandas touches them: the API sends
    whole-number fields as ints (position: 3) and decimal fields as floats
    (points: 25.0), so this never mistakes a decimal column for a whole one.
    Columns that are entirely missing are not included.
    """
    all_ints = {}  # column -> True while every value seen so far is an int
    for record in records:
        for col, value in record.items():
            if value is None:
                continue
            # bool is a subclass of int in Python, so rule it out explicitly.
            is_int = isinstance(value, int) and not isinstance(value, bool)
            all_ints[col] = all_ints.get(col, True) and is_int
    return [col for col, ok in all_ints.items() if ok]


def infer_type(series, endpoint, col, is_whole_number):
    """Type for a column that isn't in the declared schema (the old behaviour).

    Whole-number columns become Int64. Anything else is kept as-is if Parquet
    accepts it, or stored as JSON text if Parquet rejects it (e.g. mixed
    numbers and text, or lists with mixed items).
    """
    if is_whole_number:
        return series.astype("Int64")
    try:
        pa.array(series, from_pandas=True)   # can Parquet store it as it is?
        return series
    except (pa.ArrowInvalid, pa.ArrowTypeError):
        print(f"  note: {endpoint}.{col} has mixed types; storing as JSON text")
        return to_json_text(series)


def cast_column(series, declared, already_json=False):
    """Convert one column to its declared type (see SCHEMAS)."""
    if declared == "json":
        # Files saved earlier already hold JSON text; don't encode it twice.
        return series.astype("string") if already_json else to_json_text(series)
    if declared == "list":
        return series                         # lists are kept exactly as sent
    return series.astype(declared)


def apply_schema(df, endpoint, whole_number_cols=(), json_text_cols=()):
    """Give every column present its declared type, without losing values.

    - Declared columns get their SCHEMAS type, so a column's type is the same
      in every file, even where it's entirely empty.
    - Columns are never added or dropped.
    - An undeclared column keeps its inferred type, with a warning naming the
      endpoint and column (once per run), so it can be added to SCHEMAS.
    - If a value can't be converted to the declared type (the API changed
      something), the column keeps its inferred type, with a warning.

    whole_number_cols: columns whose raw API values are all integers.
    json_text_cols: columns that already hold JSON text (when re-saving files).
    """
    schema = SCHEMAS.get(endpoint, {})
    for col in df.columns:
        declared = schema.get(col)
        if declared is None:
            if (endpoint, col) not in _warned_columns:
                _warned_columns.add((endpoint, col))
                print(f"  WARNING: {endpoint}.{col} is not in the declared schema; "
                      "keeping its inferred type (add it to SCHEMAS in ingest.py)")
            df[col] = infer_type(df[col], endpoint, col, col in whole_number_cols)
            continue
        try:
            df[col] = cast_column(df[col], declared, col in json_text_cols)
        except (TypeError, ValueError) as error:
            print(f"  WARNING: {endpoint}.{col} couldn't be converted to {declared} "
                  f"({error}); keeping its inferred type")
            df[col] = infer_type(df[col], endpoint, col, col in whole_number_cols)
    return df


def write_parquet(df, out_path):
    """Write a DataFrame to Parquet and print one line with the row count."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(out_path, index=False)
    STATS["files_saved"] += 1
    print(f"Saved {out_path.relative_to(REPO_ROOT)} ({len(df)} rows)")


def save_parquet(records, endpoint, out_path):
    """Turn a list of API records into a DataFrame and write it as Parquet.

    Every field the API returns becomes a column; nothing is dropped or renamed.
    """
    whole_number_cols = find_whole_number_columns(records)
    df = pd.DataFrame(records)
    # JSON-text columns are encoded from the API's own values. Going through
    # a pandas column first would turn whole numbers into decimals whenever a
    # value is missing (2 -> 2.0), so the text wouldn't match what was sent.
    for col in json_columns(endpoint) & set(df.columns):
        df[col] = pd.Series([r.get(col) for r in records], index=df.index, dtype=object)
    write_parquet(apply_schema(df, endpoint, whole_number_cols), out_path)


def json_columns(endpoint):
    """The columns SCHEMAS declares as JSON text for an endpoint."""
    return {c for c, t in SCHEMAS.get(endpoint, {}).items() if t == "json"}


# --- Re-save existing files (no API), with a fingerprint guard ---------------

def canonical(value):
    """A value in a form that ignores how it's stored but not what it is.

    Re-saving may change a column's storage type (e.g. double -> Int64), so a
    whole-number float counts the same as the int (2048.0 == 2048). Anything
    else that differs (text vs number, true vs 1, a changed digit, a null
    appearing or vanishing) changes the fingerprint.
    """
    if isinstance(value, float):
        if math.isnan(value):
            return "NaN"
        return int(value) if value.is_integer() else value
    if isinstance(value, (list, tuple)):
        return [canonical(v) for v in value]
    if isinstance(value, dict):
        return {k: canonical(v) for k, v in value.items()}
    return value                      # None, bool, int, str


def decode_json_text(value):
    """A JSON-text value decoded back to what it stands for ('1' -> 1,
    '"RT"' -> "RT", '[90.1, null]' -> [90.1, None]). Missing stays None;
    text that isn't valid JSON is returned unchanged."""
    if not isinstance(value, str):
        return value
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return value


def fingerprint(path):
    """{column: hash of its values in row order} for one Parquet file, plus the
    row count under "(rows)". Column order doesn't matter; row order does.

    Columns declared "json" in SCHEMAS are compared by their decoded values,
    so moving a column to JSON text (integer 1 -> text '1') doesn't count as a
    change, while any change to the value itself still does. Other text
    columns are compared as plain text.
    """
    table = pq.ParquetFile(path).read()
    decode = json_columns(path.parent.parent.name)
    result = {"(rows)": table.num_rows}
    for name in table.column_names:
        values = table.column(name).to_pylist()
        if name in decode:
            values = [decode_json_text(v) for v in values]
        values = [canonical(v) for v in values]
        text = json.dumps(values, default=str)
        result[name] = hashlib.sha256(text.encode()).hexdigest()
    return result


def read_for_resave(path):
    """Read one raw file into a DataFrame with the declared schema applied."""
    # ParquetFile reads exactly this file (no year column added from the
    # folder name, unlike dataset-style readers).
    table = pq.ParquetFile(path).read()
    json_text_cols = {f.name for f in table.schema if pa.types.is_string(f.type)
                      or pa.types.is_large_string(f.type)}
    df = table.to_pandas()
    # pandas turns a list column into numpy arrays, and a list with a missing
    # item into decimals (2048 -> 2048.0). Take list columns straight from the
    # file as plain Python lists, so they're written back exactly as they were.
    # Likewise, a column about to become JSON text is taken from the file's own
    # values, so whole numbers stay whole (2, not 2.0) when some are missing.
    endpoint = path.parent.parent.name
    for f in table.schema:
        is_list = pa.types.is_list(f.type) or pa.types.is_large_list(f.type)
        to_json = f.name in json_columns(endpoint) and f.name not in json_text_cols
        if is_list or to_json:
            df[f.name] = pd.Series(table.column(f.name).to_pylist(),
                                   index=df.index, dtype=object)
    return apply_schema(df, endpoint, json_text_cols=json_text_cols)


def resave_one(path):
    """Re-save one file with the declared schema, only if its values don't change.

    Writes to a temporary file next to it, fingerprints both, and replaces the
    original only if they match. Otherwise deletes the temporary file, leaves
    the original untouched, and stops the script naming the file and columns.
    """
    before = fingerprint(path)
    df = read_for_resave(path)
    tmp = path.with_name(path.name + ".tmp")
    df.to_parquet(tmp, index=False)
    after = fingerprint(tmp)

    changed = sorted(c for c in before.keys() | after.keys() if before.get(c) != after.get(c))
    if changed:
        tmp.unlink()
        sys.exit(f"Stopping: re-saving {path.relative_to(REPO_ROOT)} would change its values "
                 f"(column(s): {', '.join(changed)}). That file was left unchanged; files "
                 "re-saved before it passed the same check.")

    os.replace(tmp, path)             # atomic swap: never a half-written file
    STATS["files_saved"] += 1
    STATS["fingerprints_ok"] += 1
    print(f"Re-saved {path.relative_to(REPO_ROOT)} ({len(df)} rows, values unchanged)")


def resave_local(years, session_keys=None):
    """Re-apply the declared schemas to raw files already on disk.

    Reads each file under data/raw/<endpoint>/year=YYYY/ for the chosen years,
    applies SCHEMAS, and writes it back in place if a fingerprint of its values
    is unchanged (see resave_one). Contacts no API.
    With session_keys, only those sessions' per-session files are re-saved
    (meetings and sessions files are skipped).
    """
    # None means "no session filter"; an empty list means "no sessions".
    filtered = session_keys is not None
    wanted = {f"session_{k}" for k in session_keys or []}
    for endpoint in SCHEDULE_ENDPOINTS + SESSION_ENDPOINTS:
        if filtered and endpoint in SCHEDULE_ENDPOINTS:
            continue
        for year in years:
            for path in sorted((RAW_DIR / endpoint / f"year={year}").glob("*.parquet")):
                if filtered and path.stem not in wanted:
                    continue
                resave_one(path)


# --- Step 1: schedule (meetings and sessions) ---------------------------------

def schedule_file(endpoint, year):
    """Where one season's meetings or sessions file is saved. The Hive-style
    folder name (year=YYYY) lets DuckDB read the year back out of the path."""
    return RAW_DIR / endpoint / f"year={year}" / f"{endpoint}.parquet"


def plan_schedule(years, skip_schedule):
    """Decide, for each year and schedule endpoint, whether to download it.

    Returns a list of (year, endpoint, action), where action is:
      "fetch"        - download it
      "skip_saved"   - past season whose file already exists
      "skip_flag"    - --skip-schedule was given
    The current season (today's UTC year) is always re-downloaded, because
    its sessions and cancellations keep changing.
    """
    current_year = datetime.now(timezone.utc).year
    plan = []
    for year in years:
        for endpoint in SCHEDULE_ENDPOINTS:
            if skip_schedule:
                action = "skip_flag"
            elif year < current_year and schedule_file(endpoint, year).exists():
                action = "skip_saved"
            else:
                action = "fetch"
            plan.append((year, endpoint, action))
    return plan


def download_schedule(plan):
    """Download the schedule files the plan marks "fetch"."""
    for year, endpoint, action in plan:
        if action == "skip_saved":
            STATS["schedule_kept"] += 1
            print(f"Keeping saved {endpoint} for {year} (past season)")
            continue
        if action != "fetch":
            continue
        records = fetch_json(endpoint, {"year": year})
        if records is None:               # 404: nothing for this year
            log_no_data(endpoint, year=year)
            continue
        save_parquet(records, endpoint, schedule_file(endpoint, year))


# --- Step 2: pick which sessions to process -----------------------------------

def load_sessions(years, session_names=None, session_keys=None, limit=None,
                  min_age_hours=DEFAULT_MIN_AGE_HOURS):
    """Read the saved session files and return the sessions to process.

    Applied in this order:
      1. skip cancelled sessions
      2. skip sessions that ended less than min_age_hours ago (or haven't ended)
      3. keep only the given session_keys / session_names, if any were given
      4. skip sessions with no entry in ENDPOINTS_BY_SESSION_NAME (with a note)
      5. sort by start time and keep the first `limit`, if given
    """
    frames = []
    for year in years:
        frames.append(pd.read_parquet(schedule_file("sessions", year)))
    sessions = pd.concat(frames, ignore_index=True)

    # 1. Cancelled. fillna(False) treats a missing flag as "not cancelled".
    cancelled = sessions["is_cancelled"].fillna(False).astype(bool)
    print(f"Skipping {cancelled.sum()} cancelled session(s)")
    sessions = sessions[~cancelled]

    # 2. Too recent. A missing date_end counts as not finished (NaT compares False).
    date_end = pd.to_datetime(sessions["date_end"], utc=True)
    cutoff = pd.Timestamp.now(tz="UTC") - pd.Timedelta(hours=min_age_hours)
    old_enough = date_end <= cutoff
    print(f"Skipping {(~old_enough).sum()} session(s) that ended less than "
          f"{min_age_hours:g} h ago or haven't ended")
    sessions = sessions[old_enough]

    # 3. Explicit filters.
    if session_keys:
        missing = sorted(set(session_keys) - set(sessions["session_key"]))
        if missing:
            print(f"Note: session_key(s) {missing} not found among non-cancelled sessions "
                  f"that ended at least {min_age_hours:g} h ago, for years {years}")
        sessions = sessions[sessions["session_key"].isin(session_keys)]
    if session_names:
        sessions = sessions[sessions["session_name"].isin(session_names)]

    # 4. No endpoint map entry: list what's skipped, grouped by name.
    mapped = sessions["session_name"].isin(ENDPOINTS_BY_SESSION_NAME)
    if (~mapped).any():
        counts = sessions.loc[~mapped, "session_name"].value_counts()
        listing = ", ".join(f"{name} ({n})" for name, n in counts.items())
        print(f"Skipping {(~mapped).sum()} session(s) with no endpoint map entry: {listing}")
    sessions = sessions[mapped]

    # 5. Order and limit.
    sessions = sessions.sort_values("date_start")
    if limit is not None:
        sessions = sessions.head(limit)

    return sessions


def endpoints_for(session_name, chosen_endpoints):
    """The endpoints to request for one session: its map entry, narrowed to
    --endpoints if that was given."""
    return [e for e in ENDPOINTS_BY_SESSION_NAME[session_name] if e in chosen_endpoints]


def session_file(endpoint, year, session_key):
    """Where one endpoint's data for one session is saved."""
    return RAW_DIR / endpoint / f"year={year}" / f"session_{session_key}.parquet"


def plan_session_requests(sessions, chosen_endpoints, force=False, retry_no_data=False):
    """Decide, for each session and endpoint, whether to request it.

    Returns a list of dicts (session, endpoint, path, action), where action is:
      "fetch"          - not saved yet (or --force), so request it
      "retry"          - listed in _no_data.csv, re-requested (--retry-no-data)
      "skip_exists"    - its file already exists
      "skip_no_data"   - listed in _no_data.csv
    A real run and --dry-run both use this, so the dry run shows exactly what
    a real run would do.
    """
    no_data = load_no_data_pairs()
    plan = []
    for session in sessions.itertuples():
        for endpoint in endpoints_for(session.session_name, chosen_endpoints):
            path = session_file(endpoint, session.year, session.session_key)
            if path.exists():
                action = "fetch" if force else "skip_exists"
            elif (endpoint, session.session_key) in no_data:
                action = "retry" if retry_no_data else "skip_no_data"
            else:
                action = "fetch"
            plan.append({"session": session, "endpoint": endpoint,
                         "path": path, "action": action})
    return plan


# --- Step 3: per-session data (one file per endpoint per session) ------------

def download_session_data(plan):
    """Request every planned session + endpoint marked "fetch" or "retry"."""
    STATS["skipped_exists"] += sum(p["action"] == "skip_exists" for p in plan)
    STATS["skipped_no_data"] += sum(p["action"] == "skip_no_data" for p in plan)
    print(f"Skipping {STATS['skipped_exists']} file(s) already saved and "
          f"{STATS['skipped_no_data']} logged as no data")
    no_data = load_no_data_pairs()

    current_session = None
    for item in [p for p in plan if p["action"] in ("fetch", "retry")]:
        session, endpoint, path = item["session"], item["endpoint"], item["path"]
        if session.session_key != current_session:   # one header per session
            current_session = session.session_key
            print(f"\nSession {session.session_key}: {session.year} "
                  f"{session.location} - {session.session_name}")

        records = fetch_json(endpoint, {"session_key": session.session_key})
        if records is None:
            # 404: no data for this session (e.g. starting_grid for a race,
            # which is filed under the qualifying session instead).
            if item["action"] == "retry":
                # Already listed in _no_data.csv; don't add a duplicate row.
                STATS["retry_still_none"] += 1
                print(f"Still no data for {endpoint} (session {session.session_key})")
            else:
                if path.exists():
                    print(f"  note: {endpoint} now returns no data; keeping the existing file")
                log_no_data(endpoint, session.session_key, session.session_name, session.year)
            continue

        save_parquet(records, endpoint, path)
        if (endpoint, session.session_key) in no_data:
            # It was logged as no data before, but now there is some.
            if item["action"] == "retry":
                STATS["retry_found"] += 1
            remove_no_data_rows(endpoint, session.session_key)


# --- Dry run ------------------------------------------------------------------

def format_duration(seconds):
    """Turn 2016 into "33 min 36 s"."""
    minutes, secs = divmod(round(seconds), 60)
    hours, minutes = divmod(minutes, 60)
    return f"{hours} h {minutes} min" if hours else f"{minutes} min {secs} s"


# Column headings for each planned action, in display order.
ACTION_LABELS = {
    "fetch": "request",
    "retry": "retry no-data",
    "skip_exists": "skip: saved",
    "skip_no_data": "skip: no data",
}


def print_dry_run(sessions, session_plan, schedule_plan, args):
    """Print the requests a run would make, and what it would skip and why,
    without contacting the API."""
    print("\n--- Dry run (no API requests made) ---")
    flags = [name for name, on in [("--force", args.force),
                                   ("--retry-no-data", args.retry_no_data)] if on]
    print(f"Minimum session age: {args.min_age_hours:g} h"
          + (f"; flags: {' '.join(flags)}" if flags else ""))

    # Sessions selected, by year and session name.
    print(f"\nSessions selected: {len(sessions)}")
    if len(sessions):
        table = pd.crosstab(sessions["year"], sessions["session_name"],
                            margins=True, margins_name="Total")
        print(table.to_string())

    # Per-session plan: one row per endpoint, one column per action.
    session_requests = sum(p["action"] in ("fetch", "retry") for p in session_plan)
    if session_plan:
        df = pd.DataFrame({"endpoint": [p["endpoint"] for p in session_plan],
                           "action": [ACTION_LABELS[p["action"]] for p in session_plan]})
        table = pd.crosstab(df["endpoint"], df["action"], margins=True, margins_name="Total")
        table = table.reindex(columns=[c for c in [*ACTION_LABELS.values(), "Total"]
                                       if c in table.columns])
        table = table.reindex([e for e in [*SESSION_ENDPOINTS, "Total"] if e in table.index])
        print("\nPer-session endpoints by planned action:")
        print(table.to_string())

    # Schedule plan.
    schedule_requests = sum(a == "fetch" for _, _, a in schedule_plan)
    kept = [f"{e} {y}" for y, e, a in schedule_plan if a == "skip_saved"]
    fetched = [f"{e} {y}" for y, e, a in schedule_plan if a == "fetch"]

    # Totals and time estimate.
    total = session_requests + schedule_requests
    counts = {a: sum(p["action"] == a for p in session_plan) for a in ACTION_LABELS}
    print(f"\nPer-session requests: {session_requests}"
          + (f"  ({counts['retry']} of them retrying no-data)" if counts["retry"] else ""))
    print(f"  skipped, file already saved:  {counts['skip_exists']}")
    print(f"  skipped, logged as no data:   {counts['skip_no_data']}"
          + ("  (use --retry-no-data to retry)" if counts["skip_no_data"] else ""))
    if args.skip_schedule:
        print(f"Schedule requests:    0  (--skip-schedule)")
    else:
        print(f"Schedule requests:    {schedule_requests}"
              + (f"  ({', '.join(fetched)})" if fetched else ""))
        if kept:
            print(f"  skipped, past season already saved: {len(kept)}  ({', '.join(kept)})")
    print(f"Total requests:       {total}")
    # Requests start DELAY_SECONDS apart (start-to-start), so the run takes
    # about total x DELAY_SECONDS. Only a response slower than DELAY_SECONDS,
    # or a 429 wait, makes it longer.
    print(f"Estimated time:       {format_duration(total * DELAY_SECONDS)} "
          f"({DELAY_SECONDS} s start-to-start per request; longer only if a "
          f"response takes over {DELAY_SECONDS} s or a 429 wait occurs)")


# --- Main ---------------------------------------------------------------------

def print_summary():
    """Print the end-of-run counts, including what was skipped and why."""
    print("\n--- Run summary ---")
    print(f"Requests:           {STATS['requests']}")
    print(f"Files saved:        {STATS['files_saved']}")
    print(f"No-data results:    {STATS['no_data']}"
          + (f"  (see {NO_DATA_LOG.relative_to(REPO_ROOT)})" if STATS["no_data"] else ""))
    print(f"Rate limited (429): {STATS['rate_limited']}"
          + (f"  (see {RATE_LIMIT_LOG.relative_to(REPO_ROOT)})" if STATS["rate_limited"] else ""))
    print("Skipped:")
    print(f"  file already saved:          {STATS['skipped_exists']}")
    print(f"  logged as no data:           {STATS['skipped_no_data']}")
    print(f"  past-season schedule saved:  {STATS['schedule_kept']}")
    if STATS["retry_found"] or STATS["retry_still_none"]:
        print(f"Retried no-data:    {STATS['retry_found']} found, "
              f"{STATS['retry_still_none']} still none")
    if STATS["fingerprints_ok"]:
        print(f"Fingerprint checks passed: {STATS['fingerprints_ok']}")


def main():
    args = parse_args()
    years = args.year

    def select_sessions():
        return load_sessions(years, args.session_name, args.session_keys, args.limit,
                             args.min_age_hours)

    # Dry run: work everything out from the saved schedule, request nothing.
    if args.dry_run:
        sessions = select_sessions()
        print_dry_run(sessions,
                      plan_session_requests(sessions, args.endpoints,
                                            args.force, args.retry_no_data),
                      plan_schedule(years, args.skip_schedule), args)
        return

    # Re-save local files with the declared schemas, request nothing.
    if args.resave_local:
        keys = args.session_keys
        if args.session_name:
            # Every saved session with these names, however recent.
            keys = load_sessions(years, args.session_name, keys,
                                 min_age_hours=0)["session_key"].tolist()
        resave_local(years, keys)
        print_summary()
        return

    # The summary prints even if the run stops early on an error.
    try:
        # Step 1: refresh the current season's schedule, and any missing ones.
        if args.skip_schedule:
            print("Skipping schedule download (using saved meetings/sessions files)")
        download_schedule(plan_schedule(years, args.skip_schedule))

        # Step 2: decide which sessions to fetch, and which files are needed.
        sessions = select_sessions()
        print(f"Processing {len(sessions)} session(s)")
        plan = plan_session_requests(sessions, args.endpoints, args.force, args.retry_no_data)

        # Step 3: fetch what's missing (all chosen endpoints by default).
        download_session_data(plan)
    finally:
        print_summary()


if __name__ == "__main__":
    main()
