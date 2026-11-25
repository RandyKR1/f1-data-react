"""
Export static JSON for the React app from data/f1.duckdb.

Two kinds of file, both under public/data/:

1. sessions/<session_key>.json - one per session that has raw per-session data
   (2025-2026 Race and Qualifying so far):
       {
         "session": {...},  "meeting": {...},        # single objects
         "drivers": [...], "laps": [...], "stints": [...],
         "session_result": [...], "weather": [...],
         "race_control": [...], "team_radio": [...],
         "position": [...]       # only when session_result is empty
       }
   Each list holds the session's rows in the order the API sent them.

2. index.json - the full schedule (every meeting, with its sessions nested
   and sorted by date).

Incremental by default. A session is exported when:
  - new:             it has raw data but no file in public/data/sessions/
  - raw data newer:  one of its per-session raw Parquet files (drivers, laps,
                     ...) is newer than its exported file. Schedule files
                     aren't counted: the current season's is re-downloaded on
                     every ingest, so it would flag every session every run.
                     A schedule-only change reaches index.json straight away
                     and reaches the session files on --all.
  - forced:          --force --session-keys K1,K2
  - all:             --all
Otherwise it's skipped as up to date.

Files are only rewritten when their content changes, so unchanged files
don't create new git versions. A re-export with identical content just
updates the file's timestamp, so it isn't treated as stale on the next run.

index.json is always rebuilt by merging: it starts from the existing
index.json, adds or updates every meeting and session in the database (the
database wins), and keeps everything else. A database holding only part of
the schedule (e.g. a scheduled job's) never removes meetings. Every
"exported" flag comes from whether the session file exists.
generated_at is the time the index content last changed: if nothing but
generated_at would differ, the file is left as it is.

Which fields are exported:
- Only the fields in EXPORT_FIELDS (session files) and INDEX_FIELDS
  (index.json): an allow-list of what the app reads, plus a few kept on
  purpose. A field OpenF1 adds later stays out until it's added here.
  docs/export_fields.md lists what's kept, what's dropped and why; the full
  data stays in data/f1.duckdb.

Matching the API exactly (for the fields that are exported):
- Each row starts from exactly the fields its source Parquet file has, i.e.
  the fields the API sent, in the API's order; the allow-list then removes
  fields without reordering the rest. (The database's merged tables add
  columns missing from some files, e.g. points in qualifying session_result,
  and year from the folder name, so the field list is read from the source
  file's schema: metadata only, no data.) A kept field the API didn't send
  for a session stays absent rather than appearing as null.
- Columns stored as JSON text (session_result.position, duration,
  gap_to_leader) are decoded back to their original values: 1, "RT",
  [90.1, 89.7, null]. List columns are stored as real lists.

Every file is written compactly to a temp file and renamed into place.
Contacts no API: it only reads the database and the raw files' metadata.

Run from anywhere:
    python pipeline/export.py                             # new + stale sessions
    python pipeline/export.py --dry-run                   # show the plan only
    python pipeline/export.py --session-keys 11369,11384  # only these, if needed
    python pipeline/export.py --force --session-keys 11369   # re-export these
    python pipeline/export.py --all                       # re-export everything
    python pipeline/export.py --year 2026                 # only 2026 sessions
    python pipeline/export.py --db X.duckdb --out-dir DIR # other database/output
"""

import argparse
import json
import os
import sys
from collections import Counter
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path

import duckdb
import pyarrow.parquet as pq

import ingest  # same folder: reuse the repo paths, schemas and JSON decoding

# --- Settings -----------------------------------------------------------------

DB_PATH = ingest.REPO_ROOT / "data" / "f1.duckdb"
OUT_DIR = ingest.REPO_ROOT / "public" / "data"
SESSIONS_DIR = OUT_DIR / "sessions"
INDEX_PATH = OUT_DIR / "index.json"

# Per-session endpoints written to every session file, in this order.
SESSION_FILE_ENDPOINTS = [
    "drivers", "laps", "stints", "session_result",
    "weather", "race_control", "team_radio",
]
# Written only when session_result is empty (the app then builds fallback
# results from positions, like loadSessionData in src/api.js).
FALLBACK_ENDPOINT = "position"
SOURCE_ENDPOINTS = SESSION_FILE_ENDPOINTS + [FALLBACK_ENDPOINT]

# Why a session is exported, in the order the summary lists them.
REASONS = ["new", "raw data newer", "forced", "all"]

# Allow-lists: the only fields written, per object. Order here doesn't matter;
# fields keep the API's order. Why each field is kept or dropped:
# docs/export_fields.md.
_SESSION_FIELDS = [   # whole object kept, so it matches /sessions exactly
    "session_key", "session_type", "session_name", "date_start", "date_end",
    "meeting_key", "circuit_key", "circuit_short_name", "country_key",
    "country_code", "country_name", "location", "gmt_offset", "year", "is_cancelled",
]
_MEETING_FIELDS = [   # whole object kept, so it matches /meetings exactly
    "meeting_key", "meeting_name", "meeting_official_name", "location",
    "country_key", "country_code", "country_name", "country_flag", "circuit_key",
    "circuit_short_name", "circuit_type", "circuit_info_url", "circuit_image",
    "gmt_offset", "date_start", "date_end", "year", "is_cancelled",
]
EXPORT_FIELDS = {
    "session": _SESSION_FIELDS,
    "meeting": _MEETING_FIELDS,
    "drivers": ["driver_number", "first_name", "last_name", "name_acronym",
                "team_name", "team_colour", "headshot_url"],
    "laps": ["driver_number", "lap_number", "date_start",   # date_start: Ghost Car
             "duration_sector_1", "duration_sector_2", "duration_sector_3",
             "is_pit_out_lap", "lap_duration"],
    "stints": ["driver_number", "lap_start", "lap_end", "compound"],
    "session_result": ["position", "driver_number", "number_of_laps", "points",
                       "dnf", "dns", "dsq", "duration", "gap_to_leader"],
    "weather": ["date", "air_temperature", "track_temperature", "humidity",
                "rainfall", "wind_direction", "wind_speed"],
    "race_control": ["date", "category", "flag", "message"],
    "team_radio": ["date", "driver_number", "recording_url"],
    "position": ["date", "driver_number", "position"],
}
INDEX_FIELDS = {
    "meeting": ["meeting_key", "meeting_official_name", "location", "date_start",
                "year", "is_cancelled"],
    "session": ["session_key", "session_type", "session_name", "date_start",
                "date_end", "meeting_key", "location", "year", "is_cancelled"],
}




# --- Command-line options -----------------------------------------------------

def parse_args():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument("--session-keys", type=ingest.parse_int_list, default=None,
                        help="comma-separated session keys: only consider these sessions")
    parser.add_argument("--year", type=ingest.parse_int_list, default=None,
                        help="comma-separated years, e.g. 2025,2026: only consider "
                             "sessions from these years (index.json is still rebuilt "
                             "in full)")
    parser.add_argument("--force", action="store_true",
                        help="re-export the --session-keys sessions even if up to date")
    parser.add_argument("--all", action="store_true",
                        help="re-export every session with raw data")
    parser.add_argument("--dry-run", action="store_true",
                        help="list what would be exported and why; write nothing")
    parser.add_argument("--db", type=Path, default=DB_PATH,
                        help="database to read (default: data/f1.duckdb)")
    parser.add_argument("--out-dir", type=Path, default=OUT_DIR,
                        help="output folder (default: public/data)")
    args = parser.parse_args()
    if args.force and args.session_keys is None:
        parser.error("--force needs --session-keys")
    if args.all and args.session_keys is not None:
        parser.error("--all can't be combined with --session-keys")
    return args


# --- Reading ------------------------------------------------------------------

@lru_cache(maxsize=None)
def file_columns(source_file):
    """The columns stored in one source Parquet file (read from its metadata)."""
    return pq.ParquetFile(ingest.REPO_ROOT / source_file).schema_arrow.names


def to_api_row(row, endpoint):
    """One database row as the API sent it: only the source file's columns,
    with JSON-text columns decoded."""
    decode = ingest.json_columns(endpoint)
    api_row = {}
    for col in file_columns(row["source_file"]):
        value = row[col]
        api_row[col] = ingest.decode_json_text(value) if col in decode else value
    return api_row


def keep_fields(row, allowed):
    """A row with only the allowed fields, in the row's own (API) order."""
    return {k: v for k, v in row.items() if k in allowed}


def keep_fields_all(rows, allowed):
    return [keep_fields(row, allowed) for row in rows]


def table_names(con):
    """Names of the tables in the database (a partial database may lack some)."""
    return {name for (name,) in con.execute("SELECT table_name FROM information_schema.tables").fetchall()}


def query_rows(con, endpoint, where_sql="TRUE", params=(), order_by="rowid"):
    """Rows of raw_<endpoint> matching a WHERE clause, as API-shaped dicts
    ([] if the table doesn't exist).

    The default ORDER BY rowid keeps the order rows were loaded in, which is
    the order of the Parquet file, which is the order the API returned them."""
    if f"raw_{endpoint}" not in table_names(con):
        return []
    cursor = con.execute(
        f"SELECT * FROM raw_{endpoint} WHERE {where_sql} ORDER BY {order_by}", params)
    names = [col[0] for col in cursor.description]
    return [to_api_row(dict(zip(names, values)), endpoint) for values in cursor.fetchall()]


def source_files_by_session(con):
    """{session_key: {raw file, ...}} for every session with per-session raw data."""
    tables = table_names(con)
    parts = [f"SELECT DISTINCT session_key, source_file FROM raw_{e}"
             for e in SOURCE_ENDPOINTS if f"raw_{e}" in tables]
    result = {}
    if parts:
        for key, source in con.execute(" UNION ".join(parts)).fetchall():
            result.setdefault(key, set()).add(source)
    return result


def exportable_session_keys(con):
    """Every session_key that has rows in any per-session table we export."""
    tables = table_names(con)
    parts = [f"SELECT session_key FROM raw_{e}"
             for e in SESSION_FILE_ENDPOINTS if f"raw_{e}" in tables]
    if not parts:
        return []
    union = " UNION ".join(parts)
    return [k for (k,) in con.execute(f"SELECT DISTINCT session_key FROM ({union}) ORDER BY 1").fetchall()]


def session_years(con):
    """{session_key: year} from the schedule table ({} if it isn't loaded)."""
    if "raw_sessions" not in table_names(con):
        return {}
    return dict(con.execute("SELECT session_key, year FROM raw_sessions").fetchall())


def newest_mtime(source_files):
    """Latest modification time (ns) among a session's raw files (missing ones ignored)."""
    times = [(ingest.REPO_ROOT / f).stat().st_mtime_ns
             for f in source_files if (ingest.REPO_ROOT / f).exists()]
    return max(times, default=0)


# --- Planning -----------------------------------------------------------------

def plan_exports(con, args, sessions_dir):
    """Decide which sessions to export. Returns (plan, skipped):
    plan is [(session_key, reason), ...]; skipped counts up-to-date sessions."""
    available = exportable_session_keys(con)
    keys = available
    if args.session_keys is not None:
        missing = sorted(set(args.session_keys) - set(available))
        if missing:
            sys.exit(f"No raw data for session key(s) {missing}; nothing written.")
        keys = args.session_keys
    if args.year is not None:
        # Uses each session's year from the schedule; no years are built in.
        years = session_years(con)
        keys = [k for k in keys if years.get(k) in args.year]
        print(f"Year filter {','.join(map(str, args.year))}: {len(keys)} session(s) with raw data")

    sources = source_files_by_session(con)
    plan, skipped = [], 0
    for key in keys:
        path = sessions_dir / f"{key}.json"
        if args.all:
            reason = "all"
        elif args.force:
            reason = "forced"
        elif not path.exists():
            reason = "new"
        elif newest_mtime(sources.get(key, ())) > path.stat().st_mtime_ns:
            reason = "raw data newer"
        else:
            skipped += 1
            continue
        plan.append((key, reason))
    return plan, skipped


# --- Session files ------------------------------------------------------------

def build_session(con, session_key):
    """Everything one session file holds, keyed by endpoint name, or None if
    the database has no schedule row for the session or its meeting."""
    sessions = query_rows(con, "sessions", "session_key = ?", [session_key])
    if not sessions:
        return None
    meetings = query_rows(con, "meetings", "meeting_key = ?", [sessions[0]["meeting_key"]])
    if not meetings:
        return None
    data = {"session": keep_fields(sessions[0], EXPORT_FIELDS["session"]),
            "meeting": keep_fields(meetings[0], EXPORT_FIELDS["meeting"])}
    for endpoint in SESSION_FILE_ENDPOINTS:
        data[endpoint] = endpoint_rows(con, endpoint, session_key)
    if not data["session_result"]:
        data[FALLBACK_ENDPOINT] = endpoint_rows(con, FALLBACK_ENDPOINT, session_key)
    return data


def endpoint_rows(con, endpoint, session_key):
    """One endpoint's rows for a session, with only the exported fields."""
    rows = query_rows(con, endpoint, "session_key = ?", [session_key])
    return keep_fields_all(rows, EXPORT_FIELDS[endpoint])


def export_sessions(con, plan, sessions_dir):
    """Export each planned session. Returns {"written": [...], "unchanged": [...],
    "no_schedule": [...]} of session keys."""
    outcome = {"written": [], "unchanged": [], "no_schedule": []}
    for key, _reason in plan:
        data = build_session(con, key)
        if data is None:
            print(f"  WARNING: session {key} has raw data but no schedule row; not exported")
            outcome["no_schedule"].append(key)
            continue
        changed = write_if_changed(sessions_dir / f"{key}.json", data)
        outcome["written" if changed else "unchanged"].append(key)
    return outcome


# --- Index --------------------------------------------------------------------

def by_date(row, key_field):
    """Sort key: date_start as a real timestamp, then the key for ties."""
    start = row.get("date_start")
    when = datetime.fromisoformat(start) if start else datetime.max.replace(tzinfo=timezone.utc)
    return (when, row[key_field])


def load_index(index_path):
    """The existing index.json, or None if there isn't one."""
    if not index_path.exists():
        return None
    with open(index_path, encoding="utf-8") as f:
        return json.load(f)


def merge_index(existing, con, sessions_dir, will_exist=()):
    """The new index: the existing one plus every meeting and session in the
    database (the database wins), with every exported flag set from the
    session files. will_exist: session keys to count as exported (dry run)."""
    meetings, sessions = {}, {}
    # 1. Start from the existing index (re-applying the allow-list).
    for m in (existing or {}).get("meetings", []):
        meetings[m["meeting_key"]] = keep_fields(m, INDEX_FIELDS["meeting"])
        for s in m.get("sessions", []):
            sessions[s["session_key"]] = keep_fields(s, INDEX_FIELDS["session"])
    # 2. Add or replace with what the database has.
    for m in query_rows(con, "meetings"):
        meetings[m["meeting_key"]] = keep_fields(m, INDEX_FIELDS["meeting"])
    for s in query_rows(con, "sessions"):
        sessions[s["session_key"]] = keep_fields(s, INDEX_FIELDS["session"])

    # 3. Nest sessions under meetings, both sorted by date.
    nested = {key: {**m, "sessions": []} for key, m in meetings.items()}
    for s in sorted(sessions.values(), key=lambda s: by_date(s, "session_key")):
        if s["meeting_key"] not in nested:
            print(f"  WARNING: session {s['session_key']} has no meeting "
                  f"{s['meeting_key']}; left out of the index")
            continue
        key = s["session_key"]
        exported = key in will_exist or (sessions_dir / f"{key}.json").exists()
        nested[s["meeting_key"]]["sessions"].append({**s, "exported": exported})

    all_sessions = [s for m in nested.values() for s in m["sessions"]]
    exported_ends = [s["date_end"] for s in all_sessions if s["exported"] and s["date_end"]]
    return {
        "generated_at": None,     # set when the file is written
        # date_end values are ISO strings in UTC, so max() on text is chronological.
        "last_exported_date_end": max(exported_ends, default=None),
        "meetings": sorted(nested.values(), key=lambda m: by_date(m, "meeting_key")),
    }


def same_index(a, b):
    """True if two indexes differ at most in generated_at."""
    if a is None or b is None:
        return False
    strip = lambda index: {k: v for k, v in index.items() if k != "generated_at"}
    return strip(a) == strip(b)


def export_index(con, existing, index_path, sessions_dir):
    """Merge and write index.json if its content changed. Returns (index, written)."""
    index = merge_index(existing, con, sessions_dir)
    if same_index(index, existing):
        return existing, False
    index["generated_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    write_json_atomic(index_path, index)
    return index, True


# --- Writing ------------------------------------------------------------------

def to_json_bytes(data):
    """Compact JSON, exactly as written to disk."""
    return json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def write_json_atomic(path, data):
    """Write compact JSON to path.tmp, then rename it over path."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_bytes(to_json_bytes(data))
    os.replace(tmp, path)   # atomic on the same filesystem


def write_if_changed(path, data):
    """Write the file only if its content would change. Returns True if written.

    If the content is identical, the file is left alone apart from its
    timestamp, which is updated so it no longer looks older than its raw data."""
    if path.exists() and path.read_bytes() == to_json_bytes(data):
        os.utime(path)
        return False
    write_json_atomic(path, data)
    return True


# --- Reporting ----------------------------------------------------------------

def mb(n_bytes):
    return f"{n_bytes / 1024 / 1024:.2f} MB"


def print_plan(plan, skipped):
    reasons = Counter(reason for _, reason in plan)
    print(f"Sessions to export: {len(plan)}  "
          f"({', '.join(f'{r}: {reasons[r]}' for r in REASONS)})")
    print(f"Skipped, up to date: {skipped}")


def print_index_summary(index, written, index_path, label="index.json"):
    sessions = [s for m in index["meetings"] for s in m["sessions"]]
    print(f"{label}: {'written' if written else 'unchanged, not rewritten'}")
    print(f"  meetings: {len(index['meetings'])}, sessions: {len(sessions)}, "
          f"exported: {sum(s['exported'] for s in sessions)}")
    print(f"  last_exported_date_end: {index['last_exported_date_end']}")
    if index_path.exists():
        print(f"  size: {index_path.stat().st_size / 1024:.1f} KB")


# --- Main ---------------------------------------------------------------------

def main():
    args = parse_args()
    sessions_dir = args.out_dir / "sessions"
    index_path = args.out_dir / "index.json"
    print(f"Database: {args.db}\nOutput:   {args.out_dir}\n")

    con = duckdb.connect(str(args.db), read_only=True)
    try:
        plan, skipped = plan_exports(con, args, sessions_dir)
        existing = load_index(index_path)

        if args.dry_run:
            print_plan(plan, skipped)
            for key, reason in plan:
                print(f"  would export {key}: {reason}")
            preview = merge_index(existing, con, sessions_dir, will_exist={k for k, _ in plan})
            print(f"\nDry run: nothing written. index.json would "
                  f"{'stay the same' if same_index(preview, existing) else 'change'}.")
            print_index_summary(preview, False, index_path, label="index.json (preview)")
            return

        # Session files first, so the index's exported flags see them.
        outcome = export_sessions(con, plan, sessions_dir)
        index, index_written = export_index(con, existing, index_path, sessions_dir)
    finally:
        con.close()

    print_plan(plan, skipped)
    for key, reason in plan:
        state = ("written" if key in outcome["written"] else
                 "unchanged, not rewritten" if key in outcome["unchanged"] else "no schedule row")
        print(f"  {key}: {reason} -> {state}")
    print(f"Written (content changed): {len(outcome['written'])}")
    print(f"Unchanged, not rewritten:  {len(outcome['unchanged'])}")
    if outcome["no_schedule"]:
        print(f"Not exported, no schedule row: {len(outcome['no_schedule'])}")
    files = list(sessions_dir.glob("*.json"))
    print(f"Session files on disk: {len(files)}, {mb(sum(f.stat().st_size for f in files))}\n")
    print_index_summary(index, index_written, index_path)


if __name__ == "__main__":
    main()
