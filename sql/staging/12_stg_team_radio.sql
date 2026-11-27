-- stg_team_radio: team radio clips published by F1 (links to MP3 files)
--
-- Grain:       one row per radio clip per session
-- Natural key: (session_key, date, driver_number)
--              Checked on all 1,827 raw rows (27 November 2026): unique, no
--              nulls. (session_key, date) alone is not (104 repeats: clips
--              from different drivers at the same moment). recording_url is
--              unique too, but the timestamp and driver match the other
--              tables' keys.
-- Source:      raw_team_radio (one file per session,
--              data/raw/team_radio/year=YYYY/)
--
-- Cleaned only: columns listed explicitly, date as TIMESTAMPTZ, duplicates on
-- the natural key removed. The raw `year` column comes from the folder name,
-- not the API, so it's left out. No business logic.

CREATE OR REPLACE TABLE stg_team_radio AS
SELECT
    session_key,
    meeting_key,
    driver_number,
    CAST(date AS TIMESTAMPTZ)   AS date,
    recording_url,
    source_file
FROM raw_team_radio
-- Raw data is stored file by file, so the same clip could appear twice (e.g.
-- a session file saved again). Keep exactly one row per (session_key, date,
-- driver_number): the first by source file, then by load order, so the choice
-- is the same on every build.
QUALIFY ROW_NUMBER() OVER (
    PARTITION BY session_key, date, driver_number
    ORDER BY source_file, rowid
) = 1;
