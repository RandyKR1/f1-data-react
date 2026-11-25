/**
 * The local data index: public/data/index.json, built by pipeline/export.py.
 *
 * It lists every meeting and session, and marks with `exported: true` the
 * sessions that have a static file at /data/sessions/<session_key>.json.
 *
 * - Fetched at most once per page load. The promise is cached, so callers
 *   that ask at the same time share one request.
 * - DATA_SOURCE "api": the index is never fetched; no session counts as
 *   exported and getIndexMeetings() gives null.
 * - If the index can't be fetched or parsed, one console warning is logged
 *   and every session counts as not exported, so the app falls back to the
 *   live API instead of breaking.
 */
import { DATA_SOURCE } from "./config.js";

// BASE_URL is "/" unless the app is served from a sub-path
const INDEX_URL = `${import.meta.env.BASE_URL}data/index.json`;

let indexRequest = null;

// Fetch and check the index. Resolves to { index, exportedKeys } or null.
const fetchIndex = async () => {
  try {
    const res = await fetch(INDEX_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // A missing file can come back as the app's index.html (status 200),
    // so a parse error here is the usual sign that the index isn't there.
    const index = await res.json();
    if (!Array.isArray(index?.meetings)) throw new Error("no meetings list");

    // Set of exported session keys, for quick lookups
    const exportedKeys = new Set(
      index.meetings.flatMap((m) => m.sessions ?? [])
        .filter((s) => s.exported === true)
        .map((s) => s.session_key)
    );
    return { index, exportedKeys };
  } catch (error) {
    console.warn(
      `Couldn't load ${INDEX_URL} (${error.message}); using the live OpenF1 API for all sessions.`
    );
    return null;
  }
};

// { index, exportedKeys } or null. Never fetches in "api" mode.
const loadIndexData = () => {
  if (DATA_SOURCE === "api") return Promise.resolve(null);
  indexRequest ??= fetchIndex();
  return indexRequest;
};

/**
 * The parsed index.json, or null in "api" mode or if it couldn't be loaded.
 * Never rejects.
 */
export const loadIndex = async () => (await loadIndexData())?.index ?? null;

/** True if the session has a local file (always false in "api" mode). */
export const isExported = async (sessionKey) =>
  // sessionKey may be a string from the URL
  (await loadIndexData())?.exportedKeys.has(Number(sessionKey)) ?? false;

/** The index's meetings (each with its sessions), or null in "api" mode or on failure. */
export const getIndexMeetings = async () => (await loadIndex())?.meetings ?? null;
