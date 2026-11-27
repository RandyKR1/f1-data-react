-- stg_weather: track-side weather readings, about one a minute
--
-- Grain:       one row per weather reading per session
-- Natural key: (session_key, date)
--              Checked on all 11,133 raw rows (27 November 2026): unique, no
--              nulls.
-- Source:      raw_weather (one file per session, data/raw/weather/year=YYYY/)
--
-- Cleaned only: columns listed explicitly, date as TIMESTAMPTZ, rainfall as
-- BOOLEAN, duplicates on the natural key removed. The raw `year` column comes
-- from the folder name, not the API, so it's left out. No business logic.

CREATE OR REPLACE TABLE stg_weather AS
SELECT
    session_key,
    meeting_key,
    CAST(date AS TIMESTAMPTZ)   AS date,
    air_temperature,                        -- °C
    track_temperature,                      -- °C
    humidity,                               -- %
    pressure,                               -- mbar
    wind_speed,                             -- m/s
    wind_direction,                         -- degrees, 0-359
    -- OpenF1 sends rainfall as the number 0 or 1 (only those two values in
    -- raw). It's a yes/no flag, so store it as BOOLEAN: 1 -> true, 0 -> false.
    CAST(rainfall AS BOOLEAN)   AS rainfall,
    source_file
FROM raw_weather
-- Raw data is stored file by file, so the same reading could appear twice
-- (e.g. a session file saved again). Keep exactly one row per (session_key,
-- date): the first by source file, then by load order, so the choice is the
-- same on every build.
QUALIFY ROW_NUMBER() OVER (
    PARTITION BY session_key, date
    ORDER BY source_file, rowid
) = 1;
