-- stg_meetings: OpenF1 meetings (a Grand Prix weekend or a testing event)
--
-- Grain:       one row per meeting
-- Natural key: meeting_key
-- Source:      raw_meetings (one schedule file per year, data/raw/meetings/year=YYYY/)
--
-- Cleaned only: columns listed explicitly, dates as TIMESTAMPTZ, gmt_offset
-- as INTERVAL, duplicates on the natural key removed. No business logic.

CREATE OR REPLACE TABLE stg_meetings AS
SELECT
    meeting_key,
    meeting_name,                                   -- e.g. 'Monaco Grand Prix', 'Pre-Season Testing'
    meeting_official_name,
    CAST(date_start AS TIMESTAMPTZ) AS date_start,  -- API sends ISO 8601 text with a UTC offset
    CAST(date_end   AS TIMESTAMPTZ) AS date_end,
    CAST(gmt_offset AS INTERVAL)    AS gmt_offset,  -- local time offset, e.g. '02:00:00'
    year,
    circuit_key,
    circuit_short_name,
    circuit_type,
    circuit_info_url,
    circuit_image,
    location,                                       -- not stable across seasons; group venues by circuit_key
    country_key,
    country_code,
    country_name,
    country_flag,
    is_cancelled,
    source_file
FROM raw_meetings
-- Raw data is stored file by file, so the same meeting could appear in more
-- than one file (e.g. a season boundary, or a file saved twice). Keep exactly
-- one row per meeting_key: the first by source file, then by load order, so
-- the choice is the same on every build.
QUALIFY ROW_NUMBER() OVER (PARTITION BY meeting_key ORDER BY source_file, rowid) = 1;
