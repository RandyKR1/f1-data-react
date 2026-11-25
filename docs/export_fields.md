# Exported fields

`pipeline/export.py` writes the static JSON the app loads:

- `public/data/index.json`: the schedule (every meeting, each with its sessions)
- `public/data/sessions/<session_key>.json`: one file per session with raw data

These files hold only the fields the app uses, plus a few kept on purpose. The
fields are set by allow-lists in `export.py`: `EXPORT_FIELDS` for session files
and `INDEX_FIELDS` for the index. A field that OpenF1 adds later stays out of the
exports until someone adds it to a list. Exported fields keep the API's names,
order and value formats, so a row from a file looks like the same row from the
API with some fields removed. If a kept field wasn't sent for a session (for
example, `points` in qualifying), the row leaves it out rather than setting it
to null.

**Nothing is lost.** `data/f1.duckdb` (built from the raw Parquet files in
`data/raw/`) still has every field the API returned, so use it for analysis.
These lists only control what goes to the browser.

Why we trimmed: the files were 36.9 MB raw (2.10 MB brotli) before and
17.7 MB raw (1.43 MB brotli) after. Most of the saving comes from dropping the
lap speed and mini-sector fields.

To export a dropped field: add it to the allow-list in `export.py`, update this
file, re-run `python pipeline/export.py`, and check it with
`python pipeline/compare_export.py --session-keys ...`.

Notes on the tables below:

- "Used" means something in `src/` reads the field: directly, by destructuring,
  as chart or table data, or for sorting and filtering. The evidence comes from
  the field audit of 25 November 2026.
- `meeting_key` and `session_key` are dropped from every row. Each session
  file covers a single session, and the app takes the session key from the URL.

## Session files

### session (single object): every field kept

Kept: `session_key`, `session_type`, `session_name`, `date_start`, `date_end`,
`meeting_key`, `circuit_key`, `circuit_short_name`, `country_key`,
`country_code`, `country_name`, `location`, `gmt_offset`, `year`, `is_cancelled`

Dropped: none.

Why: the app reads only `session_type`, `session_name` and `meeting_key`
(`src/api.js`, results pages). The other fields are kept so the object matches
`getSession()` exactly. They cost about 0.03 MB across all files.

### meeting (single object): every field kept

Kept: `meeting_key`, `meeting_name`, `meeting_official_name`, `location`,
`country_key`, `country_code`, `country_name`, `country_flag`, `circuit_key`,
`circuit_short_name`, `circuit_type`, `circuit_info_url`, `circuit_image`,
`gmt_offset`, `date_start`, `date_end`, `year`, `is_cancelled`

Dropped: none.

Why: the app reads only `meeting_official_name` (page titles). The other
fields are kept so the object matches `getMeeting()` exactly. They cost about
0.07 MB across all files.

### drivers

| Kept | Why |
|---|---|
| `driver_number` | Joins every other endpoint to its driver |
| `first_name`, `last_name` | Driver pages, team radio, driver picker, chart labels |
| `name_acronym` | Driver picker buttons |
| `team_name` | Driver picker grouping, teammate styling, driver pages |
| `team_colour` | Chart and picker colours |
| `headshot_url` | Driver page photo |

| Dropped | Why |
|---|---|
| `broadcast_name`, `full_name` | Not used; the app builds names from `first_name` and `last_name` |
| `country_code` | Not used, and always null so far |
| `meeting_key`, `session_key` | Implied by the file |

### laps

| Kept | Why |
|---|---|
| `driver_number` | Grouping by driver, chart series |
| `lap_number` | Lap chart x-axis and sort order |
| `date_start` | Not read yet. The Ghost Car feature will need it. |
| `duration_sector_1`, `duration_sector_2`, `duration_sector_3` | Sector columns, sector charts, complete-lap check |
| `is_pit_out_lap` | Lap chart skips out-laps |
| `lap_duration` | Lap chart, best laps, fallback results |

| Dropped | Why |
|---|---|
| `segments_sector_1`, `segments_sector_2`, `segments_sector_3` | Not used. These mini-sector lists are most of the lap data. |
| `i1_speed`, `i2_speed`, `st_speed` | Not used (speed-trap readings) |
| `meeting_key`, `session_key` | Implied by the file |

### stints

| Kept | Why |
|---|---|
| `driver_number` | Driver filter, driver names |
| `lap_start`, `lap_end` | Stint length |
| `compound` | Longest stint by compound |

| Dropped | Why |
|---|---|
| `stint_number`, `tyre_age_at_start` | Not used |
| `meeting_key`, `session_key` | Implied by the file |

Qualifying files keep their stints, even though no qualifying page reads them
today.

### session_result

| Kept | Why |
|---|---|
| `position` | Classification and sorting. Can be a text code such as `"RT"`. |
| `driver_number` | Row identity, links to driver pages |
| `number_of_laps` | Laps column, tie-break when sorting |
| `points` | Points column (races only; absent in qualifying) |
| `dnf`, `dns`, `dsq` | Result status |
| `duration` | Best lap, Q1/Q2/Q3 times or race time (a number, list or null) |
| `gap_to_leader` | Gap column (a number, text such as `"+1 LAP"`, a list or null) |

| Dropped | Why |
|---|---|
| `meeting_key`, `session_key` | Implied by the file |

### weather

| Kept | Why |
|---|---|
| `date` | Not read yet. Kept as the timeline key for future features. |
| `air_temperature`, `track_temperature` | High and low temperatures |
| `humidity` | Average humidity |
| `rainfall` | Whether it rained (0 or 1) |
| `wind_direction`, `wind_speed` | Max wind |

| Dropped | Why |
|---|---|
| `pressure` | Not used |
| `meeting_key`, `session_key` | Implied by the file |

### race_control

| Kept | Why |
|---|---|
| `date` | Message key and de-duplication |
| `category`, `flag` | Message heading |
| `message` | Message text, key and de-duplication |

| Dropped | Why |
|---|---|
| `driver_number`, `lap_number`, `scope`, `sector`, `qualifying_phase` | Not used |
| `meeting_key`, `session_key` | Implied by the file |

### team_radio

| Kept | Why |
|---|---|
| `date` | Not read yet. Kept as the timeline key for future features. |
| `driver_number` | Grouping and filtering by driver |
| `recording_url` | The audio player |

| Dropped | Why |
|---|---|
| `meeting_key`, `session_key` | Implied by the file |

### position (only in files whose session_result is empty)

| Kept | Why |
|---|---|
| `date` | Sorting, to find each driver's latest position |
| `driver_number`, `position` | Fallback classification (`buildFallbackResults`) |

| Dropped | Why |
|---|---|
| `meeting_key`, `session_key` | Implied by the file |

## index.json

Top level: `generated_at` (UTC) and `last_exported_date_end` (the latest
`date_end` among exported sessions, or null). The pipeline and the future
loader use these.

### meetings[]

| Kept | Why |
|---|---|
| `meeting_key` | Links each meeting to its sessions |
| `meeting_official_name` | The meeting's display name |
| `location` | Search track list |
| `date_start` | Search: year when `year` is missing; sort order |
| `year` | Search year list |
| `is_cancelled` | Not read yet. Search may use it to hide cancelled rounds. |
| `sessions` | Nested sessions (see below) |

| Dropped | Why |
|---|---|
| `meeting_name`, `date_end`, `gmt_offset` | Not used in search |
| `country_key`, `country_code`, `country_name`, `country_flag` | Not used in search (the full meeting is in each session file) |
| `circuit_key`, `circuit_short_name`, `circuit_type`, `circuit_info_url`, `circuit_image` | Not used in search |

### meetings[].sessions[]

| Kept | Why |
|---|---|
| `session_key` | Search option value, route to the results page and the session file |
| `session_type` | Picks the results route |
| `session_name` | Search option label |
| `date_start` | Search option label, sort order |
| `date_end` | Sets `last_exported_date_end`; shows when a session has finished |
| `meeting_key` | Links back to the meeting |
| `location`, `year` | The live fallback `getSessionsFor(location, year)` filters on these, so a static search can filter the same way |
| `is_cancelled` | Marks cancelled sessions |
| `exported` | Added by the pipeline: true if `sessions/<session_key>.json` exists, so the app knows whether to load the file or call the API |

| Dropped | Why |
|---|---|
| `circuit_key`, `circuit_short_name`, `gmt_offset` | Not used in search |
| `country_key`, `country_code`, `country_name` | Not used in search |
