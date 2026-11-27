-- stg_starting_grid: the race starting grid, as set by qualifying
--
-- Grain:       one row per driver per qualifying session
-- Natural key: (session_key, driver_number)
--              OpenF1 files the starting grid under the *qualifying*
--              session's key, not the race's, so session_key here is a
--              Qualifying session (see docs/data_quirks.md). Find the race
--              through the meeting.
-- Source:      raw_starting_grid (one file per qualifying session,
--              data/raw/starting_grid/year=YYYY/)
--
-- Cleaned only: columns listed explicitly, duplicates on the natural key
-- removed. The raw `year` column comes from the folder name, not the API, so
-- it's left out. No date columns here. No business logic (grid penalties and
-- pit-lane starts are as OpenF1 sends them).

CREATE OR REPLACE TABLE stg_starting_grid AS
SELECT
    session_key,                -- the qualifying session's key
    meeting_key,
    driver_number,
    position,                   -- grid slot
    lap_duration,               -- the qualifying lap time behind the grid slot, in seconds
    source_file
FROM raw_starting_grid
-- Raw data is stored file by file, so the same grid slot could appear twice
-- (e.g. a session file saved again). Keep exactly one row per (session_key,
-- driver_number): the first by source file, then by load order, so the choice
-- is the same on every build.
QUALIFY ROW_NUMBER() OVER (
    PARTITION BY session_key, driver_number
    ORDER BY source_file, rowid
) = 1;
