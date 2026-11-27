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
--   stg_pit       Reduced to one row per (session_key, driver_number,
--                 lap_number) with DISTINCT (pit_in_laps), then LEFT JOINed on
--                 the lap's natural key: at most one row per lap.
--   stg_session_result  LEFT JOIN on (session_key, driver_number), unique in
--                 stg_session_result: at most one result per lap.
--   chequered     One row per session (the last CHEQUERED flag in
--                 stg_race_control, GROUP BY session_key), LEFT JOINed on
--                 session_key: at most one row per lap.
--
-- Columns added here:
--   lap_end_time     date_start + lap_duration seconds (a timestamp; null when
--                    either is null). Named _time so it isn't confused with a
--                    stint's lap_end (a lap number).
--   tyre_age_on_lap  tyre_age_at_start + (lap_number - lap_start): laps on the
--                    tyres at this lap, counting this one's position in the stint.
--   is_pit_in_lap    The lap ended in the pit lane (races only; see below).
--   is_pit_lap       is_pit_in_lap OR is_pit_out_lap. SQL's three-valued OR:
--                    true for any out-lap, unknown (null) where is_pit_in_lap
--                    is unknown and the lap isn't an out-lap.
--   is_pit_out_lap is kept exactly as OpenF1 sends it.
--
-- Pit convention, checked against every stg_pit row (27 November 2026):
--   Races: pit.lap_number is the IN-lap. The driver's next lap
--     (lap_number + 1) is an OpenF1 pit-out lap for 817 of 821 pit rows in
--     2025 (99.5%) and 845 of 863 in 2026 (97.9%). The 22 exceptions all have
--     known causes: missing lap data (Miami 2025, 4), stops under a Safety Car
--     (Melbourne 2026 lap 46, 5), pit rows numbered with the wrong lap
--     (Melbourne 2026 "lap 18" rows timed when the race was on lap 26, 3),
--     a pit row after the driver's last lap (1), and pit-lane starts (Mexico
--     City 2026 lap 1, 9).
--     The pit-lane starts are the only race pit rows with no lane_duration,
--     and their lap 1 is already a pit-out lap, so they aren't stops: rows
--     with a null lane_duration are not used as in-laps.
--   Qualifying: the in-lap reading does NOT hold (next lap is an out-lap for
--     only 2.5% / 11.2% of rows). There, pit.lap_number is the OUT-lap itself
--     (94.8% in 2025, 81.2% in 2026): a qualifying pit row records a garage
--     visit, numbered by the lap the car goes out on. So is_pit_in_lap is null
--     (unknown) for qualifying, and for any session with no pit data at all.
--
-- is_lap1: true only for lap 1 of a Race session (sprints included), the
-- standing start, which runs slower than racing laps (median 100.7 s against
-- 98.1 s on lap 2). False in qualifying: there, all 918 lap 1s are garage
-- out-laps (is_pit_out_lap) and 808 of them have no lap time, so a lap-1 flag
-- would only repeat is_pit_out_lap. Lap 1 never counts as "after finish".
--
-- is_after_finish: the lap started after the driver's race or session was
-- over (cool-down / in-laps after the flag). Evidence (27 November 2026):
--   Signal A, lap_number > number_of_laps (from stg_session_result), is wrong
--     on its own: it marks 132 DNF retirement laps and 11 DNS laps (laps that
--     were never completed, not laps after the finish), and in qualifying
--     number_of_laps counts in- and out-laps (so it misses all 240 laps after
--     the final flag) and is 0 for drivers whose times were deleted (69 laps).
--   Signal B, date_start >= the last CHEQUERED flag, is right but race-control
--     times are truncated to whole seconds, so it can miss a cool-down lap that
--     starts within a second of the flag (Spa-Francorchamps 2026 Race #12 lap
--     45 started at 14:28:35.029, flag logged at 14:28:36).
--   Rule:
--     Race:       B, OR (A for drivers still running at the end, i.e. not
--                 dnf, dns or dsq). Catches Norris Melbourne 2025 lap 58
--                 (both signals) and the Spa case (A only).
--     Qualifying: B only, with the session's last chequered flag (end of Q3).
--   Laps with no date_start (some lap 1s) or sessions with no chequered flag
--   fall back to what's known: false unless A applies.
-- No other cleaning flags yet (red flags, garage time): later steps.
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
),
pit_sessions AS (
    -- Race sessions that have pit data, so a missing pit row means "no stop"
    SELECT DISTINCT p.session_key
    FROM stg_pit AS p
    JOIN stg_sessions AS s USING (session_key)
    WHERE s.session_type = 'Race'
),
pit_in_laps AS (
    -- Race in-laps: one row per lap that ended in the pit lane. Pit-lane
    -- starts (no lane_duration) aren't stops and are left out.
    SELECT DISTINCT p.session_key, p.driver_number, p.lap_number
    FROM stg_pit AS p
    JOIN pit_sessions USING (session_key)
    WHERE p.lane_duration IS NOT NULL
),
chequered AS (
    -- When the session ended: the last chequered flag (qualifying shows one per
    -- part; the last is the end of Q3). One row per session.
    SELECT session_key, max(date) AS chequered_at
    FROM stg_race_control
    WHERE flag = 'CHEQUERED'
    GROUP BY session_key
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
    l.date_start + to_microseconds(CAST(round(l.lap_duration * 1000000) AS BIGINT)) AS lap_end_time,
    l.lap_duration,
    l.duration_sector_1,
    l.duration_sector_2,
    l.duration_sector_3,
    l.is_pit_out_lap,                                   -- as sent by OpenF1
    CASE WHEN ps.session_key IS NOT NULL
         THEN pi.lap_number IS NOT NULL END AS is_pit_in_lap,   -- null: unknown
    (CASE WHEN ps.session_key IS NOT NULL
          THEN pi.lap_number IS NOT NULL END) OR l.is_pit_out_lap AS is_pit_lap,
    s.session_type = 'Race' AND l.lap_number = 1 AS is_lap1,
    CASE
        WHEN s.session_type = 'Race' THEN
            coalesce(l.date_start >= ch.chequered_at, false)
            OR coalesce(l.lap_number > r.number_of_laps
                        AND NOT (coalesce(r.dnf, false) OR coalesce(r.dns, false) OR coalesce(r.dsq, false)), false)
        WHEN s.session_type = 'Qualifying' THEN
            coalesce(l.date_start >= ch.chequered_at, false)
    END AS is_after_finish,
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
  AND m.lap_number    = l.lap_number
LEFT JOIN pit_sessions AS ps
  ON ps.session_key = l.session_key
LEFT JOIN pit_in_laps AS pi
  ON  pi.session_key   = l.session_key
  AND pi.driver_number = l.driver_number
  AND pi.lap_number    = l.lap_number
LEFT JOIN stg_session_result AS r
  ON  r.session_key   = l.session_key
  AND r.driver_number = l.driver_number
LEFT JOIN chequered AS ch
  ON ch.session_key = l.session_key;
