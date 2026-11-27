"""
Build the modelled tables in data/f1.duckdb by running SQL files.

1. Runs load.py first (unless --no-load), because load.py rebuilds
   data/f1.duckdb from the raw files from scratch, which removes any tables
   built here. So staging is always rebuilt on top of a fresh load.
2. Runs every .sql file in sql/staging/, then every .sql file in
   sql/models/, each folder in filename order (01_..., 02_...), against
   data/f1.duckdb. Staging cleans the raw tables one to one; models build on
   staging. For each file it prints the file name, how long it took, and the
   row count of the table it created (the last
   "CREATE OR REPLACE TABLE <name>" in the file). It stops at the first error.

The DuckDB session time zone is set to UTC, so anything in the SQL that turns
a TIMESTAMPTZ into a date, an hour or text uses UTC, not this machine's zone.

Contacts no API: it only reads the raw files and the local database.

Run from anywhere:
    python pipeline/build.py             # load.py, then all SQL
    python pipeline/build.py --no-load   # only rerun the SQL
"""

import argparse
import re
import sys
import time

import duckdb

import ingest  # same folder: reuse the repo paths
import load    # same folder: the raw-to-DuckDB load step

# --- Settings -----------------------------------------------------------------

DB_PATH = ingest.REPO_ROOT / "data" / "f1.duckdb"
SQL_DIRS = [ingest.REPO_ROOT / "sql" / "staging",   # run in this order:
            ingest.REPO_ROOT / "sql" / "models"]    # staging first, then models

# The table a file creates: the last "CREATE OR REPLACE TABLE <name>" in it.
CREATED_TABLE = re.compile(r"CREATE\s+OR\s+REPLACE\s+TABLE\s+([A-Za-z_][A-Za-z0-9_]*)",
                           re.IGNORECASE)


# --- Helpers ------------------------------------------------------------------

def sql_files():
    """Every .sql file to run, folder by folder, in filename order."""
    return [path for folder in SQL_DIRS if folder.is_dir()
            for path in sorted(folder.glob("*.sql"))]


def created_table(sql):
    """Name of the table the SQL creates, or None if it creates none."""
    names = CREATED_TABLE.findall(sql)
    return names[-1] if names else None


def run_file(con, path):
    """Run one SQL file. Returns (table name or None, row count or None, seconds)."""
    sql = path.read_text(encoding="utf-8")
    started = time.perf_counter()
    con.execute(sql)    # a file may hold several statements; DuckDB runs them all
    seconds = time.perf_counter() - started
    table = created_table(sql)
    rows = con.execute(f"SELECT count(*) FROM {table}").fetchone()[0] if table else None
    return table, rows, seconds


# --- Main ---------------------------------------------------------------------

def parse_args():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument("--no-load", action="store_true",
                        help="skip load.py and only rerun the SQL files")
    return parser.parse_args()


def run_load():
    """Rebuild data/f1.duckdb from the raw files (load.py); stop if it fails."""
    print("=== load.py ===")
    try:
        load.build()
    except Exception as error:
        sys.exit(f"Load failed, database left unchanged; SQL not run: {error}")
    print()


def main():
    args = parse_args()
    files = sql_files()
    if not files:
        sys.exit("No .sql files found in " + ", ".join(str(d) for d in SQL_DIRS))
    if not args.no_load:
        run_load()
    print(f"=== SQL: {len(files)} file(s) into {DB_PATH.relative_to(ingest.REPO_ROOT)} ===")

    con = duckdb.connect(str(DB_PATH))
    con.execute("SET TimeZone = 'UTC'")   # dates and times in the SQL are UTC
    total_started = time.perf_counter()
    try:
        for path in files:
            name = path.relative_to(ingest.REPO_ROOT)
            try:
                table, rows, seconds = run_file(con, path)
            except duckdb.Error as error:
                sys.exit(f"FAILED {name}\n  {error}\nStopped; later files were not run.")
            result = f"{table}: {rows:,} rows" if table else "no table created"
            print(f"{str(name):40} {seconds:6.2f} s   {result}")
    finally:
        con.close()
    print(f"\nDone: {len(files)} file(s) in {time.perf_counter() - total_started:.2f} s")


if __name__ == "__main__":
    main()
