-- lap_deletions: race-control lap-time deletions and reinstatements, matched to laps
--
-- Grain:       one row per deletion or reinstatement message
-- Natural key: (session_key, date, message). Messages are unique per session
--              and second (fully identical rows are already removed in staging).
-- Built from:  stg_race_control (messages starting 'CAR ' that contain
--              'DELETED' or 'WILL BE REINSTATED'), stg_laps, stg_drivers
--
-- Message formats (inventory, 27 November 2026; 1,170 messages):
--   CAR 1 (VER) TIME 1:15.945 DELETED - TRACK LIMITS AT TURN 14 LAP 14 16:45:49
--   CAR 1 (VER) LAP DELETED - TRACK LIMITS AT TURN 14 LAP 2 20:03:28 (PIT)
--   CAR 12 (ANT) TIME 1:58.613 DELETED - DOUBLE YELLOW AT TURN 15         (no lap)
--   CAR 10 (GAS) LAP DELETED - TRACK LIMITS AT TURN 10 (NEXT LAP PIT)     (no lap, no time)
--   CAR LEC TIME 1:36.518 DELETED - TRACK LIMITS AT TURN 14 (NEXT LAP) (Q1)  (acronym only)
--   CAR 43 (COL) TIME 1:39.173 WILL BE REINSTATED
--   CAR 55 (SAI) LAP 1 WILL BE REINSTATED
-- Parsed: driver_number (the number, or the acronym looked up in that
-- session's stg_drivers), deleted_time (M:SS.mmm -> seconds), msg_lap.
--
-- Lap-number convention, checked on all messages with both a lap and a time:
--   Races: msg_lap is the driver's OpenF1 lap. The deleted time equals that
--     lap's lap_duration for 298 of 300 (2025) and 348 of 349 (2026) messages,
--     and the offence clock time falls inside that lap for 701 of 712.
--   Qualifying: msg_lap is ONE MORE than the OpenF1 lap. The time never equals
--     lap msg_lap's duration, but equals lap (msg_lap - 1)'s for 225 of 231; the
--     offence time falls inside lap (msg_lap - 1) for 351 messages and inside
--     lap msg_lap for none.
-- Matching (matched_lap, match_method):
--   1. target lap = msg_lap (races) or msg_lap - 1 (qualifying).
--   2. 'lap_and_time': the target lap exists and its lap_duration equals the
--      message's time (to the millisecond).
--      'time': the message has a time that equals exactly one of the driver's
--      laps, and either there's no lap number or the target lap's time differs.
--      'lap': the target lap exists and the message has no time (or no lap
--      matches the time).
--   3. Otherwise unmatched (matched_lap null): no lap number and no usable time.
--   Reinstatements ('deletion'): matched to the lap of the latest earlier
--   deletion for the same driver with the same time (or, for "LAP N WILL BE
--   REINSTATED", the same lap). A time alone can be ambiguous: Leclerc set
--   1:40.101 on both lap 26 and lap 38 at Las Vegas 2026; the reinstatement
--   undoes the lap-38 deletion. All 7 reinstatements have such a deletion.

CREATE OR REPLACE TABLE lap_deletions AS
WITH msgs AS (
    SELECT
        r.session_key,
        s.session_type,
        s.year,
        r.date,
        r.message,
        CASE WHEN r.message LIKE '%WILL BE REINSTATED%' THEN 'reinstated' ELSE 'deleted' END AS action,
        CASE WHEN r.message LIKE '%DOUBLE YELLOW%' THEN 'double yellow'
             WHEN r.message LIKE '%TRACK LIMITS%'  THEN 'track limits' END              AS reason,
        coalesce(
            TRY_CAST(regexp_extract(r.message, '^CAR (\d+)', 1) AS INTEGER),
            -- 'CAR LEC ...': look the acronym up in the same session's drivers
            (SELECT d.driver_number FROM stg_drivers AS d
             WHERE d.session_key = r.session_key
               AND d.name_acronym = regexp_extract(r.message, '^CAR ([A-Z]{3}) ', 1))) AS driver_number,
        CASE WHEN regexp_matches(r.message, 'TIME \d+:\d+\.\d+')
             THEN CAST(regexp_extract(r.message, 'TIME (\d+):(\d+\.\d+)', 1) AS INTEGER) * 60
                  + CAST(regexp_extract(r.message, 'TIME (\d+):(\d+\.\d+)', 2) AS DOUBLE) END AS deleted_time,
        TRY_CAST(regexp_extract(r.message, ' LAP (\d+)', 1) AS INTEGER)               AS msg_lap
    FROM stg_race_control AS r
    JOIN stg_sessions AS s USING (session_key)
    WHERE r.message LIKE 'CAR %'
      AND (r.message LIKE '%DELETED%' OR r.message LIKE '%WILL BE REINSTATED%')
),
targets AS (
    SELECT
        m.*,
        CASE WHEN m.session_type = 'Qualifying' THEN m.msg_lap - 1 ELSE m.msg_lap END AS target_lap
    FROM msgs AS m
),
with_laps AS (
    SELECT
        t.*,
        tl.lap_number   AS target_exists,
        tl.lap_duration AS target_duration,
        -- the driver's single lap whose time equals the message's time, if any
        (SELECT CASE WHEN count(*) = 1 THEN min(l.lap_number) END
         FROM stg_laps AS l
         WHERE l.session_key = t.session_key AND l.driver_number = t.driver_number
           AND abs(l.lap_duration - t.deleted_time) < 0.0005)                       AS time_lap
    FROM targets AS t
    LEFT JOIN stg_laps AS tl
      ON tl.session_key = t.session_key AND tl.driver_number = t.driver_number
     AND tl.lap_number = t.target_lap
),
matched AS (
SELECT
    session_key,
    session_type,
    year,
    date,
    action,                 -- 'deleted' or 'reinstated'
    reason,                 -- 'track limits', 'double yellow' or null
    driver_number,
    deleted_time,           -- seconds, if the message gives a time
    msg_lap,                -- the LAP number in the message, as written
    CASE
        WHEN target_exists IS NOT NULL AND abs(target_duration - deleted_time) < 0.0005 THEN target_lap
        WHEN time_lap IS NOT NULL THEN time_lap
        WHEN target_exists IS NOT NULL THEN target_lap
    END AS matched_lap,     -- the OpenF1 lap_number in stg_laps / fct_laps
    CASE
        WHEN target_exists IS NOT NULL AND abs(target_duration - deleted_time) < 0.0005 THEN 'lap_and_time'
        WHEN time_lap IS NOT NULL THEN 'time'
        WHEN target_exists IS NOT NULL THEN 'lap'
    END AS match_method,
    message
FROM with_laps
),
undone AS (
    -- For each reinstatement, the lap of the latest earlier matching deletion
    SELECT r.session_key, r.date, r.message,
           arg_max(d.matched_lap, d.date) AS lap
    FROM matched AS r
    JOIN matched AS d
      ON  d.session_key = r.session_key AND d.driver_number = r.driver_number
      AND d.action = 'deleted' AND d.date < r.date AND d.matched_lap IS NOT NULL
      AND (abs(d.deleted_time - r.deleted_time) < 0.0005
           OR (r.deleted_time IS NULL AND d.matched_lap = r.matched_lap))
    WHERE r.action = 'reinstated'
    GROUP BY r.session_key, r.date, r.message
)
SELECT
    m.session_key, m.session_type, m.year, m.date, m.action, m.reason,
    m.driver_number, m.deleted_time, m.msg_lap,
    CASE WHEN m.action = 'reinstated' THEN coalesce(u.lap, m.matched_lap) ELSE m.matched_lap END AS matched_lap,
    CASE WHEN m.action = 'reinstated' AND u.lap IS NOT NULL THEN 'deletion' ELSE m.match_method END AS match_method,
    m.message
FROM matched AS m
LEFT JOIN undone AS u USING (session_key, date, message)
ORDER BY m.session_key, m.date;
