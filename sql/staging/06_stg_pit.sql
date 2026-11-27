-- stg_pit: one pass through the pit lane by one driver
--
-- Grain:       one row per pit-lane pass per driver per session
-- Natural key: (session_key, driver_number, lap_number)
--   Why lap_number and not the timestamp: a car can only enter the pit lane
--   once per lap (the lap ends as it rejoins), so the lap identifies the stop
--   in race terms, and it's the column other tables join on. Checked on all
--   4,376 raw rows (2025-2026 races and qualifying, 27 November 2026): no
--   driver has two pit rows on the same lap in the same session. `date` is
--   unique too, but a sub-second timestamp is a fragile key to join on.
-- Source:      raw_pit (one file per session, data/raw/pit/year=YYYY/)
--
-- Cleaned only: columns listed explicitly, date as TIMESTAMPTZ, the
-- deprecated pit_duration dropped, duplicates on the natural key removed.
-- The raw `year` column comes from the folder name, not the API, so it's left
-- out (take it from stg_sessions). No business logic.

CREATE OR REPLACE TABLE stg_pit AS
SELECT
    session_key,
    meeting_key,
    driver_number,
    lap_number,
    CAST(date AS TIMESTAMPTZ) AS date,  -- when the car entered the pit lane; microsecond precision
    lane_duration,                      -- seconds from pit entry to pit exit
    stop_duration,                      -- seconds stationary; empty in qualifying and before late 2024
    -- pit_duration is left out: OpenF1 marks it deprecated, and it equals
    -- lane_duration in every raw row.
    source_file
FROM raw_pit
-- Raw data is stored file by file, so the same pit stop could appear twice
-- (e.g. a session file saved again). Keep exactly one row per (session_key,
-- driver_number, lap_number): the first by source file, then by load order,
-- so the choice is the same on every build.
QUALIFY ROW_NUMBER() OVER (
    PARTITION BY session_key, driver_number, lap_number
    ORDER BY source_file, rowid
) = 1;
