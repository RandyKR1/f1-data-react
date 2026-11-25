/**
 * App configuration from Vite environment variables.
 *
 * VITE_DATA_SOURCE chooses where session data comes from:
 *   "local" - the static JSON files in public/data (default)
 *   "api"   - the live OpenF1 API
 * Set it in .env.local (see .env.example) or on the command line:
 *   VITE_DATA_SOURCE=api npm run dev
 * Vite bakes the value in at build time, so on Vercel it's a project
 * environment variable and changing it needs a rebuild.
 */

const VALID_DATA_SOURCES = ["local", "api"];
const DEFAULT_DATA_SOURCE = "local";

// "local" or "api"; unset or empty means the default, anything else warns.
const resolveDataSource = (value) => {
  if (value === undefined || value === "") return DEFAULT_DATA_SOURCE;
  if (VALID_DATA_SOURCES.includes(value)) return value;
  console.warn(
    `VITE_DATA_SOURCE="${value}" isn't valid; use "local" or "api". Using "${DEFAULT_DATA_SOURCE}".`
  );
  return DEFAULT_DATA_SOURCE;
};

export const DATA_SOURCE = resolveDataSource(import.meta.env.VITE_DATA_SOURCE);
