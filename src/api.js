import axios from 'axios';
import { buildFallbackResults } from './utilities';

const BASE_URL = 'https://api.openf1.org/v1';
const MAX_RETRIES = 2;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Reusable GET for OpenF1 endpoints
 * @param {string} endpoint - the endpoint to call (e.g. "drivers")
 * @param {object} params - query filters (e.g. { session_key: 9472 }); axios URL-encodes them
 * @param {string} label - name used in error logs
 * @returns {Promise<any[]>} - rows. An empty array means "no data".
 * @throws on network / server errors so callers can show an error state.
 */
async function fetchData(endpoint, params = {}, label = endpoint) {
    for (let attempt = 0; ; attempt++) {
        try {
            const res = await axios.get(`${BASE_URL}/${endpoint}`, { params });
            return res.data;
        } catch (error) {
            const status = error.response?.status;
            // OpenF1 responds 404 "No results found" when a query matches nothing.
            // That is an empty result, not a failure.
            if (status === 404) return [];
            // 429 = rate limited. Wait 1s, then 2s, before giving up.
            if (status === 429 && attempt < MAX_RETRIES) {
                await sleep(1000 * 2 ** attempt);
                continue;
            }
            console.error(`Trouble fetching ${label}:`, error);
            throw error;
        }
    }
}

/** Turns any error from these calls into a message for the UI */
export const getErrorMessage = (error) => {
    if (error?.response?.status === 429) {
        return "OpenF1 is limiting requests right now. Wait a few seconds and try again.";
    }
    if (error?.isAxiosError) {
        return "Could not load data from OpenF1. Please try again in a moment.";
    }
    return error?.message ?? "Something went wrong.";
};

/** api calls to individual endpoints */
export const getDrivers = (sessionKey) => fetchData("drivers", { session_key: sessionKey }, "Driver Data");
export const getLaps = (sessionKey) => fetchData("laps", { session_key: sessionKey }, "Laps");
export const getPosition = (sessionKey) => fetchData("position", { session_key: sessionKey }, "Position Data");
export const getRaceControl = (sessionKey) => fetchData("race_control", { session_key: sessionKey }, "Race Control Data");
export const getSessionResult = (sessionKey) => fetchData("session_result", { session_key: sessionKey }, "Session Results");
export const getStints = (sessionKey) => fetchData("stints", { session_key: sessionKey }, "Stints Data");
export const getTeamRadio = (sessionKey) => fetchData("team_radio", { session_key: sessionKey }, "Team Radio Data");
export const getWeather = (sessionKey) => fetchData("weather", { session_key: sessionKey }, "Weather Data");

// Single records, filtered on the server instead of downloading everything
export const getSession = async (sessionKey) =>
    (await fetchData("sessions", { session_key: sessionKey }, "Session Data"))[0] ?? null;
export const getMeeting = async (meetingKey) =>
    (await fetchData("meetings", { meeting_key: meetingKey }, "Meeting Data"))[0] ?? null;
export const getSessionsFor = (location, year) =>
    fetchData("sessions", { location, year }, "Sessions Data");

// The full meeting list only changes daily, so fetch it once per page load
// and share it (Search is rendered on every results page).
let meetingsRequest = null;
export const getMeetings = () => {
    meetingsRequest ??= fetchData("meetings", {}, "Meeting Data").catch((error) => {
        meetingsRequest = null; // allow a retry after a failure
        throw error;
    });
    return meetingsRequest;
};

/**
 * Everything a results page needs for one session.
 * Uses the official session_result classification; if it isn't published yet,
 * falls back to the last live position for each driver (isOfficial: false).
 */
export async function loadSessionData(sessionKey, { includeStints = false } = {}) {
    const [session, drivers, laps, stints, officialResults] = await Promise.all([
        getSession(sessionKey),
        getDrivers(sessionKey),
        getLaps(sessionKey),
        includeStints ? getStints(sessionKey) : [],
        getSessionResult(sessionKey),
    ]);
    if (!session) throw new Error("Session not found.");

    const meeting = await getMeeting(session.meeting_key);
    const base = { session, meeting, drivers, laps, stints };

    if (officialResults.length) {
        return { ...base, results: officialResults, isOfficial: true };
    }
    const positions = await getPosition(sessionKey);
    const isRace = session.session_type === "Race";
    return { ...base, results: buildFallbackResults(positions, laps, isRace), isOfficial: false };
}
