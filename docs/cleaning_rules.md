# Cleaning rules

Every rule applied when building the modelled tables in `data/f1.duckdb`
(`pipeline/build.py`: `sql/staging/`, then `sql/models/`). Each rule lists the
data evidence behind it. The SQL files carry the same reasoning in comments.
Raw data (`data/raw/`, the `raw_*` tables) is never changed.

How rules are added: see "Cleaning conventions" in `CLAUDE.md`. Background on
the data itself: `docs/data_quirks.md`.

Reference sessions, used to report flag counts on every change:

| session_key | Session |
|---|---|
| 9693 | 2025 Melbourne Race (wet, garbled stints) |
| 9939 | 2025 Spa-Francorchamps Race |
| 11361 | 2026 Monza Race |
| 11369 | 2026 Madrid Race |
| 11384 | 2026 Marina Bay Qualifying (`position = "RT"`) |

## Staging (`sql/staging/`, one table per raw table)

Staging only cleans types and duplicates; no business logic. Every table
keeps all raw rows unless they are duplicates (0 removed so far).

| Rule | Tables | Evidence |
|---|---|---|
| Deduplicate on the natural key with `QUALIFY ROW_NUMBER()`, keeping the first row by `source_file`, then load order | all | Raw is stored file by file, so a key could repeat if a file is saved twice. 0 duplicates today. |
| `stg_race_control` has no natural key; only rows identical in every column are removed | race_control | `(session_key, date)` repeats 588 times; `driver_number` is null for 7,309 track-wide messages; even `(session_key, date, category, message)` repeats once (two rows differing only in `lap_number`). |
| Date columns cast to `TIMESTAMPTZ`; `gmt_offset` to `INTERVAL` | all with dates | ISO 8601 text with a UTC offset; every cast checked equal to the raw text. |
| Folder-only `year` columns dropped | per-session tables | They come from the folder name, not the API. Take the year from `stg_sessions`. |
| `compound = 'UNKNOWN'` → NULL | stints | Literal placeholder for "no compound recorded" (2 rows: Montréal 2026 Qualifying #81, Mexico City 2026 Race #18). |
| `rainfall` 0/1 → BOOLEAN | weather | Only 0 and 1 occur (10,637 / 496). |
| `pit_duration` dropped | pit | Deprecated by OpenF1 and equal to `lane_duration` in every row. |
| `session_result` JSON text decoded by `session_type` into typed columns; original text kept as `*_raw` | session_result | Inventory of all 1,877 rows (`data_quirks.md`, "session_result odd rows"). Checked against an independent JSON parse: 7,194 values, 0 lost, 0 different. |

## `fct_laps` (`sql/models/20_fct_laps.sql`)

One row per driver per lap per session: always exactly the rows of
`stg_laps` (65,106), with the key `(session_key, driver_number, lap_number)`
unique. Every join is on a key that is unique on the joined side.

| Column | Rule | Evidence |
|---|---|---|
| `stint_number`, `compound`, `tyre_age_on_lap`, `stint_match_count` | A stint matches when `lap_start <= lap_number <= lap_end`; columns filled only when exactly one stint matches, otherwise null | 64,985 laps match 1, 120 match 0 (117 are DNF drivers' final laps, which OpenF1 leaves out of the last stint), 1 matches 2 (Melbourne 2025 #30's garbled stints). |
| `lap_end_time` | `date_start + lap_duration` (null if either is null) | Named `_time` so it isn't confused with a stint's `lap_end` (a lap number). |
| `is_pit_out_lap` | Kept exactly as OpenF1 sends it | — |
| `is_pit_in_lap` | Races: the lap matches a `stg_pit` row (pit rows with no `lane_duration` excluded). Qualifying, and sessions with no pit data: null (unknown) | Races: `pit.lap_number + 1` is a pit-out lap for 99.5% (2025) / 97.9% (2026) of pit rows; the 22 exceptions are explained (missing laps, Safety Car stops, mis-numbered rows, pit-lane starts). The 9 pit-lane starts are the only race pit rows with no `lane_duration`. Qualifying: the pit row's own lap is the out-lap (94.8% / 81.2%), so the in-lap rule doesn't hold. |
| `is_pit_lap` | `is_pit_in_lap OR is_pit_out_lap` (three-valued: null where the in-lap is unknown and the lap isn't an out-lap) | — |
| `is_lap1` | Race (incl. sprint) lap 1 only; false in qualifying | Race lap 1 is the standing start (median 100.7 s against 98.1 s on lap 2). In qualifying all 918 lap 1s are garage out-laps already flagged by `is_pit_out_lap`, 808 with no time. |
| `is_after_finish` | Race: lap starts at or after the last chequered flag, OR `lap_number > number_of_laps` for a driver still running at the end (not DNF/DNS/DSQ). Qualifying: starts at or after the last chequered flag | `lap_number > number_of_laps` alone marks 132 DNF retirement laps and 11 DNS laps, and in qualifying counts in/out laps (misses 240) and is 0 for deleted times (69). The chequered flag alone misses cool-down laps starting within a second of the flag, because race-control times are whole seconds (Spa 2026 #12 lap 45). Norris Melbourne 2025 lap 58 is flagged by both. |

## `neutral_periods` (`sql/models/10_neutral_periods.sql`)

One row per Safety Car, VSC or red-flag period (102 rows: SC 33, VSC 38, RED 31,
of which 26 are in qualifying), built from `stg_race_control`. Key:
`(session_key, period_type, start_time)`, unique.

| Rule | Evidence |
|---|---|
| SC: from "SAFETY CAR DEPLOYED" to the leader's start of the lap after "SAFETY CAR IN THIS LAP" (the restart) | Same wording both seasons (deployed 17 / 16, in 16 / 13). The Safety Car comes in at the end of the announced lap. |
| VSC: from "VIRTUAL SAFETY CAR DEPLOYED" (2025) / "VSC DEPLOYED" (2026) to the "TRACK CLEAR" after the ENDING message (within 60 s), else the ENDING message | The wording changed between seasons (13 / 25 deployments). TRACK CLEAR follows ENDING by 11 s at Monza and Madrid 2026. |
| RED: from `flag = 'RED'` or a message starting "RED FLAG - " to the next "SESSION STARTED" (else "SESSION FINISHED") | 2025 races and all qualifying use `flag = 'RED'`; 2026 races log only "RED FLAG - RACE SUSPENDED" (4), with no flag value. Several red-flag messages before one resumption form one period. |
| A period with no end message ends at the first of: red flag, (for a VSC) Safety Car, chequered flag | Monza 2026: SC on lap 3, red flag 54 s later. 3 SCs end with a red flag, 1 at the chequered flag, 1 VSC with an SC. |
| start_lap / end_lap from the messages' lap_number; null in qualifying and for red flags before the race started | Spa 2025's red flag was before lap 1. |

## `fct_laps` neutralization flags

| Column | Rule | Evidence |
|---|---|---|
| `is_sc_lap`, `is_vsc_lap`, `is_red_flag_lap` | The lap overlaps a period in time (SC/VSC end + 1 s for whole-second times; red flags end exactly at the resumption), or (races) its lap number is in the period's lap range | Lap 1s with no `date_start` (70) get their end from the next lap's start and their start from end − duration. Time overlap also catches lapped cars, whose lap N runs later than the leader's (e.g. Monza 2026 lap 27 VSC for 10 lapped cars). |
| `is_field_slow` | Races only: field median of non-pit laps on this lap number ≥ 1.25 × the session's typical pace (lap 1: ≥ 1.40), with ≥ 5 timed laps, AND this lap ≥ the same threshold or untimed | Field-median ratio outside logged periods: median 1.000, 95th percentile 1.026. In logged SC periods: 5th percentile ~1.19, median 1.45. Normal lap 1s: 1.07–1.28, next 1.78. Wet laps 1.12–1.21 stay below. The own-lap condition stops late-race VSCs on lapped cars from flagging the leaders' racing laps (Barcelona 2026 lap 62, Zandvoort 2026 lap 54). |
| `is_neutralized` | `is_sc_lap OR is_vsc_lap OR is_red_flag_lap OR is_field_slow` | — |

`is_field_slow` adds laps no logged period covers: starts behind the Safety
Car (Spa 2025 laps 1-4, Kuala Lumpur 2026 laps 1-2) and restart laps after
red flags (Monza 2026 laps 5-6, Zandvoort 2026 lap 4, Mexico City 2026 lap 47,
Monte Carlo 2026 lap 70). Known false positive: 1 untimed lap (Barcelona 2026
#12 lap 62, no time and no next lap, so it can't be placed in time).

## `lap_deletions` and `fct_laps.is_deleted`

`sql/models/15_lap_deletions.sql`: one row per lap-deletion or reinstatement
message (1,152: 1,145 deletions, 7 reinstatements), parsed and matched to an
OpenF1 lap. `fct_laps.is_deleted` is true when a lap's latest matched action
is a deletion (1,065 laps).

| Rule | Evidence |
|---|---|
| Parse driver (number, or the 3-letter code looked up in the session's drivers), deleted time (M:SS.mmm → s) and lap number from the message | All 1,152 messages give a driver; 901 a time; 1,105 a lap. |
| Races: the message's "LAP N" is OpenF1 lap N | The deleted time equals lap N's duration for 646 of 649 messages; the offence clock time falls in lap N for 701 of 712. |
| Qualifying: the message's "LAP N" is OpenF1 lap N − 1 | The time equals lap N−1's duration for 225 of 231 messages, and never lap N's; the offence time falls in lap N−1 for 351 messages, in lap N for none. |
| Prefer the lap whose duration equals the deleted time if the lap-numbered lap disagrees; use the time alone when there's no lap number | No message with a lap number needed this; 16 qualifying messages without a lap number match by time. |
| Reinstatements match through the deletion they undo (same driver, same time or lap, earlier) | Leclerc set 1:40.101 on laps 26 and 38 at Las Vegas 2026; the reinstatement undoes the lap-38 deletion. All 7 reinstatements resolve. |
| Unmatched deletions aren't flagged | 35 of 1,145 (96.9% matched): 23 qualifying messages with neither a lap number nor a time (14 double yellow, 9 "NEXT LAP PIT"), 10 at Baku 2025 Qualifying (no lap data), 2 at Miami 2025 Race (laps 16-17 missing from `laps`). |

**Validation (qualifying):** each driver's fastest non-deleted lap equals their
best official Q time for 909 of 911 driver-sessions (99.8%; 98.7% ignoring
deletions). The 2 differences have no deletion message to match: Hülkenberg,
Sakhir 2025 (his Q1 lap was deleted after Q1, dropping him to P16, so his Q2
laps were void; 91.693 s counted here) and Bearman, Imola 2025 (76.077 s lap
ending at the red flag, logged only as "LAP TIME ... UNDER REVIEW").

## `fct_laps` garage-time, outlier and clean-lap flags

| Column | Rule | Evidence |
|---|---|---|
| `is_garage_time` | Qualifying: `lap_duration >= 2.15 ×` the session's fastest lap | Ratio to session best: flying laps 1.00–1.10, out/in/cool-down laps tail off from 1.3, garage laps form a second group from ~2.3 to ~1,500 s; the trough is at 2.15–2.20 (9 and 11 laps per 0.05 bin vs 18–52 around it). 2.15 × a typical 83.5 s best is ~180 s, a minute more than a slow out-lap. 2,962 laps; 388 aren't caught by the pit flags (Melbourne 2025 73, Montréal 2025 73, Melbourne 2026 64, Montréal 2026 60, Monaco 2025 54, Monte Carlo 2026 53, others 5). Melbourne 2025: 73 of its 74 long unmarked laps (the 74th is 2.13 ×). |
| `is_outlier` | Races, among laps not excluded by another flag (timed, not pit, not lap 1, not after finish, not neutralized, not deleted): `lap_duration >= 1.12 ×` the median of the same driver's such laps in the same stint | 42,379 such laps: median ratio 1.000, 99th percentile 1.043. Per 0.01 bin the count falls smoothly 403 (1.03) … 12 (1.10), 5 (1.11), 3 (1.12), then a flat sparse tail (11, 3, 6, 8, 2 … to 1.85): the cut is at that minimum. 59 laps (2025: 13, 2026: 46): yellow-flag incidents, blue-flag traffic, wet early-stint laps. |
| `is_clean_lap` | Timed AND not pit AND not lap 1 AND not after finish AND not neutralized AND not deleted AND not garage time AND not outlier. Compound not required | — |

**Sanity check (27 November 2026):** clean-lap share is 84.9% (2025) / 81.3%
(2026) of race laps and 59.7% / 63.4% of qualifying laps. Race exclusions,
by first reason: neutralized 42.6%, pit 38.0%, lap 1 10.1%, deleted 6.9%, no
time 1.7%, outlier 0.7%. Qualifying: pit (out-laps) 61.5%, no time 24.3%,
deleted 5.8%, garage time 5.2%, neutralized 1.8%, after finish 1.3%.
Madrid 2026: median clean lap per driver vs finishing position has a
Spearman rank correlation of 0.926.

**Caveat, qualifying:** qualifying in-laps can't be identified (see
`is_pit_in_lap`), and there is no outlier rule for qualifying, so "clean"
qualifying laps include in-laps and cool-down laps run before the flag, not
just flying laps. For qualifying pace, use the official Q times in
`stg_session_result` or a flying-lap filter on top of `is_clean_lap`.

## Planned (not yet applied)

- Pace analysis excludes qualifying times where `position` is null
  (`data_quirks.md`, "session_result odd rows").
- The Step 3 complete results table gets one `result_status` column
  (`Finished`, `Lapped`, `Not classified`, `DNF`, `DNS`, `DSQ`, or the text code).
- Stint repairs (garbled, backwards and empty stints): step 2.11.
- Qualifying in-laps (e.g. the lap before each out-lap): not yet verified.
