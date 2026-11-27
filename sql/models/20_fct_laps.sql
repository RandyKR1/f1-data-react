-- fct_laps: every lap, with its session, driver and tyre context
--
-- Grain:       one row per driver per lap per session
-- Natural key: (session_key, driver_number, lap_number)
-- Built from:  stg_laps (one row per lap; every lap appears exactly once)
--
-- Join rules (none of them can add or drop a lap):
--   stg_sessions  LEFT JOIN on session_key. session_key is unique in
--                 stg_sessions, so each lap matches at most one session.
--   stg_drivers   LEFT JOIN on session_key AND driver_number. Driver numbers
--                 are only unique within a session, and (session_key,
--                 driver_number) is unique in stg_drivers, so each lap matches
--                 at most one driver. A lap with no driver row keeps nulls.
--   stg_stints    A lap can fall inside zero, one or several stints when the
--                 stint data is garbled (overlapping or backwards lap ranges).
--                 Joining stints directly would repeat such laps, so matches
--                 are first collapsed to one row per lap (stint_matches), and
--                 that is LEFT JOINed on the lap's natural key: at most one row.
--                 A stint matches when lap_start <= lap_number <= lap_end for
--                 the same session and driver. stint_match_count says how many
--                 matched; the stint columns are filled only when exactly one
--                 did, and left null otherwise (no guessing between stints).
--
-- Columns added here:
--   lap_end          date_start + lap_duration seconds (a timestamp; null when
--                    either is null). Not to be confused with a stint's lap_end
--                    (a lap number).
--   tyre_age_on_lap  tyre_age_at_start + (lap_number - lap_start): laps on the
--                    tyres at this lap, counting this one's position in the stint.
-- No cleaning flags yet (pit laps, red flags, garage time): later steps.
-- The segments_sector_* lists stay in stg_laps.

CREATE OR REPLACE TABLE fct_laps AS
WITH stint_matches AS (
    -- One row per lap that falls inside at least one stint
    SELECT
        l.session_key,
        l.driver_number,
        l.lap_number,
        count(*) AS stint_match_count,
        -- With exactly one match, min() is just that stint's value
        CASE WHEN count(*) = 1 THEN min(st.stint_number) END                 AS stint_number,
        CASE WHEN count(*) = 1 THEN min(st.compound) END                     AS compound,
        CASE WHEN count(*) = 1
             THEN min(st.tyre_age_at_start + l.lap_number - st.lap_start) END AS tyre_age_on_lap
    FROM stg_laps AS l
    JOIN stg_stints AS st
      ON  st.session_key   = l.session_key
      AND st.driver_number = l.driver_number
      AND l.lap_number BETWEEN st.lap_start AND st.lap_end
    GROUP BY l.session_key, l.driver_number, l.lap_number
)
SELECT
    -- Session
    l.session_key,
    s.meeting_key,
    s.year,
    s.session_name,
    s.session_type,

    -- Driver (from the same session's driver list)
    l.driver_number,
    d.name_acronym,
    d.team_name,
    d.team_colour,

    -- Lap
    l.lap_number,
    l.date_start,
    l.date_start + to_microseconds(CAST(round(l.lap_duration * 1000000) AS BIGINT)) AS lap_end,
    l.lap_duration,
    l.duration_sector_1,
    l.duration_sector_2,
    l.duration_sector_3,
    l.is_pit_out_lap,
    l.i1_speed,
    l.i2_speed,
    l.st_speed,

    -- Tyres (null unless exactly one stint matched)
    m.stint_number,
    m.compound,
    m.tyre_age_on_lap,
    coalesce(m.stint_match_count, 0) AS stint_match_count
FROM stg_laps AS l
LEFT JOIN stg_sessions AS s
  ON s.session_key = l.session_key
LEFT JOIN stg_drivers AS d
  ON  d.session_key   = l.session_key
  AND d.driver_number = l.driver_number
LEFT JOIN stint_matches AS m
  ON  m.session_key   = l.session_key
  AND m.driver_number = l.driver_number
  AND m.lap_number    = l.lap_number;
