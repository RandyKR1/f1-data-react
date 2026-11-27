-- stg_session_result: the official classification of a session, one driver per row
--
-- Grain:       one row per driver per session
-- Natural key: (session_key, driver_number)
-- Source:      raw_session_result (one file per session,
--              data/raw/session_result/year=YYYY/), with session_type from
--              stg_sessions to know how to read each value
--
-- position, duration and gap_to_leader are stored in raw as JSON text, because
-- their shape depends on the session (see docs/data_quirks.md). They're
-- decoded here into typed columns, and the original text is kept as
-- *_raw for traceability. Shapes found in raw (27 November 2026):
--   position       integer; JSON null; or a text code ("RT" = retired,
--                  Marina Bay 2026 Qualifying)
--   Race           duration: seconds (float) or null; gap_to_leader: seconds
--                  (float; the integer 0 for the winner), "+N LAP"/"+N LAPS"
--                  for lapped cars, or null
--   Qualifying     duration and gap_to_leader: [Q1, Q2, Q3] lists of seconds,
--                  with nulls for parts the driver didn't set a time in
-- Sprints have session_type 'Race' and are read the same way. Practice
-- sessions aren't in the data yet (their duration is a best lap, not a race
-- time): their parsed columns would stay null, with the values kept in *_raw.
--
-- Cleaned only: decoding and explicit columns, duplicates on the natural key
-- removed. The raw `year` column comes from the folder name, not the API, so
-- it's left out. No business logic: no positions filled in, no gaps
-- recalculated, no times compared.

CREATE OR REPLACE TABLE stg_session_result AS
SELECT
    r.session_key,
    r.meeting_key,
    r.driver_number,

    -- Classified position, or null (unclassified, DNS, DSQ, or a text code)
    CASE WHEN json_type(r.position) IN ('UBIGINT', 'BIGINT')
         THEN CAST(r.position AS INTEGER) END                           AS position,
    -- Text code sent instead of a position, e.g. 'RT'; null otherwise
    CASE WHEN json_type(r.position) = 'VARCHAR'
         THEN json_extract_string(r.position, '$') END                  AS position_status,

    r.number_of_laps,
    r.dnf,
    r.dns,
    r.dsq,
    r.points,                                                           -- races only

    -- Race: total race time and gap to the winner, in seconds
    CASE WHEN s.session_type = 'Race' AND json_type(r.duration) IN ('DOUBLE', 'UBIGINT', 'BIGINT')
         THEN CAST(r.duration AS DOUBLE) END                            AS duration_seconds,
    CASE WHEN s.session_type = 'Race' AND json_type(r.gap_to_leader) IN ('DOUBLE', 'UBIGINT', 'BIGINT')
         THEN CAST(r.gap_to_leader AS DOUBLE) END                       AS gap_seconds,
    -- Race: laps behind the winner, from text like "+1 LAP" / "+2 LAPS"
    CASE WHEN s.session_type = 'Race' AND json_type(r.gap_to_leader) = 'VARCHAR'
         THEN CAST(regexp_extract(json_extract_string(r.gap_to_leader, '$'),
                                  '^\+(\d+) LAPS?$', 1) AS INTEGER) END AS laps_behind,

    -- Qualifying: best time in each part, in seconds (null if no time set)
    CASE WHEN s.session_type = 'Qualifying'
         THEN CAST(json_extract_string(r.duration, '$[0]') AS DOUBLE) END      AS q1_seconds,
    CASE WHEN s.session_type = 'Qualifying'
         THEN CAST(json_extract_string(r.duration, '$[1]') AS DOUBLE) END      AS q2_seconds,
    CASE WHEN s.session_type = 'Qualifying'
         THEN CAST(json_extract_string(r.duration, '$[2]') AS DOUBLE) END      AS q3_seconds,
    -- Qualifying: gap to the fastest driver in each part, in seconds
    CASE WHEN s.session_type = 'Qualifying'
         THEN CAST(json_extract_string(r.gap_to_leader, '$[0]') AS DOUBLE) END AS q1_gap_seconds,
    CASE WHEN s.session_type = 'Qualifying'
         THEN CAST(json_extract_string(r.gap_to_leader, '$[1]') AS DOUBLE) END AS q2_gap_seconds,
    CASE WHEN s.session_type = 'Qualifying'
         THEN CAST(json_extract_string(r.gap_to_leader, '$[2]') AS DOUBLE) END AS q3_gap_seconds,

    -- Original JSON text, exactly as stored in raw
    r.position      AS position_raw,
    r.duration      AS duration_raw,
    r.gap_to_leader AS gap_to_leader_raw,

    r.source_file
FROM raw_session_result AS r
LEFT JOIN stg_sessions AS s USING (session_key)
-- Raw data is stored file by file, so the same driver's result could appear
-- twice (e.g. a session file saved again). Keep exactly one row per
-- (session_key, driver_number): the first by source file, then by load order,
-- so the choice is the same on every build.
QUALIFY ROW_NUMBER() OVER (
    PARTITION BY r.session_key, r.driver_number
    ORDER BY r.source_file, r.rowid
) = 1;
