-- stints_clean: tyre stints with stray and empty rows removed, DNF final laps
-- covered, and garbled drivers marked
--
-- Grain:       one row per driver per stint (per session)
-- Natural key: (session_key, driver_number, stint_number)
-- Built from:  stg_stints (7,002 rows), stg_drivers, stg_laps, stg_pit,
--              stg_session_result
--
-- Checks on stg_stints (27 November 2026), before any rule:
--   driver not in the session's drivers list   12 rows (Spielberg 2025
--                                              Qualifying, numbers 2-25 that
--                                              aren't driver numbers)
--   zero-length (lap_end = lap_start - 1)      14 rows (Monaco 2025 4,
--                                              Melbourne 2025 4, Monte Carlo
--                                              2026 3, Kuala Lumpur 2026 2,
--                                              Montréal 2026 1): mostly "stint
--                                              1: laps 1-0", a tyre change on
--                                              the grid
--   backwards (lap_end < lap_start - 1)        1 row  (Melbourne 2025 #30, laps 3-1)
--   overlapping stints (any pair)              1 driver (Melbourne 2025 #30, stints 2 and 4)
--   gaps between stints / first stint not lap 1 / null lap_start or lap_end: none
--
-- Rules:
--   1. Remove stints whose driver isn't in the session's stg_drivers (12 rows).
--   2. Remove zero-length stints (14 rows). They cover no lap.
--   3. A DNF driver's last stint is extended by one lap when it ends exactly
--      one lap before the driver's last recorded lap: OpenF1 leaves a
--      retiring driver's final lap out of every stint (117 laps). lap_end_raw
--      keeps the original value and lap_end_inferred = true marks the change.
--   4. stint_reliable = false for every stint of a driver whose stints are
--      still garbled after rules 1-2 (nothing is repaired or guessed):
--        (a) a backwards stint (lap_end < lap_start), or
--        (b) two stints sharing a lap, or
--        (c) (races) two or more stint changes in laps 1-3 that aren't all
--            backed by a pit in-lap on the lap before (stint start - 1).
--      (c) separates the wet-start garbling (Melbourne 2025, Kuala Lumpur
--      2026: one-lap "stints" on laps 1-3, tyre ages that jump, pit rows that
--      don't line up) from genuine early double stops, which are backed by
--      pit rows on both laps (Baku 2025 #31, Spa-Francorchamps 2026 #6).
--      Not used: "compound change without a pit stop". It's confounded by
--      missing or mis-numbered pit data (Miami 2025, Melbourne 2026) and by
--      Spa 2025's lap-1 compound records, so it would flag sound stints.

CREATE OR REPLACE TABLE stints_clean AS
WITH kept AS (
    -- Rules 1 and 2: drop stray and zero-length stints
    SELECT st.*
    FROM stg_stints AS st
    WHERE EXISTS (SELECT 1 FROM stg_drivers AS d
                  WHERE d.session_key = st.session_key AND d.driver_number = st.driver_number)
      AND st.lap_end <> st.lap_start - 1
),
driver_last_lap AS (
    SELECT session_key, driver_number, max(lap_number) AS last_lap
    FROM stg_laps
    GROUP BY session_key, driver_number
),
last_stint AS (
    -- Each driver's last stint (by laps covered)
    SELECT session_key, driver_number, arg_max(stint_number, lap_end) AS stint_number,
           max(lap_end) AS lap_end
    FROM kept
    GROUP BY session_key, driver_number
),
dnf_extend AS (
    -- Rule 3: DNF drivers whose last stint stops one lap short of their last lap
    SELECT ls.session_key, ls.driver_number, ls.stint_number, dl.last_lap
    FROM last_stint AS ls
    JOIN driver_last_lap AS dl USING (session_key, driver_number)
    JOIN stg_session_result AS r USING (session_key, driver_number)
    WHERE r.dnf AND ls.lap_end = dl.last_lap - 1
),
race_in_laps AS (
    SELECT p.session_key, p.driver_number, p.lap_number
    FROM stg_pit AS p
    JOIN stg_sessions AS s USING (session_key)
    WHERE s.session_type = 'Race'
),
early_changes AS (
    -- Stint changes in laps 1-3 (a stint, other than a driver's first, starting
    -- on lap 2 or 3), and whether a pit in-lap on the lap before backs each one
    SELECT k.session_key, k.driver_number,
           count(*) AS changes,
           bool_and(EXISTS (SELECT 1 FROM race_in_laps AS p
                            WHERE p.session_key = k.session_key AND p.driver_number = k.driver_number
                              AND p.lap_number = k.lap_start - 1)) AS all_backed
    FROM kept AS k
    JOIN stg_sessions AS s USING (session_key)
    WHERE s.session_type = 'Race' AND k.lap_start BETWEEN 2 AND 3
    GROUP BY k.session_key, k.driver_number
),
garbled AS (
    -- Rule 4: drivers whose stints are still garbled
    SELECT session_key, driver_number FROM kept WHERE lap_end < lap_start           -- (a)
    UNION
    SELECT a.session_key, a.driver_number                                          -- (b)
    FROM kept AS a
    JOIN kept AS b
      ON  b.session_key = a.session_key AND b.driver_number = a.driver_number
      AND a.stint_number < b.stint_number
      AND a.lap_end >= a.lap_start AND b.lap_end >= b.lap_start
      AND a.lap_start <= b.lap_end AND b.lap_start <= a.lap_end
    UNION
    SELECT session_key, driver_number FROM early_changes                            -- (c)
    WHERE changes >= 2 AND NOT all_backed
)
SELECT
    k.session_key,
    k.meeting_key,
    k.driver_number,
    k.stint_number,
    k.lap_start,
    CASE WHEN x.stint_number IS NOT NULL THEN x.last_lap ELSE k.lap_end END AS lap_end,
    k.lap_end                                   AS lap_end_raw,       -- as OpenF1 sent it
    x.stint_number IS NOT NULL                  AS lap_end_inferred,  -- rule 3 applied
    k.compound,
    k.tyre_age_at_start,
    g.driver_number IS NULL                     AS stint_reliable,    -- rule 4
    k.source_file
FROM kept AS k
LEFT JOIN dnf_extend AS x
  ON  x.session_key = k.session_key AND x.driver_number = k.driver_number
  AND x.stint_number = k.stint_number
LEFT JOIN garbled AS g
  ON  g.session_key = k.session_key AND g.driver_number = k.driver_number;
