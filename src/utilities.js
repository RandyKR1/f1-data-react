/** File for storing re-usable functions throughout the app */

// URL prefix for each OpenF1 session_type that has a results page
export const SESSION_ROUTES = {
  Practice: "practice-results",
  Qualifying: "qualy-results",
  Race: "race-results",
};

export const FALLBACK_RESULTS_MESSAGE =
  "Official results aren't published for this session yet. The order below is based on live position data and may not include penalties.";

/* ---------- Generic data helpers ---------- */

// Group an array of objects into { [item[key]]: item[] }
export const groupBy = (array, key) =>
  array.reduce((acc, item) => {
    (acc[item[key]] ??= []).push(item);
    return acc;
  }, {});

// Function to get the object with the highest value for a given key
export const getMaxBy = (data, key) => {
  if (!data.length) return null;
  return data.reduce((currentMax, item) =>
    item[key] > (currentMax[key] ?? -Infinity) ? item : currentMax);
};

// Function to get the object with the lowest value for a given key
export const getMinBy = (data, key) => {
  if (!data.length) return null;
  return data.reduce((currentMin, item) =>
    item[key] < (currentMin[key] ?? Infinity) ? item : currentMin);
};

// Function to get the average value of a given key
export const getAverageBy = (data, key) => {
  if (!data.length) return null;
  const total = data.reduce((sum, item) => sum + (item[key] ?? 0), 0);
  return (total / data.length).toFixed(0);
};

/* ---------- Unit conversions ---------- */

// OpenF1 wind_speed is in metres per second.
// 1 m/s = 3.6 km/h exactly; 1 mph is defined as exactly 0.44704 m/s.
export const msToKph = (ms) => (ms * 3.6).toFixed(1);
export const msToMph = (ms) => (ms / 0.44704).toFixed(1);

// Function to convert temperature from Celsius to Fahrenheit (exact)
export const toFahrenheit = (celsius) => {
  return ((celsius * 9) / 5 + 32).toFixed(1);
};

// Function to convert wind direction from degrees to compass direction
export const getWindDirection = (deg) => {
  const directions = [
    "N", "NNE", "NE", "ENE",
    "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW",
    "W", "WNW", "NW", "NNW"
  ];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
};

// Function to check if any item in the array reports rainfall
export const rainfall = (data, key) => {
  if (!data.length) return null;
  return data.some(item => item[key] === 1) ? "Yes" : "No";
};

/* ---------- Time formatting ---------- */
// All formatters convert to whole milliseconds first, then use integer math.
// OpenF1 times are given to the millisecond, so this reproduces them exactly
// and avoids floating-point slips like 59.99999 -> "0:59.1000".

const pad = (n, length = 2) => String(n).padStart(length, "0");

// 91.743 -> "1:31.743"
export const lapToMinFormat = (seconds) => {
  if (seconds == null || Number.isNaN(seconds)) return "–";
  const totalMs = Math.round(seconds * 1000);
  const minutes = Math.floor(totalMs / 60000);
  const secs = Math.floor(totalMs / 1000) % 60;
  return `${minutes}:${pad(secs)}.${pad(totalMs % 1000, 3)}`;
};

// 5504.742 -> "1:31:44.742"
export const formatRaceTime = (seconds) => {
  if (seconds == null || Number.isNaN(seconds)) return "–";
  const totalMs = Math.round(seconds * 1000);
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor(totalMs / 60000) % 60;
  const secs = Math.floor(totalMs / 1000) % 60;
  return `${hours}:${pad(minutes)}:${pad(secs)}.${pad(totalMs % 1000, 3)}`;
};

// 22.457 -> "+22.457s", "+1 LAP" stays as-is, 0 / null -> "–"
export const formatGap = (gap) => {
  if (gap == null || gap === 0) return "–";
  if (typeof gap === "string") return gap;
  return `+${gap.toFixed(3)}s`;
};

/* ---------- Drivers ---------- */
// Driver numbers are only guaranteed unique within a session, so always build
// this map from the same session's /drivers response.

export const buildDriverMap = (drivers) =>
  new Map(drivers.map((d) => [d.driver_number, d]));

// Last name for display; falls back to "#44" so every driver still shows something distinct
export const getDriverName = (driverMap, driverNumber) =>
  driverMap.get(Number(driverNumber))?.last_name ?? `#${driverNumber}`;

export const getTeamColor = (driver) =>
  driver?.team_colour ? `#${driver.team_colour}` : "#6c757d";

// Black or white text, whichever is readable on the given background colour
export const getReadableTextColor = (hex) => {
  const value = parseInt(hex.replace("#", ""), 16);
  const r = (value >> 16) & 255, g = (value >> 8) & 255, b = value & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#000" : "#fff";
};

/* ---------- Laps & results ---------- */

export const isCompleteLap = (lap) =>
  lap.lap_duration != null &&
  lap.duration_sector_1 != null &&
  lap.duration_sector_2 != null &&
  lap.duration_sector_3 != null;

// Map of driver_number -> fastest lap that has all three sector times
export const getBestLapsByDriver = (laps) => {
  const best = new Map();
  for (const lap of laps) {
    if (!isCompleteLap(lap)) continue;
    const current = best.get(lap.driver_number);
    if (!current || lap.lap_duration < current.lap_duration) best.set(lap.driver_number, lap);
  }
  return best;
};

// Unclassified drivers (no position) go last; ties broken by laps completed
export const sortByPosition = (results) =>
  [...results].sort(
    (a, b) =>
      (a.position ?? Infinity) - (b.position ?? Infinity) ||
      (b.number_of_laps ?? 0) - (a.number_of_laps ?? 0)
  );

// Driver numbers of the top n finishers
export const getTopDrivers = (results, n = 2) =>
  sortByPosition(results).slice(0, n).map((r) => r.driver_number);

// "DSQ" / "DNS" / "DNF", or null if the driver was classified normally
export const getResultStatus = (result) => {
  if (result?.dsq) return "DSQ";
  if (result?.dns) return "DNS";
  if (result?.dnf) return "DNF";
  return null;
};

// "P3", "P18 (DNF)", "DSQ", or "N/A"
export const formatPosition = (result) => {
  if (!result) return "N/A";
  const status = getResultStatus(result);
  if (result.position == null) return status ?? "N/A";
  return status ? `P${result.position} (${status})` : `P${result.position}`;
};

// Official best lap from session_result: a number for practice,
// [Q1, Q2, Q3] for qualifying (take the fastest), total time for races (not a lap)
export const getOfficialBestLap = (result, sessionType) => {
  if (!result || sessionType === "Race") return null;
  if (Array.isArray(result.duration)) {
    const times = result.duration.filter((t) => t != null);
    return times.length ? Math.min(...times) : null;
  }
  return result.duration ?? null;
};

// Used only when session_result is empty (results not published yet).
// Builds rows in the same shape as session_result from live position data.
export const buildFallbackResults = (positions, laps, isRace) => {
  const latestPosition = new Map();
  const byDate = [...positions].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  for (const p of byDate) latestPosition.set(p.driver_number, p.position);

  const lapsByDriver = groupBy(laps, "driver_number");
  return [...latestPosition].map(([driverNumber, position]) => {
    const driverLaps = lapsByDriver[driverNumber] ?? [];
    const best = getMinBy(driverLaps.filter((l) => l.lap_duration != null), "lap_duration");
    return {
      driver_number: driverNumber,
      position,
      number_of_laps: driverLaps.length,
      duration: isRace ? null : best?.lap_duration ?? null,
      gap_to_leader: null,
      dnf: false,
      dns: false,
      dsq: false,
      points: null,
    };
  });
};
