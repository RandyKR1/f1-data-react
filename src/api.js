import axios from 'axios';

const BASE_URL = 'https://api.openf1.org/v1'

/**
 * Reusable api call for OpenF1 endpoints
 * @param {string} endpoint - the endpoint to call (e.g. "drivers")
 * @param {string} label - optional label for error logs
 * @returns {Promise<any>} - response data or empty array on error
 */

async function fetchData(endpoint, label = 'Data') {
    try{
        const res = await axios.get(`${BASE_URL}/${endpoint}`);
        return res.data;
    }catch(error){
        console.error(`Trouble Fetching ${label}:`, error);
        return [];
    }   
};

/**api calls to all endpoints*/
export const getDrivers = (sessionKey) => fetchData(`drivers?session_key=${sessionKey}`, "Driver Data");
export const getMeetings = () => fetchData("meetings", "Meeting Data");
export const getSessions = () => fetchData("sessions", "Sessions Data");
export const getLocation = (sessionKey) => fetchData(`location?session_key=${sessionKey}`, "Location Data");
export const getCarData = (sessionKey) => fetchData(`car_data?session_key=${sessionKey}`, "Car Data");
export const getIntervals = (sessionKey) => fetchData(`intervals?session_key=${sessionKey}`, "Intervals");
export const getLaps = (sessionKey) => fetchData(`laps?session_key=${sessionKey}`, "Laps");
export const getPit = (sessionKey) => fetchData(`pit?session_key=${sessionKey}`, "Pit Data");
export const getPosition = (sessionKey) => fetchData(`position?session_key=${sessionKey}`, "Position Data");
export const getRaceControl = (sessionKey) => fetchData(`race_control?session_key=${sessionKey}`, "Race Control Data");
export const getStints = (sessionKey) => fetchData(`stints?session_key=${sessionKey}`, "Stints Data");
export const getTeamRadio = (sessionKey) => fetchData(`team_radio?session_key=${sessionKey}`, "Team Radio Data");
export const getWeather = (sessionKey) => fetchData(`weather?session_key=${sessionKey}`, "Weather Data");