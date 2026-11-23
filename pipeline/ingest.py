"""
Download raw OpenF1 data and save it as Parquet files.

Step 1 - schedule (one file per year):
    data/raw/meetings/year=YYYY/meetings.parquet
    data/raw/sessions/year=YYYY/sessions.parquet

Step 2 - per-session data (one file per session, cancelled sessions skipped):
    data/raw/<endpoint>/year=YYYY/session_<session_key>.parquet
    for each endpoint in SESSION_ENDPOINTS (or just those given with --endpoints)

Which endpoints are requested depends on the session (ENDPOINTS_BY_SESSION_NAME);
sessions not in that map, cancelled sessions, and unfinished sessions are skipped.

Examples (run from anywhere):
    python pipeline/ingest.py                              # everything, 2023-2026
    python pipeline/ingest.py --year 2025,2026 \
        --session-name Race,Qualifying                     # GP races + qualifying
    python pipeline/ingest.py --session-keys 9689,9693 \
        --skip-schedule                                    # exact sessions
    python pipeline/ingest.py --year 2025 --dry-run        # plan only, no requests
"""

import argparse
import csv
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
import pyarrow as pa
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

# Known column types, applied before anything else so these columns have the
# same type in every file. Add new entries here as we find them.
#   "json"  - store as JSON text (for fields whose shape varies by session)
#   "Int64" - whole numbers, missing values allowed
#   any other pandas dtype name ("string", "float64", "boolean") also works
COLUMN_TYPES = {
    "session_result": {
        # A number in races ("12.4"), text for lapped cars ("+1 LAP"), and a
        # [Q1, Q2, Q3] list in qualifying.
        "duration": "json",
        "gap_to_leader": "json",
    },
    "race_control": {
        # 1/2/3 in qualifying, but null in every row for other sessions, which
        # would otherwise save with no type at all.
        "qualifying_phase": "Int64",
    },
}

# data/raw lives at the repo root, one level above this pipeline/ folder,
# so the script works no matter which folder you run it from.
REPO_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = REPO_ROOT / "data" / "raw"

# Run logs (CSV, appended to on every run).
NO_DATA_LOG = RAW_DIR / "_no_data.csv"
RATE_LIMIT_LOG = RAW_DIR / "_rate_limit_log.csv"

# Counters for the end-of-run summary.
STATS = {"requests": 0, "files_saved": 0, "no_data": 0, "rate_limited": 0}


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
    return parser.parse_args()


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


def make_parquet_safe(df, endpoint, whole_number_cols):
    """Make sure every column can be saved to Parquet, without losing values.

    1. Columns listed in COLUMN_TYPES for this endpoint get that type, so
       their type is the same in every file.
    2. Whole-number columns use pandas' nullable Int64 type. Plain pandas turns
       an int column into decimals as soon as one value is missing (e.g.
       number_of_laps for a disqualified driver); Int64 keeps it whole.
    3. Any other column is kept as-is if Parquet accepts it. If Parquet rejects
       it (e.g. mixed numbers and text, or lists with mixed items), it's
       stored as JSON text instead.
    """
    known_types = COLUMN_TYPES.get(endpoint, {})

    for col in df.columns:
        if col in known_types:
            if known_types[col] == "json":
                df[col] = to_json_text(df[col])
            else:
                df[col] = df[col].astype(known_types[col])
            continue

        if col in whole_number_cols:
            df[col] = df[col].astype("Int64")
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
    whole_number_cols = find_whole_number_columns(records)
    df = make_parquet_safe(pd.DataFrame(records), endpoint, whole_number_cols)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(out_path, index=False)
    STATS["files_saved"] += 1
    print(f"Saved {out_path.relative_to(REPO_ROOT)} ({len(df)} rows)")


# --- Step 1: schedule (meetings and sessions) ---------------------------------

def download_schedule(years):
    """Download meetings and sessions for each year, one file per year."""
    for year in years:
        for endpoint in SCHEDULE_ENDPOINTS:
            records = fetch_json(endpoint, {"year": year})
            if records is None:               # 404: nothing for this year
                log_no_data(endpoint, year=year)
                continue
            # Hive-style folder name (year=YYYY) so DuckDB can read the year
            # back out of the path later.
            out_path = RAW_DIR / endpoint / f"year={year}" / f"{endpoint}.parquet"
            save_parquet(records, endpoint, out_path)


# --- Step 2: pick which sessions to process -----------------------------------

def load_sessions(years, session_names=None, session_keys=None, limit=None):
    """Read the saved session files and return the sessions to process.

    Applied in this order:
      1. skip cancelled sessions
      2. skip sessions that haven't finished yet (date_end in the future)
      3. keep only the given session_keys / session_names, if any were given
      4. skip sessions with no entry in ENDPOINTS_BY_SESSION_NAME (with a note)
      5. sort by start time and keep the first `limit`, if given
    """
    frames = []
    for year in years:
        path = RAW_DIR / "sessions" / f"year={year}" / "sessions.parquet"
        frames.append(pd.read_parquet(path))
    sessions = pd.concat(frames, ignore_index=True)

    # 1. Cancelled. fillna(False) treats a missing flag as "not cancelled".
    cancelled = sessions["is_cancelled"].fillna(False).astype(bool)
    print(f"Skipping {cancelled.sum()} cancelled session(s)")
    sessions = sessions[~cancelled]

    # 2. Not finished yet. A missing date_end counts as not finished.
    date_end = pd.to_datetime(sessions["date_end"], utc=True)
    finished = date_end <= pd.Timestamp.now(tz="UTC")
    print(f"Skipping {(~finished).sum()} session(s) that haven't finished yet")
    sessions = sessions[finished]

    # 3. Explicit filters.
    if session_keys:
        missing = sorted(set(session_keys) - set(sessions["session_key"]))
        if missing:
            print(f"Note: session_key(s) {missing} not found among finished, "
                  f"non-cancelled sessions for years {years}")
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


# --- Step 3: per-session data (one file per endpoint per session) ------------

def download_session_data(sessions, chosen_endpoints):
    """For each session, download its mapped endpoints, each to its own file."""
    for session in sessions.itertuples():
        print(f"\nSession {session.session_key}: {session.year} "
              f"{session.location} - {session.session_name}")

        for endpoint in endpoints_for(session.session_name, chosen_endpoints):
            records = fetch_json(endpoint, {"session_key": session.session_key})
            if records is None:
                # 404: no data for this session (e.g. starting_grid for a race,
                # which is filed under the qualifying session instead).
                log_no_data(endpoint, session.session_key, session.session_name, session.year)
                continue
            out_path = (RAW_DIR / endpoint / f"year={session.year}"
                        / f"session_{session.session_key}.parquet")
            save_parquet(records, endpoint, out_path)


# --- Dry run ------------------------------------------------------------------

def format_duration(seconds):
    """Turn 2016 into "33 min 36 s"."""
    minutes, secs = divmod(round(seconds), 60)
    hours, minutes = divmod(minutes, 60)
    return f"{hours} h {minutes} min" if hours else f"{minutes} min {secs} s"


def print_dry_run(sessions, chosen_endpoints, years, skip_schedule):
    """Print the requests a run would make, without contacting the API."""
    print("\n--- Dry run (no API requests made) ---")

    # Sessions selected, by year and session name.
    print(f"\nSessions selected: {len(sessions)}")
    if len(sessions):
        table = pd.crosstab(sessions["year"], sessions["session_name"],
                            margins=True, margins_name="Total")
        print(table.to_string())

    # Requests per endpoint: each session's mapped endpoints, added up.
    per_endpoint = {e: 0 for e in SESSION_ENDPOINTS}
    for name in sessions["session_name"]:
        for endpoint in endpoints_for(name, chosen_endpoints):
            per_endpoint[endpoint] += 1
    print("\nRequests per endpoint:")
    for endpoint, count in per_endpoint.items():
        if count:
            print(f"  {endpoint:16} {count}")

    # Totals and time estimate. A real run also re-downloads meetings and
    # sessions for each year unless --skip-schedule is given.
    session_requests = sum(per_endpoint.values())
    schedule_requests = 0 if skip_schedule else len(SCHEDULE_ENDPOINTS) * len(years)
    total = session_requests + schedule_requests
    print(f"\nPer-session requests: {session_requests}")
    print(f"Schedule requests:    {schedule_requests}"
          + ("  (--skip-schedule)" if skip_schedule else "  (meetings + sessions per year)"))
    print(f"Total requests:       {total}")
    # Requests start DELAY_SECONDS apart (start-to-start), so the run takes
    # about total x DELAY_SECONDS. Only a response slower than DELAY_SECONDS,
    # or a 429 wait, makes it longer.
    print(f"Estimated time:       {format_duration(total * DELAY_SECONDS)} "
          f"({DELAY_SECONDS} s start-to-start per request; longer only if a "
          f"response takes over {DELAY_SECONDS} s or a 429 wait occurs)")


# --- Main ---------------------------------------------------------------------

def print_summary():
    """Print the end-of-run counts."""
    print("\n--- Run summary ---")
    print(f"Requests:           {STATS['requests']}")
    print(f"Files saved:        {STATS['files_saved']}")
    print(f"No-data results:    {STATS['no_data']}"
          + (f"  (see {NO_DATA_LOG.relative_to(REPO_ROOT)})" if STATS["no_data"] else ""))
    print(f"Rate limited (429): {STATS['rate_limited']}"
          + (f"  (see {RATE_LIMIT_LOG.relative_to(REPO_ROOT)})" if STATS["rate_limited"] else ""))


def main():
    args = parse_args()
    years = args.year

    # Dry run: work everything out from the saved schedule, request nothing.
    if args.dry_run:
        sessions = load_sessions(years, args.session_name, args.session_keys, args.limit)
        print_dry_run(sessions, args.endpoints, years, args.skip_schedule)
        return

    # The summary prints even if the run stops early on an error.
    try:
        # Step 1: refresh the schedule unless told to reuse the saved files.
        if args.skip_schedule:
            print("Skipping schedule download (using saved meetings/sessions files)")
        else:
            download_schedule(years)

        # Step 2: decide which sessions to fetch.
        sessions = load_sessions(years, args.session_name, args.session_keys, args.limit)
        print(f"Processing {len(sessions)} session(s)")

        # Step 3: fetch the chosen per-session endpoints (all of them by default).
        download_session_data(sessions, args.endpoints)
    finally:
        print_summary()


if __name__ == "__main__":
    main()
