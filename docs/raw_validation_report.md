# Raw data validation report

Generated 2026-11-24 01:57 UTC by `pipeline/validate_raw.py` (read-only, nothing was changed).

Filters: `--session-keys [9689, 9693, 9994, 9998, 9935, 9939, 11357, 11361, 11365, 11369]`. Sessions checked: 10. Expected files: 100, present: 98.

## Summary

| Check | FAIL | WARN | INFO |
|---|---|---|---|
| Inventory | 0 | 0 | 2 |
| Schema consistency | 0 | 0 | 0 |
| Key columns | 0 | 0 | 0 |
| Duplicates | 0 | 0 | 0 |
| Empty columns | 0 | 0 | 12 |
| Value ranges | 0 | 10 | 0 |
| Driver counts | 0 | 0 | 0 |
| Cross-file links | 0 | 0 | 0 |
| Results coverage | 0 | 1 | 0 |
| Stint logic | 1 | 0 | 0 |

Empty columns already documented in `docs/data_quirks.md` (not reported again): `drivers.country_code` in 10 file(s) (always null so far), `race_control.qualifying_phase` in 5 file(s) (null outside qualifying).

## Inventory

- **INFO** `pit` session 11357 (2026 Monza Qualifying): no file; logged as no data (404) in _no_data.csv
- **INFO** `pit` session 11365 (2026 Madrid Qualifying): no file; logged as no data (404) in _no_data.csv

## Schema consistency

No issues.

## Key columns

No issues.

## Duplicates

No issues.

## Empty columns

- **INFO** `pit` session 9689 (2025 Melbourne Qualifying): `stop_duration` is entirely null
- **INFO** `race_control` session 9689 (2025 Melbourne Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 9689 (2025 Melbourne Qualifying): `lap_number` is entirely null
- **INFO** `pit` session 9994 (2025 Shanghai Qualifying): `stop_duration` is entirely null
- **INFO** `race_control` session 9994 (2025 Shanghai Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 9994 (2025 Shanghai Qualifying): `lap_number` is entirely null
- **INFO** `pit` session 9935 (2025 Spa-Francorchamps Qualifying): `stop_duration` is entirely null
- **INFO** `race_control` session 9935 (2025 Spa-Francorchamps Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 9935 (2025 Spa-Francorchamps Qualifying): `lap_number` is entirely null
- **INFO** `race_control` session 11357 (2026 Monza Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 11357 (2026 Monza Qualifying): `lap_number` is entirely null
- **INFO** `race_control` session 11365 (2026 Madrid Qualifying): `lap_number` is entirely null

## Value ranges

- **WARN** `laps` session 9689 (2025 Melbourne Qualifying): 78 lap(s) slower than 1.3 x the session median (115.2 s, so over 149.8 s); flagged laps range 150.4-748.3 s (examples: slowest first) (78 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 22 | 6 | 748.3 | False |
  | 10 | 9 | 692.1 | False |
  | 7 | 9 | 671.6 | False |
  | 6 | 6 | 667.2 | False |
  | 55 | 9 | 643.3 | False |

- **WARN** `laps` session 9693 (2025 Melbourne Race): 274 lap(s) slower than 1.3 x the session median (93.9 s, so over 122.1 s); flagged laps range 122.2-191.1 s (examples: slowest first) (274 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 81 | 44 | 191.1 | False |
  | 10 | 2 | 171.3 | False |
  | 31 | 2 | 169.9 | False |
  | 44 | 2 | 169.9 | False |
  | 4 | 2 | 169.9 | False |

- **WARN** `laps` session 9935 (2025 Spa-Francorchamps Qualifying): 81 lap(s) slower than 1.3 x the session median (134.2 s, so over 174.5 s); flagged laps range 175.5-1046.4 s (examples: slowest first) (81 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 1 | 10 | 1046.4 | True |
  | 16 | 8 | 677.5 | True |
  | 6 | 8 | 609.8 | True |
  | 27 | 9 | 594.5 | True |
  | 4 | 9 | 587.2 | True |

- **WARN** `laps` session 9939 (2025 Spa-Francorchamps Race): 80 lap(s) slower than 1.3 x the session median (108.1 s, so over 140.5 s); flagged laps range 163.7-219.0 s (examples: slowest first) (80 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 14 | 1 | 219.0 | False |
  | 12 | 1 | 216.8 | False |
  | 44 | 1 | 214.1 | False |
  | 55 | 1 | 211.8 | False |
  | 18 | 1 | 209.5 | False |

- **WARN** `laps` session 9994 (2025 Shanghai Qualifying): 80 lap(s) slower than 1.3 x the session median (116.7 s, so over 151.7 s); flagged laps range 152.3-1206.0 s (examples: slowest first) (80 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 1 | 4 | 1206.0 | True |
  | 4 | 13 | 1083.8 | True |
  | 81 | 9 | 630.4 | True |
  | 27 | 10 | 621.6 | True |
  | 81 | 15 | 583.2 | True |

- **WARN** `laps` session 9998 (2025 Shanghai Race): 2 lap(s) slower than 1.3 x the session median (97.8 s, so over 127.1 s); flagged laps range 135.9-141.0 s (examples: slowest first) (2 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 14 | 4 | 141.0 | False |
  | 22 | 47 | 135.9 | True |

- **WARN** `laps` session 11357 (2026 Monza Qualifying): 77 lap(s) slower than 1.3 x the session median (107.8 s, so over 140.1 s); flagged laps range 194.0-1500.3 s (examples: slowest first) (77 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 44 | 4 | 1500.3 | True |
  | 3 | 4 | 1229.4 | True |
  | 16 | 7 | 1183.6 | True |
  | 12 | 6 | 787.6 | True |
  | 63 | 6 | 780.5 | True |

- **WARN** `laps` session 11361 (2026 Monza Race): 92 lap(s) slower than 1.3 x the session median (86.8 s, so over 112.8 s); flagged laps range 113.6-1958.3 s (examples: slowest first) (92 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 63 | 4 | 1958.3 | True |
  | 43 | 4 | 1957.2 | True |
  | 3 | 4 | 1956.9 | True |
  | 44 | 4 | 1956.2 | True |
  | 27 | 4 | 1956.0 | True |

- **WARN** `laps` session 11365 (2026 Madrid Qualifying): 66 lap(s) slower than 1.3 x the session median (124.2 s, so over 161.5 s); flagged laps range 163.9-979.6 s (examples: slowest first) (66 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 3 | 7 | 979.6 | True |
  | 5 | 7 | 908.5 | True |
  | 16 | 7 | 868.3 | True |
  | 44 | 7 | 861.3 | True |
  | 1 | 8 | 734.3 | True |

- **WARN** `laps` session 11369 (2026 Madrid Race): 19 lap(s) slower than 1.3 x the session median (99.9 s, so over 129.9 s); flagged laps range 130.3-149.2 s (examples: slowest first) (19 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 12 | 15 | 149.2 | True |
  | 1 | 15 | 146.1 | False |
  | 3 | 15 | 146.0 | True |
  | 55 | 24 | 143.2 | True |
  | 63 | 15 | 142.4 | True |


## Driver counts

No issues.

## Cross-file links

No issues.

## Results coverage

- **WARN** `session_result` session 11365 (2026 Madrid Qualifying): 2 driver(s) in drivers but with no session_result row: #18 STR, #87 BEA (2 row(s))

  Examples (up to 5):

  | driver_number | name_acronym | has_grid_row | dns_elsewhere |
  |---|---|---|---|
  | 18 | STR | True | False |
  | 87 | BEA | True | False |


## Stint logic

- **FAIL** `stints` session 9693 (2025 Melbourne Race): lap_end before lap_start (5 row(s))

  Examples (up to 5):

  | driver_number | stint_number | lap_start | lap_end |
  |---|---|---|---|
  | 5 | 3 | 3 | 2 |
  | 5 | 5 | 4 | 3 |
  | 30 | 3 | 3 | 1 |
  | 87 | 3 | 3 | 2 |
  | 87 | 5 | 4 | 3 |

