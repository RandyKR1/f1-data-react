-- stg_position: a driver's live running position, recorded each time it changes
--
-- Grain:       one row per driver per position update per session
-- Natural key: (session_key, date, driver_number)
--              Checked on all 78,339 raw rows (27 November 2026): unique, no
--              nulls. (session_key, date) alone is not: many drivers'
--              positions are updated at the same moment.
-- Source:      raw_position (one file per session, data/raw/position/year=YYYY/)
--
-- Cleaned only: columns listed explicitly, date as TIMESTAMPTZ, duplicates on
-- the natural key removed. The raw `year` column comes from the folder name,
-- not the API, so it's left out. No business logic: stray positions (e.g. 23
-- in a 22-car field) are left as sent; that's later cleaning (see
-- docs/data_quirks.md).

CREATE OR REPLACE TABLE stg_position AS
SELECT
    session_key,
    meeting_key,
    driver_number,
    CAST(date AS TIMESTAMPTZ)   AS date,
    position,
    source_file
FROM raw_position
-- Raw data is stored file by file, so the same update could appear twice
-- (e.g. a session file saved again). Keep exactly one row per (session_key,
-- date, driver_number): the first by source file, then by load order, so the
-- choice is the same on every build.
QUALIFY ROW_NUMBER() OVER (
    PARTITION BY session_key, date, driver_number
    ORDER BY source_file, rowid
) = 1;
