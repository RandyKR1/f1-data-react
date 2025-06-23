/** File for storing re-usable functions throughout the app */

// Function for filtering duplicates from a data set
export const filterDupes = (array, key) => {
  const seen = new Set();
  const result = array.filter((arr) => {
    if (arr[key] && !seen.has(arr[key])) {
      seen.add(arr[key]);
      return true;
    }
    return false;
  });

  return result;
};

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

// Function to convert speed from KPH to MPH
export const toMPH = (kph) => {
  return (kph * 0.621371).toFixed(1);
};

// Function to convert temperature from Celsius to Fahrenheit
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

export const lapToMinFormat = (duration) => {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  const milliseconds = Math.round((duration % 1) * 1000);

  return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
};


export const formatRaceTime = (durationInSeconds) => {
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  const seconds = Math.floor(durationInSeconds % 60);
  const milliseconds = Math.round((durationInSeconds % 1) * 1000);

  return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds
    .toString()
    .padStart(2, '0')}s ${milliseconds.toString().padStart(3, '0')}ms`;
};


export const mapDriverNames = (data, drivers) => {
  return data.map((item) => {
    const driver = drivers.find((d) => d.driver_number === item.driver_number);
    return {
      ...item,
      driver_name: driver?.last_name || "Unknown Driver Name",
    };
  });
};


export const groupByDriverName = (dataWithNames) => {
  return dataWithNames.reduce((acc, item) => {
    const name = item.driver_name;
    if (!acc[name]) acc[name] = [];
    acc[name].push(item);
    return acc;
  }, {});
};

export const sortRaceResults = (drivers) => {
  return drivers.sort((a, b) => {
    // First, compare by lap count (descending)
    if (b.lapCount !== a.lapCount) {
      return b.lapCount - a.lapCount;
    }

    // If lap count is the same, compare by race time (ascending)
    return a.raceLength - b.raceLength;
  });
};

export const getDriverFinalPosition = (driverNumber, positionInfo) => {
  const driverPositions = positionInfo.filter(
    (p) => p.driver_number.toString() === driverNumber.toString()
  );

  const finalEntry = driverPositions[driverPositions.length - 1];
  return finalEntry?.position ?? "N/A";
};
