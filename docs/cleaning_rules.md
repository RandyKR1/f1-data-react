# Cleaning rules (Step 2 reference)

Every rule applied when building the modelled tables in `data/f1.duckdb`,
with the data evidence behind it. The SQL files carry the same reasoning in
comments. Raw data (`data/raw/`, the `raw_*` tables) is never changed.
Evidence was measured on 27 November 2026 (2025-2026 Race and Qualifying).

How rules are added: see "Cleaning conventions" in `CLAUDE.md`. Background on
the data itself: `docs/data_quirks.md`.

## Build

`python pipeline/build.py` runs `load.py` (raw Parquet → `raw_*` tables), then
every file in `sql/staging/` and then `sql/models/`, each in filename order.
`--no-load` reruns only the SQL. The DuckDB session runs in UTC.

| Layer | Tables |
|---|---|
| Staging (01-13) | `stg_sessions`, `stg_meetings`, `stg_drivers`, `stg_laps`, `stg_stints`, `stg_pit`, `stg_session_result`, `stg_starting_grid`, `stg_weather`, `stg_race_control`, `stg_position`, `stg_team_radio`, `stg_overtakes` |
| Models (10-20) | `neutral_periods`, `stints_clean`, `pit_clean`, `position_clean`, `lap_deletions`, `fct_laps` |

Reference sessions, used to report flag counts on every change:

| session_key | Session |
|---|---|
| 9693 | 2025 Melbourne Race (wet, garbled stints) |
| 9939 | 2025 Spa-Francorchamps Race (start behind the Safety Car) |
| 11361 | 2026 Monza Race (SC, red flag, VSC) |
| 11369 | 2026 Madrid Race (VSC) |
| 11384 | 2026 Marina Bay Qualifying (`position = "RT"`) |

## Rows removed (all of Step 2)

| Table | From | Removed | Why |
|---|---|---|---|
| all `stg_*` | raw | 0 | Duplicates on the natural key (none exist today) |
| `stints_clean` | `stg_stints` 7,002 | 26 → 6,976 | 12 stints for cars not in the session (Spielberg 2025 Qualifying); 14 zero-length stints (`lap_end = lap_start − 1`) |
| `pit_clean` | `stg_pit` 4,376 | 1 → 4,375 | Car #236, Mexico City 2026 Qualifying: not in any session's drivers |
| `position_clean` | `stg_position` 78,339 | 5 → 78,334 | P23 in 22-car races, each replaced by a valid position at the same instant |
| `fct_laps` | `stg_laps` 65,106 | 0 | Laps are only flagged, never removed |

Left as they are: the race-control lap-0 message (1 row, Melbourne 2026
Race, "PINK HEAD PADDING MATERIAL MUST BE USED"). Pre-start messages can carry
lap 0; it's correct, and nothing filters on race-control lap numbers below 1.

## Staging (`sql/staging/`, one table per raw table)

Staging only cleans types and duplicates; no business logic.

| Rule | Tables | Evidence |
|---|---|---|
| Deduplicate on the natural key with `QUALIFY ROW_NUMBER()`, keeping the first row by `source_file`, then load order | all | Raw is stored file by file, so a key could repeat if a file is saved twice. 0 duplicates today. |
| `stg_race_control` has no natural key; only rows identical in every column are removed | race_control | `(session_key, date)` repeats 588 times; `driver_number` is null for 7,309 track-wide messages; even `(session_key, date, category, message)` repeats once (two rows differing only in `lap_number`). |
| Natural keys of the other event tables | weather `(session_key, date)`; position and team_radio `(session_key, date, driver_number)`; overtakes `(session_key, date, overtaking, overtaken)`; pit `(session_key, driver_number, lap_number)` | Each checked unique with no nulls on all raw rows. |
| Date columns cast to `TIMESTAMPTZ`; `gmt_offset` to `INTERVAL` | all with dates | ISO 8601 text with a UTC offset; every cast checked equal to the raw text. |
| Folder-only `year` columns dropped | per-session tables | They come from the folder name, not the API. Take the year from `stg_sessions`. |
| `compound = 'UNKNOWN'` → NULL | stints | Literal placeholder for "no compound recorded" (2 rows: Montréal 2026 Qualifying #81, Mexico City 2026 Race #18). |
| `rainfall` 0/1 → BOOLEAN | weather | Only 0 and 1 occur (10,637 / 496). |
| `pit_duration` dropped | pit | Deprecated by OpenF1 and equal to `lane_duration` in every row. |
| `session_result` JSON text decoded by `session_type` into typed columns (`position`, `position_status`, race `duration_seconds` / `gap_seconds` / `laps_behind`, qualifying `q1-q3_seconds` / `q1-q3_gap_seconds`); original text kept as `*_raw` | session_result | Inventory of all 1,877 rows (`data_quirks.md`, "session_result odd rows"). Checked against an independent JSON parse: 7,194 values, 0 lost, 0 different. |

## `neutral_periods` (`sql/models/10_neutral_periods.sql`)

One row per Safety Car, VSC or red-flag period (102 rows: SC 33, VSC 38, RED 31,
of which 26 are in qualifying). Key `(session_key, period_type, start_time)`.

| Rule | Evidence |
|---|---|
| SC: from "SAFETY CAR DEPLOYED" to the leader's start of the lap after "SAFETY CAR IN THIS LAP" (the restart) | Same wording both seasons (deployed 17 / 16, in 16 / 13). The Safety Car comes in at the end of the announced lap. |
| VSC: from "VIRTUAL SAFETY CAR DEPLOYED" (2025) / "VSC DEPLOYED" (2026) to the "TRACK CLEAR" after the ENDING message (within 60 s), else the ENDING message | The wording changed between seasons (13 / 25 deployments). TRACK CLEAR follows ENDING by 11 s at Monza and Madrid 2026. |
| RED: from `flag = 'RED'` or a message starting "RED FLAG - " to the next "SESSION STARTED" (else "SESSION FINISHED") | 2025 races and all qualifying use `flag = 'RED'`; 2026 races log only "RED FLAG - RACE SUSPENDED" (4), with no flag value. Several red-flag messages before one resumption form one period. |
| A period with no end message ends at the first of: red flag, (for a VSC) Safety Car, chequered flag | Monza 2026: SC on lap 3, red flag 54 s later. 3 SCs end with a red flag, 1 at the chequered flag, 1 VSC with an SC. |
| `start_lap` / `end_lap` from the messages' lap_number; null in qualifying and for red flags before the race started | Spa 2025's red flag was before lap 1. |

## `stints_clean` (`sql/models/12_stints_clean.sql`)

One row per driver per stint; key `(session_key, driver_number, stint_number)`.

Checks on `stg_stints` before any rule: cars not in the session 12 (Spielberg
2025 Qualifying); zero-length 14 (Monaco 2025 4, Melbourne 2025 4, Monte Carlo
2026 3, Kuala Lumpur 2026 2, Montréal 2026 1; mostly "stint 1: laps 1-0", a
tyre change on the grid); backwards 1 (Melbourne 2025 #30, laps 3-1);
overlapping 1 driver (Melbourne 2025 #30, stints 2 and 4); gaps, first stint
not on lap 1, null lap ranges: none.

| Rule | Evidence |
|---|---|
| Remove stints for cars not in the session's drivers (12) | Numbers 2-25 in Spielberg 2025 Qualifying that aren't driver numbers. |
| Remove zero-length stints (14) | They cover no lap. |
| Extend a DNF driver's last stint by one lap when it ends exactly one lap before their last recorded lap; `lap_end_raw` keeps OpenF1's value, `lap_end_inferred = true` | OpenF1 leaves a retiring driver's final lap out of every stint: 117 laps, one per such DNF driver. |
| `stint_reliable = false` for every stint of a driver whose stints are still garbled: (a) a backwards stint, (b) two stints sharing a lap, or (c) in races, two or more stint changes in laps 1-3 not all backed by a pit in-lap on the lap before. Nothing is repaired | (c) separates the wet-start garbling (one-lap "stints" on laps 1-3, jumping tyre ages, pit rows that don't line up) from genuine early double stops backed by pit rows on both laps (Baku 2025 #31, Spa 2026 #6, Kuala Lumpur 2026 #11). Result: 26 drivers, all in Melbourne 2025 (17) and Kuala Lumpur 2026 (9). Not used: "compound change without a pit stop", which is confounded by missing or mis-numbered pit data (Miami 2025, Melbourne 2026) and Spa 2025's lap-1 compound records. |

## `pit_clean` and `position_clean` (`sql/models/13_…`, `14_…`)

| Rule | Evidence |
|---|---|
| `pit_clean`: remove pit rows for cars not in the session's drivers (1) | #236, Mexico City 2026 Qualifying (lap 1, lane 40.4 s). |
| `position_clean`: remove positions larger than the session's number of drivers, or for cars not in the session (5) | 5 rows of P23 in 22-car races (Melbourne 2026 #27, Monte Carlo 2026 #43 and #16, Barcelona 2026 #55, Marina Bay 2026 #10), each replaced by a valid position for the same driver at the same instant. No rows for cars outside the session. |

## `lap_deletions` (`sql/models/15_lap_deletions.sql`)

One row per lap-deletion or reinstatement message (1,152: 1,145 deletions,
7 reinstatements), parsed and matched to an OpenF1 lap.

| Rule | Evidence |
|---|---|
| Parse driver (number, or the 3-letter code looked up in the session's drivers), deleted time (M:SS.mmm → s) and lap number from the message | All 1,152 messages give a driver; 901 a time; 1,105 a lap. |
| Races: the message's "LAP N" is OpenF1 lap N | The deleted time equals lap N's duration for 646 of 649 messages; the offence clock time falls in lap N for 701 of 712. |
| Qualifying: the message's "LAP N" is OpenF1 lap N − 1 | The time equals lap N−1's duration for 225 of 231 messages, and never lap N's; the offence time falls in lap N−1 for 351 messages, in lap N for none. |
| Prefer the lap whose duration equals the deleted time if the lap-numbered lap disagrees; use the time alone when there's no lap number | No message with a lap number needed this; 16 qualifying messages without a lap number match by time. |
| Reinstatements match through the deletion they undo (same driver, same time or lap, earlier) | Leclerc set 1:40.101 on laps 26 and 38 at Las Vegas 2026; the reinstatement undoes the lap-38 deletion. All 7 resolve. |
| Unmatched deletions aren't flagged | 35 of 1,145 (96.9% matched): 23 qualifying messages with neither a lap number nor a time (14 double yellow, 9 "NEXT LAP PIT"), 10 at Baku 2025 Qualifying (no lap data), 2 at Miami 2025 Race (laps 16-17 missing). |

## `fct_laps` (`sql/models/20_fct_laps.sql`)

One row per driver per lap per session: always exactly the rows of
`stg_laps` (65,106), with the key `(session_key, driver_number, lap_number)`
unique. Every join is on a key that is unique on the joined side.

### Context columns

| Column | Rule | Evidence |
|---|---|---|
| `year`, `session_name`, `session_type`, `meeting_key` | From `stg_sessions` on `session_key` | Every lap matches a session. |
| `name_acronym`, `team_name`, `team_colour` | From `stg_drivers` on `session_key` AND `driver_number` | Driver numbers are only unique within a session. Every lap matches a driver. |
| `lap_end_time` | `date_start + lap_duration` (null if either is null) | Named `_time` so it isn't confused with a stint's `lap_end` (a lap number). |
| `stint_number`, `compound`, `tyre_age_on_lap`, `stint_match_count` | From `stints_clean`: a stint matches when `lap_start <= lap_number <= lap_end`; columns filled only when exactly one stint matches | Laps matching 0 stints: 120 → 3 after `stints_clean` (Norris Melbourne 2025 lap 58, beyond the official count; Piastri Melbourne 2026, DNS with no stints; Bearman Imola 2025 Qualifying lap 9). All 132 DNF drivers' final laps now match. 1 lap matches 2 (Melbourne 2025 #30 lap 2, marked unreliable). |
| `stint_reliable` | `stints_clean.stint_reliable` for the driver; null for a driver with no stints | 1,415 laps unreliable (Melbourne 2025 925, Kuala Lumpur 2026 490). Filter on it when using compound or tyre age. |
| `qualifying_part` | Qualifying: the `qualifying_phase` of the latest race-control message at or before the lap's end (Q1 before the first one) | — |

### Lap-position flags

| Column | Rule | Evidence |
|---|---|---|
| `is_pit_out_lap` | Kept exactly as OpenF1 sends it | — |
| `is_pit_in_lap` | Races: the lap matches a `pit_clean` row (rows with no `lane_duration` excluded). Qualifying, and sessions with no pit data: null (unknown) | Races: `pit.lap_number + 1` is a pit-out lap for 99.5% (2025) / 97.9% (2026) of pit rows; the 22 exceptions are explained (missing laps, Safety Car stops, mis-numbered rows, pit-lane starts). The 9 pit-lane starts are the only race pit rows with no `lane_duration`. Qualifying: the pit row's own lap is the out-lap (94.8% / 81.2%), so the in-lap rule doesn't hold. |
| `is_pit_lap` | `is_pit_in_lap OR is_pit_out_lap` (three-valued: null where the in-lap is unknown and the lap isn't an out-lap) | — |
| `is_lap1` | Race (incl. sprint) lap 1 only; false in qualifying | Race lap 1 is the standing start (median 100.7 s against 98.1 s on lap 2). In qualifying all 918 lap 1s are garage out-laps, 808 with no time. |
| `is_after_finish` | Race: lap starts at or after the last chequered flag, OR `lap_number > number_of_laps` for a driver still running at the end (not DNF/DNS/DSQ). Qualifying: starts at or after the last chequered flag | `lap_number > number_of_laps` alone marks 132 DNF retirement laps and 11 DNS laps, and in qualifying counts in/out laps (misses 240) and is 0 for deleted times (69). The chequered flag alone misses cool-down laps starting within a second of the flag (whole-second race-control times; Spa 2026 #12 lap 45). Norris Melbourne 2025 lap 58 is flagged by both. |

### Neutralization flags

| Column | Rule | Evidence |
|---|---|---|
| `is_sc_lap`, `is_vsc_lap`, `is_red_flag_lap` | The lap overlaps a `neutral_periods` period in time (SC/VSC end + 1 s for whole-second times; red flags end exactly at the resumption), or (races) its lap number is in the period's lap range | Lap 1s with no `date_start` (70) get their end from the next lap's start and their start from end − duration. Time overlap also catches lapped cars, whose lap N runs later than the leader's (Monza 2026 lap 27 VSC for 10 lapped cars). |
| `is_field_slow` | Races: field median of non-pit laps on this lap number ≥ 1.25 × the session's typical pace (lap 1: ≥ 1.40), with ≥ 5 timed laps, AND this lap ≥ the same threshold or untimed | Field-median ratio outside logged periods: median 1.000, 95th percentile 1.026. In logged SC periods: 5th percentile ~1.19, median 1.45. Normal lap 1s: 1.07–1.28, next 1.78. Wet laps 1.12–1.21 stay below. The own-lap condition stops late-race VSCs on lapped cars from flagging the leaders' racing laps. Adds Spa 2025 laps 1-4 and Kuala Lumpur 2026 laps 1-2 (starts behind the SC) and red-flag restart laps (Monza 2026 5-6, Zandvoort 2026 4, Mexico City 2026 47, Monte Carlo 2026 70). 1 false positive: an untimed lap (Barcelona 2026 #12 lap 62). |
| `is_neutralized` | `is_sc_lap OR is_vsc_lap OR is_red_flag_lap OR is_field_slow` | — |

### Validity and pace flags

| Column | Rule | Evidence |
|---|---|---|
| `is_deleted` | The lap's latest matched action in `lap_deletions` is a deletion | 1,065 laps. Qualifying validation: each driver's fastest non-deleted lap equals their best official Q time for 909 of 911 driver-sessions (99.8%; 98.7% ignoring deletions). The 2 differences were invalidated without a deletion message: Hülkenberg, Sakhir 2025 (Q2 laps void after his Q1 lap was deleted post-session) and Bearman, Imola 2025 (lap ending at the red flag, "UNDER REVIEW"). |
| `is_garage_time` | Qualifying: `lap_duration >= 2.15 ×` the session's fastest lap | Ratio to session best: flying laps 1.00–1.10, out/in/cool-down laps tail off from 1.3, garage laps form a second group from ~2.3 to ~1,500 s; the trough is at 2.15–2.20 (9 and 11 laps per 0.05 bin vs 18–52 around it). 2,962 laps; 388 aren't caught by the pit flags (Melbourne 2025 73 of its 74 long unmarked laps, Montréal 2025 73, Melbourne 2026 64, Montréal 2026 60, Monaco 2025 54, Monte Carlo 2026 53, others 5). |
| `is_outlier` | Races, among laps not excluded by another flag (timed, not pit, lap 1, after finish, neutralized or deleted): `lap_duration >= 1.12 ×` the median of the same driver's such laps in the same stint | 42,379 such laps: median ratio 1.000, 99th percentile 1.043. Per 0.01 bin the count falls 403 (1.03) … 5 (1.11), 3 (1.12), then a flat sparse tail (11, 3, 6, 8, 2 … to 1.85): the cut is at that minimum. 59 laps: yellow-flag incidents, blue-flag traffic, wet early-stint laps. |
| `is_flying_lap` | Qualifying: timed, not pit, not garage time, and `lap_duration < 1.07 ×` the fastest non-deleted lap of the same `qualifying_part`. False in races | Ratio to the part's best: per 0.01 bin 512 (1.02), 216, 108, 76, 43, then 38 at 1.07, flat to 1.10 (57, 43, 42), and in-laps / cool-down laps build up from 1.11. The part is the reference because the track changes between parts: against the session's best, official Q times reach 1.171 (São Paulo 2026, wet); against their part's best, 2,012 of the 2,022 official times that appear as laps are within 1.06, and 2,020 are flagged flying. The 2 not flagged: Bearman, Las Vegas 2026 Q1 (1.141; no position in the result) and Bortoleto, São Paulo 2026 Q1 (1.117, wet). 4,461 laps. |
| `is_clean_lap` | Timed AND not pit AND not lap 1 AND not after finish AND not neutralized AND not deleted AND not garage time AND not outlier AND (in qualifying) a flying lap. Compound not required | Each condition is commented in the SQL. |

### Sanity check (end of Step 2)

| | Laps | Clean | Share |
|---|---|---|---|
| Race 2025 | 26,265 | 22,299 | 84.9% |
| Race 2026 | 24,615 | 20,021 | 81.3% |
| Qualifying 2025 | 7,129 | 2,219 | 31.1% |
| Qualifying 2026 | 7,097 | 2,145 | 30.2% |

| Reference session | Laps | Clean | Share |
|---|---|---|---|
| 9693 Melbourne 2025 Race | 928 | 554 | 59.7% |
| 9939 Spa-Francorchamps 2025 Race | 879 | 734 | 83.5% |
| 11361 Monza 2026 Race | 1,055 | 877 | 83.1% |
| 11369 Madrid 2026 Race | 1,109 | 983 | 88.6% |
| 11384 Marina Bay 2026 Qualifying | 363 | 114 | 31.4% |

Race exclusions by first reason: neutralized 42.6%, pit 38.0%, lap 1 10.1%,
deleted 6.9%, no time 1.7%, outlier 0.7%. Qualifying clean laps are flying
laps only (0 clean laps that aren't flying). Madrid 2026: median clean lap per
driver against finishing position has a Spearman rank correlation of 0.926.

## Known limitations

- Qualifying in-laps can't be identified (`is_pit_in_lap` is null), so
  `is_pit_lap` is only known to be true for qualifying out-laps. The flying-lap
  rule makes this irrelevant for clean qualifying laps.
- Deletions with no lap number and no time (23 qualifying messages) aren't
  matched; 2 qualifying laps were invalidated without any deletion message.
- `stint_reliable = false` marks garbled drivers but doesn't fix them; their
  stint columns still come from the exactly-one-match rule.
- Sessions without lap data (Baku 2025 Qualifying) have no `fct_laps` rows.

## Planned (Step 3 and later)

- Pace analysis excludes qualifying times where `position` is null
  (`data_quirks.md`, "session_result odd rows").
- The complete results table gets one `result_status` column (`Finished`,
  `Lapped`, `Not classified`, `DNF`, `DNS`, `DSQ`, or the text code).
- Qualifying in-laps (e.g. the lap before each out-lap): not yet verified.
