# Raw data validation report

Generated 2026-11-24 15:49 UTC by `pipeline/validate_raw.py` (read-only, nothing was changed).

Filters: `--year [2025]`, `--session-name ['Race', 'Qualifying']`. Sessions checked: 48. Expected files: 480, present: 479.

## Summary

| Check | FAIL | WARN | INFO |
|---|---|---|---|
| Inventory | 0 | 0 | 1 |
| Schema consistency | 0 | 0 | 0 |
| Key columns | 0 | 0 | 0 |
| Duplicates | 0 | 0 | 0 |
| Empty columns | 0 | 0 | 77 |
| Value ranges | 0 | 47 | 0 |
| Driver counts | 0 | 1 | 0 |
| Cross-file links | 1 | 0 | 0 |
| Results coverage | 0 | 1 | 0 |
| Stint logic | 2 | 0 | 0 |

Empty columns already documented in `docs/data_quirks.md` (not reported again): `drivers.country_code` in 48 file(s) (always null so far), `race_control.qualifying_phase` in 24 file(s) (null outside qualifying).

## Inventory

- **INFO** `laps` session 9900 (2025 Baku Qualifying): no file; logged as no data (404) in _no_data.csv

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

- **WARN** `stints` session 9951 (2025 Spielberg Qualifying): compound outside the known set (or missing) (8 row(s))

  Examples (up to 5):

  | driver_number | stint_number | compound | lap_start | lap_end |
  |---|---|---|---|---|
  | 14 | 2 |  | 3 | 5 |
  | 10 | 2 |  | 4 | 6 |
  | 5 | 2 |  | 4 | 6 |
  | 23 | 3 |  | 7 | 9 |
  | 16 | 2 |  | 4 | 6 |


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


## Results coverage

- **WARN** `session_result` session 9865 (2025 São Paulo Qualifying): 1 driver(s) in drivers but with no session_result row: #5 BOR

  Examples (up to 5):

  | driver_number | name_acronym | has_grid_row | dns_elsewhere |
  |---|---|---|---|
  | 5 | BOR | True | False |


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

