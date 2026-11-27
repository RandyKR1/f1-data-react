import axios from 'axios';
import { buildFallbackResults } from './utilities';
import { getIndexMeetings, isExported } from './dataIndex';

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
export const getSessionResult = (sessionKey) => fetchData("session_result", { session_key: sessionKey }, "Session Results");
export const getStints = (sessionKey) => fetchData("stints", { session_key: sessionKey }, "Stints Data");

// Single records, filtered on the server instead of downloading everything
export const getSession = async (sessionKey) =>
    (await fetchData("sessions", { session_key: sessionKey }, "Session Data"))[0] ?? null;
export const getMeeting = async (meetingKey) =>
    (await fetchData("meetings", { meeting_key: meetingKey }, "Meeting Data"))[0] ?? null;

/* ---------- Schedule (used by Search) ----------
 * In "local" mode these come from public/data/index.json (see dataIndex.js),
 * with no OpenF1 request. getIndexMeetings() is null in "api" mode or if the
 * index couldn't be loaded, and then the live API is used exactly as before.
 * Local rows are in the API's shape: index-only fields (a meeting's nested
 * `sessions`, a session's `exported`) are removed.
 */

// Shallow copy of an object without one key
const withoutKey = (obj, key) => {
    const copy = { ...obj };
    delete copy[key];
    return copy;
};

// Sessions at this location in this year, like /sessions?location=&year=.
// A location can span several meetings (e.g. Sakhir: testing + Grand Prix).
export const getSessionsFor = async (location, year) => {
    const meetings = await getIndexMeetings();
    if (!meetings) return fetchData("sessions", { location, year }, "Sessions Data");
    return meetings
        .flatMap((meeting) => meeting.sessions)   // already in date order
        .filter((s) => s.location === location && String(s.year) === String(year))
        .map((session) => withoutKey(session, "exported"));
};

// All meetings, without their nested sessions (like /meetings)
const loadMeetings = async () => {
    const meetings = await getIndexMeetings();
    if (!meetings) return fetchData("meetings", {}, "Meeting Data");
    return meetings.map((meeting) => withoutKey(meeting, "sessions"));
};

// The full meeting list only changes daily, so load it once per page load
// and share it (Search is rendered on every results page).
let meetingsRequest = null;
export const getMeetings = () => {
    meetingsRequest ??= loadMeetings().catch((error) => {
        meetingsRequest = null; // allow a retry after a failure
        throw error;
    });
    return meetingsRequest;
};

/* ---------- Session pages ---------- */

// Official session_result rows if there are any; otherwise rows built from
// the last live position of each driver (isOfficial: false). Shared by the
// local and API paths so both behave the same.
async function withResults(base, officialResults, getPositions) {
    if (officialResults.length) {
        return { ...base, results: officialResults, isOfficial: true };
    }
    const positions = await getPositions();
    const isRace = base.session.session_type === "Race";
    return { ...base, results: buildFallbackResults(positions, base.laps, isRace), isOfficial: false };
}

// Local session files (public/data/sessions/<key>.json), fetched at most once
// per session per page load. Each entry is a promise of the parsed file, or
// of null if it couldn't be loaded (one warning is logged, then the API is used).
const localSessionRequests = new Map();

async function fetchLocalSession(key) {
    const url = `${import.meta.env.BASE_URL}data/sessions/${key}.json`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        // A missing file can come back as the app's index.html (status 200),
        // so a JSON parse error usually means the file isn't there.
        const data = await res.json();
        if (!data?.session || !Array.isArray(data.laps) || !Array.isArray(data.session_result)) {
            throw new Error("unexpected file contents");
        }
        return data;
    } catch (error) {
        console.warn(`Couldn't load ${url} (${error.message}); using the live OpenF1 API for session ${key}.`);
        return null;
    }
}

const getLocalSession = (key) => {
    if (!localSessionRequests.has(key)) localSessionRequests.set(key, fetchLocalSession(key));
    return localSessionRequests.get(key);
};

// One endpoint's rows from the local session file, or null to use the API.
// Shares getLocalSession's cached fetch, so the file is downloaded once per
// session however many sections ask for it.
async function localRows(sessionKey, endpoint) {
    if (!(await isExported(sessionKey))) return null;
    const file = await getLocalSession(Number(sessionKey));
    return Array.isArray(file?.[endpoint]) ? file[endpoint] : null;
}

/* Dev-only timing: one console line per call, e.g.
 * "[timing] loadSessionData 11369 local: 42 ms". Everything is behind
 * import.meta.env.DEV, which Vite replaces with false in production builds,
 * so the bundler drops it. */
const timingStart = () => (import.meta.env.DEV ? performance.now() : 0);
const logTiming = (name, sessionKey, source, start) => {
    if (import.meta.env.DEV) {
        console.log(`[timing] ${name} ${sessionKey} ${source}: ${Math.round(performance.now() - start)} ms`);
    }
};

// Local-first: the session file in "local" mode for exported sessions,
// otherwise (or if the file fails) the OpenF1 API, exactly as before.
async function localFirstRows(name, endpoint, sessionKey, label) {
    const start = timingStart();
    let source = "api";
    try {
        const local = await localRows(sessionKey, endpoint);
        if (local) {
            source = "local";
            return local;
        }
        return await fetchData(endpoint, { session_key: sessionKey }, label);
    } finally {
        logTiming(name, sessionKey, source, start);
    }
}

export const getWeather = (sessionKey) =>
    localFirstRows("getWeather", "weather", sessionKey, "Weather Data");
export const getRaceControl = (sessionKey) =>
    localFirstRows("getRaceControl", "race_control", sessionKey, "Race Control Data");
export const getTeamRadio = (sessionKey) =>
    localFirstRows("getTeamRadio", "team_radio", sessionKey, "Team Radio Data");

// The results-page data from the local file, or null to use the API instead.
// isExported() is always false in "api" mode, so this never fetches there.
async function loadLocalSessionData(sessionKey, includeStints) {
    if (!(await isExported(sessionKey))) return null;
    const key = Number(sessionKey);
    const file = await getLocalSession(key);
    if (!file) return null;

    const base = {
        session: file.session,
        meeting: file.meeting,
        drivers: file.drivers,
        laps: file.laps,
        stints: includeStints ? file.stints : [],
    };
    // export.py includes `position` exactly when session_result is empty
    return withResults(base, file.session_result,
        async () => file.position ?? getPosition(key));
}

/**
 * Everything a results page needs for one session:
 * { session, meeting, drivers, laps, stints, results, isOfficial }.
 * In "local" mode, exported sessions come from their static file; everything
 * else (and any session whose file fails to load) uses the OpenF1 API.
 * Uses the official session_result classification; if it isn't published yet,
 * falls back to the last live position for each driver (isOfficial: false).
 */
export async function loadSessionData(sessionKey, { includeStints = false } = {}) {
    const start = timingStart();
    let source = "api";
    try {
        const local = await loadLocalSessionData(sessionKey, includeStints);
        if (local) {
            source = "local";
            return local;
        }

        const [session, drivers, laps, stints, officialResults] = await Promise.all([
            getSession(sessionKey),
            getDrivers(sessionKey),
            getLaps(sessionKey),
            includeStints ? getStints(sessionKey) : [],
            getSessionResult(sessionKey),
        ]);
        if (!session) throw new Error("Session not found.");

        const meeting = await getMeeting(session.meeting_key);
        return await withResults({ session, meeting, drivers, laps, stints }, officialResults,
            () => getPosition(sessionKey));
    } finally {
        logTiming("loadSessionData", sessionKey, source, start);
    }
}
