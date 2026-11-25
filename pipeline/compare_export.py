"""
Compare exported session files with the live OpenF1 API.

For each session key given, fetches every endpoint that the session's file
holds (sessions, meetings, drivers, laps, ...) and checks the exported JSON
against the API response: same number of rows, same rows in the same order,
same field names, and the same values with the same JSON types (1 vs 1.0 vs
"1", null vs missing all count as differences).

Uses ingest.fetch_json, so requests are paced 2.1 s apart (start to start)
and 429s are retried and logged. This DOES make API requests: one per
endpoint in each file (about 9 per session).

Run from anywhere:
    python pipeline/compare_export.py --session-keys 11369,11384
"""

import argparse
import json
import sys

import ingest   # same folder: API pacing, retries and request counters
import export   # same folder: where the session files live

# Max differences printed per endpoint (the count is always shown).
MAX_SHOWN = 10


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument("--session-keys", type=ingest.parse_int_list, required=True,
                        help="comma-separated session keys to compare")
    return parser.parse_args()


def json_type(value):
    """The JSON type name of a value (bool is checked before int on purpose)."""
    for py_type, name in ((bool, "boolean"), (int, "integer"), (float, "float"),
                          (str, "string"), (list, "list"), (dict, "object")):
        if isinstance(value, py_type):
            return name
    return "null"


def differences(api, ours, where):
    """Every difference between two JSON values, as readable strings."""
    if json_type(api) != json_type(ours):
        return [f"{where}: type {json_type(api)} {api!r} (API) vs "
                f"{json_type(ours)} {ours!r} (export)"]
    if isinstance(api, dict):
        found = []
        for key in sorted(api.keys() - ours.keys()):
            found.append(f"{where}: field {key!r} missing from export")
        for key in sorted(ours.keys() - api.keys()):
            found.append(f"{where}: extra field {key!r} in export")
        for key in api.keys() & ours.keys():
            found += differences(api[key], ours[key], f"{where}.{key}")
        return found
    if isinstance(api, list):
        if len(api) != len(ours):
            return [f"{where}: {len(api)} items (API) vs {len(ours)} (export)"]
        found = []
        for i, (a, o) in enumerate(zip(api, ours)):
            found += differences(a, o, f"{where}[{i}]")
        return found
    if api != ours:
        return [f"{where}: {api!r} (API) vs {ours!r} (export)"]
    return []


def api_rows(endpoint, session):
    """The API's rows for one endpoint of this session ([] on 404)."""
    if endpoint == "meetings":
        params = {"meeting_key": session["meeting_key"]}
    else:
        params = {"session_key": session["session_key"]}
    return ingest.fetch_json(endpoint, params) or []


def compare_session(session_key):
    """Compare one session file with the API. Returns the number of differences."""
    path = export.SESSIONS_DIR / f"{session_key}.json"
    with open(path, encoding="utf-8") as f:
        exported = json.load(f)
    session = exported["session"]
    print(f"\nSession {session_key}: {session['year']} {session['location']} "
          f"{session['session_name']}  ({path.relative_to(ingest.REPO_ROOT)})")

    total = 0
    for key, ours in exported.items():
        # session and meeting are single objects in the file, lists in the API.
        endpoint = {"session": "sessions", "meeting": "meetings"}.get(key, key)
        ours_rows = [ours] if key in ("session", "meeting") else ours
        api = api_rows(endpoint, session)
        found = differences(api, ours_rows, key)
        total += len(found)
        status = "OK" if not found else f"{len(found)} difference(s)"
        print(f"  {key:15} {len(api):6} rows (API) {len(ours_rows):6} rows (export)  {status}")
        for line in found[:MAX_SHOWN]:
            print(f"      {line}")
        if len(found) > MAX_SHOWN:
            print(f"      ... and {len(found) - MAX_SHOWN} more")
    return total


def main():
    args = parse_args()
    total = sum(compare_session(key) for key in args.session_keys)
    print(f"\nAPI requests: {ingest.STATS['requests']}, "
          f"rate-limited (429) responses: {ingest.STATS['rate_limited']}")
    print("Comparison clean: no differences." if total == 0
          else f"Comparison found {total} difference(s).")
    sys.exit(0 if total == 0 else 1)


if __name__ == "__main__":
    main()
