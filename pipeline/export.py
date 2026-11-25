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


def keep_fields(row, allowed):
    """A row with only the allowed fields, in the row's own (API) order."""
    return {k: v for k, v in row.items() if k in allowed}


def keep_fields_all(rows, allowed):
    return [keep_fields(row, allowed) for row in rows]


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
    data = {"session": keep_fields(session, EXPORT_FIELDS["session"]),
            "meeting": keep_fields(meeting, EXPORT_FIELDS["meeting"])}
    for endpoint in SESSION_FILE_ENDPOINTS:
        data[endpoint] = endpoint_rows(con, endpoint, session_key)
    if not data["session_result"]:
        data[FALLBACK_ENDPOINT] = endpoint_rows(con, FALLBACK_ENDPOINT, session_key)
    return data


def endpoint_rows(con, endpoint, session_key):
    """One endpoint's rows for a session, with only the exported fields."""
    rows = query_rows(con, endpoint, "session_key = ?", [session_key])
    return keep_fields_all(rows, EXPORT_FIELDS[endpoint])


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
    meetings = keep_fields_all(query_rows(con, "meetings", order_by=by_date),
                               INDEX_FIELDS["meeting"])
    sessions = keep_fields_all(query_rows(con, "sessions", order_by=by_date),
                               INDEX_FIELDS["session"])
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
