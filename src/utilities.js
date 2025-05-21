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
