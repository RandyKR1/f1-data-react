# Raw data validation report

Generated 2026-11-24 16:18 UTC by `pipeline/validate_raw.py` (read-only, nothing was changed).

Filters: `--year [2025, 2026]`, `--session-name ['Race', 'Qualifying']`. Sessions checked: 90. Expected files: 900, present: 873.

## Summary

| Check | FAIL | WARN | INFO |
|---|---|---|---|
| Inventory | 0 | 0 | 27 |
| Schema consistency | 0 | 0 | 0 |
| Key columns | 0 | 0 | 0 |
| Duplicates | 0 | 0 | 0 |
| Empty columns | 0 | 0 | 118 |
| Value ranges | 0 | 96 | 1 |
| Driver counts | 0 | 1 | 0 |
| Cross-file links | 2 | 0 | 0 |
| Results coverage | 0 | 3 | 0 |
| Stint logic | 5 | 0 | 0 |

Empty columns already documented in `docs/data_quirks.md` (not reported again): `drivers.country_code` in 90 file(s) (always null so far), `race_control.qualifying_phase` in 45 file(s) (null outside qualifying).

## Inventory

- **INFO** `laps` session 9900 (2025 Baku Qualifying): no file; logged as no data (404) in _no_data.csv
- **INFO** `pit` session 11230 (2026 Melbourne Qualifying): no file; logged as no data (404) in _no_data.csv
- **INFO** `team_radio` session 11230 (2026 Melbourne Qualifying): no file; logged as no data (404) in _no_data.csv
- **INFO** `team_radio` session 11234 (2026 Melbourne Race): no file; logged as no data (404) in _no_data.csv
- **INFO** `pit` session 11241 (2026 Shanghai Qualifying): no file; logged as no data (404) in _no_data.csv
- **INFO** `team_radio` session 11241 (2026 Shanghai Qualifying): no file; logged as no data (404) in _no_data.csv
- **INFO** `team_radio` session 11245 (2026 Shanghai Race): no file; logged as no data (404) in _no_data.csv
- **INFO** `pit` session 11249 (2026 Suzuka Qualifying): no file; logged as no data (404) in _no_data.csv
- **INFO** `team_radio` session 11249 (2026 Suzuka Qualifying): no file; logged as no data (404) in _no_data.csv
- **INFO** `team_radio` session 11253 (2026 Suzuka Race): no file; logged as no data (404) in _no_data.csv
- **INFO** `pit` session 11276 (2026 Miami Gardens Qualifying): no file; logged as no data (404) in _no_data.csv
- **INFO** `team_radio` session 11276 (2026 Miami Gardens Qualifying): no file; logged as no data (404) in _no_data.csv
- **INFO** `team_radio` session 11280 (2026 Miami Gardens Race): no file; logged as no data (404) in _no_data.csv
- **INFO** `pit` session 11287 (2026 Montréal Qualifying): no file; logged as no data (404) in _no_data.csv
- **INFO** `pit` session 11295 (2026 Monte Carlo Qualifying): no file; logged as no data (404) in _no_data.csv
- **INFO** `pit` session 11303 (2026 Barcelona Qualifying): no file; logged as no data (404) in _no_data.csv
- **INFO** `pit` session 11311 (2026 Spielberg Qualifying): no file; logged as no data (404) in _no_data.csv
- **INFO** `pit` session 11322 (2026 Silverstone Qualifying): no file; logged as no data (404) in _no_data.csv
- **INFO** `pit` session 11330 (2026 Spa-Francorchamps Qualifying): no file; logged as no data (404) in _no_data.csv
- **INFO** `pit` session 11338 (2026 Budapest Qualifying): no file; logged as no data (404) in _no_data.csv
- **INFO** `pit` session 11349 (2026 Zandvoort Qualifying): no file; logged as no data (404) in _no_data.csv
- **INFO** `pit` session 11357 (2026 Monza Qualifying): no file; logged as no data (404) in _no_data.csv
- **INFO** `pit` session 11365 (2026 Madrid Qualifying): no file; logged as no data (404) in _no_data.csv
- **INFO** `pit` session 11373 (2026 Baku Qualifying): no file; logged as no data (404) in _no_data.csv
- **INFO** `pit` session 11730 (2026 Kuala Lumpur Qualifying): no file; logged as no data (404) in _no_data.csv
- **INFO** `pit` session 11384 (2026 Marina Bay Qualifying): no file; logged as no data (404) in _no_data.csv
- **INFO** `pit` session 11392 (2026 Austin Qualifying): no file; logged as no data (404) in _no_data.csv

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
- **INFO** `pit` session 10002 (2025 Suzuka Qualifying): `stop_duration` is entirely null
- **INFO** `race_control` session 10002 (2025 Suzuka Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 10002 (2025 Suzuka Qualifying): `lap_number` is entirely null
- **INFO** `race_control` session 10002 (2025 Suzuka Qualifying): `sector` is entirely null
- **INFO** `race_control` session 10006 (2025 Suzuka Race): `sector` is entirely null
- **INFO** `pit` session 10010 (2025 Sakhir Qualifying): `stop_duration` is entirely null
- **INFO** `race_control` session 10010 (2025 Sakhir Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 10010 (2025 Sakhir Qualifying): `lap_number` is entirely null
- **INFO** `pit` session 10018 (2025 Jeddah Qualifying): `stop_duration` is entirely null
- **INFO** `race_control` session 10018 (2025 Jeddah Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 10018 (2025 Jeddah Qualifying): `lap_number` is entirely null
- **INFO** `pit` session 10029 (2025 Miami Gardens Qualifying): `stop_duration` is entirely null
- **INFO** `race_control` session 10029 (2025 Miami Gardens Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 10029 (2025 Miami Gardens Qualifying): `lap_number` is entirely null
- **INFO** `pit` session 9983 (2025 Imola Qualifying): `stop_duration` is entirely null
- **INFO** `race_control` session 9983 (2025 Imola Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 9983 (2025 Imola Qualifying): `lap_number` is entirely null
- **INFO** `pit` session 9975 (2025 Monaco Qualifying): `stop_duration` is entirely null
- **INFO** `race_control` session 9975 (2025 Monaco Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 9975 (2025 Monaco Qualifying): `lap_number` is entirely null
- **INFO** `pit` session 9967 (2025 Barcelona Qualifying): `stop_duration` is entirely null
- **INFO** `race_control` session 9967 (2025 Barcelona Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 9967 (2025 Barcelona Qualifying): `lap_number` is entirely null
- **INFO** `race_control` session 9967 (2025 Barcelona Qualifying): `sector` is entirely null
- **INFO** `pit` session 9959 (2025 Montréal Qualifying): `stop_duration` is entirely null
- **INFO** `race_control` session 9959 (2025 Montréal Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 9959 (2025 Montréal Qualifying): `lap_number` is entirely null
- **INFO** `pit` session 9951 (2025 Spielberg Qualifying): `stop_duration` is entirely null
- **INFO** `race_control` session 9951 (2025 Spielberg Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 9951 (2025 Spielberg Qualifying): `lap_number` is entirely null
- **INFO** `pit` session 9943 (2025 Silverstone Qualifying): `stop_duration` is entirely null
- **INFO** `race_control` session 9943 (2025 Silverstone Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 9943 (2025 Silverstone Qualifying): `lap_number` is entirely null
- **INFO** `pit` session 9935 (2025 Spa-Francorchamps Qualifying): `stop_duration` is entirely null
- **INFO** `race_control` session 9935 (2025 Spa-Francorchamps Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 9935 (2025 Spa-Francorchamps Qualifying): `lap_number` is entirely null
- **INFO** `pit` session 9924 (2025 Budapest Qualifying): `stop_duration` is entirely null
- **INFO** `race_control` session 9924 (2025 Budapest Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 9924 (2025 Budapest Qualifying): `lap_number` is entirely null
- **INFO** `pit` session 9916 (2025 Zandvoort Qualifying): `stop_duration` is entirely null
- **INFO** `race_control` session 9916 (2025 Zandvoort Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 9916 (2025 Zandvoort Qualifying): `lap_number` is entirely null
- **INFO** `pit` session 9908 (2025 Monza Qualifying): `stop_duration` is entirely null
- **INFO** `race_control` session 9908 (2025 Monza Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 9908 (2025 Monza Qualifying): `lap_number` is entirely null
- **INFO** `pit` session 9900 (2025 Baku Qualifying): `stop_duration` is entirely null
- **INFO** `race_control` session 9900 (2025 Baku Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 9900 (2025 Baku Qualifying): `lap_number` is entirely null
- **INFO** `pit` session 9892 (2025 Marina Bay Qualifying): `stop_duration` is entirely null
- **INFO** `race_control` session 9892 (2025 Marina Bay Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 9892 (2025 Marina Bay Qualifying): `lap_number` is entirely null
- **INFO** `pit` session 9884 (2025 Austin Qualifying): `stop_duration` is entirely null
- **INFO** `race_control` session 9884 (2025 Austin Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 9884 (2025 Austin Qualifying): `lap_number` is entirely null
- **INFO** `pit` session 9873 (2025 Mexico City Qualifying): `stop_duration` is entirely null
- **INFO** `race_control` session 9873 (2025 Mexico City Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 9873 (2025 Mexico City Qualifying): `lap_number` is entirely null
- **INFO** `race_control` session 9873 (2025 Mexico City Qualifying): `sector` is entirely null
- **INFO** `pit` session 9865 (2025 São Paulo Qualifying): `stop_duration` is entirely null
- **INFO** `race_control` session 9865 (2025 São Paulo Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 9865 (2025 São Paulo Qualifying): `lap_number` is entirely null
- **INFO** `pit` session 9854 (2025 Las Vegas Qualifying): `stop_duration` is entirely null
- **INFO** `race_control` session 9854 (2025 Las Vegas Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 9854 (2025 Las Vegas Qualifying): `lap_number` is entirely null
- **INFO** `laps` session 9858 (2025 Las Vegas Race): `i2_speed` is entirely null
- **INFO** `pit` session 9846 (2025 Lusail Qualifying): `stop_duration` is entirely null
- **INFO** `race_control` session 9846 (2025 Lusail Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 9846 (2025 Lusail Qualifying): `lap_number` is entirely null
- **INFO** `pit` session 9835 (2025 Yas Island Qualifying): `stop_duration` is entirely null
- **INFO** `race_control` session 9835 (2025 Yas Island Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 9835 (2025 Yas Island Qualifying): `lap_number` is entirely null
- **INFO** `race_control` session 11230 (2026 Melbourne Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 11230 (2026 Melbourne Qualifying): `lap_number` is entirely null
- **INFO** `race_control` session 11241 (2026 Shanghai Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 11241 (2026 Shanghai Qualifying): `lap_number` is entirely null
- **INFO** `race_control` session 11249 (2026 Suzuka Qualifying): `lap_number` is entirely null
- **INFO** `race_control` session 11249 (2026 Suzuka Qualifying): `sector` is entirely null
- **INFO** `race_control` session 11276 (2026 Miami Gardens Qualifying): `lap_number` is entirely null
- **INFO** `race_control` session 11287 (2026 Montréal Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 11287 (2026 Montréal Qualifying): `lap_number` is entirely null
- **INFO** `race_control` session 11295 (2026 Monte Carlo Qualifying): `lap_number` is entirely null
- **INFO** `race_control` session 11303 (2026 Barcelona Qualifying): `lap_number` is entirely null
- **INFO** `race_control` session 11311 (2026 Spielberg Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 11311 (2026 Spielberg Qualifying): `lap_number` is entirely null
- **INFO** `race_control` session 11322 (2026 Silverstone Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 11322 (2026 Silverstone Qualifying): `lap_number` is entirely null
- **INFO** `race_control` session 11330 (2026 Spa-Francorchamps Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 11330 (2026 Spa-Francorchamps Qualifying): `lap_number` is entirely null
- **INFO** `race_control` session 11338 (2026 Budapest Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 11338 (2026 Budapest Qualifying): `lap_number` is entirely null
- **INFO** `race_control` session 11349 (2026 Zandvoort Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 11349 (2026 Zandvoort Qualifying): `lap_number` is entirely null
- **INFO** `race_control` session 11357 (2026 Monza Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 11357 (2026 Monza Qualifying): `lap_number` is entirely null
- **INFO** `race_control` session 11365 (2026 Madrid Qualifying): `lap_number` is entirely null
- **INFO** `race_control` session 11373 (2026 Baku Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 11373 (2026 Baku Qualifying): `lap_number` is entirely null
- **INFO** `race_control` session 11730 (2026 Kuala Lumpur Qualifying): `lap_number` is entirely null
- **INFO** `race_control` session 11730 (2026 Kuala Lumpur Qualifying): `sector` is entirely null
- **INFO** `race_control` session 11384 (2026 Marina Bay Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 11384 (2026 Marina Bay Qualifying): `lap_number` is entirely null
- **INFO** `race_control` session 11392 (2026 Austin Qualifying): `lap_number` is entirely null
- **INFO** `pit` session 11400 (2026 Mexico City Qualifying): `stop_duration` is entirely null
- **INFO** `race_control` session 11400 (2026 Mexico City Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 11400 (2026 Mexico City Qualifying): `lap_number` is entirely null
- **INFO** `pit` session 11408 (2026 São Paulo Qualifying): `stop_duration` is entirely null
- **INFO** `race_control` session 11408 (2026 São Paulo Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 11408 (2026 São Paulo Qualifying): `lap_number` is entirely null
- **INFO** `pit` session 11416 (2026 Las Vegas Qualifying): `stop_duration` is entirely null
- **INFO** `race_control` session 11416 (2026 Las Vegas Qualifying): `driver_number` is entirely null
- **INFO** `race_control` session 11416 (2026 Las Vegas Qualifying): `lap_number` is entirely null
- **INFO** `race_control` session 11420 (2026 Las Vegas Race): `driver_number` is entirely null

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

- **WARN** `laps` session 9835 (2025 Yas Island Qualifying): 73 lap(s) slower than 1.3 x the session median (112.0 s, so over 145.6 s); flagged laps range 166.7-904.3 s (examples: slowest first) (73 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 1 | 13 | 904.3 | True |
  | 4 | 7 | 770.3 | True |
  | 81 | 7 | 728.0 | True |
  | 6 | 7 | 658.8 | True |
  | 22 | 7 | 639.7 | True |

- **WARN** `laps` session 9839 (2025 Yas Island Race): 1 lap(s) slower than 1.3 x the session median (89.7 s, so over 116.6 s); flagged laps range 117.8-117.8 s (examples: slowest first)

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 30 | 22 | 117.8 | True |

- **WARN** `laps` session 9846 (2025 Lusail Qualifying): 73 lap(s) slower than 1.3 x the session median (108.0 s, so over 140.4 s); flagged laps range 140.8-1038.9 s (examples: slowest first) (73 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 4 | 7 | 1038.9 | True |
  | 81 | 7 | 1008.1 | True |
  | 12 | 11 | 799.0 | True |
  | 14 | 10 | 760.0 | True |
  | 1 | 17 | 752.7 | True |

- **WARN** `laps` session 9850 (2025 Lusail Race): 62 lap(s) slower than 1.3 x the session median (86.9 s, so over 113.0 s); flagged laps range 113.1-160.7 s (examples: slowest first) (62 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 31 | 9 | 160.7 | True |
  | 6 | 55 | 158.9 | False |
  | 81 | 8 | 147.4 | False |
  | 1 | 8 | 145.8 | True |
  | 4 | 8 | 145.1 | False |

- **WARN** `laps` session 9854 (2025 Las Vegas Qualifying): 45 lap(s) slower than 1.3 x the session median (119.0 s, so over 154.7 s); flagged laps range 154.7-942.8 s (examples: slowest first) (45 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 81 | 9 | 942.8 | True |
  | 31 | 10 | 911.7 | True |
  | 4 | 9 | 887.3 | True |
  | 87 | 10 | 833.9 | True |
  | 30 | 10 | 830.1 | True |

- **WARN** `laps` session 9858 (2025 Las Vegas Race): 25 lap(s) slower than 1.3 x the session median (96.4 s, so over 125.3 s); flagged laps range 125.6-161.6 s (examples: slowest first) (25 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 5 | 2 | 161.6 | True |
  | 23 | 15 | 143.5 | True |
  | 30 | 3 | 140.3 | True |
  | 10 | 3 | 138.5 | True |
  | 12 | 3 | 138.1 | True |

- **WARN** `laps` session 9865 (2025 São Paulo Qualifying): 82 lap(s) slower than 1.3 x the session median (96.6 s, so over 125.6 s); flagged laps range 125.8-797.1 s (examples: slowest first) (82 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 63 | 7 | 797.1 | True |
  | 4 | 10 | 780.1 | True |
  | 12 | 6 | 746.5 | True |
  | 30 | 10 | 727.6 | True |
  | 18 | 10 | 717.6 | True |

- **WARN** `laps` session 9869 (2025 São Paulo Race): 114 lap(s) slower than 1.3 x the session median (75.0 s, so over 97.5 s); flagged laps range 97.9-125.8 s (examples: slowest first) (114 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 44 | 2 | 125.8 | False |
  | 4 | 5 | 123.6 | False |
  | 12 | 5 | 123.2 | False |
  | 16 | 5 | 121.9 | False |
  | 81 | 5 | 120.7 | False |

- **WARN** `laps` session 9873 (2025 Mexico City Qualifying): 80 lap(s) slower than 1.3 x the session median (98.6 s, so over 128.2 s); flagged laps range 181.4-875.9 s (examples: slowest first) (80 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 6 | 13 | 875.9 | True |
  | 6 | 7 | 709.1 | True |
  | 30 | 7 | 698.3 | True |
  | 22 | 7 | 690.9 | True |
  | 4 | 10 | 688.5 | True |

- **WARN** `laps` session 9877 (2025 Mexico City Race): 5 lap(s) slower than 1.3 x the session median (82.9 s, so over 107.8 s); flagged laps range 107.8-118.5 s (examples: slowest first) (5 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 30 | 3 | 118.5 | True |
  | 44 | 24 | 111.9 | True |
  | 22 | 37 | 110.3 | True |
  | 31 | 70 | 107.8 | False |
  | 55 | 47 | 107.8 | True |

- **WARN** `laps` session 9884 (2025 Austin Qualifying): 75 lap(s) slower than 1.3 x the session median (122.9 s, so over 159.8 s); flagged laps range 163.9-1150.5 s (examples: slowest first) (75 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 1 | 10 | 1150.5 | True |
  | 10 | 3 | 982.6 | True |
  | 43 | 3 | 904.3 | True |
  | 63 | 2 | 899.8 | True |
  | 31 | 3 | 888.3 | True |

- **WARN** `laps` session 9888 (2025 Austin Race): 19 lap(s) slower than 1.3 x the session median (100.3 s, so over 130.4 s); flagged laps range 130.9-140.2 s (examples: slowest first) (19 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 23 | 8 | 140.2 | True |
  | 1 | 8 | 138.6 | False |
  | 16 | 8 | 136.8 | False |
  | 22 | 8 | 136.2 | False |
  | 27 | 8 | 136.0 | False |

- **WARN** `laps` session 9892 (2025 Marina Bay Qualifying): 76 lap(s) slower than 1.3 x the session median (123.5 s, so over 160.6 s); flagged laps range 162.5-1166.1 s (examples: slowest first) (76 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 12 | 6 | 1166.1 | True |
  | 4 | 9 | 1043.8 | True |
  | 81 | 9 | 1017.3 | True |
  | 44 | 10 | 989.8 | True |
  | 16 | 10 | 946.5 | True |

- **WARN** `laps` session 9896 (2025 Marina Bay Race): 1 lap(s) slower than 1.3 x the session median (98.1 s, so over 127.5 s); flagged laps range 128.7-128.7 s (examples: slowest first)

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 44 | 61 | 128.7 | False |

- **WARN** `laps` session 9904 (2025 Baku Race): 70 lap(s) slower than 1.3 x the session median (106.4 s, so over 138.3 s); flagged laps range 140.4-192.2 s (examples: slowest first) (70 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 1 | 4 | 192.2 | False |
  | 55 | 4 | 192.1 | False |
  | 30 | 4 | 190.3 | False |
  | 12 | 4 | 190.2 | False |
  | 63 | 4 | 188.9 | False |

- **WARN** `laps` session 9908 (2025 Monza Qualifying): 81 lap(s) slower than 1.3 x the session median (106.1 s, so over 137.9 s); flagged laps range 140.0-1143.1 s (examples: slowest first) (81 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 63 | 7 | 1143.1 | True |
  | 16 | 9 | 806.5 | True |
  | 44 | 9 | 799.9 | True |
  | 22 | 7 | 778.8 | True |
  | 87 | 10 | 764.9 | True |

- **WARN** `laps` session 9912 (2025 Monza Race): 2 lap(s) slower than 1.3 x the session median (83.7 s, so over 108.8 s); flagged laps range 110.7-117.0 s (examples: slowest first) (2 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 18 | 50 | 117.0 | True |
  | 31 | 52 | 110.7 | True |

- **WARN** `laps` session 9916 (2025 Zandvoort Qualifying): 79 lap(s) slower than 1.3 x the session median (96.3 s, so over 125.2 s); flagged laps range 161.7-846.7 s (examples: slowest first) (79 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 81 | 7 | 846.7 | True |
  | 4 | 7 | 812.7 | True |
  | 6 | 7 | 770.9 | True |
  | 14 | 6 | 748.9 | True |
  | 55 | 7 | 717.7 | True |

- **WARN** `laps` session 9920 (2025 Zandvoort Race): 178 lap(s) slower than 1.3 x the session median (76.5 s, so over 99.5 s); flagged laps range 99.7-131.0 s (examples: slowest first) (178 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 81 | 54 | 131.0 | True |
  | 55 | 52 | 130.1 | True |
  | 4 | 54 | 128.9 | True |
  | 81 | 55 | 127.6 | False |
  | 4 | 55 | 127.2 | False |

- **WARN** `laps` session 9924 (2025 Budapest Qualifying): 69 lap(s) slower than 1.3 x the session median (102.4 s, so over 133.1 s); flagged laps range 145.9-1176.0 s (examples: slowest first) (69 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 14 | 10 | 1176.0 | True |
  | 12 | 4 | 1088.8 | True |
  | 63 | 4 | 1081.4 | True |
  | 6 | 13 | 1052.8 | True |
  | 14 | 7 | 774.3 | True |

- **WARN** `laps` session 9928 (2025 Budapest Race): 2 lap(s) slower than 1.3 x the session median (82.4 s, so over 107.1 s); flagged laps range 108.6-110.1 s (examples: slowest first) (2 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 43 | 14 | 110.1 | True |
  | 27 | 42 | 108.6 | True |

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

- **WARN** `laps` session 9943 (2025 Silverstone Qualifying): 71 lap(s) slower than 1.3 x the session median (109.9 s, so over 142.9 s); flagged laps range 165.2-1762.5 s (examples: slowest first) (71 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 14 | 4 | 1762.5 | True |
  | 10 | 7 | 1038.4 | True |
  | 30 | 4 | 1004.1 | True |
  | 55 | 4 | 1002.0 | True |
  | 23 | 5 | 996.0 | True |

- **WARN** `laps` session 9947 (2025 Silverstone Race): 152 lap(s) slower than 1.3 x the session median (104.9 s, so over 136.4 s); flagged laps range 136.4-177.1 s (examples: slowest first) (152 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 81 | 17 | 177.1 | False |
  | 1 | 17 | 176.9 | False |
  | 4 | 17 | 175.4 | False |
  | 18 | 17 | 174.4 | False |
  | 27 | 17 | 174.1 | False |

- **WARN** `laps` session 9951 (2025 Spielberg Qualifying): 87 lap(s) slower than 1.3 x the session median (89.8 s, so over 116.7 s); flagged laps range 117.0-849.8 s (examples: slowest first) (87 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 4 | 7 | 849.8 | True |
  | 43 | 13 | 848.3 | True |
  | 10 | 13 | 843.4 | True |
  | 23 | 16 | 835.8 | True |
  | 44 | 13 | 831.9 | True |

- **WARN** `laps` session 9955 (2025 Spielberg Race): 51 lap(s) slower than 1.3 x the session median (70.8 s, so over 92.0 s); flagged laps range 94.6-119.1 s (examples: slowest first) (51 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 27 | 1 | 119.1 | False |
  | 6 | 1 | 117.4 | False |
  | 22 | 1 | 114.7 | False |
  | 4 | 2 | 114.4 | False |
  | 81 | 2 | 113.5 | False |

- **WARN** `laps` session 9959 (2025 Montréal Qualifying): 83 lap(s) slower than 1.3 x the session median (94.1 s, so over 122.3 s); flagged laps range 126.9-829.7 s (examples: slowest first) (83 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 1 | 3 | 829.7 | False |
  | 63 | 9 | 770.5 | False |
  | 12 | 6 | 762.7 | False |
  | 12 | 9 | 762.3 | False |
  | 27 | 6 | 758.3 | False |

- **WARN** `laps` session 9963 (2025 Montréal Race): 63 lap(s) slower than 1.3 x the session median (77.0 s, so over 100.1 s); flagged laps range 101.8-127.5 s (examples: slowest first) (63 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 63 | 70 | 127.5 | True |
  | 63 | 68 | 126.8 | True |
  | 1 | 70 | 126.7 | True |
  | 12 | 70 | 126.4 | True |
  | 31 | 69 | 125.7 | True |

- **WARN** `laps` session 9967 (2025 Barcelona Qualifying): 70 lap(s) slower than 1.3 x the session median (100.9 s, so over 131.2 s); flagged laps range 132.8-1240.2 s (examples: slowest first) (70 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 63 | 4 | 1240.2 | True |
  | 4 | 10 | 1118.5 | True |
  | 1 | 7 | 1112.3 | True |
  | 44 | 10 | 1024.9 | True |
  | 63 | 7 | 996.7 | True |

- **WARN** `laps` session 9971 (2025 Barcelona Race): 71 lap(s) slower than 1.3 x the session median (81.5 s, so over 106.0 s); flagged laps range 106.8-148.8 s (examples: slowest first) (71 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 81 | 56 | 148.8 | True |
  | 4 | 56 | 146.7 | True |
  | 1 | 56 | 145.1 | True |
  | 14 | 55 | 138.7 | True |
  | 55 | 56 | 137.7 | True |

- **WARN** `laps` session 9975 (2025 Monaco Qualifying): 59 lap(s) slower than 1.3 x the session median (92.3 s, so over 120.0 s); flagged laps range 132.3-965.5 s (examples: slowest first) (59 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 1 | 12 | 965.5 | False |
  | 30 | 14 | 883.6 | False |
  | 4 | 14 | 818.0 | False |
  | 22 | 14 | 807.0 | False |
  | 1 | 15 | 792.4 | False |

- **WARN** `laps` session 9979 (2025 Monaco Race): 46 lap(s) slower than 1.3 x the session median (77.7 s, so over 101.0 s); flagged laps range 101.2-146.0 s (examples: slowest first) (46 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 5 | 1 | 146.0 | False |
  | 87 | 1 | 140.3 | False |
  | 10 | 1 | 112.6 | False |
  | 27 | 2 | 112.4 | False |
  | 30 | 2 | 112.3 | False |

- **WARN** `laps` session 9983 (2025 Imola Qualifying): 79 lap(s) slower than 1.3 x the session median (102.5 s, so over 133.2 s); flagged laps range 139.9-1964.7 s (examples: slowest first) (79 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 1 | 6 | 1964.7 | True |
  | 81 | 7 | 1834.2 | True |
  | 63 | 6 | 1747.8 | True |
  | 10 | 6 | 1742.4 | True |
  | 55 | 10 | 1729.5 | True |

- **WARN** `laps` session 9987 (2025 Imola Race): 149 lap(s) slower than 1.3 x the session median (82.0 s, so over 106.6 s); flagged laps range 106.7-136.8 s (examples: slowest first) (149 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 44 | 30 | 136.8 | True |
  | 16 | 30 | 135.4 | True |
  | 1 | 47 | 135.0 | True |
  | 4 | 47 | 134.5 | True |
  | 87 | 30 | 133.4 | True |

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

- **WARN** `laps` session 10002 (2025 Suzuka Qualifying): 73 lap(s) slower than 1.3 x the session median (115.3 s, so over 149.9 s); flagged laps range 154.6-1647.0 s (examples: slowest first) (73 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 4 | 10 | 1647.0 | True |
  | 4 | 7 | 942.1 | True |
  | 16 | 7 | 914.9 | True |
  | 81 | 10 | 907.9 | True |
  | 55 | 13 | 890.4 | True |

- **WARN** `laps` session 10010 (2025 Sakhir Qualifying): 70 lap(s) slower than 1.3 x the session median (118.7 s, so over 154.3 s); flagged laps range 156.7-1786.1 s (examples: slowest first) (70 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 16 | 5 | 1786.1 | True |
  | 81 | 7 | 1275.9 | True |
  | 7 | 8 | 1253.2 | True |
  | 4 | 7 | 1244.4 | True |
  | 6 | 8 | 1210.0 | True |

- **WARN** `laps` session 10014 (2025 Sakhir Race): 46 lap(s) slower than 1.3 x the session median (98.6 s, so over 128.2 s); flagged laps range 129.3-166.1 s (examples: slowest first) (46 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 81 | 33 | 166.1 | True |
  | 16 | 33 | 158.1 | True |
  | 63 | 33 | 157.8 | True |
  | 4 | 33 | 156.6 | True |
  | 18 | 33 | 152.6 | True |

- **WARN** `laps` session 10018 (2025 Jeddah Qualifying): 71 lap(s) slower than 1.3 x the session median (120.6 s, so over 156.8 s); flagged laps range 165.7-1465.8 s (examples: slowest first) (71 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 22 | 14 | 1465.8 | True |
  | 1 | 14 | 1237.3 | True |
  | 4 | 10 | 1053.3 | True |
  | 4 | 7 | 1042.9 | True |
  | 16 | 17 | 999.9 | True |

- **WARN** `laps` session 10022 (2025 Jeddah Race): 55 lap(s) slower than 1.3 x the session median (94.6 s, so over 123.0 s); flagged laps range 123.6-175.6 s (examples: slowest first) (55 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 1 | 3 | 175.6 | False |
  | 81 | 3 | 175.2 | False |
  | 63 | 3 | 173.5 | False |
  | 16 | 3 | 171.9 | False |
  | 12 | 3 | 170.9 | False |

- **WARN** `laps` session 10029 (2025 Miami Gardens Qualifying): 87 lap(s) slower than 1.3 x the session median (115.1 s, so over 149.6 s); flagged laps range 151.1-1116.1 s (examples: slowest first) (87 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 81 | 11 | 1116.1 | True |
  | 1 | 7 | 729.4 | True |
  | 81 | 8 | 655.4 | True |
  | 12 | 9 | 639.8 | True |
  | 63 | 9 | 630.6 | True |

- **WARN** `laps` session 10033 (2025 Miami Gardens Race): 25 lap(s) slower than 1.3 x the session median (91.4 s, so over 118.8 s); flagged laps range 119.1-135.1 s (examples: slowest first) (25 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 44 | 29 | 135.1 | True |
  | 16 | 29 | 131.2 | False |
  | 14 | 29 | 128.7 | True |
  | 63 | 29 | 128.4 | False |
  | 55 | 29 | 125.3 | False |

- **WARN** `laps` session 11230 (2026 Melbourne Qualifying): 85 lap(s) slower than 1.3 x the session median (107.0 s, so over 139.1 s); flagged laps range 139.2-1604.4 s (examples: slowest first) (85 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 5 | 6 | 1604.4 | False |
  | 6 | 3 | 897.2 | False |
  | 30 | 20 | 896.2 | False |
  | 41 | 21 | 881.1 | False |
  | 11 | 4 | 852.9 | True |

- **WARN** `laps` session 11234 (2026 Melbourne Race): 54 lap(s) slower than 1.3 x the session median (85.2 s, so over 110.8 s); flagged laps range 111.6-1168.1 s (examples: slowest first) (54 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 18 | 34 | 1168.1 | False |
  | 14 | 13 | 1069.5 | False |
  | 77 | 12 | 192.0 | False |
  | 18 | 11 | 132.3 | False |
  | 30 | 12 | 130.4 | True |

- **WARN** `laps` session 11241 (2026 Shanghai Qualifying): 71 lap(s) slower than 1.3 x the session median (117.0 s, so over 152.1 s); flagged laps range 159.2-982.5 s (examples: slowest first) (71 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 27 | 7 | 982.5 | True |
  | 12 | 4 | 900.3 | True |
  | 63 | 4 | 885.8 | True |
  | 44 | 7 | 819.0 | True |
  | 1 | 7 | 768.5 | True |

- **WARN** `laps` session 11245 (2026 Shanghai Race): 55 lap(s) slower than 1.3 x the session median (98.4 s, so over 127.9 s); flagged laps range 128.0-167.2 s (examples: slowest first) (55 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 12 | 11 | 167.2 | True |
  | 63 | 11 | 162.7 | True |
  | 44 | 11 | 162.3 | True |
  | 16 | 11 | 161.7 | True |
  | 10 | 11 | 158.6 | True |

- **WARN** `laps` session 11249 (2026 Suzuka Qualifying): 76 lap(s) slower than 1.3 x the session median (112.8 s, so over 146.6 s); flagged laps range 147.2-952.4 s (examples: slowest first) (76 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 12 | 4 | 952.4 | True |
  | 44 | 7 | 767.7 | True |
  | 16 | 7 | 763.8 | True |
  | 16 | 13 | 682.9 | True |
  | 6 | 13 | 593.8 | True |

- **WARN** `laps` session 11253 (2026 Suzuka Race): 103 lap(s) slower than 1.3 x the session median (95.9 s, so over 124.7 s); flagged laps range 124.9-159.8 s (examples: slowest first) (103 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 12 | 23 | 159.8 | True |
  | 44 | 23 | 157.4 | True |
  | 16 | 25 | 151.5 | False |
  | 44 | 25 | 151.3 | False |
  | 77 | 24 | 150.9 | False |

- **WARN** `laps` session 11276 (2026 Miami Gardens Qualifying): 85 lap(s) slower than 1.3 x the session median (117.0 s, so over 152.1 s); flagged laps range 152.3-1457.6 s (examples: slowest first) (85 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 3 | 4 | 1457.6 | True |
  | 87 | 7 | 1162.6 | True |
  | 12 | 7 | 918.6 | True |
  | 63 | 7 | 906.1 | True |
  | 1 | 7 | 880.7 | True |

- **WARN** `laps` session 11280 (2026 Miami Gardens Race): 111 lap(s) slower than 1.3 x the session median (94.7 s, so over 123.1 s); flagged laps range 128.0-171.4 s (examples: slowest first) (111 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 27 | 7 | 171.4 | False |
  | 30 | 6 | 163.1 | False |
  | 16 | 11 | 151.9 | False |
  | 1 | 11 | 150.9 | False |
  | 12 | 11 | 150.2 | False |

- **WARN** `laps` session 11287 (2026 Montréal Qualifying): 68 lap(s) slower than 1.3 x the session median (91.4 s, so over 118.8 s); flagged laps range 119.1-1065.6 s (examples: slowest first) (68 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 3 | 5 | 1065.6 | False |
  | 63 | 6 | 1047.5 | False |
  | 12 | 6 | 1047.0 | False |
  | 6 | 5 | 1012.4 | False |
  | 41 | 12 | 647.6 | False |

- **WARN** `laps` session 11291 (2026 Montréal Race): 48 lap(s) slower than 1.3 x the session median (77.5 s, so over 100.8 s); flagged laps range 101.0-133.8 s (examples: slowest first) (48 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 87 | 30 | 133.8 | False |
  | 31 | 30 | 131.0 | False |
  | 16 | 31 | 125.5 | False |
  | 44 | 31 | 123.0 | False |
  | 77 | 29 | 121.8 | False |

- **WARN** `laps` session 11295 (2026 Monte Carlo Qualifying): 66 lap(s) slower than 1.3 x the session median (87.0 s, so over 113.1 s); flagged laps range 115.7-1135.4 s (examples: slowest first) (66 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 3 | 8 | 1135.4 | False |
  | 12 | 10 | 1124.5 | False |
  | 16 | 10 | 1107.1 | False |
  | 44 | 10 | 1087.6 | False |
  | 1 | 11 | 1084.9 | False |

- **WARN** `laps` session 11299 (2026 Monte Carlo Race): 130 lap(s) slower than 1.3 x the session median (79.1 s, so over 102.8 s); flagged laps range 103.3-2264.6 s (examples: slowest first) (130 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 44 | 68 | 2264.6 | False |
  | 63 | 68 | 2264.3 | False |
  | 6 | 68 | 2264.2 | False |
  | 12 | 68 | 2262.7 | False |
  | 81 | 68 | 2255.9 | False |

- **WARN** `laps` session 11303 (2026 Barcelona Qualifying): 71 lap(s) slower than 1.3 x the session median (104.4 s, so over 135.7 s); flagged laps range 138.7-1857.0 s (examples: slowest first) (71 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 63 | 8 | 1857.0 | True |
  | 16 | 4 | 1209.0 | True |
  | 63 | 4 | 1197.6 | True |
  | 3 | 4 | 1196.0 | True |
  | 44 | 4 | 1194.1 | True |

- **WARN** `laps` session 11307 (2026 Barcelona Race): 12 lap(s) slower than 1.3 x the session median (84.2 s, so over 109.5 s); flagged laps range 109.5-861.5 s (examples: slowest first) (12 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 23 | 35 | 861.5 | True |
  | 16 | 62 | 125.3 | False |
  | 87 | 40 | 121.4 | True |
  | 3 | 41 | 120.8 | True |
  | 77 | 15 | 120.8 | True |

- **WARN** `laps` session 11311 (2026 Spielberg Qualifying): 87 lap(s) slower than 1.3 x the session median (91.5 s, so over 119.0 s); flagged laps range 127.7-1316.7 s (examples: slowest first) (87 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 44 | 4 | 1316.7 | True |
  | 16 | 4 | 1304.3 | True |
  | 3 | 4 | 1291.4 | True |
  | 27 | 15 | 1205.5 | False |
  | 1 | 4 | 1199.1 | True |

- **WARN** `laps` session 11315 (2026 Spielberg Race): 21 lap(s) slower than 1.3 x the session median (73.1 s, so over 95.0 s); flagged laps range 96.1-113.4 s (examples: slowest first) (21 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 12 | 25 | 113.4 | True |
  | 87 | 25 | 109.9 | True |
  | 14 | 25 | 109.4 | True |
  | 18 | 25 | 108.6 | True |
  | 14 | 50 | 108.5 | True |

- **WARN** `laps` session 11322 (2026 Silverstone Qualifying): 83 lap(s) slower than 1.3 x the session median (109.7 s, so over 142.6 s); flagged laps range 144.0-1540.8 s (examples: slowest first) (83 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 44 | 6 | 1540.8 | True |
  | 16 | 7 | 1463.6 | True |
  | 63 | 6 | 1231.5 | True |
  | 81 | 7 | 1191.8 | True |
  | 12 | 7 | 1182.9 | True |

- **WARN** `laps` session 11326 (2026 Silverstone Race): 74 lap(s) slower than 1.3 x the session median (96.0 s, so over 124.8 s); flagged laps range 124.8-177.9 s (examples: slowest first) (74 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 55 | 49 | 177.9 | True |
  | 16 | 51 | 173.0 | False |
  | 63 | 51 | 172.2 | False |
  | 44 | 51 | 171.3 | False |
  | 16 | 50 | 168.6 | False |

- **WARN** `laps` session 11330 (2026 Spa-Francorchamps Qualifying): 70 lap(s) slower than 1.3 x the session median (136.9 s, so over 178.0 s); flagged laps range 186.1-1181.1 s (examples: slowest first) (70 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 3 | 4 | 1181.1 | True |
  | 12 | 10 | 1136.5 | True |
  | 1 | 7 | 1133.9 | True |
  | 3 | 7 | 1132.8 | True |
  | 44 | 10 | 1115.2 | True |

- **WARN** `laps` session 11334 (2026 Spa-Francorchamps Race): 73 lap(s) slower than 1.3 x the session median (112.2 s, so over 145.9 s); flagged laps range 146.2-168.0 s (examples: slowest first) (73 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 12 | 2 | 168.0 | False |
  | 16 | 2 | 167.1 | False |
  | 3 | 2 | 166.7 | False |
  | 81 | 2 | 165.2 | False |
  | 44 | 2 | 165.0 | False |

- **WARN** `laps` session 11338 (2026 Budapest Qualifying): 85 lap(s) slower than 1.3 x the session median (102.7 s, so over 133.5 s); flagged laps range 134.0-1427.9 s (examples: slowest first) (85 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 44 | 4 | 1427.9 | True |
  | 10 | 12 | 1223.9 | False |
  | 6 | 4 | 1189.1 | True |
  | 81 | 5 | 1111.3 | True |
  | 1 | 5 | 1062.3 | True |

- **WARN** `laps` session 11342 (2026 Budapest Race): 3 lap(s) slower than 1.3 x the session median (86.4 s, so over 112.3 s); flagged laps range 112.4-140.0 s (examples: slowest first) (3 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 11 | 48 | 140.0 | False |
  | 23 | 55 | 115.5 | True |
  | 55 | 44 | 112.4 | True |

- **WARN** `laps` session 11349 (2026 Zandvoort Qualifying): 85 lap(s) slower than 1.3 x the session median (92.7 s, so over 120.5 s); flagged laps range 137.1-975.7 s (examples: slowest first) (85 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 16 | 8 | 975.7 | True |
  | 3 | 8 | 884.9 | True |
  | 22 | 10 | 700.1 | True |
  | 5 | 11 | 697.2 | True |
  | 43 | 9 | 683.4 | True |

- **WARN** `laps` session 11353 (2026 Zandvoort Race): 96 lap(s) slower than 1.3 x the session median (78.5 s, so over 102.0 s); flagged laps range 102.0-1944.8 s (examples: slowest first) (96 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 41 | 3 | 1944.8 | True |
  | 10 | 3 | 1770.4 | True |
  | 43 | 3 | 1770.4 | True |
  | 22 | 3 | 1770.0 | True |
  | 14 | 3 | 1769.4 | True |

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

- **WARN** `laps` session 11373 (2026 Baku Qualifying): 38 lap(s) slower than 1.3 x the session median (122.3 s, so over 159.0 s); flagged laps range 159.7-822.4 s (examples: slowest first) (38 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 43 | 10 | 822.4 | True |
  | 44 | 17 | 806.1 | True |
  | 6 | 16 | 764.9 | True |
  | 10 | 11 | 729.7 | True |
  | 10 | 16 | 721.1 | True |

- **WARN** `laps` session 11377 (2026 Baku Race): 112 lap(s) slower than 1.3 x the session median (109.1 s, so over 141.8 s); flagged laps range 142.2-251.4 s (examples: slowest first) (112 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 43 | 36 | 251.4 | False |
  | 63 | 32 | 181.0 | True |
  | 30 | 37 | 168.7 | True |
  | 11 | 31 | 167.7 | True |
  | 55 | 31 | 167.5 | True |

- **WARN** `laps` session 11384 (2026 Marina Bay Qualifying): 72 lap(s) slower than 1.3 x the session median (121.4 s, so over 157.8 s); flagged laps range 160.7-1093.1 s (examples: slowest first) (72 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 3 | 4 | 1093.1 | True |
  | 87 | 7 | 914.2 | True |
  | 55 | 11 | 573.2 | True |
  | 31 | 10 | 557.4 | True |
  | 44 | 20 | 552.9 | True |

- **WARN** `laps` session 11388 (2026 Marina Bay Race): 6 lap(s) slower than 1.3 x the session median (99.2 s, so over 129.0 s); flagged laps range 129.6-144.2 s (examples: slowest first) (6 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 23 | 38 | 144.2 | True |
  | 63 | 39 | 137.1 | False |
  | 11 | 38 | 135.8 | False |
  | 30 | 39 | 131.0 | False |
  | 27 | 39 | 130.4 | False |

- **WARN** `laps` session 11392 (2026 Austin Qualifying): 64 lap(s) slower than 1.3 x the session median (123.2 s, so over 160.2 s); flagged laps range 167.4-1303.7 s (examples: slowest first) (64 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 16 | 4 | 1303.7 | True |
  | 44 | 4 | 1242.7 | True |
  | 6 | 4 | 1204.0 | True |
  | 3 | 4 | 1192.2 | True |
  | 30 | 4 | 1126.1 | True |

- **WARN** `laps` session 11396 (2026 Austin Race): 22 lap(s) slower than 1.3 x the session median (102.0 s, so over 132.6 s); flagged laps range 133.1-154.5 s (examples: slowest first) (22 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 5 | 51 | 154.5 | True |
  | 14 | 43 | 139.8 | True |
  | 63 | 52 | 138.7 | False |
  | 1 | 52 | 138.3 | False |
  | 44 | 52 | 138.3 | False |

- **WARN** `laps` session 11400 (2026 Mexico City Qualifying): 83 lap(s) slower than 1.3 x the session median (97.8 s, so over 127.1 s); flagged laps range 132.0-1133.6 s (examples: slowest first) (83 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 3 | 9 | 1133.6 | True |
  | 3 | 6 | 1031.3 | True |
  | 1 | 7 | 879.8 | True |
  | 43 | 9 | 827.5 | True |
  | 10 | 9 | 824.7 | True |

- **WARN** `laps` session 11404 (2026 Mexico City Race): 140 lap(s) slower than 1.3 x the session median (82.3 s, so over 107.0 s); flagged laps range 107.0-2434.2 s (examples: slowest first) (140 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 16 | 46 | 2434.2 | True |
  | 12 | 46 | 2433.8 | True |
  | 3 | 46 | 2433.4 | True |
  | 44 | 46 | 2429.3 | True |
  | 1 | 46 | 2429.2 | True |

- **WARN** `laps` session 11408 (2026 São Paulo Qualifying): 34 lap(s) slower than 1.3 x the session median (97.9 s, so over 127.3 s); flagged laps range 128.8-1549.0 s (examples: slowest first) (34 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 43 | 2 | 1549.0 | True |
  | 77 | 2 | 1543.9 | True |
  | 63 | 20 | 862.2 | True |
  | 87 | 19 | 841.2 | True |
  | 16 | 19 | 835.6 | True |

- **WARN** `laps` session 11412 (2026 São Paulo Race): 47 lap(s) slower than 1.3 x the session median (79.1 s, so over 102.8 s); flagged laps range 103.0-124.4 s (examples: slowest first) (47 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 63 | 17 | 124.4 | True |
  | 87 | 17 | 123.1 | True |
  | 27 | 62 | 117.0 | True |
  | 44 | 62 | 116.4 | False |
  | 11 | 16 | 115.2 | True |

- **WARN** `laps` session 11416 (2026 Las Vegas Qualifying): 51 lap(s) slower than 1.3 x the session median (112.7 s, so over 146.5 s); flagged laps range 154.3-990.7 s (examples: slowest first) (51 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 1 | 8 | 990.7 | True |
  | 3 | 8 | 924.6 | True |
  | 81 | 10 | 785.8 | True |
  | 6 | 10 | 771.4 | True |
  | 44 | 10 | 740.8 | True |

- **WARN** `laps` session 11420 (2026 Las Vegas Race): 113 lap(s) slower than 1.3 x the session median (98.8 s, so over 128.4 s); flagged laps range 130.8-179.2 s (examples: slowest first) (113 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 44 | 21 | 179.2 | True |
  | 3 | 21 | 162.6 | False |
  | 10 | 21 | 162.5 | False |
  | 63 | 21 | 162.3 | False |
  | 6 | 21 | 162.2 | False |

- **WARN** `laps` session 11730 (2026 Kuala Lumpur Qualifying): 58 lap(s) slower than 1.3 x the session median (129.6 s, so over 168.5 s); flagged laps range 181.7-1193.9 s (examples: slowest first) (58 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 43 | 7 | 1193.9 | True |
  | 63 | 4 | 1156.7 | True |
  | 12 | 4 | 1151.8 | True |
  | 44 | 4 | 1141.9 | True |
  | 3 | 4 | 1136.0 | True |

- **WARN** `laps` session 11731 (2026 Kuala Lumpur Race): 209 lap(s) slower than 1.3 x the session median (104.7 s, so over 136.1 s); flagged laps range 136.5-239.8 s (examples: slowest first) (209 row(s))

  Examples (up to 5):

  | driver_number | lap_number | lap_duration | is_pit_out_lap |
  |---|---|---|---|
  | 3 | 2 | 239.8 | False |
  | 44 | 2 | 235.6 | False |
  | 12 | 2 | 234.6 | False |
  | 16 | 2 | 234.0 | False |
  | 1 | 2 | 232.0 | False |

- **WARN** `race_control` session 11234 (2026 Melbourne Race): lap_number below 1

  Examples (up to 5):

  | lap_number | meeting_key | session_key | date | driver_number | category | flag | scope | sector | qualifying_phase | message | year | folder_year |
  |---|---|---|---|---|---|---|---|---|---|---|---|---|
  | 0 | 1279 | 11234 | 2026-03-08T03:08:08+00:00 | <NA> | Other |  |  | <NA> | <NA> | PINK HEAD PADDING MATERIAL MUST BE USED | 2026 | 2026 |

- **WARN** `position` session 11234 (2026 Melbourne Race): position outside 1 to the season's driver count

  Examples (up to 5):

  | folder_year | position | date | session_key | meeting_key | driver_number | year |
  |---|---|---|---|---|---|---|
  | 2026 | 23 | 2026-03-08T04:30:39.735000+00:00 | 11234 | 1279 | 27 | 2026 |

- **WARN** `position` session 11299 (2026 Monte Carlo Race): position outside 1 to the season's driver count (2 row(s))

  Examples (up to 5):

  | folder_year | position | date | session_key | meeting_key | driver_number | year |
  |---|---|---|---|---|---|---|
  | 2026 | 23 | 2026-06-07T13:49:47.379000+00:00 | 11299 | 1286 | 43 | 2026 |
  | 2026 | 23 | 2026-06-07T14:33:05.888000+00:00 | 11299 | 1286 | 16 | 2026 |

- **WARN** `position` session 11307 (2026 Barcelona Race): position outside 1 to the season's driver count

  Examples (up to 5):

  | folder_year | position | date | session_key | meeting_key | driver_number | year |
  |---|---|---|---|---|---|---|
  | 2026 | 23 | 2026-06-14T13:46:38.364000+00:00 | 11307 | 1287 | 55 | 2026 |

- **WARN** `position` session 11388 (2026 Marina Bay Race): position outside 1 to the season's driver count

  Examples (up to 5):

  | folder_year | position | date | session_key | meeting_key | driver_number | year |
  |---|---|---|---|---|---|---|
  | 2026 | 23 | 2026-10-11T12:52:17.057000+00:00 | 11388 | 1296 | 10 | 2026 |

- **WARN** `stints` session 9951 (2025 Spielberg Qualifying): compound outside the known set (or missing) (8 row(s))

  Examples (up to 5):

  | driver_number | stint_number | compound | lap_start | lap_end |
  |---|---|---|---|---|
  | 14 | 2 |  | 3 | 5 |
  | 10 | 2 |  | 4 | 6 |
  | 5 | 2 |  | 4 | 6 |
  | 23 | 3 |  | 7 | 9 |
  | 16 | 2 |  | 4 | 6 |

- **WARN** `stints` session 11287 (2026 Montréal Qualifying): compound outside the known set (or missing)

  Examples (up to 5):

  | driver_number | stint_number | compound | lap_start | lap_end |
  |---|---|---|---|---|
  | 81 | 4 | UNKNOWN | 17 | 21 |

- **WARN** `stints` session 11404 (2026 Mexico City Race): compound outside the known set (or missing)

  Examples (up to 5):

  | driver_number | stint_number | compound | lap_start | lap_end |
  |---|---|---|---|---|
  | 18 | 2 | UNKNOWN | 4 | 5 |

- **INFO** `session_result` session 11384 (2026 Marina Bay Qualifying): non-numeric position code(s): #6 "RT"

  Examples (up to 5):

  | driver_number | position_text |
  |---|---|
  | 6 | "RT" |


## Driver counts

- **WARN** `drivers` session 9971 (2025 Barcelona Race): 19 drivers, expected 20 for 2025

## Cross-file links

- **FAIL** `stints` session 9951 (2025 Spielberg Qualifying): driver_number(s) [2, 3, 7, 8, 9, 11, 15, 17, 20, 21, 24, 25] not in this session's drivers file (12 row(s))

  Examples (up to 5):

  | driver_number | n_rows |
  |---|---|
  | 2 | 1 |
  | 3 | 1 |
  | 7 | 1 |
  | 8 | 1 |
  | 9 | 1 |

- **FAIL** `pit` session 11400 (2026 Mexico City Qualifying): driver_number(s) [236] not in this session's drivers file

  Examples (up to 5):

  | driver_number | n_rows |
  |---|---|
  | 236 | 1 |


## Results coverage

- **WARN** `session_result` session 9865 (2025 São Paulo Qualifying): 1 driver(s) in drivers but with no session_result row: #5 BOR

  Examples (up to 5):

  | driver_number | name_acronym | has_grid_row | dns_elsewhere |
  |---|---|---|---|
  | 5 | BOR | True | False |

- **WARN** `session_result` session 11230 (2026 Melbourne Qualifying): 3 driver(s) in drivers but with no session_result row: #3 VER, #18 STR, #55 SAI (3 row(s))

  Examples (up to 5):

  | driver_number | name_acronym | has_grid_row | dns_elsewhere |
  |---|---|---|---|
  | 3 | VER | True | False |
  | 18 | STR | True | False |
  | 55 | SAI | True | False |

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

- **FAIL** `stints` session 9979 (2025 Monaco Race): lap_end before lap_start (4 row(s))

  Examples (up to 5):

  | driver_number | stint_number | lap_start | lap_end |
  |---|---|---|---|
  | 5 | 1 | 1 | 0 |
  | 10 | 1 | 1 | 0 |
  | 22 | 1 | 1 | 0 |
  | 87 | 1 | 1 | 0 |

- **FAIL** `stints` session 11291 (2026 Montréal Race): lap_end before lap_start

  Examples (up to 5):

  | driver_number | stint_number | lap_start | lap_end |
  |---|---|---|---|
  | 81 | 1 | 1 | 0 |

- **FAIL** `stints` session 11299 (2026 Monte Carlo Race): lap_end before lap_start (3 row(s))

  Examples (up to 5):

  | driver_number | stint_number | lap_start | lap_end |
  |---|---|---|---|
  | 5 | 1 | 1 | 0 |
  | 77 | 1 | 1 | 0 |
  | 87 | 1 | 1 | 0 |

- **FAIL** `stints` session 11731 (2026 Kuala Lumpur Race): lap_end before lap_start (2 row(s))

  Examples (up to 5):

  | driver_number | stint_number | lap_start | lap_end |
  |---|---|---|---|
  | 11 | 2 | 2 | 1 |
  | 81 | 3 | 3 | 2 |

