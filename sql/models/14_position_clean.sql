-- position_clean: live running positions, without impossible positions
--
-- Grain:       one row per driver per position update per session
-- Natural key: (session_key, date, driver_number), as in stg_position
-- Built from:  stg_position (78,339 rows), stg_drivers
--
-- Rule: remove rows whose position is larger than the number of drivers in
-- the session (or whose driver isn't in the session).
-- Evidence (27 November 2026): 5 rows show P23 in 22-car races (Melbourne
-- 2026 #27, Monte Carlo 2026 #43 and #16, Barcelona 2026 #55, Marina Bay
-- 2026 #10). Each is replaced by a valid position for the same driver at the
-- same instant (0.0 s later: 22, 14, 16, 13 and 10), so they're transient
-- glitches. No position rows belong to drivers outside the session.

CREATE OR REPLACE TABLE position_clean AS
WITH field AS (
    SELECT session_key, count(*) AS drivers
    FROM stg_drivers
    GROUP BY session_key
)
SELECT p.*
FROM stg_position AS p
JOIN field AS f USING (session_key)
WHERE p.position <= f.drivers
  AND EXISTS (SELECT 1 FROM stg_drivers AS d
              WHERE d.session_key = p.session_key AND d.driver_number = p.driver_number);
