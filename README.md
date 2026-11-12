# Glenstar Intelligence — frontend

React dashboard for Glenstar's industrial market intelligence platform. All data comes from the
backend API (`Glenstar-Backend`), which serves only figures read from broker reports — each with
the report, page and quote it came from.

## Pages

| URL              | Page                | What it does |
| ---------------- | ------------------- | ------------ |
| `/`              | Overview            | Quarter coverage and the forward thesis: which markets should lead in two to three years |
| `/markets`       | Markets             | Sortable table with direction of travel, a building-size selector and CSV export; click a market for detail |
| `/underwriting`  | Underwriting        | Assumption sheet by market and building size (broker figure / your assumption / unverified estimate), quick feasibility, Excel/CSV export |
| `/chat`          | Ask Claude          | Questions answered from the report data |
| `/data`          | Add reports         | Drag-and-drop PDF upload, web search for missing reports, items needing review, quarter coverage |
| `/reports`       | Report library      | Every report on file, grouped by quarter |
| `/reports/:id`   | Report              | The PDF beside the figures read from it; confirm, fix or remove each |
| `/sources`       | Broker sources      | The pages the scanner checks and what happened; edit links; scan now |

Click any number anywhere on the site to see the broker, quarter, page and sentence it came from.

## Running locally

Requires Node 18+.

```bash
cd glenstar_frontend
npm install
REACT_APP_API_URL=https://your-backend.onrender.com npm start
```

```bash
npm test          # unit tests
npm run build     # production build into build/
```

## Configuration

| Variable            | Where              | Purpose                     |
| ------------------- | ------------------ | --------------------------- |
| `REACT_APP_API_URL` | Vercel env / local | Base URL of the backend API |

Never put secrets in `REACT_APP_*` variables — they are embedded in the public JavaScript bundle.
The Anthropic key and the admin passcode live on the backend. When the backend has an
`ADMIN_TOKEN`, the site asks for the passcode the first time you add or change data and remembers
it on that device.

## Deployment

Deployed on Vercel from `glenstar_frontend/` (see `vercel.json`). All paths are rewritten to
`index.html`, so page URLs work on refresh and as shared links. **Deploy the backend first** — this
version of the site needs the new backend API.

## Project layout

```
glenstar_frontend/src/
  App.js              shell: sidebar, routing, live status, market drawer, passcode prompt
  App.css             design system
  lib/api.js          fetch wrapper (errors, admin passcode, uploads)
  lib/format.js       number formatting for report figures
  lib/router.js       tiny path-based router
  lib/hooks.js        data-loading hook
  components/         shared UI, the sourced-figure popover, market detail, upload zone
  pages/              one file per page
```
