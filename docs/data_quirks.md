# OpenF1 data quirks

Things we've found in the OpenF1 data (https://api.openf1.org/v1) that affect
how we download, store, or clean it. Add new findings as they come up.

## Sprints use `session_type = "Race"`

OpenF1 labels both Sprints and Grands Prix with `session_type = "Race"`. Only
`session_name` tells them apart (`"Sprint"` vs `"Race"`).

- Filter by `session_name`, never by `session_type`, when you mean "Grand Prix
  race only". This is why `ingest.py` has `--session-name` rather than
  `--session-type`.
- Seen with: 2025 Shanghai Sprint (session 9993) was picked up by a
  `session_type == "Race"` filter.

## `session_result.gap_to_leader` mixes numbers and text

Within a single race, `gap_to_leader` is a number of seconds for cars on the
lead lap (`0`, `9.748`) but text for lapped cars (`"+1 LAP"`). It's empty for
cars that didn't finish.

- Parquet needs one type per column, so this crashed the first save.
- Seen in: 2025 Chinese GP (session 9998).

## Qualifying `duration` and `gap_to_leader` are Q1/Q2/Q3 lists

In qualifying, `session_result.duration` and `gap_to_leader` are lists with
one entry per part, for example `[q1, q2, q3]`. Entries can be empty for parts
a driver didn't reach. In races the same fields are single values.

## How ingest stores these

- `session_result.duration` and `session_result.gap_to_leader` are **always
  stored as JSON text**, in every file, so the column type is the same across
  races, sprints, and qualifying. Examples of stored values: `6126.304`, `0`,
  `"+1 LAP"` (quotes included, since it's a JSON string), `[90.1, 89.7, null]`.
  A missing value is a real null, not the text `"null"`.
- Any other column that Parquet rejects (mixed types) also falls back to JSON
  text, and ingest prints a `note:` line when that happens.
- The number formatting comes straight from the API, so `0` and `0.0` can both
  appear for the leader. Parse the JSON before comparing values.
- To use these in DuckDB, parse them in the cleaning step, e.g.
  `TRY_CAST(gap_to_leader AS DOUBLE)` for race gaps, or
  `json_extract(duration, '$[2]')` for Q3 time.

## Whole-number columns become decimals when a value is missing (handled at ingest)

Plain pandas can't store an empty value in a whole-number column, so it
switches the column to decimals. Without a fix, the same column could be
`int64` in one file and `double` in another.

- Seen with: `session_result.number_of_laps` was `int64` for the 2025
  Australian GP (9693) but `double` for the 2025 Chinese GP (9998). In China,
  Leclerc, Hamilton, and Gasly were disqualified and have no lap count.
- **Handled at ingest:** `ingest.py` checks the raw API values. If every
  non-missing value in a column is a JSON integer, the column is saved with
  pandas' nullable `Int64` type, so it stays whole-number and missing values
  are real nulls. This also covers `position`, `i1_speed`, `i2_speed`, and
  `st_speed`, which have gaps.
- Decimal fields are untouched: the API sends them as floats (for example
  `points: 25.0`), so they're never converted to whole numbers.
- A column that's empty in every row of a file has no values to detect a
  type from. That case is now **handled by the declared schemas** (see
  "Empty columns keep their type" below).

## Empty columns keep their type: declared schemas (handled at ingest)

Some columns are entirely empty in some files: `race_control.lap_number` and
`driver_number` in qualifying, `race_control.qualifying_phase` outside
qualifying, `pit.stop_duration` in qualifying, and `drivers.country_code`
everywhere so far. Without a declared type, Parquet stores such a column with
its `null` type, which DuckDB reads back as `INTEGER`, so the column's type
would differ between files.

- **Handled at ingest:** `SCHEMAS` in `ingest.py` declares every known column
  and its type for every endpoint. It was built from the types observed in
  files where each column has values. `drivers.country_code` was never
  observed with a value, so it's declared as text per the OpenF1 docs.
  Every column present is saved with its declared type, even when empty, so a
  column has the same type in every file. Columns are never added or dropped.
- **New columns:** if the API sends a column that isn't in `SCHEMAS`, ingest
  keeps it with its inferred type and prints a `WARNING` naming the endpoint
  and column. Add it to `SCHEMAS` when that happens.
- **Re-applying to existing files:** `python pipeline/ingest.py --resave-local`
  re-saves raw files already on disk with the declared schemas, without
  contacting the API. It honours `--year` and `--session-keys`. Values are
  unchanged: the 8-session test sample's row-by-row fingerprints were
  identical before and after.
- `validate_raw.py` reports 0 schema WARNs for the test sample after
  re-saving, down from 11.
- Lists (`laps.segments_sector_*`) are kept exactly as sent, as lists of
  whole numbers. Re-saving reads them straight from the file, because going
  through pandas would turn any list with a missing item into decimals.

## 2025 Australian GP was wet: many stints

The 2025 Australian GP (session 9693) was a wet, chaotic race. It has 106 stint
rows (up to 7 stints for one driver) and only 928 lap rows (5 DNFs). A typical
dry race has about 40-70 stints (2-3 per driver) and 1,000-1,400 laps.

- Don't treat high stint counts or low lap counts as errors without checking
  the race first.
- The same race has 82 `pit` rows: 17 drivers, up to 5 stops for one driver.
  `weather.rainfall` is 1 in 58 of its 178 rows.

## `starting_grid` uses the qualifying session's key, not the race's

The grid is filed under the qualifying session that set it.
`starting_grid?session_key=<race key>` returns 404 (no results).

- 2025 Australian GP: race 9693, grid under 9689 (Qualifying).
- 2025 Chinese GP (Sprint weekend) has two grids: 9989 (Sprint Qualifying,
  the Sprint grid) and 9994 (Qualifying, the Grand Prix grid).
- To get a race's grid, join on `meeting_key` and the matching qualifying
  session, not on the race's `session_key`.
- Drivers who set no qualifying time still get a grid row, with
  `lap_duration` null (Bearman, #87, P20 in Australia 2025).
- **Handled at ingest:** ingest requests every endpoint for every session,
  so `starting_grid` returns 404 for practice and race sessions. The same is
  expected for `overtakes` outside races ("only available during races" per
  the docs) and for `team_radio` where F1 released none. A 404 now means "no
  data": no file is saved, and the result is logged to `data/raw/_no_data.csv`
  (logged_at, endpoint, session_key, session_name, year).

## Endpoints with per-file quirks (seen in 2025 Australia and China races)

- **Column order varies between files.** `pit`, `position`, and `weather`
  have the same columns and types in both races but in a different order
  (it follows the API's JSON key order). Harmless; always select columns
  by name, and read with `union_by_name=true`.
- **`race_control.qualifying_phase` is entirely null in races** but holds
  1/2/3 in qualifying. With nothing to detect, race files would save it with
  Parquet's `null` type. **Handled at ingest:** it's declared as `Int64` in
  `SCHEMAS` in `ingest.py`, so it's `int64` in every file.
- **`race_control.driver_number` and `sector` are mostly null.** They're
  only set for driver- or sector-specific messages (10 of 115 rows have a
  driver in Australia). `lap_number` is always set in races.
- **`weather` and `position` start before the race.** Both begin about an hour
  before the scheduled start (for example 03:07 UTC for a 04:00 UTC race) and
  run past the scheduled end. `weather` is about one row per minute over that
  whole window (178 rows in Australia), not just race time.
- **`position` holds changes only, not snapshots.** It has 335 rows (Australia)
  and 461 (China): one row each time a driver's position changes, plus the
  starting order.
- **`weather.rainfall` is 0/1 (`int64`), not true/false.**
- **`pit.stop_duration` can be missing.** In Australia only 34 of 82 pit rows
  have it. China has 24 of 25. The docs say it's "available from the 2024 US
  Grand Prix onwards". `lane_duration` is always present.
  **Use `lane_duration` rather than `stop_duration` for pit analysis.** It's
  present for every stop in both races checked so far. Per the docs,
  `stop_duration` doesn't exist before the 2024 US GP, so it can't cover
  2023-2024 at all. Re-check `lane_duration` coverage once all years are
  downloaded.
- **`pit.pit_duration` is deprecated.** It's the same as `lane_duration`, and
  the docs say it will be removed at the end of the 2026 season. Use
  `lane_duration`.
- **`overtakes` overstates on-track passes.** Per the docs it includes
  "position changes resulting from pit stops or post-race penalties"
  (172 rows in Australia, 221 in China). **Filter these out before any
  overtake analysis.** For example, drop overtakes where either driver has a
  `pit` row around that time, or that happen after the chequered flag in
  `race_control`.
- **`team_radio` is a sample, not the full record.** It has 20 clips
  (Australia) and 44 (China). The docs say coverage "decreased significantly
  starting in 2026, with most events providing no radio data at all".

## API rate limits (free tier)

OpenF1's free tier allows **3 requests per second and 30 requests per
minute**. The per-minute limit is the one that matters for bulk downloads.

- `ingest.py` starts each request **at least 2.1 s after the previous one
  started** (start-to-start, never shorter), so there are at most about 28.5
  per minute. A slow response uses up part of the gap rather than adding to
  it, so a run takes about requests x 2.1 s.
- On **HTTP 429** it waits and retries up to 5 times. It uses the `Retry-After`
  header if one is sent, otherwise waits 5 s, then 10, 20, 40, 80. If all 5
  retries are rate limited, the script stops with a clear message.
- Every 429 is logged to `data/raw/_rate_limit_log.csv` (logged_at, url,
  attempt).
- At 2.1 s per request, a full run is slow. There are about 495 sessions in
  2023-2026, and 11 per-session endpoints each, so about 5,400 requests:
  roughly 3 hours. Use `--year` and `--endpoints` to split the work.
- OpenF1 is also unavailable during live F1 sessions; avoid running ingest
  then.

## 2026 schedule changes: cancellations and a relocated "Bahrain Grand Prix"

- **Bahrain (meeting 1282) and Saudi Arabia (meeting 1283) 2026 are
  cancelled.** All their sessions have `is_cancelled = true`, and ingest skips
  them.
- **A replacement "Bahrain Grand Prix" ran in Kuala Lumpur** (meeting 1308,
  official name "FORMULA 1 GULF AIR BAHRAIN GRAND PRIX IN MALAYSIA 2026",
  4 October 2026). Its `meeting_name`, `country_code` (BRN), and `country_name`
  (Bahrain) all say Bahrain, but the circuit is different: `circuit_key` 12
  (Kuala Lumpur) instead of 63 (Sakhir).
- **Match circuits on `circuit_key`, never on meeting or event name, for
  season-to-season comparisons.** Joining on `meeting_name = 'Bahrain Grand
  Prix'` would compare Sakhir 2023-2025 with Kuala Lumpur 2026.
- `location` isn't stable either: 2026 pre-season testing uses `location`
  "Bahrain", while every other Sakhir meeting uses "Sakhir" (same
  `circuit_key` 63).

## Recently finished sessions may still be filling in

OpenF1 populates some fields after a session ends. The docs say
`pit.stop_duration` "may be unavailable during live sessions but is typically
populated within a few hours after the session ends". As of 23 November 2026,
Las Vegas 2026 (finished 22 November) is the most recent session and may still
be incomplete.

- Re-download the most recent weekend a few days after it ends, before
  treating its data as final.

## Findings from the 8-session test sample (run 23 November 2026)

Sample: Race and Qualifying for 2025 Australia (wet), 2025 China (sprint
weekend), 2025 Belgium (red flag), and 2026 Italy (dry, but also red-flagged,
so it doesn't serve as the "normal dry weekend" it was chosen for).

- **No `pit` data for Monza 2026 Qualifying (session 11357).** The API
  returned 404, but the other three qualifying sessions in the sample each have
  about 101 `pit` rows, because cars use the pit lane constantly in qualifying.
  This may be a genuine gap in OpenF1's data. **Re-check during the full run**:
  if other 2026 qualifying sessions also have no `pit` data, it's a 2026-wide
  change rather than a one-off.
- **2026 has 22 drivers and 11 teams** (Cadillac joined). `drivers`,
  `session_result`, and `starting_grid` have 22 rows per session in 2026 and
  20 in 2023-2025. Base driver-count checks on the season, not a fixed 20.
- **Monza 2026 race (11361) was dry but red-flagged on lap 3** (corrected:
  an earlier version of this entry wrongly said "no red flag").
  - Dry: `weather.rainfall` is 0 in all 176 rows.
  - Lap 3: "SAFETY CAR DEPLOYED" at 13:06:49 UTC, then "SESSION ABORTED" and
    "RED FLAG - RACE SUSPENDED" at 13:07:43, a **32-minute stoppage**, then
    "SESSION STARTED" at 13:39:00 and a **standing restart** (with an "EXTRA
    FORMATION LAP").
  - VSC on laps 28-29 ("VSC DEPLOYED", "VSC ENDING").
  - Useful for testing red-flag, Safety Car, and VSC detection.
- **Spa 2025 race (9939) was red-flagged before the start.** `race_control`
  shows "STARTING PROCEDURE SUSPENDED", then `flag = 'RED'` at 13:01 UTC
  (lap 1), and "RACE WILL RESUME AT 16:20". Useful for testing red-flag
  detection.

## Red flags aren't always in the `flag` column

`race_control` logs red flags in more than one way:

| Race | `category` | `flag` | `message` |
|---|---|---|---|
| Spa 2025 (9939) | `Flag` | `RED` | "RED FLAG" |
| Monza 2026 (11361) | `Other` | empty | "RED FLAG - RACE SUSPENDED" |
| Monza 2026 (11361) | `SessionStatus` | empty | "SESSION ABORTED" |

- **Red-flag detection must match the message text** (for example
  `message LIKE 'RED FLAG%'` or `message = 'SESSION ABORTED'`), not just
  `flag = 'RED'`. A `flag = 'RED'` filter alone misses Monza 2026.

## Melbourne 2025 race: garbled stints for drivers 5, 30 and 87

In `stints` for session 9693, drivers **#5, #30 and #87** have seven stints
each. Stints 1-5 cover only laps 1-4, and some run backwards (`lap_end`
before `lap_start`, e.g. stint 3 = laps 3 to 2), all on INTERMEDIATE. It
looks like OpenF1 misread tyre changes in the wet. Every other stint boundary
in the test sample joins cleanly (next `lap_start` = previous `lap_end` + 1).

- **Handle in the cleaning step, not in raw data.** Raw files stay exactly as
  the API sent them. `validate_raw.py` reports these as a Stint logic FAIL.

## Qualifying laps include garage time (up to about 1,500 s)

Qualifying `laps` include laps of several minutes, up to about 1,500 s at
Monza 2026, that are really time in the garage between runs. A lap timed from
the garage counts the wait.

- In Shanghai, Spa, and Monza, all of them are marked `is_pit_out_lap`. In
  **Melbourne 2025 (9689) 71 of 73 are not**, so **`is_pit_out_lap` alone
  can't exclude them**. Also filter on duration relative to the session's
  typical pace.

## Red-flag stoppages inflate lap and pit times

A red-flag stoppage counts toward the lap it happens on, and toward pit-lane
time for cars waiting in the pit lane.

- Monza 2026 (11361): `lap_duration` for lap 4 is about 1,950 s for 21
  drivers, and `pit.lane_duration` is about 1,840 s for 21 drivers (all
  logged at 13:39, the restart).
- Spa 2025 (9939): lap 1 is 202-219 s (Safety Car restart after the
  red flag).
- **Pit and lap analysis must exclude red-flag periods** (find them in
  `race_control`, using the message-text matching above).
