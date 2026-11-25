"""
Export static JSON for the React app from data/f1.duckdb.

For now this only writes public/data/index.json: the full schedule
(every meeting and session in raw_meetings / raw_sessions), so the app can
build its search menus without calling the OpenF1 API.

index.json layout:
    {
      "generated_at": "2026-11-24T12:00:00Z",        # UTC, when this ran
      "last_exported_date_end": null,                  # latest date_end of an exported session
      "meetings": [
        { <meeting fields, same names as OpenF1 /meetings>,
          "sessions": [ { <session fields, same names as OpenF1 /sessions>,
                          "exported": false }, ... ] },   # sorted by date_start
        ...
      ]                                                # sorted by date_start
    }

- Field names and values are exactly the API's (only our source_file
  column is dropped).
- "exported" is true only if public/data/sessions/<session_key>.json exists.
- The file is written compactly to a temp file and then renamed into place,
  so the app never sees a half-written index.
- Contacts no API: it only reads the local database.

Run from anywhere:
    python pipeline/export.py
"""

import json
import os
from datetime import datetime, timezone

import duckdb

import ingest  # same folder: reuse the repo paths

# --- Settings -----------------------------------------------------------------

DB_PATH = ingest.REPO_ROOT / "data" / "f1.duckdb"
OUT_DIR = ingest.REPO_ROOT / "public" / "data"
SESSIONS_DIR = OUT_DIR / "sessions"          # per-session files (a later step)
INDEX_PATH = OUT_DIR / "index.json"

# Columns we added in the pipeline, not returned by the API.
PIPELINE_COLUMNS = {"source_file"}


# --- Reading ------------------------------------------------------------------

def read_rows(con, table):
    """All rows of a table as dicts (API columns only), oldest date_start first."""
    cursor = con.execute(
        f"SELECT * FROM {table} ORDER BY CAST(date_start AS TIMESTAMPTZ), 1"
    )
    names = [col[0] for col in cursor.description]
    rows = []
    for values in cursor.fetchall():
        row = dict(zip(names, values))
        for col in PIPELINE_COLUMNS:
            row.pop(col, None)
        rows.append(row)
    return rows


def is_exported(session_key):
    """True if this session's detail file has already been written."""
    return (SESSIONS_DIR / f"{session_key}.json").exists()


# --- Building -----------------------------------------------------------------

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


# --- Writing ------------------------------------------------------------------

def write_json_atomic(path, data):
    """Write compact JSON to path.tmp, then rename it over path."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, path)   # atomic on the same filesystem


def main():
    con = duckdb.connect(str(DB_PATH), read_only=True)
    try:
        meetings = read_rows(con, "raw_meetings")
        sessions = read_rows(con, "raw_sessions")
    finally:
        con.close()

    index = build_index(meetings, sessions)
    write_json_atomic(INDEX_PATH, index)

    exported = sum(s["exported"] for s in sessions)
    size_kb = INDEX_PATH.stat().st_size / 1024
    print(f"Wrote {INDEX_PATH.relative_to(ingest.REPO_ROOT)}")
    print(f"  meetings: {len(meetings)}")
    print(f"  sessions: {len(sessions)}")
    print(f"  exported sessions: {exported}")
    print(f"  last_exported_date_end: {index['last_exported_date_end']}")
    print(f"  size: {size_kb:.1f} KB")


if __name__ == "__main__":
    main()
