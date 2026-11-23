"""
Validate the raw OpenF1 Parquet files in data/raw. Read-only: it reports
problems and never changes, deletes, or fixes any data.

Uses ingest.py's session selection and endpoint map, so "expected files" means
exactly what ingest.py would have downloaded for the same filters.

Each problem is graded:
    FAIL - the data is wrong or incomplete in a way that would break later steps
    WARN - suspicious, worth a look (often a legitimate race event)
    INFO - for the record, no action needed

Output:
    a summary table in the terminal
    the full report, with counts and up to 5 example rows per issue, in
    docs/raw_validation_report.md

Examples (run from anywhere):
    python pipeline/validate_raw.py --session-keys 9689,9693
    python pipeline/validate_raw.py --year 2025,2026 --session-name Race,Qualifying
"""

import argparse
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime, timezone

import duckdb
import pandas as pd

import ingest  # same folder: reuse its filters, session selection and endpoint map

# --- Settings -----------------------------------------------------------------

REPORT_PATH = ingest.REPO_ROOT / "docs" / "raw_validation_report.md"
MAX_EXAMPLES = 5

# Expected drivers per session, by season (2026 added Cadillac: 11 teams).
EXPECTED_DRIVERS = {2023: 20, 2024: 20, 2025: 20, 2026: 22}

# Natural keys: no two rows should share these values.
NATURAL_KEYS = {
    "laps": ["session_key", "driver_number", "lap_number"],
    "stints": ["session_key", "driver_number", "stint_number"],
    "session_result": ["session_key", "driver_number"],
    "drivers": ["session_key", "driver_number"],
    "starting_grid": ["session_key", "driver_number"],
}
# Time-based endpoints have no natural key, so check for fully duplicated rows.
TIME_BASED = ["position", "weather", "race_control", "team_radio", "overtakes", "pit"]

# Driver-number columns that must never be null, per endpoint. Endpoints not
# listed use "driver_number" if they have it.
DRIVER_COLUMNS = {
    # race_control.driver_number is only set for driver-specific messages, so
    # nulls are expected there (see docs/data_quirks.md).
    "race_control": [],
    # overtakes has two driver columns instead of driver_number.
    "overtakes": ["overtaking_driver_number", "overtaken_driver_number"],
}

# Columns already documented in docs/data_quirks.md as (sometimes) entirely
# empty. These aren't reported again by the empty-column check.
KNOWN_EMPTY_COLUMNS = {
    ("drivers", "country_code"): "always null so far",
    ("race_control", "qualifying_phase"): "null outside qualifying",
}

# Endpoints whose driver_number must appear in the same session's drivers file.
LINKED_TO_DRIVERS = ["laps", "stints", "session_result", "pit", "starting_grid"]

KNOWN_COMPOUNDS = ["SOFT", "MEDIUM", "HARD", "INTERMEDIATE", "WET"]
SLOW_LAP_FACTOR = 1.3               # WARN for laps over 1.3 x the session median
AIR_TEMP_RANGE = (0, 50)            # °C, plausible for any F1 venue
TRACK_TEMP_RANGE = (0, 70)          # °C

CHECK_ORDER = ["Inventory", "Schema consistency", "Key columns", "Duplicates",
               "Empty columns", "Value ranges", "Driver counts", "Cross-file links",
               "Stint logic"]


# --- Collecting issues --------------------------------------------------------

@dataclass
class Issue:
    """One problem found by one check."""
    check: str
    severity: str                 # FAIL, WARN or INFO
    endpoint: str
    message: str
    count: int = 1
    session_key: object = None
    examples: pd.DataFrame = field(default=None, repr=False)


ISSUES = []


def report(check, severity, endpoint, message, count=1, session_key=None, examples=None):
    """Record an issue. `examples` is a DataFrame; only the first rows are kept."""
    if examples is not None:
        examples = examples.head(MAX_EXAMPLES)
    ISSUES.append(Issue(check, severity, endpoint, message, count, session_key, examples))


# --- Command-line options -----------------------------------------------------

def parse_args():
    """Same filters as ingest.py, parsed with ingest.py's own helpers."""
    parser = argparse.ArgumentParser(description="Validate raw OpenF1 Parquet files (read-only).")
    parser.add_argument("--year", type=ingest.parse_year_list, default=list(ingest.YEARS),
                        help="comma-separated years, e.g. 2025,2026 (default: all years)")
    parser.add_argument("--session-name", type=ingest.parse_text_list,
                        help='comma-separated exact session names, e.g. "Race,Qualifying"')
    parser.add_argument("--session-keys", type=ingest.parse_int_list,
                        help="comma-separated session_keys, e.g. 9689,9693")
    return parser.parse_args()


# --- Setup: which files should exist ------------------------------------------

def session_file(endpoint, year, session_key):
    """Where ingest.py saves one endpoint for one session."""
    return ingest.RAW_DIR / endpoint / f"year={year}" / f"session_{session_key}.parquet"


def load_no_data_log():
    """The (endpoint, session_key) pairs ingest.py logged as 404 / no data."""
    if not ingest.NO_DATA_LOG.exists():
        return set()
    log = pd.read_csv(ingest.NO_DATA_LOG)
    log = log[pd.to_numeric(log["session_key"], errors="coerce").notna()]
    return set(zip(log["endpoint"], log["session_key"].astype(int)))


def expected_files(sessions):
    """Every (endpoint, session) pair ingest.py would request, with its path."""
    rows = []
    for s in sessions.itertuples():
        for endpoint in ingest.endpoints_for(s.session_name, ingest.SESSION_ENDPOINTS):
            path = session_file(endpoint, s.year, s.session_key)
            rows.append({"endpoint": endpoint, "session_key": s.session_key,
                         "session_name": s.session_name, "year": s.year,
                         "path": path, "exists": path.exists()})
    return pd.DataFrame(rows)


def register_views(con, files):
    """Create one DuckDB view per endpoint over all its existing files.

    union_by_name lines columns up by name across files. Two extra columns
    come from the file path: file_session_key and folder_year.
    """
    for endpoint, group in files[files["exists"]].groupby("endpoint"):
        paths = [str(p) for p in group["path"]]
        con.execute(f"""
            CREATE OR REPLACE VIEW {endpoint} AS
            SELECT *,
                   regexp_extract(filename, 'session_(\\d+)\\.parquet', 1)::BIGINT AS file_session_key,
                   regexp_extract(filename, 'year=(\\d{{4}})', 1)::BIGINT AS folder_year
            FROM read_parquet({paths}, union_by_name = true, filename = true)
        """)


def columns_of(con, endpoint):
    """Column names in an endpoint's view (excluding the path-derived ones)."""
    names = [row[0] for row in con.execute(f"DESCRIBE {endpoint}").fetchall()]
    return [n for n in names if n not in ("filename", "file_session_key", "folder_year")]


def query(con, sql):
    """Run SQL and return a DataFrame."""
    return con.execute(sql).df()


# --- Check 1: inventory -------------------------------------------------------

def check_inventory(files, no_data):
    """Each expected file exists, or ingest logged it as no data."""
    for row in files.itertuples():
        logged = (row.endpoint, row.session_key) in no_data
        if row.exists and logged:
            report("Inventory", "INFO", row.endpoint,
                   "file exists but an older run also logged it as no data",
                   session_key=row.session_key)
        elif not row.exists and logged:
            report("Inventory", "INFO", row.endpoint,
                   "no file; logged as no data (404) in _no_data.csv",
                   session_key=row.session_key)
        elif not row.exists:
            report("Inventory", "FAIL", row.endpoint,
                   "no file and no _no_data.csv entry (never downloaded?)",
                   session_key=row.session_key)


# --- Check 2: schema consistency ----------------------------------------------

def file_schema(con, path):
    """{column: type} for one Parquet file."""
    rows = con.execute(f"DESCRIBE SELECT * FROM read_parquet('{path}')").fetchall()
    return {name: col_type for name, col_type, *_ in rows}


def empty_columns(con, path, columns):
    """Columns that are null in every row of one file (all, if it has no rows)."""
    counts = con.execute(
        "SELECT " + ", ".join(f'count("{c}")' for c in columns)
        + f" FROM read_parquet('{path}')").fetchone()
    return [c for c, n in zip(columns, counts) if n == 0]


def check_schemas(con, files):
    """Same column names and types across the files of an endpoint.

    Column types: a column's expected type is the most common type among the
    files where it has at least one value. An entirely empty column has no
    real type (Parquet stores it as "null", read back as INTEGER), so it never
    decides the expected type. If its type differs, that's a WARN.
    A file with values of a different type is a FAIL.

    Column names: compared only within the same session type (Race files
    against Race files, Qualifying against Qualifying), because some columns
    only exist for one type (e.g. session_result.points is race-only).
    A file missing a column that others of its session type have is a FAIL.
    """
    for endpoint, group in files[files["exists"]].groupby("endpoint"):
        # Per file: its schema, its entirely-empty columns and its session type.
        info = {}
        for row in group.itertuples():
            schema = file_schema(con, row.path)
            info[row.session_key] = {"schema": schema, "session_name": row.session_name,
                                     "empty": set(empty_columns(con, row.path, list(schema)))}

        check_column_types(endpoint, info)
        check_column_names(endpoint, info)


def check_column_types(endpoint, info):
    """Compare each column's type against the type it has where it has values."""
    all_columns = sorted({c for f in info.values() for c in f["schema"]})
    for col in all_columns:
        with_values = Counter(f["schema"][col] for f in info.values()
                              if col in f["schema"] and col not in f["empty"])
        if not with_values:
            continue                  # empty everywhere: the empty-column check covers it
        expected = with_values.most_common(1)[0][0]
        for key, f in info.items():
            actual = f["schema"].get(col)
            if actual is None or actual == expected:
                continue
            if col in f["empty"]:
                report("Schema consistency", "WARN", endpoint,
                       f"`{col}` is entirely empty here, so it has no real type "
                       f"(read as {actual}; {expected} where it has values)", session_key=key)
            else:
                report("Schema consistency", "FAIL", endpoint,
                       f"`{col}` is {actual} here but {expected} in files where it has values",
                       session_key=key)


def check_column_names(endpoint, info):
    """Within each session type, every file should have the same columns."""
    by_type = {}
    for key, f in info.items():
        by_type.setdefault(f["session_name"], {})[key] = set(f["schema"])
    for session_name, column_sets in by_type.items():
        all_columns = set().union(*column_sets.values())
        for key, columns in column_sets.items():
            missing = sorted(all_columns - columns)
            if missing:
                report("Schema consistency", "FAIL", endpoint,
                       f"missing column(s) {missing} that other {session_name} files have",
                       session_key=key)


# --- Check 3: key columns -----------------------------------------------------

def check_key_columns(con, files, endpoints):
    """session_key / meeting_key / driver columns present and never null;
    session_key, meeting_key and year match the file path and the schedule."""
    for endpoint in endpoints:
        cols = columns_of(con, endpoint)
        driver_cols = DRIVER_COLUMNS.get(
            endpoint, ["driver_number"] if "driver_number" in cols else [])
        required = ["session_key", "meeting_key"] + driver_cols

        # Present in every file?
        for row in files[(files["endpoint"] == endpoint) & files["exists"]].itertuples():
            missing = [c for c in required if c not in file_schema(con, row.path)]
            if missing:
                report("Key columns", "FAIL", endpoint, f"missing column(s) {missing}",
                       session_key=row.session_key)

        # Never null?
        for col in [c for c in required if c in cols]:
            df = query(con, f"""
                SELECT file_session_key, count(*) AS null_rows FROM {endpoint}
                WHERE "{col}" IS NULL GROUP BY 1 ORDER BY 1""")
            for r in df.itertuples():
                report("Key columns", "FAIL", endpoint, f"`{col}` is null in {r.null_rows} row(s)",
                       count=r.null_rows, session_key=r.file_session_key)

        # Matches the file name, the folder and the schedule?
        df = query(con, f"""
            SELECT e.file_session_key, e.session_key, e.meeting_key,
                   s.meeting_key AS schedule_meeting_key, e.folder_year, s.year AS schedule_year,
                   count(*) AS n_rows
            FROM {endpoint} e LEFT JOIN sel_sessions s ON s.session_key = e.file_session_key
            WHERE e.session_key IS DISTINCT FROM e.file_session_key
               OR e.meeting_key IS DISTINCT FROM s.meeting_key
               OR e.folder_year IS DISTINCT FROM s.year
            GROUP BY ALL ORDER BY 1""")
        for key, group in df.groupby("file_session_key"):
            report("Key columns", "FAIL", endpoint,
                   "session_key / meeting_key / year doesn't match the file name, "
                   "folder or schedule", count=int(group["n_rows"].sum()),
                   session_key=key, examples=group)


# --- Check 4: duplicates ------------------------------------------------------

def check_duplicates(con, endpoints):
    """No repeated natural keys; no fully duplicated rows in time-based data."""
    for endpoint in endpoints:
        if endpoint in NATURAL_KEYS:
            keys = ", ".join(NATURAL_KEYS[endpoint])
            df = query(con, f"""
                SELECT {keys}, count(*) AS copies FROM {endpoint}
                GROUP BY {keys} HAVING count(*) > 1 ORDER BY copies DESC""")
            what = f"duplicate ({keys})"
        elif endpoint in TIME_BASED:
            df = query(con, f"""
                SELECT * EXCLUDE (filename, folder_year), count(*) AS copies
                FROM {endpoint} GROUP BY ALL HAVING count(*) > 1 ORDER BY copies DESC""")
            what = "fully duplicated rows"
        else:
            continue
        for key, group in df.groupby("file_session_key" if "file_session_key" in df else "session_key"):
            extra = int((group["copies"] - 1).sum())
            report("Duplicates", "FAIL", endpoint, f"{len(group)} {what} ({extra} extra row(s))",
                   count=extra, session_key=key, examples=group.drop(
                       columns=[c for c in ("file_session_key",) if c in group]))


# --- Check 5: empty columns ---------------------------------------------------

def check_empty_columns(con, files):
    """Columns null in every row of a file, unless already documented."""
    suppressed = Counter()
    for row in files[files["exists"]].itertuples():
        cols = list(file_schema(con, row.path))
        for col in empty_columns(con, row.path, cols):
            if (row.endpoint, col) in KNOWN_EMPTY_COLUMNS:
                suppressed[(row.endpoint, col)] += 1
                continue
            report("Empty columns", "INFO", row.endpoint, f"`{col}` is entirely null",
                   session_key=row.session_key)
    return suppressed


# --- Check 6: value ranges ----------------------------------------------------

def range_check(con, endpoint, where, message, select="*"):
    """Report rows matching `where` (one WARN per session), with examples."""
    df = query(con, f"SELECT {select} FROM {endpoint} WHERE {where} ORDER BY file_session_key")
    for key, group in df.groupby("file_session_key"):
        report("Value ranges", "WARN", endpoint, message, count=len(group),
               session_key=key, examples=group.drop(columns=["file_session_key"]))


def check_lap_durations(con):
    """Lap times: FAIL if impossible (zero or negative), WARN if slow for the
    session (over SLOW_LAP_FACTOR x that session's median lap_duration).

    Relative, because "slow" depends on the track and conditions: a 190 s lap
    is normal at Spa under a Safety Car but very slow at Monza. One WARN per
    session, with the count, the flagged range and the slowest examples.
    """
    df = query(con, """
        SELECT file_session_key, driver_number, lap_number, lap_duration, is_pit_out_lap
        FROM laps WHERE lap_duration <= 0 ORDER BY 1, 2, 3""")
    for key, group in df.groupby("file_session_key"):
        report("Value ranges", "FAIL", "laps", "lap_duration zero or negative (impossible)",
               count=len(group), session_key=key, examples=group.drop(columns=["file_session_key"]))

    df = query(con, f"""
        WITH medians AS (
            SELECT file_session_key, median(lap_duration) AS median_s
            FROM laps WHERE lap_duration > 0 GROUP BY 1)
        SELECT l.file_session_key, l.driver_number, l.lap_number,
               round(l.lap_duration, 1) AS lap_duration, l.is_pit_out_lap,
               round(m.median_s, 1) AS session_median
        FROM laps l JOIN medians m USING (file_session_key)
        WHERE l.lap_duration > {SLOW_LAP_FACTOR} * m.median_s
        ORDER BY l.file_session_key, l.lap_duration DESC""")
    for key, group in df.groupby("file_session_key"):
        median_s = group["session_median"].iloc[0]
        report("Value ranges", "WARN", "laps",
               f"{len(group)} lap(s) slower than {SLOW_LAP_FACTOR} x the session median "
               f"({median_s} s, so over {SLOW_LAP_FACTOR * median_s:.1f} s); "
               f"flagged laps range {group['lap_duration'].min()}-"
               f"{group['lap_duration'].max()} s (examples: slowest first)",
               count=len(group), session_key=key,
               examples=group.drop(columns=["file_session_key", "session_median"]))


def check_value_ranges(con, endpoints):
    """Values outside plausible ranges (WARN: often legitimate, worth a look)."""
    if "laps" in endpoints:
        check_lap_durations(con)

    # lap_number below 1, wherever there is a lap_number.
    for endpoint in [e for e in ("laps", "pit", "race_control") if e in endpoints]:
        range_check(con, endpoint, "lap_number < 1", "lap_number below 1",
                    "file_session_key, lap_number, * EXCLUDE (filename, file_session_key, lap_number)")

    # Positions between 1 and the season's driver count.
    cases = " ".join(f"WHEN {y} THEN {n}" for y, n in EXPECTED_DRIVERS.items())
    for endpoint in [e for e in ("session_result", "starting_grid", "position", "overtakes")
                     if e in endpoints]:
        range_check(con, endpoint,
                    f"position < 1 OR position > (CASE folder_year {cases} END)",
                    "position outside 1 to the season's driver count",
                    "file_session_key, folder_year, position, * EXCLUDE (filename, file_session_key, folder_year, position)")

    if "stints" in endpoints:
        known = ", ".join(f"'{c}'" for c in KNOWN_COMPOUNDS)
        range_check(con, "stints", f"compound IS NULL OR compound NOT IN ({known})",
                    "compound outside the known set (or missing)",
                    "file_session_key, driver_number, stint_number, compound, lap_start, lap_end")

    if "weather" in endpoints:
        range_check(con, "weather", "rainfall IS NULL OR rainfall NOT IN (0, 1)",
                    "rainfall not 0 or 1", "file_session_key, date, rainfall")
        (alo, ahi), (tlo, thi) = AIR_TEMP_RANGE, TRACK_TEMP_RANGE
        range_check(con, "weather",
                    f"air_temperature NOT BETWEEN {alo} AND {ahi} "
                    f"OR track_temperature NOT BETWEEN {tlo} AND {thi}",
                    f"implausible temperature (air outside {alo}-{ahi} °C or track outside {tlo}-{thi} °C)",
                    "file_session_key, date, air_temperature, track_temperature")


# --- Check 7: driver counts ---------------------------------------------------

def check_driver_counts(con):
    """Each session's drivers file has the season's expected driver count."""
    df = query(con, """
        SELECT file_session_key, folder_year, count(DISTINCT driver_number) AS drivers
        FROM drivers GROUP BY ALL ORDER BY 1""")
    for r in df.itertuples():
        expected = EXPECTED_DRIVERS.get(r.folder_year)
        if r.drivers != expected:
            report("Driver counts", "WARN", "drivers",
                   f"{r.drivers} drivers, expected {expected} for {r.folder_year}",
                   session_key=r.file_session_key)


# --- Check 8: cross-file links ------------------------------------------------

def check_cross_file_links(con, endpoints):
    """driver_number in other endpoints must exist in that session's drivers file."""
    for endpoint in [e for e in LINKED_TO_DRIVERS if e in endpoints]:
        df = query(con, f"""
            SELECT e.file_session_key, e.driver_number, count(*) AS n_rows
            FROM {endpoint} e
            WHERE e.driver_number IS NOT NULL
              AND e.file_session_key IN (SELECT DISTINCT file_session_key FROM drivers)
              AND NOT EXISTS (SELECT 1 FROM drivers d
                              WHERE d.file_session_key = e.file_session_key
                                AND d.driver_number = e.driver_number)
            GROUP BY ALL ORDER BY 1, 2""")
        for key, group in df.groupby("file_session_key"):
            report("Cross-file links", "FAIL", endpoint,
                   f"driver_number(s) {sorted(group['driver_number'].tolist())} "
                   "not in this session's drivers file",
                   count=int(group["n_rows"].sum()), session_key=key,
                   examples=group.drop(columns=["file_session_key"]))


# --- Check 9: stint logic -----------------------------------------------------

def check_stint_logic(con):
    """lap_end >= lap_start, and a driver's stints don't overlap."""
    df = query(con, """
        SELECT file_session_key, driver_number, stint_number, lap_start, lap_end
        FROM stints WHERE lap_end < lap_start ORDER BY 1, 2, 3""")
    for key, group in df.groupby("file_session_key"):
        report("Stint logic", "FAIL", "stints", "lap_end before lap_start",
               count=len(group), session_key=key, examples=group.drop(columns=["file_session_key"]))

    # Overlap: a stint starts on or before the previous stint's last lap.
    df = query(con, """
        WITH ordered AS (
            SELECT file_session_key, driver_number, stint_number, lap_start, lap_end,
                   lag(stint_number) OVER w AS prev_stint, lag(lap_end) OVER w AS prev_lap_end
            FROM stints
            WINDOW w AS (PARTITION BY file_session_key, driver_number ORDER BY stint_number))
        SELECT * FROM ordered WHERE lap_start <= prev_lap_end ORDER BY 1, 2, 3""")
    for key, group in df.groupby("file_session_key"):
        report("Stint logic", "FAIL", "stints",
               "stint starts on or before the previous stint's last lap (overlap)",
               count=len(group), session_key=key, examples=group.drop(columns=["file_session_key"]))


# --- Output -------------------------------------------------------------------

def summary_table():
    """FAIL / WARN / INFO counts per check, as a DataFrame."""
    rows = []
    for check in CHECK_ORDER:
        found = [i for i in ISSUES if i.check == check]
        rows.append({"Check": check,
                     **{sev: sum(1 for i in found if i.severity == sev)
                        for sev in ("FAIL", "WARN", "INFO")}})
    return pd.DataFrame(rows)


def to_markdown_table(df):
    """A DataFrame as a Markdown table (values shortened to 60 characters)."""
    def cell(value):
        text = "" if value is None or (isinstance(value, float) and pd.isna(value)) else str(value)
        text = text.replace("|", "\\|").replace("\n", " ")
        return text if len(text) <= 60 else text[:57] + "..."
    lines = ["| " + " | ".join(map(str, df.columns)) + " |",
             "|" + "---|" * len(df.columns)]
    lines += ["| " + " | ".join(cell(v) for v in row) + " |" for row in df.itertuples(index=False)]
    return "\n".join(lines)


def write_report(args, sessions, files, suppressed, labels):
    """Write the full report to docs/raw_validation_report.md."""
    lines = [
        "# Raw data validation report",
        "",
        f"Generated {datetime.now(timezone.utc):%Y-%m-%d %H:%M UTC} by "
        "`pipeline/validate_raw.py` (read-only, nothing was changed).",
        "",
        "Filters: " + ", ".join(f"`--{k.replace('_', '-')} {v}`" for k, v in vars(args).items()
                                if v and not (k == "year" and v == list(ingest.YEARS)))
        + f". Sessions checked: {len(sessions)}. Expected files: {len(files)}, "
          f"present: {int(files['exists'].sum())}.",
        "",
        "## Summary",
        "",
        to_markdown_table(summary_table()),
        "",
    ]
    if suppressed:
        lines += ["Empty columns already documented in `docs/data_quirks.md` (not "
                  "reported again): " + ", ".join(
                      f"`{ep}.{col}` in {n} file(s) ({KNOWN_EMPTY_COLUMNS[(ep, col)]})"
                      for (ep, col), n in sorted(suppressed.items())) + ".", ""]

    for check in CHECK_ORDER:
        found = [i for i in ISSUES if i.check == check]
        lines += [f"## {check}", ""]
        if not found:
            lines += ["No issues.", ""]
            continue
        for sev in ("FAIL", "WARN", "INFO"):
            for i in [i for i in found if i.severity == sev]:
                where = labels.get(i.session_key, i.session_key)
                lines.append(f"- **{i.severity}** `{i.endpoint}` session {where}: "
                             f"{i.message}" + (f" ({i.count} row(s))" if i.count > 1 else ""))
                if i.examples is not None and len(i.examples):
                    lines += ["", f"  Examples (up to {MAX_EXAMPLES}):", ""]
                    lines += ["  " + ln for ln in to_markdown_table(i.examples).splitlines()]
                    lines.append("")
        lines.append("")

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text("\n".join(lines))


def print_terminal_summary(labels):
    """Print the summary table and a one-line list of every FAIL and WARN."""
    print("\n--- Validation summary ---")
    print(summary_table().to_string(index=False))
    for sev in ("FAIL", "WARN"):
        for i in [i for i in ISSUES if i.severity == sev]:
            print(f"  {sev} [{i.check}] {i.endpoint} {labels.get(i.session_key, i.session_key)}: "
                  f"{i.message}" + (f" ({i.count})" if i.count > 1 else ""))
    print(f"\nFull report: {REPORT_PATH.relative_to(ingest.REPO_ROOT)}")


# --- Main ---------------------------------------------------------------------

def main():
    args = parse_args()

    # Same selection as ingest.py (skips cancelled, unfinished and unmapped).
    sessions = ingest.load_sessions(args.year, args.session_name, args.session_keys)
    labels = {s.session_key: f"{s.session_key} ({s.year} {s.location} {s.session_name})"
              for s in sessions.itertuples()}
    files = expected_files(sessions)
    print(f"Checking {len(sessions)} session(s), {len(files)} expected file(s), "
          f"{int(files['exists'].sum())} present")

    con = duckdb.connect()            # in-memory; only reads the Parquet files
    con.register("sel_sessions", sessions[["session_key", "meeting_key", "year"]])
    register_views(con, files)
    endpoints = sorted(files.loc[files["exists"], "endpoint"].unique())

    check_inventory(files, load_no_data_log())
    check_schemas(con, files)
    check_key_columns(con, files, endpoints)
    check_duplicates(con, endpoints)
    suppressed = check_empty_columns(con, files)
    check_value_ranges(con, endpoints)
    if "drivers" in endpoints:
        check_driver_counts(con)
        check_cross_file_links(con, endpoints)
    if "stints" in endpoints:
        check_stint_logic(con)

    write_report(args, sessions, files, suppressed, labels)
    print_terminal_summary(labels)


if __name__ == "__main__":
    main()
