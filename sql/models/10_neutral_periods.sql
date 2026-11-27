-- neutral_periods: Safety Car, Virtual Safety Car and red-flag periods
--
-- Grain:       one row per neutralization period per session
-- Natural key: (session_key, period_type, start_time)
-- Built from:  stg_race_control (the messages), stg_laps (lap start times, to
--              find when a Safety Car restart happened)
--
-- Messages used (inventory of stg_race_control, 27 November 2026; counts are
-- all sessions):
--   SC start    'SAFETY CAR DEPLOYED' (category SafetyCar)    2025: 17, 2026: 16
--   SC end      'SAFETY CAR IN THIS LAP'                      2025: 16, 2026: 13
--               The Safety Car comes in at the end of that lap, so the period
--               runs until the leader starts the next lap (the restart): the
--               earliest date_start of lap (end_lap + 1) in the session.
--   VSC start   2025: 'VIRTUAL SAFETY CAR DEPLOYED' (13); 2026: 'VSC DEPLOYED' (25)
--   VSC end     2025: 'VIRTUAL SAFETY CAR ENDING' (13); 2026: 'VSC ENDING' (24).
--               Racing resumes at the 'TRACK CLEAR' that follows (11 s later at
--               Monza and Madrid 2026); without one, at the ENDING message.
--   RED start   flag = 'RED' (2025 races and all qualifying), or a message
--               starting 'RED FLAG - ' (2026 races log 'RED FLAG - RACE
--               SUSPENDED' with no flag value).
--   RED end     the next 'SESSION STARTED' (the resumption). Without one (a
--               session not resumed), the next 'SESSION FINISHED'.
-- A Safety Car or VSC that never gets its end message ends at whatever comes
-- first: a red flag, (for a VSC) a Safety Car, or the chequered flag. E.g.
-- Monza 2026: Safety Car on lap 3, red flag 54 s later.
-- Not periods: 'RACE WILL START BEHIND THE SAFETY CAR' / 'FORMATION LAP...
-- BEHIND (THE) SAFETY CAR' announce a start behind the Safety Car but never
-- log a deployment or an end (Spa 2025: laps 1-4). fct_laps.is_field_slow
-- catches those laps instead.
--
-- Whole-second timestamps: race-control times are truncated to the second.
-- start_time is the logged second (up to 1 s early: harmless for overlap
-- checks), and fct_laps adds 1 s to the end of SC and VSC periods.
-- start_lap / end_lap: the race lap (leader's lap) in the start and end
-- messages. Null in qualifying (no lap numbers) and for red flags shown
-- before the race started (Spa 2025: the stoppage was before lap 1).

CREATE OR REPLACE TABLE neutral_periods AS
WITH events AS (
    SELECT
        session_key,
        date,
        lap_number,
        CASE
            WHEN category = 'SafetyCar' AND message = 'SAFETY CAR DEPLOYED'              THEN 'SC_START'
            WHEN category = 'SafetyCar' AND message = 'SAFETY CAR IN THIS LAP'           THEN 'SC_END'
            WHEN category = 'SafetyCar' AND message IN ('VIRTUAL SAFETY CAR DEPLOYED',
                                                        'VSC DEPLOYED')                  THEN 'VSC_START'
            WHEN category = 'SafetyCar' AND message IN ('VIRTUAL SAFETY CAR ENDING',
                                                        'VSC ENDING')                    THEN 'VSC_END'
            WHEN flag = 'RED' OR message LIKE 'RED FLAG - %'                            THEN 'RED_START'
            WHEN category = 'SessionStatus' AND message = 'SESSION STARTED'             THEN 'RESUMED'
            WHEN category = 'SessionStatus' AND message = 'SESSION FINISHED'            THEN 'FINISHED'
            WHEN flag = 'CHEQUERED'                                                     THEN 'CHEQUERED'
            WHEN flag = 'CLEAR' AND scope = 'Track'                                     THEN 'TRACK_CLEAR'
        END AS event,
        message
    FROM stg_race_control
),
ev AS (
    SELECT * FROM events WHERE event IS NOT NULL
),
first_lap_start AS (
    -- When racing laps began in each session (to tell pre-start red flags apart)
    SELECT session_key, min(date_start) AS first_lap_at
    FROM stg_laps
    GROUP BY session_key
),

-- Safety Car: each deployment, ended by the first of: SC in, red flag, chequered
sc AS (
    SELECT
        s.session_key, s.date AS start_time, s.lap_number AS start_lap,
        (SELECT e FROM (
            SELECT struct_pack(t := x.date, lap := x.lap_number, kind := x.event) AS e
            FROM ev AS x
            WHERE x.session_key = s.session_key AND x.date >= s.date
              AND x.event IN ('SC_END', 'RED_START', 'CHEQUERED')
            ORDER BY x.date
            LIMIT 1)) AS ending
    FROM ev AS s
    WHERE s.event = 'SC_START'
),
-- VSC: each deployment, ended by the first of: VSC ending, SC, red flag, chequered
vsc AS (
    SELECT
        s.session_key, s.date AS start_time, s.lap_number AS start_lap,
        (SELECT e FROM (
            SELECT struct_pack(t := x.date, lap := x.lap_number, kind := x.event) AS e
            FROM ev AS x
            WHERE x.session_key = s.session_key AND x.date >= s.date
              AND x.event IN ('VSC_END', 'SC_START', 'RED_START', 'CHEQUERED')
            ORDER BY x.date
            LIMIT 1)) AS ending
    FROM ev AS s
    WHERE s.event = 'VSC_START'
),
-- Red flag: each red-flag message, ended by the next resumption (or finish)
red_raw AS (
    SELECT
        s.session_key, s.date AS start_time, s.lap_number AS start_lap,
        (SELECT e FROM (
            SELECT struct_pack(t := x.date, lap := x.lap_number, kind := x.event) AS e
            FROM ev AS x
            WHERE x.session_key = s.session_key AND x.date > s.date
              AND x.event IN ('RESUMED', 'FINISHED')
            ORDER BY x.date
            LIMIT 1)) AS ending
    FROM ev AS s
    WHERE s.event = 'RED_START'
),
red AS (
    -- Several red-flag messages before one resumption are one period
    SELECT session_key, min(start_time) AS start_time, arg_min(start_lap, start_time) AS start_lap,
           ending
    FROM red_raw
    GROUP BY session_key, ending
),

periods AS (
    SELECT
        sc.session_key, 'SC' AS period_type, sc.start_time, sc.start_lap,
        CASE WHEN sc.ending.kind = 'SC_END'
             -- restart: the leader starting the lap after "SC IN THIS LAP"
             THEN coalesce((SELECT min(l.date_start) FROM stg_laps AS l
                            WHERE l.session_key = sc.session_key
                              AND l.lap_number = sc.ending.lap + 1), sc.ending.t)
             ELSE sc.ending.t END AS end_time,
        sc.ending.lap  AS end_lap,
        sc.ending.kind AS ended_by
    FROM sc
    UNION ALL
    SELECT
        v.session_key, 'VSC', v.start_time, v.start_lap,
        CASE WHEN v.ending.kind = 'VSC_END'
             -- racing resumes at the TRACK CLEAR that follows (within 60 s)
             THEN coalesce((SELECT min(x.date) FROM ev AS x
                            WHERE x.session_key = v.session_key AND x.event = 'TRACK_CLEAR'
                              AND x.date BETWEEN v.ending.t AND v.ending.t + INTERVAL 60 SECOND),
                           v.ending.t)
             ELSE v.ending.t END,
        v.ending.lap, v.ending.kind
    FROM vsc AS v
    UNION ALL
    SELECT
        r.session_key, 'RED', r.start_time,
        -- lap numbers only when the race had already started
        CASE WHEN r.start_time >= f.first_lap_at THEN r.start_lap END,
        r.ending.t,
        CASE WHEN r.start_time >= f.first_lap_at THEN r.ending.lap END,
        r.ending.kind
    FROM red AS r
    LEFT JOIN first_lap_start AS f USING (session_key)
)
SELECT
    p.session_key,
    s.year,
    s.session_type,
    s.session_name,
    p.period_type,          -- 'SC', 'VSC' or 'RED'
    p.start_time,           -- logged second of the start message
    p.end_time,             -- see the end rules above; null if nothing ended it
    p.start_lap,            -- race lap of the start message (null in qualifying)
    p.end_lap,
    p.ended_by              -- the event that ended it: SC_END, VSC_END, RESUMED, RED_START, ...
FROM periods AS p
JOIN stg_sessions AS s USING (session_key)
ORDER BY p.session_key, p.start_time;
