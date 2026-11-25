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
   and sorted by date). Rebuilt after the session files, so its "exported"
   flags and last_exported_date_end describe the files actually on disk.

Matching the API exactly:
- Each row has exactly the fields its source Parquet file has, i.e. the
  fields the API sent. The database's merged tables add columns that are
  missing from some files (e.g. points in qualifying session_result) and add
  year from the folder name, so the field list is read from the source
  file's schema (metadata only, no data). This drops our source_file column
  and partition-only columns, and nothing else.
- Columns stored as JSON text (session_result.position, duration,
  gap_to_leader) are decoded back to their original values: 1, "RT",
  [90.1, 89.7, null]. List columns (laps.segments_sector_*) are stored as
  real lists and come out as lists.

Every file is written compactly to a temp file and renamed into place.
Contacts no API: it only reads the local database and Parquet metadata.

Run from anywhere:
    python pipeline/export.py                          # all sessions + index
    python pipeline/export.py --session-keys 11369,11384   # just these + index
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from functools import lru_cache

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


# --- Command-line options -----------------------------------------------------

def parse_args():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument("--session-keys", type=ingest.parse_int_list, default=None,
                        help="comma-separated session keys to export (default: all "
                             "sessions with raw data); index.json is always rebuilt")
    return parser.parse_args()


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


def query_rows(con, endpoint, where_sql="TRUE", params=(), order_by="rowid"):
    """Rows of raw_<endpoint> matching a WHERE clause, as API-shaped dicts.

    The default ORDER BY rowid keeps the order rows were loaded in, which is
    the order of the Parquet file, which is the order the API returned them."""
    cursor = con.execute(
        f"SELECT * FROM raw_{endpoint} WHERE {where_sql} ORDER BY {order_by}", params)
    names = [col[0] for col in cursor.description]
    return [to_api_row(dict(zip(names, values)), endpoint) for values in cursor.fetchall()]


def exportable_session_keys(con):
    """Every session_key that has rows in any per-session table we export."""
    union = " UNION ".join(f"SELECT session_key FROM raw_{e}" for e in SESSION_FILE_ENDPOINTS)
    return [k for (k,) in con.execute(f"SELECT DISTINCT session_key FROM ({union}) ORDER BY 1").fetchall()]


def is_exported(session_key):
    """True if this session's file has been written."""
    return (SESSIONS_DIR / f"{session_key}.json").exists()


# --- Session files ------------------------------------------------------------

def build_session(con, session_key):
    """Everything one session file holds, keyed by endpoint name."""
    session = query_rows(con, "sessions", "session_key = ?", [session_key])[0]
    meeting = query_rows(con, "meetings", "meeting_key = ?", [session["meeting_key"]])[0]
    data = {"session": session, "meeting": meeting}
    for endpoint in SESSION_FILE_ENDPOINTS:
        data[endpoint] = query_rows(con, endpoint, "session_key = ?", [session_key])
    if not data["session_result"]:
        data[FALLBACK_ENDPOINT] = query_rows(con, FALLBACK_ENDPOINT, "session_key = ?",
                                             [session_key])
    return data


def export_sessions(con, session_keys):
    """Write one file per session. Returns [(path, size_bytes), ...]."""
    written = []
    for key in session_keys:
        path = SESSIONS_DIR / f"{key}.json"
        write_json_atomic(path, build_session(con, key))
        written.append((path, path.stat().st_size))
    return written


# --- Index --------------------------------------------------------------------

def build_index(meetings, sessions):
    """Nest sessions under their meeting and add the top-level summary fields."""
    by_meeting = {m["meeting_key"]: {**m, "sessions": []} for m in meetings}

    # Sessions arrive sorted by date, so each meeting's list stays sorted.
    for s in sessions:
        s["exported"] = is_exported(s["session_key"])
        by_meeting[s["meeting_key"]]["sessions"].append(s)

    exported_ends = [s["date_end"] for s in sessions if s["exported"] and s["date_end"]]
    # date_end values are ISO strings in UTC, so max() on text is chronological.
    last_end = max(exported_ends) if exported_ends else None

    return {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "last_exported_date_end": last_end,
        "meetings": list(by_meeting.values()),   # dict keeps date order
    }


def export_index(con):
    """Rebuild index.json from the schedule tables. Returns the index."""
    by_date = "CAST(date_start AS TIMESTAMPTZ), rowid"
    meetings = query_rows(con, "meetings", order_by=by_date)
    sessions = query_rows(con, "sessions", order_by=by_date)
    index = build_index(meetings, sessions)
    write_json_atomic(INDEX_PATH, index)
    return index


# --- Writing ------------------------------------------------------------------

def write_json_atomic(path, data):
    """Write compact JSON to path.tmp, then rename it over path."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, path)   # atomic on the same filesystem


# --- Reporting ----------------------------------------------------------------

def mb(n_bytes):
    return f"{n_bytes / 1024 / 1024:.2f} MB"


def print_session_summary(written):
    total = sum(size for _, size in written)
    print(f"Session files written: {len(written)}")
    if not written:
        return
    print(f"  total size:   {mb(total)}")
    print(f"  average size: {mb(total / len(written))}")
    print("  5 largest:")
    for path, size in sorted(written, key=lambda w: w[1], reverse=True)[:5]:
        print(f"    {path.relative_to(ingest.REPO_ROOT)}  {mb(size)}")


def print_index_summary(index):
    sessions = [s for m in index["meetings"] for s in m["sessions"]]
    exported = sum(s["exported"] for s in sessions)
    print(f"Wrote {INDEX_PATH.relative_to(ingest.REPO_ROOT)}")
    print(f"  meetings: {len(index['meetings'])}")
    print(f"  sessions: {len(sessions)}")
    print(f"  exported sessions: {exported}")
    print(f"  last_exported_date_end: {index['last_exported_date_end']}")
    print(f"  size: {INDEX_PATH.stat().st_size / 1024:.1f} KB")


# --- Main ---------------------------------------------------------------------

def main():
    args = parse_args()
    con = duckdb.connect(str(DB_PATH), read_only=True)
    try:
        available = exportable_session_keys(con)
        keys = available
        if args.session_keys is not None:
            missing = sorted(set(args.session_keys) - set(available))
            if missing:
                sys.exit(f"No raw data for session key(s) {missing}; nothing written.")
            keys = args.session_keys

        # Session files first, so the index reflects what's on disk.
        written = export_sessions(con, keys)
        index = export_index(con)
    finally:
        con.close()

    print_session_summary(written)
    print()
    print_index_summary(index)


if __name__ == "__main__":
    main()
