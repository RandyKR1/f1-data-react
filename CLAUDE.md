# CLAUDE.md

## Environment
- Ubuntu, bash shell. Give bash commands only (no PowerShell / cmd).
- Python lives in a virtual environment at `.venv` (python3):
  - Create: `python3 -m venv .venv`
  - Activate: `source .venv/bin/activate`
  - Install: `pip install -r pipeline/requirements.txt` (once it exists)

## Where new work goes
- `pipeline/` — Python data work (fetching, cleaning, loading)
- `sql/` — SQL files
- `docs/` — documentation
- The existing React app stays in `src/`; don't mix data-pipeline code into it.

## Git
- Work on a feature branch, never directly on `main`.
- Commit after each completed step with a clear message describing what changed and why.
- Never commit: `data/`, `*.duckdb`, `.venv/`, `exports/`. Make sure these are in `.gitignore`.

## Code style
- Keep code simple and well commented.
- Prefer small, readable functions over clever ones.

## Project context (React app)
- React 18 + Vite 6, React Router 7, Bootstrap 5 / react-bootstrap, Recharts, motion, axios.
- Run locally: `npm install` then `npm run dev` (also `npm run build`, `npm run lint`, `npm run preview`).
- Deployed on Vercel; `vercel.json` rewrites all paths to `index.html` for client-side routing.
- All OpenF1 calls go through `src/api.js` (`https://api.openf1.org/v1`):
  - `fetchData` treats 404 as an empty result and retries 429 twice (1s, 2s backoff).
  - `loadSessionData(sessionKey, { includeStints })` bundles session, meeting, drivers, laps,
    stints and results for the results pages. If `session_result` is empty it builds fallback
    results from `position` data (`isOfficial: false`).
- Shared helpers (formatting, grouping, best laps, positions) live in `src/utilities.js`.
- Routes: `/`, `/{practice|qualy|race}-results/:sessionKey`, and
  `/{...}-results/:sessionKey/:sessionName/:driver_number` for driver pages.
- Driver numbers are only unique within a session; always join on the same session's `/drivers` data.
- OpenF1 is unavailable during live F1 sessions.
- Never make OpenF1 API requests beyond what the current task explicitly asks for.
  If extra requests would help, stop and ask first, stating how many.

## Cleaning conventions (data pipeline models)
Applies to every change in `sql/staging/` and `sql/models/` (built by `python pipeline/build.py`).
Every model change must:
- **Keep the row count and the natural key.** Report the row count before and after and confirm
  the key is unique. If a rule removes rows, count and report exactly how many and why.
- **Show data evidence before any rule.** Query the data first (rates, counts, examples,
  exceptions grouped by cause) and only then write the rule. If the evidence doesn't support
  the rule, say so and stop or adapt; don't apply it anyway.
- **Comment every rule in the SQL**: what it does and the evidence behind it.
- **Update `docs/cleaning_rules.md`** with the rule and its evidence (and `docs/data_quirks.md`
  for new data quirks).
- **Report flag counts** for the reference sessions 11369 (Madrid 2026 Race), 9939 (Spa 2025
  Race), 11361 (Monza 2026 Race), 9693 (Melbourne 2025 Race) and 11384 (Marina Bay 2026
  Qualifying), plus totals by session type and year.
- **Make no API requests.**
- **Commit and push** when done.
