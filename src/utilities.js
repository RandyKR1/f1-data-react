/**FIle for storing re-usable functions throughout the app */


/** function for filtering duplicates from a data set */
export const filterDupes = (array, key) => {
    const seen = new Set;
    const result = array.filter((arr) => {
        if (arr[key] && !seen.has(arr[key])) {
            seen.add(arr[key]);
            return true;
        }
        return false
    })

    return result;
};

//Gathering the highest num in the array
export const getMaxBy = (data, key)=> {
    if (!data.length) return null;
    return data.reduce((currentMax, item) =>
        item[key] > (currentMax[key] ?? -Infinity) ? item : currentMax )
}

//Gathering the lowest num in the array
export const getMinBy = (data, key)=> {
    if (!data.length) return null;
    return data.reduce((currentMin, item) =>
        item[key] < (currentMin[key] ?? -Infinity) ? item : currentMin )
}

//Gathering the average of the array
export const getAverageBy = (data, key) => {
  if (!data.length) return null;
  const total = data.reduce((sum, item) => sum + (item[key] ?? 0), 0);
  return total / data.length;
};
