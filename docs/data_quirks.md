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

## `session_result` odd rows (inventory of all 1,877 rows, 27 November 2026)

Found while building `stg_session_result` (2025-2026 Race and Qualifying):

- **Q2 or Q3 times without a Q1 time, no position, and no flags.** Four
  qualifying rows have Q2 (and sometimes Q3) times but no Q1 time, a null
  `position`, `number_of_laps = 0`, and `dnf`, `dns` and `dsq` all false.
  Their times seem to have been thrown out after the session, but OpenF1
  doesn't flag them as disqualified.
  - Albon and Sainz, Marina Bay 2025: `[null, 90.202, null]` and
    `[null, 90.235, null]`
  - Hadjar, Miami Gardens 2026: `[null, 88.941, 88.789]`
  - Lawson, Mexico City 2026: `[null, 77.207, 77.029]`
- **Bearman, Las Vegas 2026 Qualifying:** has a Q1 time (`108.005`) but a null
  `position`, again with no flags set.
- **Unclassified finishers:** a race row can have a null `position` *and* a
  laps-behind gap. These are cars still running at the flag but too far behind
  to be classified, so the laps-behind value can be large: Stroll `"+15 LAPS"`
  (Melbourne 2026), Albon `"+11 LAPS"` (Barcelona 2026).
- **The winner's gap is the integer `0`**, not `0.0`. Every other numeric gap
  is a float (all 45 race winners). `stg_session_result` decodes it as `0.0`.
- **Disqualified race rows have no `number_of_laps`:** all 6 such rows are
  `dsq = true`: Hulkenberg (Sakhir 2025), Gasly, Leclerc and Hamilton
  (Shanghai 2025), Norris and Piastri (Las Vegas 2025).
- **`"RT"` is the only text code in `position`** (Hadjar, Marina Bay 2026
  Qualifying). Other outcomes come only from the `dnf` / `dns` / `dsq` flags
  or a null position. They're never text codes.

### Planned rules (not applied in staging)

- **Pace analysis excludes qualifying times where `position` is null.** That
  removes the rows above, whose times didn't count, and also DNS and other
  unclassified rows.
- **The Step 3 complete results table gets one `result_status` column** that
  summarizes each row: for example `Finished`, `Lapped`, `Not classified`,
  `DNF`, `DNS`, `DSQ`, or the text code itself (`RT`). Then nobody has to
  combine `position`, `laps_behind` and the three flags by hand.

## How ingest stores these

- `session_result.duration`, `session_result.gap_to_leader` and
  `session_result.position` are **always stored as JSON text**, in every
  file, so the column type is the same across races, sprints, and
  qualifying. Examples of stored values: `6126.304`, `0`, `"+1 LAP"` (quotes
  included, since it's a JSON string), `[90.1, 89.7, null]`, and for
  `position` `1` or `"RT"`. A missing value is a real null, not the text
  `"null"`.
- `position` joined this list on 24 November 2026 because it can hold text
  codes (see "Marina Bay 2026 Qualifying" below). Existing files were
  re-saved with `--resave-local` (all 873 fingerprint checks passed; the
  fingerprint compares JSON-text columns by decoded value, so `1` stored as
  an integer equals `'1'` stored as text, while any real value change still
  stops the re-save).
- Any other column that Parquet rejects (mixed types) also falls back to JSON
  text, and ingest prints a `note:` line when that happens.
- The JSON text is encoded from the API's own values, so the leader's gap is
  stored as `0`, exactly as sent. (Corrected 24 November 2026: an earlier
  version said `0` and `0.0` could both appear "from the API". The `0.0`
  actually came from pandas turning whole numbers into decimals when a value
  was missing. Ingest now encodes JSON columns from the raw values, and the
  session_result files were re-downloaded.) Parse the JSON before comparing
  values all the same.
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
- Ingest is **incremental**: it skips files that already exist and
  session + endpoint pairs already logged in `_no_data.csv`
  (`--retry-no-data` re-requests those), so an interrupted run can simply
  be restarted. `--dry-run` shows what would be requested and skipped.
- OpenF1 is also unavailable during live F1 sessions; avoid running ingest
  then.

### The app's page loads and the rate limits

- A results page loaded from the live API makes about **10 OpenF1 requests at
  once**: session, drivers, laps, stints, session_result, meeting, the meeting
  list for Search, weather, race_control and team_radio. That burst goes over
  the 3-per-second limit, so some requests get **HTTP 429**.
- `fetchData` in `src/api.js` **retries a 429 twice, after 1 s and then 2 s**.
  So the burst usually still succeeds, just a second or two slower. The 429s
  only show up in the browser console as failed requests.
- **The 30-per-minute limit is what actually causes failures.** At about 10
  requests per page, opening 3 pages within a minute uses up the whole
  allowance, and the 1 s and 2 s retries can't wait long enough for it to
  reset. Sections then fail with "Could not load ...", or Search shows
  "Could not load tracks".
- **In local mode (`VITE_DATA_SOURCE=local`, the default), exported sessions
  make zero OpenF1 requests.** Search, results, laps, stints, weather, race
  control and team radio all come from `public/data`. That avoids the limit
  for most visitors; only sessions that haven't been exported yet still use
  the API.

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

## Checked against formula1.com: race winners and lap counts all match

`pipeline/check_official_results.py` compares our Race sessions with
`docs/reference/official_race_results.csv`, the official results from
formula1.com for 2025-2026, entered by hand on 27 November 2026. Result: all
45 official races match our P1 driver, team and the winner's `number_of_laps`.
There are no official races we lack. The 4 Race sessions not in the official
list are the cancelled Bahrain and Saudi Arabia 2026 rounds and the
not-yet-run Qatar and Abu Dhabi 2026. What it showed:

- **Match races by local date, not by name or UTC date.** formula1.com dates
  are local race dates; use `date_start + gmt_offset`. Las Vegas runs on
  Saturday night locally, which is already Sunday in UTC (2025: 22 Nov local,
  23 Nov UTC).
- **Names differ between OpenF1 and formula1.com:**
  - The 2026 Kuala Lumpur race (session 11731) is "Bahrain Grand Prix" in
    OpenF1 and "Bahrain" on formula1.com (see the 2026 schedule changes above).
  - Madrid 2026 is "Spanish Grand Prix" / "Spain".
  - Barcelona 2026 is "Barcelona Grand Prix" in OpenF1 but
    "Barcelona-Catalunya" on formula1.com.
- **The winner's `number_of_laps` is the official race distance,** even where
  `laps` has an extra lap: Norris, Melbourne 2025 is 57 in both, despite a
  recorded lap 58.
- **Driver and team names line up:** `first_name || ' ' || last_name` equals
  the formula1.com winner name (e.g. "Kimi Antonelli"), and `team_name`
  equals the formula1.com team for every winner.

## `location` names change between seasons: group venues by `circuit_key`

OpenF1 names the 2026 Monaco round's `location` **"Monte Carlo"**, while
2023-2025 use **"Monaco"**. The 2027 schedule also says "Monte Carlo". It's the
same circuit every year (`circuit_key` 22, `circuit_short_name` "Monte
Carlo"). **Anything that groups or compares venues must use `circuit_key`,
not `location`.** The same `location` change shows up for three other
circuits (meetings and sessions, schedule as of 26 November 2026):

| circuit_key | Circuit | `location` values |
|---|---|---|
| 22 | Monaco | "Monaco" 2023-2025, "Monte Carlo" 2026-2027 |
| 63 | Sakhir | "Sakhir" in most meetings, "Bahrain" for 2026 pre-season testing and the 2027 Grand Prix |
| 70 | Yas Marina | "Yas Island" 2023-2025, "Yas Marina" 2026-2027 |
| 151 | Miami | "Miami" 2023-2024, "Miami Gardens" 2025-2027 |

Effect on the app: Search builds its track list from `location`, so Monaco
and Monte Carlo appear as separate tracks (Monaco offers 2023-2025, Monte Carlo
offers 2026 onward). This happens the same way with the live API and the local
index. `/sessions?location=` also matches on the exact name.

## Recently finished sessions may still be filling in

OpenF1 populates some fields after a session ends. The docs say
`pit.stop_duration` "may be unavailable during live sessions but is typically
populated within a few hours after the session ends". As of 23 November 2026,
Las Vegas 2026 (finished 22 November) is the most recent session and may still
be incomplete.

- **Handled at ingest:** `ingest.py` only processes sessions that ended at
  least 24 hours ago (`--min-age-hours` to change it).
- Re-download the most recent weekend a few days after it ends, before
  treating its data as final: `python pipeline/ingest.py --force
  --session-keys <keys>`. Ingest is incremental and otherwise skips files
  that already exist.

## Findings from the 10-session test sample (run 23 November 2026)

The test sample is the Race and Qualifying sessions of 5 weekends, each
picked to cover a different situation:

| Weekend | Qualifying / Race | Purpose |
|---|---|---|
| 2025 Australia (Melbourne) | 9689 / 9693 | Wet, chaotic race: many stints, DNFs, garbled stints |
| 2025 China (Shanghai) | 9994 / 9998 | Sprint weekend: Sprint labelled `session_type = "Race"`, two grids |
| 2025 Belgium (Spa) | 9935 / 9939 | Red flag before the start (`flag = 'RED'`) |
| 2026 Italy (Monza) | 11357 / 11361 | Second red-flag case: dry, red flag on lap 3 logged only in `message`, standing restart, 22-car field |
| 2026 Spain (Madrid) | 11365 / 11369 | Dry baseline: no rain, no red flag, no Safety Car, one VSC |

**How Madrid was chosen (from the data):** Monza was originally meant to be
the dry baseline but turned out to be red-flagged. Of the 15 finished 2026
non-sprint weekends in the saved schedule, Monza (already in the sample) and
Las Vegas (still filling in, see above) were left out, and 6 spread evenly
across the season were checked using only their race's `weather` and
`race_control`:

| Race | Session | Rainfall rows | Red flag | SC periods | VSC periods |
|---|---|---|---|---|---|
| Australia (Melbourne) | 11234 | 0 of 148 | no | 0 | 3 |
| Monaco (Monte Carlo) | 11299 | 0 of 208 | yes | 2 | 0 |
| Belgium (Spa) | 11334 | 0 of 146 | no | 1 | 2 |
| **Spain (Madrid)** | **11369** | **0 of 161** | **no** | **0** | **1** |
| United States (Austin) | 11396 | 0 of 159 | no | 0 | 2 |
| São Paulo | 11412 | 7 of 160 | no | 0 | 0 |

A red flag means a `message` matching `'RED FLAG%'` or `= 'SESSION ABORTED'`.
SC and VSC periods are counted as `'SAFETY CAR DEPLOYED'` and
`'VSC DEPLOYED'` messages. Madrid was the only dry race with no red flag
and just one SC/VSC period.

- **Madrid looks clean in the validator.** Its race has only 19 slow-lap
  WARNs, all explained: 17 on the VSC (laps 14-15, when 10 cars pitted), 1
  pit-out lap (lap 24), and Hamilton's (#44) last lap before retiring
  (lap 6). Compare 80-274 in the red-flagged and wet races.
- **No `pit` data for 2026 Qualifying: Monza (11357) and Madrid (11365).**
  The API returned 404 for both, while the three 2025 qualifying sessions in
  the sample each have about 101 `pit` rows (cars use the pit lane constantly
  in qualifying). **Resolved by the full 2026 pull:** it's not season-wide.
  Qualifying `pit` is missing for the first 18 weekends and present from
  Mexico City onward (see "Findings from the 2026 pull").
- **Drivers with no qualifying time can be missing from `session_result`.**
  In Madrid 2026 Qualifying (11365), Stroll (#18) and Bearman (#87) set no
  time. They have `starting_grid` rows (P21 and P22, `lap_duration` null) but
  **no `session_result` row**, so the file has 20 rows for 22 drivers. In
  Melbourne 2025 (9689) Bearman, who also set no time, *does* have a
  `session_result` row with `dns = true` and no position. **Treat
  `drivers` (or `starting_grid`) as the list of a session's drivers and
  left-join results onto it**, never the other way round.
  `validate_raw.py`'s driver-count check only counts `drivers`, so it didn't
  flag this at first.
  - **Now checked:** `validate_raw.py`'s "Results coverage" check WARNs
    (not FAILs, since the API isn't consistent) for every driver in a
    session's `drivers` file with no `session_result` row. For each one it
    shows whether they have a `starting_grid` row (`has_grid_row`) and
    whether another `session_result` row from the same meeting marks them
    `dns` (`dns_elsewhere`). On the 10-session sample it flags only Stroll
    and Bearman in 11365 (both with grid rows, neither dns elsewhere).
  - **Step 3 (data model) needs a complete results table** built from
    `drivers`, `starting_grid` and `session_result`: one row per driver per
    session, starting from `drivers`, with grid and result columns
    left-joined on. That way drivers who set no time still appear (with a
    null result and their grid slot), whichever way the API recorded them.
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

## Laps, stints and pit stops: how they line up (found building `fct_laps`, 27 November 2026)

Checked across all 2025-2026 Race and Qualifying sessions:

- **A DNF driver's last stint ends one lap early.** OpenF1 closes a retiring
  driver's final stint on the lap *before* their last recorded lap, so the
  retirement lap falls outside every stint. This is 117 laps, one per DNF
  driver, in almost every race (e.g. Monte Carlo 2026 #1: stint covers laps
  1-43, last lap 44). In `fct_laps` these laps have `stint_match_count = 0`
  and no compound.
- **Laps can exist beyond the official lap count.** Norris won Melbourne 2025
  with 57 laps, but `laps` has a lap 58. Bearman, Imola 2025 Qualifying has 8
  laps in `session_result` but a lap 9 in `laps`. Their stints stop at the
  official count.
- **A non-starter can have a recorded lap.** Piastri, Melbourne 2026 Race
  (DNS) has 1 lap in `laps` and no stints at all.

### `pit.lap_number` means different things in races and qualifying

- **Races: `pit.lap_number` is the in-lap.** The driver's next lap is an
  OpenF1 pit-out lap for 817 of 821 race pit rows in 2025 (99.5%) and 845 of
  863 in 2026 (97.9%). The 22 exceptions:
  - laps missing around the stop (Miami 2025, 4)
  - stops under a Safety Car (Melbourne 2026 lap 46, 5)
  - pit rows numbered with the wrong lap: Melbourne 2026 "lap 18" rows are
    timed when race control was on lap 26 (3)
  - a pit row after the driver's last lap (Melbourne 2026 #18, 1)
  - pit-lane starts (Mexico City 2026 lap 1, 9 drivers). These are the only
    race pit rows with no `lane_duration`, and their lap 1 is already a
    pit-out lap, so they aren't stops.
- **Qualifying: `pit.lap_number` is the out-lap.** The next lap is an out-lap
  for only 2.5% (2025) and 11.2% (2026) of rows, but the pit row's own lap is
  an out-lap for 94.8% (2025) and 81.2% (2026). A qualifying pit row records
  a garage visit (hence lane durations of several minutes), numbered by the
  lap the car goes back out on.
- **Pit-in laps can't be detected for 2026 qualifying without pit data.**
  Qualifying `pit` exists for only 3 of the 21 2026 qualifying sessions
  (Mexico City, São Paulo, Las Vegas; see "Qualifying `pit` is missing until
  Mexico City"). For the rest there's no pit row to mark an in-lap.
  `fct_laps.is_pit_in_lap` is null (unknown) for all qualifying laps for now,
  because the in-lap convention doesn't hold there, and `is_pit_lap` is then
  only known to be true for out-laps.

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

## Baku 2025 Qualifying: no `laps` data

Baku 2025 Qualifying (session 9900) had **six red flags**. Its
`race_control` messages run from 11:56:53 to 14:09:07 UTC, **about 2 h 10 min**
for a session that normally takes about an hour.

- **`laps` returns 404 (no data)** for this session. It was missing in the
  2025 pull and **still missing after a retry** (`--retry-no-data`,
  24 November 2026), so it stays logged in `_no_data.csv`. Every other
  endpoint has data (122 stints, 122 pit rows, 1,495 position rows, 20
  results, 20 grid rows).
- **Teammate pace analysis must fall back to the official Q1/Q2/Q3 times in
  `session_result.duration` for this session** (JSON lists, e.g.
  `json_extract(duration, '$[2]')` for Q3). 19 drivers have a Q1 time, 14 a
  Q2 time, and 8 a Q3 time. There are no per-lap or sector times.

## Findings from the 2025 pull (Race + Qualifying, run 24 November 2026)

48 sessions, 420 requests, 0 rate-limit responses, no undeclared columns.
The only no-data result was Baku Qualifying `laps` (above).
`validate_raw.py --year 2025 --session-name Race,Qualifying` reports
3 FAIL and 50 WARN. All of them are explained here or in earlier sections:

- **Slow-lap WARNs are explained.** Qualifying ones are garage time (see
  "Qualifying laps include garage time"). For races, 1,449 of the 1,493
  flagged laps across 24 races fall on lap 1, a pit in- or out-lap, or a
  Safety Car, VSC or red-flag period. The remaining 44 are Spa's 40 Safety
  Car laps (next bullet) and 4 single laps.
- **Safety Car periods aren't always logged.** Spa 2025 race (9939) laps
  1-4 are 164-219 s (median 108 s): the field ran behind the Safety Car
  after the pre-start red flag. But `race_control` has only "RED FLAG",
  "SESSION STARTED" and "SESSION FINISHED", with no `SafetyCar` messages.
  Don't rely on `race_control` alone to find neutralised laps. Also
  flag laps far slower than the median for every driver at once.
- **VSC messages are worded differently by season.** 2025 uses "VIRTUAL
  SAFETY CAR DEPLOYED" / "VIRTUAL SAFETY CAR ENDING", while 2026 uses "VSC
  DEPLOYED" / "VSC ENDING". **Match both** (or `category = 'SafetyCar'`
  plus `message LIKE '%DEPLOYED'`) when counting VSC periods. The 2026
  dry-baseline comparison above was unaffected (all 2026).
- **FAIL: phantom drivers in Spielberg 2025 Qualifying `stints` (9951).**
  12 driver numbers not in that session's `drivers` file (2, 3, 7, 8, 9,
  11, 15, 17, 20, 21, 24, 25) each have one SOFT stint covering lap 1 only,
  and no laps. 8 more stints, for real drivers (stint 2 or 3, laps 3-9),
  have a null `compound` (the "compound outside the known set" WARN).
  **Cleaning:** drop stints whose driver isn't in the same session's
  `drivers`, and keep null compounds as unknown.
- **FAIL: zero-length first stints in Monaco 2025 race (9979).** Drivers
  #5, #10, #22 and #87 have stint 1 with `lap_start` 1 and `lap_end` 0,
  followed by stint 2 starting on lap 1. This is a different pattern from
  Melbourne's garbled stints: an empty placeholder, not misread tyre
  changes. **Cleaning:** drop stints where `lap_end = lap_start - 1`.
- **WARN: 19 drivers in Barcelona 2025 race (9971).** Stroll (#18)
  qualified (grid P14 in 9967) but has no row in the race's `drivers`,
  `session_result` or `laps`. A driver who doesn't start the race can be
  missing from the race's files altogether, not marked `dns`. **Take a
  weekend's entry list from qualifying `drivers` / `starting_grid`**, not
  from the race.
- **WARN (Results coverage): Bortoleto (#5) in São Paulo 2025 Qualifying
  (9865)** has no `session_result` row and no laps, but has a grid row (P20,
  no time). This is the same as Stroll and Bearman in Madrid 2026 (see
  "Drivers with no qualifying time can be missing from `session_result`").

## Findings from the 2026 pull (Race + Qualifying, run 24 November 2026)

42 sessions (21 weekends; Bahrain and Saudi Arabia cancelled), 372 requests,
0 rate-limit responses, no undeclared columns. 24 new no-data results, all
`pit` or `team_radio` (below).

### Qualifying `pit` is missing until Mexico City

`pit` returns 404 for **18 of 21 2026 qualifying sessions**, Melbourne
(11230) through Austin (11392). It's present for the last three:
Mexico City (11400, 173 rows), São Paulo (11408, 82) and Las Vegas
(11416, 75). Race `pit` is present for all 21 races.

- So OpenF1 started publishing 2026 qualifying pit data from Mexico City
  (31 October 2026); it isn't a season-wide gap. A `--retry-no-data` run
  later may show whether the earlier sessions get backfilled.
- **Don't build qualifying pit-lane analysis for 2026 before Mexico City.**
  Qualifying `laps.is_pit_out_lap` is still there as a partial substitute.

### `team_radio` is missing only for the first four weekends

`team_radio` returns 404 for both sessions of Melbourne, Shanghai, Suzuka
and Miami (8 no-data rows), and is present for both sessions of every
weekend from Montréal onward (5-40 clips per session). This is better
coverage than the OpenF1 docs suggest ("most events providing no radio
data at all").

### Marina Bay 2026 Qualifying: `position = "RT"` (stored as JSON text)

In `session_result` for 11384, Hadjar (#6, 3 laps, no time) has
`position = "RT"` (retired) instead of a number or null. It's the only text
value seen in `position` anywhere.

- At first, ingest couldn't store this one file's column as `Int64`, so it
  fell back to JSON text for that file only, and `validate_raw.py` crashed
  on any run including 11384 (the numeric range check met text).
- **Handled at ingest:** `session_result.position` is now declared as JSON
  text in `SCHEMAS`, so it's `VARCHAR` in **every** file (`1`, `2`, ...,
  `"RT"` with its quotes). All existing files were re-saved to match.
- **Handled in the validator:** `validate_raw.py` decodes `position` before
  the range check, and reports any non-numeric code as INFO with the
  session and driver (here: `#6 "RT"` in 11384) instead of crashing.
- **Cleaning step: split `position` into a numeric position plus a status
  column.** For example `TRY_CAST(json_extract_string(position, '$') AS
  INTEGER) AS position` (null for codes) and the code itself (`'RT'`) as
  `position_status`, alongside `dnf` / `dns` / `dsq`. Other text codes may
  turn up in later seasons; the validator's INFO lists them.

### Other validator findings (all explained)

Since the `position` fix the validator runs on all 42 sessions, and on 2025
and 2026 together (90 sessions): 7 FAIL, all the known stint and phantom-
driver problems above and in the 2025 findings, and the "RT" INFO.

- **Qualifying non-starters missing from `session_result`** (Results
  coverage WARN): Melbourne 2026 (11230) Verstappen (#3, 2 laps), Sainz
  (#55) and Stroll (#18, 0 laps) have grid rows P20-P22 with no time but no
  result row; all three started the race. Same quirk as Madrid (11365).
- **Phantom driver in Mexico City 2026 Qualifying `pit` (11400)**: one row
  for driver #236 (not in that session's `drivers`), lap 1, 40.4 s. Cleaning:
  drop `pit` rows whose driver isn't in the same session's `drivers`.
- **Stint FAILs, two patterns already seen in 2025:**
  - *Zero-length first stints* (`lap_start` 1, `lap_end` 0), like Monaco
    2025: Montréal (11291) #81, Monte Carlo (11299) #5, #77 and #87.
  - *Garbled stints in a wet race*, like Melbourne 2025: Kuala Lumpur
    (11731, rain in 80 weather rows) #11 and #81, with backwards stints on
    laps 1-3 (e.g. INTERMEDIATE laps 2 to 1).
- **`compound = "UNKNOWN"`** is a literal value, not a null: Montréal
  Qualifying (11287) #81 stint 4, Mexico City race (11404) #18 stint 2.
  Treat it like a missing compound.
- **`position.position = 23` in a 22-car field**: single rows in Melbourne
  (11234), Monte Carlo (11299, 2 rows), Barcelona (11307) and Marina Bay
  (11388). Transient glitches; ignore positions above the field size.
- **`race_control.lap_number = 0`**: a pre-race message in Melbourne
  (11234) ("PINK HEAD PADDING MATERIAL MUST BE USED", 03:08 UTC). Pre-start
  messages can carry lap 0.
- **Slow-lap WARNs:** qualifying ones are garage time. For races, 1,481 of
  1,540 flagged laps fall on lap 1, a pit in- or out-lap, or a Safety Car,
  VSC or red-flag period. Most of the rest are in the two wet races,
  Kuala Lumpur (24) and Zandvoort (14), and yellow-flag laps just before a
  VSC (Montréal laps 29-30).
- 2026 uses only the short VSC wording ("VSC DEPLOYED" / "VSC ENDING"), as
  noted in the 2025 findings.
