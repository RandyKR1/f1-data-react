"""
Load the raw Parquet files in data/raw into a DuckDB database, data/f1.duckdb.

One table per endpoint, named raw_<endpoint> (raw_meetings, raw_sessions,
raw_drivers, raw_laps, ...), plus raw_no_data from data/raw/_no_data.csv.

- Files are read with read_parquet(union_by_name, hive_partitioning), so
  columns line up by name across files and `year` comes from the folder name
  (year=YYYY). Column types are kept exactly as stored; JSON-text columns
  (e.g. session_result.duration, gap_to_leader, position) stay as text.
- Every table gets a source_file column: the file each row came from,
  relative to the repo root.
- The database is rebuilt from scratch every run, in a single transaction,
  into a temporary file that replaces data/f1.duckdb only once everything
  has loaded and been checked. A failure leaves the previous database (if
  any) untouched, never a half-built one.
- Contacts no API: it only reads files already on disk.

Run from anywhere:
    python pipeline/load.py
"""

import csv
import os
import sys
import time

import duckdb
import pyarrow.parquet as pq

import ingest  # same folder: reuse the repo paths and the endpoint list

# --- Settings -----------------------------------------------------------------

DB_PATH = ingest.REPO_ROOT / "data" / "f1.duckdb"
TMP_PATH = DB_PATH.with_name(DB_PATH.name + ".tmp")   # built here, then swapped in
ENDPOINTS = ingest.SCHEDULE_ENDPOINTS + ingest.SESSION_ENDPOINTS   # all 13

# _no_data.csv columns with explicit types, so nothing is guessed from the
# data (session_key is empty for schedule rows, so it must allow nulls).
NO_DATA_COLUMNS = {
    "logged_at": "TIMESTAMPTZ", "endpoint": "VARCHAR", "session_key": "BIGINT",
    "session_name": "VARCHAR", "year": "BIGINT",
}


# --- Helpers ------------------------------------------------------------------

def relative(path):
    """A path as text relative to the repo root, e.g. data/raw/laps/year=2025/..."""
    return str(path.relative_to(ingest.REPO_ROOT))


def parquet_files(endpoint):
    """Every Parquet file for an endpoint, across all year=YYYY folders."""
    return sorted((ingest.RAW_DIR / endpoint).glob("year=*/*.parquet"))


def sql_text(value):
    """Quote a Python string as a SQL string literal."""
    return "'" + str(value).replace("'", "''") + "'"


# --- Loading ------------------------------------------------------------------

def load_endpoint(con, endpoint):
    """Create raw_<endpoint> from all its Parquet files. Returns the file count."""
    files = parquet_files(endpoint)
    if not files:
        print(f"  note: no files for {endpoint}; raw_{endpoint} not created")
        return 0
    # The root prefix is stripped from DuckDB's filename column so that
    # source_file is relative to the repo, whichever folder this runs from.
    root = str(ingest.REPO_ROOT) + "/"
    glob = str(ingest.RAW_DIR / endpoint / "year=*" / "*.parquet")
    con.execute(f"""
        CREATE TABLE raw_{endpoint} AS
        SELECT * EXCLUDE (filename),
               replace(filename, {sql_text(root)}, '') AS source_file
        FROM read_parquet({sql_text(glob)},
                          union_by_name = true,
                          hive_partitioning = true,
                          filename = true)
    """)
    return len(files)


def load_no_data(con):
    """Create raw_no_data from data/raw/_no_data.csv (empty table if missing)."""
    columns = ", ".join(f"{name} {typ}" for name, typ in NO_DATA_COLUMNS.items())
    if not ingest.NO_DATA_LOG.exists():
        con.execute(f"CREATE TABLE raw_no_data ({columns}, source_file VARCHAR)")
        return
    types = "{" + ", ".join(f"{sql_text(n)}: {sql_text(t)}"
                            for n, t in NO_DATA_COLUMNS.items()) + "}"
    con.execute(f"""
        CREATE TABLE raw_no_data AS
        SELECT *, {sql_text(relative(ingest.NO_DATA_LOG))} AS source_file
        FROM read_csv({sql_text(ingest.NO_DATA_LOG)}, header = true, columns = {types})
    """)


# --- Checks -------------------------------------------------------------------

def expected_rows(endpoint):
    """Total rows in an endpoint's Parquet files, from each file's own metadata
    (pyarrow, not DuckDB, so the check is independent of the load)."""
    return sum(pq.ParquetFile(path).metadata.num_rows for path in parquet_files(endpoint))


def csv_rows(path):
    """Data rows in a CSV file (header excluded)."""
    if not path.exists():
        return 0
    with path.open(newline="") as f:
        return max(sum(1 for _ in csv.reader(f)) - 1, 0)


def check_tables(con, tables):
    """Compare each table's row count with its source files, and check that
    `year` (from the folder name) matches the folder in source_file.

    Returns a list of problems (empty if all is well)."""
    problems = []
    for table in tables:
        actual = con.execute(f"SELECT count(*) FROM {table}").fetchone()[0]
        if table == "raw_no_data":
            expected = csv_rows(ingest.NO_DATA_LOG)
        else:
            expected = expected_rows(table.removeprefix("raw_"))
            misfiled = con.execute(f"""
                SELECT count(*) FROM {table}
                WHERE year IS DISTINCT FROM
                      CAST(regexp_extract(source_file, 'year=(\\d{{4}})', 1) AS BIGINT)
            """).fetchone()[0]
            if misfiled:
                problems.append(f"{table}: {misfiled} row(s) whose year doesn't match its folder")
        if actual != expected:
            problems.append(f"{table}: {actual} rows loaded, but the source files have {expected}")
    return problems


def row_count_table(con, tables):
    """Rows per table by year, plus the total, as a DataFrame."""
    parts = [f"SELECT {sql_text(t)} AS table_name, year, count(*) AS n FROM {t} GROUP BY year"
             for t in tables]
    df = con.execute(" UNION ALL ".join(parts)).df()
    table = df.pivot_table(index="table_name", columns="year", values="n",
                           aggfunc="sum", fill_value=0)
    table = table.reindex(tables).fillna(0).astype(int)
    table.columns = [str(c) for c in table.columns]
    table["total"] = table.sum(axis=1)
    return table


# --- Main ---------------------------------------------------------------------

def build():
    """Build the database in TMP_PATH inside one transaction, then swap it in."""
    started = time.perf_counter()
    TMP_PATH.unlink(missing_ok=True)                 # leftovers from a failed run
    con = duckdb.connect(str(TMP_PATH))
    try:
        con.execute("BEGIN TRANSACTION")
        tables = []
        for endpoint in ENDPOINTS:
            n_files = load_endpoint(con, endpoint)
            if n_files:
                tables.append(f"raw_{endpoint}")
                print(f"Loaded raw_{endpoint} from {n_files} file(s)")
        load_no_data(con)
        tables.append("raw_no_data")
        print("Loaded raw_no_data from data/raw/_no_data.csv")

        problems = check_tables(con, tables)
        if problems:
            raise RuntimeError("checks failed:\n  " + "\n  ".join(problems))
        counts = row_count_table(con, tables)
        con.execute("COMMIT")
    except Exception:
        con.execute("ROLLBACK")
        con.close()
        TMP_PATH.unlink(missing_ok=True)
        raise
    con.close()

    # Only now replace the old database (os.replace is atomic on one filesystem).
    os.replace(TMP_PATH, DB_PATH)
    elapsed = time.perf_counter() - started

    print(f"\nBuilt {relative(DB_PATH)}: {len(tables)} tables in {elapsed:.1f} s")
    print("\nRows per table by year (year from the folder name):")
    print(counts.to_string())
    print("\nRow-count check: every table matches the rows in its source files.")
    print("Year check: every row's year matches its year=YYYY folder.")


if __name__ == "__main__":
    try:
        build()
    except Exception as error:
        sys.exit(f"Load failed, database left unchanged: {error}")
