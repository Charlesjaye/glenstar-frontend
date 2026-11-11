# Glenstar Intelligence — frontend

React dashboard for Glenstar's industrial real-estate market intelligence platform. It shows an
AI-generated investment thesis, market analytics by building size, underwriting assumptions,
a broker report library, source monitoring, and an "Ask Claude" chat. Market data and AI
features come from a separate backend API (hosted on Render).

## Pages

| URL             | Page                     | Data source                                   |
| --------------- | ------------------------ | --------------------------------------------- |
| `/`             | Live Investment Thesis   | `GET /api/thesis/current`                     |
| `/markets`      | Market Analytics         | `GET /api/markets/summary`, thesis scores     |
| `/underwriting` | Underwriting Assumptions | `GET /api/underwriting/dataset`               |
| `/chat`         | Ask Claude               | `POST /api/chat`                              |
| `/reports`      | Report Library           | `GET /api/reports`                            |
| `/monitor`      | Source Monitor           | `GET /api/monitor/sources`, `/api/thesis/history` |

The header also uses `GET /api/stats` (quarter, report count, `api_key_configured`, and
optionally `market_count`) and the buttons call `POST /api/monitor/scan` and
`POST /api/thesis/regenerate`.

## Running locally

Requires Node 18+.

```bash
cd glenstar_frontend
npm install
REACT_APP_API_URL=https://your-backend.onrender.com npm start
```

The app opens at http://localhost:3000. Without `REACT_APP_API_URL`, API calls go to the same
origin as the page.

```bash
npm test          # unit tests (API helper, routing, formatters)
npm run build     # production build into build/
```

## Configuration

| Variable            | Where              | Purpose                    |
| ------------------- | ------------------ | -------------------------- |
| `REACT_APP_API_URL` | Vercel env / local | Base URL of the backend API |

Never put secrets (e.g. the Anthropic API key) in `REACT_APP_*` variables — they are embedded in
the public JavaScript bundle. The Anthropic key belongs on the backend.

## Deployment

Deployed on Vercel from `glenstar_frontend/` (see `vercel.json`). All paths are rewritten to
`index.html`, so page URLs like `/underwriting` work on refresh and as shared links.

## Project layout

```
glenstar_frontend/src/
  App.js                      shell: sidebar, header, routing
  lib/api.js                  fetch wrapper — throws on HTTP errors and {error} payloads
  lib/router.js               tiny path-based router
  lib/constants.js            brokerage list, scan schedule
  lib/format.js               shared number formatters / colour scales
  pages/                      one file per page
```

## Updating underwriting data each quarter

The underwriting assumptions live in the backend repo (`Glenstar-Backend`), in
`underwriting_markets.json`. Edit that file (including its `quarter` field), run
`python -m unittest discover tests` there to catch missing fields or typos, and redeploy the
backend — no frontend change needed.
