# Local data vs live OpenF1 API: page-load performance

How much faster pages load when session data comes from the static files in
`public/data` (`VITE_DATA_SOURCE=local`) than from the live OpenF1 API
(`VITE_DATA_SOURCE=api`).

## Results (medians)

| Page | Mode | Runs | Results table visible | All sections rendered | Transferred | OpenF1 requests | 429 responses |
|---|---|---|---|---|---|---|---|
| Home (track list ready) | local | 5 | – | **303 ms** | 314 KB | 0 | 0 |
| Home (track list ready) | api | 2 | – | 781 ms | 306 KB | 1 | 0 |
| Madrid 2026 race (`/race-results/11369`) | local | 5 | **287 ms** | **436 ms** | 349 KB | 0 | 0 |
| Madrid 2026 race (`/race-results/11369`) | api | 2 | 2,342 ms | 3,723 ms | 366 KB | 14 | 4 |
| Marina Bay 2026 qualifying (`/qualy-results/11384`) | local | 5 | **232 ms** | **324 ms** | 330 KB | 0 | 0 |
| Marina Bay 2026 qualifying (`/qualy-results/11384`) | api | 1 | 2,068 ms | 3,919 ms | 332 KB | 13 | 4 |

**Speed-up from local data** (API median ÷ local median):

| Page | Results table visible | All sections rendered |
|---|---|---|
| Home | – | 2.6× |
| Madrid 2026 race | 8.2× | 8.5× |
| Marina Bay 2026 qualifying | 8.9× | 12.1× |

What the numbers show:

- **Local pages are complete in about a third to half a second; API pages take
  about 3.7-3.9 s.** Every API results-page run hit HTTP 429 four times: the
  page sends about 10 requests at once, more than the 3-per-second limit, and
  `src/api.js` retries each 429 after 1 s and then 2 s. Those waits are a large
  part of the API times (see `data_quirks.md`, "The app's page loads and the
  rate limits").
- **Bytes are similar in both modes.** The app's JavaScript bundle (about
  250 KB compressed) dominates every page. A session file is about 35 KB
  compressed (the Madrid race, 297 KB raw), and `index.json` about 14 KB
  (174 KB raw). The API's responses for the same data are about the same size.
  The gain comes from fewer round trips and no rate-limit waits, not from
  smaller downloads.
- **Local mode made zero OpenF1 requests** in all 15 runs.

Per-run times (ms; "table / all sections"):

| Page | Mode | Runs |
|---|---|---|
| Home | local | 404, 303, 308, 283, 287 |
| Home | api | 878, 683 |
| Madrid race | local | 343 / 501, 287 / 436, 294 / 449, 271 / 399, 242 / 351 |
| Madrid race | api | 2,286 / 3,694, 2,397 / 3,752 |
| Marina Bay qualifying | local | 232 / 318, 251 / 335, 230 / 324, 246 / 332, 227 / 314 |
| Marina Bay qualifying | api | 2,068 / 3,919 |

## Method

- **Date and place:** 26 November 2026 (evening, local time), on the project
  owner's home internet connection (WSL2 on Windows).
- **Builds:** two production builds of commit `43aaf28`: `npm run build`
  (local mode, the default) and `VITE_DATA_SOURCE=api vite build`. Each was
  served with `vite preview`, which serves gzip-compressed responses. No React
  StrictMode double requests: that only happens on the dev server.
- **Browser:** headless Chromium (Playwright), 1280×5000 viewport so every
  section is on screen. **A fresh browser context for every run** (cold cache:
  nothing cached from a previous run).
- **Timings** are measured in the page, from navigation start
  (`performance.now()`), by a MutationObserver that records when each element
  first appears:
  - *Home:* the Search track dropdown is opened as soon as it exists, and the
    time is when its first track option appears (the meeting list has loaded).
  - *Results table visible:* the first classification table row.
  - *All sections rendered:* the latest of the first results row, the first
    lap-chart line, the weather cards, the first race-control message and the
    first team-radio clip.
- **Transferred** is the sum of Chrome's `encodedDataLength` for every response
  on the page: compressed bytes on the wire, including the app bundle, fonts,
  data files and API responses.
- **Run counts:** local mode 5 runs per page, with every request to
  `api.openf1.org` blocked (none were attempted). API mode 2 runs per page with
  real requests, within a budget of 45 OpenF1 requests in total. Each
  API-mode page load started at least **65 seconds** after the previous one
  ended, so one run's requests didn't use up the next run's per-minute
  allowance. The order was Home, race, qualifying, race, (qualifying), Home.
  **The second qualifying run was skipped** because only 3 requests were left
  in the budget, and a qualifying page needs about 13. API mode used
  **43 OpenF1 requests**, of which **12 got HTTP 429** responses.
- **Medians** are over the runs listed. API medians are over 2 runs, or 1 for
  qualifying, so treat them as indicative.

## Caveats

- **API timings include rate-limit retries.** Each API results-page run had
  four 429s, and the app's retries (1 s, then 2 s) are part of the measured time.
  With a quieter API, or fewer parallel requests, API mode would be faster. If
  the 30-per-minute limit were already used up (for example, after opening
  three pages within a minute), it would be slower or fail.
- **Real-world numbers vary with connection speed and location**, and with
  OpenF1's load at the time. These are one evening's measurements on one home
  connection.
- **Production hosting differs from `vite preview`.** Vercel serves brotli
  (slightly smaller than gzip) from a CDN. Local-mode times there depend on CDN
  distance, but still involve no OpenF1 requests and no rate limits.
- **Small samples:** 5 local runs and 1-2 API runs per page.
