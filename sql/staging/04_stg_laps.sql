-- stg_laps: one lap by one driver, with sector times and speed-trap readings
--
-- Grain:       one row per driver per lap per session
-- Natural key: (session_key, driver_number, lap_number)
-- Source:      raw_laps (one file per session, data/raw/laps/year=YYYY/)
--
-- Cleaned only: columns listed explicitly, date_start as TIMESTAMPTZ,
-- duplicates on the natural key removed. Lap and sector times stay in seconds
-- as sent (null where OpenF1 has none). The raw `year` column comes from the
-- folder name, not the API, so it's left out (take it from stg_sessions).
-- No business logic: garage time in qualifying, red-flag laps and so on are
-- left as they are (see docs/data_quirks.md).

CREATE OR REPLACE TABLE stg_laps AS
SELECT
    session_key,
    meeting_key,
    driver_number,
    lap_number,
    CAST(date_start AS TIMESTAMPTZ) AS date_start,  -- microsecond precision; null on some lap 1s
    lap_duration,                                   -- seconds
    duration_sector_1,                              -- seconds
    duration_sector_2,
    duration_sector_3,
    is_pit_out_lap,
    i1_speed,                                       -- km/h at intermediate 1
    i2_speed,                                       -- km/h at intermediate 2
    st_speed,                                       -- km/h at the speed trap
    segments_sector_1,                              -- list of mini-sector status codes, kept as a list
    segments_sector_2,
    segments_sector_3,
    source_file
FROM raw_laps
-- Raw data is stored file by file, so the same lap could appear twice (e.g. a
-- session file saved again). Keep exactly one row per (session_key,
-- driver_number, lap_number): the first by source file, then by load order,
-- so the choice is the same on every build.
QUALIFY ROW_NUMBER() OVER (
    PARTITION BY session_key, driver_number, lap_number
    ORDER BY source_file, rowid
) = 1;
