-- stg_overtakes: one driver passing another, as OpenF1 detects it (races only)
--
-- Grain:       one row per overtake per session
-- Natural key: (session_key, date, overtaking_driver_number, overtaken_driver_number)
--              Checked on all 11,295 raw rows (27 November 2026): unique, no
--              nulls. Shorter keys are not: (session_key, date) repeats 1,939
--              times, and adding only the overtaking driver still repeats
--              1,930 times, because one move often passes several cars at
--              once (e.g. at the start or through the pit stops).
-- Source:      raw_overtakes (one file per race, data/raw/overtakes/year=YYYY/)
--
-- Cleaned only: columns listed explicitly, date as TIMESTAMPTZ, duplicates on
-- the natural key removed. The raw `year` column comes from the folder name,
-- not the API, so it's left out. No business logic: "overtakes" that are
-- really pit-stop position changes are left as sent; that's later cleaning.

CREATE OR REPLACE TABLE stg_overtakes AS
SELECT
    session_key,
    meeting_key,
    CAST(date AS TIMESTAMPTZ)   AS date,
    overtaking_driver_number,
    overtaken_driver_number,
    position,                   -- the overtaking driver's new position
    source_file
FROM raw_overtakes
-- Raw data is stored file by file, so the same overtake could appear twice
-- (e.g. a session file saved again). Keep exactly one row per natural key:
-- the first by source file, then by load order, so the choice is the same on
-- every build.
QUALIFY ROW_NUMBER() OVER (
    PARTITION BY session_key, date, overtaking_driver_number, overtaken_driver_number
    ORDER BY source_file, rowid
) = 1;
