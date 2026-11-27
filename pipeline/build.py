"""
Build the modelled tables in data/f1.duckdb by running SQL files.

Runs every .sql file in sql/staging/ in filename order (01_..., 02_..., ...)
against data/f1.duckdb. For each file it prints the file name, how long it
took, and the row count of the table it created (the last
"CREATE OR REPLACE TABLE <name>" in the file). It stops at the first error.

Run it after load.py: load.py rebuilds data/f1.duckdb from the raw files
from scratch, which removes any tables built here.

Contacts no API: it only reads and writes the local database.

Run from anywhere:
    python pipeline/build.py
"""

import re
import sys
import time

import duckdb

import ingest  # same folder: reuse the repo paths

# --- Settings -----------------------------------------------------------------

DB_PATH = ingest.REPO_ROOT / "data" / "f1.duckdb"
SQL_DIRS = [ingest.REPO_ROOT / "sql" / "staging"]   # run in this order

# The table a file creates: the last "CREATE OR REPLACE TABLE <name>" in it.
CREATED_TABLE = re.compile(r"CREATE\s+OR\s+REPLACE\s+TABLE\s+([A-Za-z_][A-Za-z0-9_]*)",
                           re.IGNORECASE)


# --- Helpers ------------------------------------------------------------------

def sql_files():
    """Every .sql file to run, folder by folder, in filename order."""
    return [path for folder in SQL_DIRS for path in sorted(folder.glob("*.sql"))]


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

def main():
    files = sql_files()
    if not files:
        sys.exit("No .sql files found in " + ", ".join(str(d) for d in SQL_DIRS))
    print(f"Building {DB_PATH.relative_to(ingest.REPO_ROOT)} from {len(files)} SQL file(s)\n")

    con = duckdb.connect(str(DB_PATH))
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
