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
- Still possible: a column that's empty in every row of one file (for example
  `drivers.country_code`, which is always null so far) has no type to detect.
  If it has values in other files, read with `union_by_name=true`.

## 2025 Australian GP was wet: many stints

The 2025 Australian GP (session 9693) was a wet, chaotic race. It has 106 stint
rows (up to 7 stints for one driver) and only 928 lap rows (5 DNFs). A typical
dry race has about 40-70 stints (2-3 per driver) and 1,000-1,400 laps.

- Don't treat high stint counts or low lap counts as errors without checking
  the race first.
