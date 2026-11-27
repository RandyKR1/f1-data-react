"""
Check our Race sessions against the official results on formula1.com.

Compares data/f1.duckdb (built by build.py) with the hand-entered reference
docs/reference/official_race_results.csv (one row per Grand Prix: season,
grand_prix, date, winner, team, laps, source_url, retrieved_on).

Races are matched by **local race date**: our session's date_start plus its
gmt_offset, which is the date formula1.com shows. Matching by the UTC date
would miss evening races in the Americas (e.g. Las Vegas runs on Saturday
night locally, which is Sunday in UTC). Names aren't matched, because they
differ: OpenF1 calls the 2026 Kuala Lumpur race the "Bahrain Grand Prix", and
formula1.com calls Madrid 2026 "Spain" and Barcelona 2026
"Barcelona-Catalunya".

For each official race it compares our P1 driver (first_name + last_name),
their team, and their number_of_laps with the official winner, team and laps.
It also lists official races we don't have, and Race sessions we have that
aren't in the official list (cancelled or not run yet are expected).

Sprints aren't included (session_name 'Race' only). Contacts no API.

Run from anywhere (after build.py):
    python pipeline/check_official_results.py
"""

import csv
import sys

import duckdb

import ingest  # same folder: reuse the repo paths

DB_PATH = ingest.REPO_ROOT / "data" / "f1.duckdb"
REFERENCE = ingest.REPO_ROOT / "docs" / "reference" / "official_race_results.csv"


def load_official():
    """The reference CSV as a list of dicts (laps and season as ints)."""
    with open(REFERENCE, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    for row in rows:
        row["season"], row["laps"] = int(row["season"]), int(row["laps"])
    return rows


def load_ours(con, seasons):
    """Our Race sessions in these seasons, one row per session, with the P1 row."""
    con.execute("SET TimeZone = 'UTC'")
    placeholders = ", ".join("?" for _ in seasons)
    cursor = con.execute(f"""
        SELECT s.session_key, s.year, s.location, m.meeting_name, s.is_cancelled,
               s.date_end < now() AS has_run,
               CAST(s.date_start + s.gmt_offset AS DATE) AS local_date,
               d.first_name || ' ' || d.last_name AS winner,
               d.team_name AS team,
               r.number_of_laps AS laps
        FROM stg_sessions AS s
        JOIN stg_meetings AS m USING (meeting_key)
        LEFT JOIN stg_session_result AS r ON r.session_key = s.session_key AND r.position = 1
        LEFT JOIN stg_drivers AS d ON d.session_key = r.session_key AND d.driver_number = r.driver_number
        WHERE s.session_name = 'Race' AND s.year IN ({placeholders})
        ORDER BY s.date_start""", list(seasons))
    names = [col[0] for col in cursor.description]
    return [dict(zip(names, values)) for values in cursor.fetchall()]


def main():
    official = load_official()
    seasons = sorted({row["season"] for row in official})
    con = duckdb.connect(str(DB_PATH), read_only=True)
    try:
        ours = load_ours(con, seasons)
    finally:
        con.close()
    ours_by_date = {str(row["local_date"]): row for row in ours}
    matched_keys = set()

    print(f"Official races: {len(official)}  ({REFERENCE.relative_to(ingest.REPO_ROOT)})")
    print(f"Our Race sessions in {', '.join(map(str, seasons))}: {len(ours)}\n")
    header = f"{'date':10} {'official GP':20} {'our session':40} {'winner':16} {'team':16} {'laps':>4}  result"
    print(header)
    print("-" * len(header))

    mismatches, missing = [], []
    for off in official:
        our = ours_by_date.get(off["date"])
        if our is None:
            missing.append(off)
            print(f"{off['date']:10} {off['grand_prix']:20} {'(none on this date)':40}")
            continue
        matched_keys.add(our["session_key"])
        label = f"{our['session_key']} {our['location']} ({our['meeting_name']})"
        problems = []
        if our["winner"] != off["winner"]:
            problems.append(f"winner {our['winner']!r} vs official {off['winner']!r}")
        if our["team"] != off["team"]:
            problems.append(f"team {our['team']!r} vs official {off['team']!r}")
        if our["laps"] != off["laps"]:
            problems.append(f"laps {our['laps']} vs official {off['laps']}")
        status = "OK" if not problems else "MISMATCH: " + "; ".join(problems)
        if problems:
            mismatches.append((off, our, problems))
        print(f"{off['date']:10} {off['grand_prix']:20} {label:40.40} {str(our['winner']):16} "
              f"{str(our['team']):16} {str(our['laps']):>4}  {status}")

    print(f"\nMatched: {len(official) - len(missing)} of {len(official)} official races; "
          f"mismatches: {len(mismatches)}")
    print(f"Official races we don't have: {len(missing)}")
    for off in missing:
        print(f"  {off['season']} {off['grand_prix']} ({off['date']})")

    extra = [row for row in ours if row["session_key"] not in matched_keys]
    print(f"Our Race sessions not in the official list: {len(extra)}")
    for row in extra:
        why = ("cancelled" if row["is_cancelled"] else
               "not run yet" if not row["has_run"] else "UNEXPECTED: run but not official")
        print(f"  {row['session_key']} {row['year']} {row['location']} ({row['meeting_name']}), "
              f"{row['local_date']}: {why}")

    unexpected = [r for r in extra if not r["is_cancelled"] and r["has_run"]]
    if mismatches or missing or unexpected:
        sys.exit(1)


if __name__ == "__main__":
    main()
