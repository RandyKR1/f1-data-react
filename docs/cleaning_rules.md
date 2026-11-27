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

## Planned (not yet applied)

- Pace analysis excludes qualifying times where `position` is null
  (`data_quirks.md`, "session_result odd rows").
- The Step 3 complete results table gets one `result_status` column
  (`Finished`, `Lapped`, `Not classified`, `DNF`, `DNS`, `DSQ`, or the text code).
- Stint repairs (garbled, backwards and empty stints): step 2.11.
- Qualifying in-laps (e.g. the lap before each out-lap): not yet verified.
