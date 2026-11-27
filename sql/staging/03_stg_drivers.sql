-- stg_drivers: the drivers taking part in a session, as OpenF1 lists them
--
-- Grain:       one row per driver per session
-- Natural key: (session_key, driver_number)
--              Driver numbers are only unique within a session (a number can
--              move to another driver between seasons), so always join on both.
-- Source:      raw_drivers (one file per session, data/raw/drivers/year=YYYY/)
--
-- Cleaned only: columns listed explicitly, duplicates on the natural key
-- removed. No date columns here. The raw table's `year` column comes from the
-- folder name, not from the API, so it's left out: take the year from
-- stg_sessions. No business logic.

CREATE OR REPLACE TABLE stg_drivers AS
SELECT
    session_key,
    meeting_key,
    driver_number,
    first_name,
    last_name,
    full_name,                  -- upper-case last name, e.g. 'Max VERSTAPPEN'
    broadcast_name,             -- e.g. 'M VERSTAPPEN'
    name_acronym,               -- e.g. 'VER'
    team_name,
    team_colour,                -- hex colour without '#', e.g. '3671C6'
    headshot_url,
    country_code,               -- always null in OpenF1 so far
    source_file
FROM raw_drivers
-- Raw data is stored file by file, so the same driver and session could appear
-- twice (e.g. a session file saved again, or a driver listed twice in one
-- response). Keep exactly one row per (session_key, driver_number): the first
-- by source file, then by load order, so the choice is the same on every build.
QUALIFY ROW_NUMBER() OVER (PARTITION BY session_key, driver_number ORDER BY source_file, rowid) = 1;
