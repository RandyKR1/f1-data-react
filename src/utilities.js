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