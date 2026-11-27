-- stg_race_control: messages from race control (flags, penalties, session status)
--
-- Grain:       one row per race-control message per session
-- Natural key: none. Only fully identical rows are removed.
--   Checked on all 9,136 raw rows (27 November 2026):
--   - (session_key, date) is not unique: 588 repeats. Several messages often
--     share a timestamp (up to 16 at once, e.g. Kuala Lumpur 2026 Race).
--   - (session_key, date, driver_number) can't be a key: driver_number is
--     null for 7,309 rows (track-wide messages).
--   - Even (session_key, date, category, message) repeats once: two "SESSION
--     STARTED" rows at the same moment in Mexico City 2026 Race that differ
--     only in lap_number (null vs 1). They aren't identical, so both are kept.
--   - No fully identical rows exist today; the dedupe below is a guard.
-- Source:      raw_race_control (one file per session,
--              data/raw/race_control/year=YYYY/)
--
-- Cleaned only: columns listed explicitly, date as TIMESTAMPTZ, fully
-- identical rows removed. category, flag, scope, sector, lap_number and
-- qualifying_phase are kept exactly as sent. The raw `year` column comes from
-- the folder name, not the API, so it's left out. No business logic: lap 0
-- (pre-start) messages and red flags that only appear in `message` are left
-- as they are; that's later cleaning (see docs/data_quirks.md).

CREATE OR REPLACE TABLE stg_race_control AS
SELECT
    session_key,
    meeting_key,
    CAST(date AS TIMESTAMPTZ)   AS date,
    category,                   -- e.g. 'Flag', 'SafetyCar', 'Drs', 'SessionStatus', 'Other'
    flag,                       -- e.g. 'GREEN', 'YELLOW', 'RED', 'CHEQUERED', 'BLUE'; null if not a flag
    scope,                      -- 'Track', 'Sector' or 'Driver'
    sector,                     -- mini-sector number for sector-scoped flags
    driver_number,              -- set for driver-specific messages; null otherwise
    lap_number,                 -- races only; can be 0 before the start
    qualifying_phase,           -- 1/2/3 in qualifying; null otherwise
    message,
    source_file
FROM raw_race_control
-- Raw data is stored file by file, so a message could be stored twice (e.g. a
-- session file saved again). With no natural key, only rows identical in
-- every column (other than source_file) are duplicates: keep the first by
-- source file, then by load order, so the choice is the same on every build.
-- PARTITION BY treats nulls as equal, so identical rows with nulls match too.
QUALIFY ROW_NUMBER() OVER (
    PARTITION BY session_key, meeting_key, date, category, flag, scope, sector,
                 driver_number, lap_number, qualifying_phase, message
    ORDER BY source_file, rowid
) = 1;
