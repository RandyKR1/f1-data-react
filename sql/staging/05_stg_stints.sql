-- stg_stints: a run of consecutive laps on one set of tyres
--
-- Grain:       one row per driver per stint (per session)
-- Natural key: (session_key, driver_number, stint_number)
-- Source:      raw_stints (one file per session, data/raw/stints/year=YYYY/)
--
-- Cleaned only: columns listed explicitly, the placeholder compound 'UNKNOWN'
-- turned into NULL, duplicates on the natural key removed. The raw `year`
-- column comes from the folder name, not the API, so it's left out (take it
-- from stg_sessions). No date columns here.
-- Not fixed here: garbled stints (backwards lap ranges, overlaps) and empty
-- stints are left exactly as sent; they're handled in step 2.11.

CREATE OR REPLACE TABLE stg_stints AS
SELECT
    session_key,
    meeting_key,
    driver_number,
    stint_number,
    lap_start,
    lap_end,
    -- OpenF1 sometimes sends the literal text 'UNKNOWN' instead of a null
    -- (Montréal 2026 Qualifying #81, Mexico City 2026 Race #18). It means
    -- "no compound recorded", the same as a null, so store it as NULL and
    -- every missing compound looks the same. Other values are kept as sent.
    NULLIF(compound, 'UNKNOWN') AS compound,        -- SOFT / MEDIUM / HARD / INTERMEDIATE / WET
    tyre_age_at_start,                              -- laps already on the tyres when the stint began
    source_file
FROM raw_stints
-- Raw data is stored file by file, so the same stint could appear twice (e.g.
-- a session file saved again). Keep exactly one row per (session_key,
-- driver_number, stint_number): the first by source file, then by load order,
-- so the choice is the same on every build.
QUALIFY ROW_NUMBER() OVER (
    PARTITION BY session_key, driver_number, stint_number
    ORDER BY source_file, rowid
) = 1;
