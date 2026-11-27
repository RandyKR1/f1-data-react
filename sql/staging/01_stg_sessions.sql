-- stg_sessions: OpenF1 sessions (practice, qualifying, sprint, race, testing days)
--
-- Grain:       one row per session
-- Natural key: session_key
-- Source:      raw_sessions (one schedule file per year, data/raw/sessions/year=YYYY/)
--
-- Cleaned only: columns listed explicitly, dates as TIMESTAMPTZ, gmt_offset
-- as INTERVAL, duplicates on the natural key removed. No business logic.

CREATE OR REPLACE TABLE stg_sessions AS
SELECT
    session_key,
    meeting_key,
    session_name,                                   -- e.g. 'Race', 'Qualifying', 'Sprint', 'Day 1'
    session_type,                                   -- 'Practice' / 'Qualifying' / 'Race' (sprints are 'Race')
    CAST(date_start AS TIMESTAMPTZ) AS date_start,  -- API sends ISO 8601 text with a UTC offset
    CAST(date_end   AS TIMESTAMPTZ) AS date_end,
    CAST(gmt_offset AS INTERVAL)    AS gmt_offset,  -- local time offset, e.g. '-03:00:00'
    year,
    circuit_key,
    circuit_short_name,
    location,                                       -- not stable across seasons; group venues by circuit_key
    country_key,
    country_code,
    country_name,
    is_cancelled,
    source_file
FROM raw_sessions
-- Raw data is stored file by file, so the same session could appear in more
-- than one file (e.g. listed in two years' schedules, or a file saved twice).
-- Keep exactly one row per session_key: the first by source file, then by
-- load order, so the choice is the same on every build.
QUALIFY ROW_NUMBER() OVER (PARTITION BY session_key ORDER BY source_file, rowid) = 1;
