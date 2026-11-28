-- pit_clean: pit-lane passes, without rows for cars not in the session
--
-- Grain:       one row per pit-lane pass per driver per session
-- Natural key: (session_key, driver_number, lap_number), as in stg_pit
-- Built from:  stg_pit (4,376 rows), stg_drivers
--
-- Rule: remove pit rows whose driver isn't in the session's stg_drivers.
-- Evidence (27 November 2026): 1 row, car #236 in Mexico City 2026
-- Qualifying (lap 1, lane 40.4 s); there is no #236 in any session's drivers.
-- Everything else is kept as staged (see stg_pit for the columns).

CREATE OR REPLACE TABLE pit_clean AS
SELECT p.*
FROM stg_pit AS p
WHERE EXISTS (SELECT 1 FROM stg_drivers AS d
              WHERE d.session_key = p.session_key AND d.driver_number = p.driver_number);
