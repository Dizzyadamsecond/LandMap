# LandMap Live Crawler Service (crawl4ai)

Real, browser-backed crawler for public Brazilian open-data sources, wrapped as a
tiny HTTP service so the TypeScript/Node stack (Next.js + Hono API) can trigger
live crawls without embedding a Python runtime in the web server.

## Setup (already done once)

```powershell
# from repo root
python -m venv crawl4ai_service/.venv
crawl4ai_service/.venv/Scripts/python.exe -m pip install -U pip wheel setuptools
crawl4ai_service/.venv/Scripts/python.exe -m pip install crawl4ai
crawl4ai_service/.venv/Scripts/python.exe -m playwright install chromium
```

## Run (dev / local)

```powershell
crawl4ai_service/.venv/Scripts/python.exe crawl4ai_service/server.py --port 8777
```

## Endpoints

- `GET /health` → `{ ok, service, version }`
- `POST /crawl` with body `{ "url": "...", "max_links": 50 }` →
  `{ ok, url, markdown, links, title, status_code, elapsed_ms }`

Only hosts on the explicit allow-list (`.gov.br`, `ibge.*`, `brasilapi.com.br`,
`api.bcb.gov.br`, `dados.gov.br`, `wikipedia.org`) are crawlable — this is a
live open-data pipeline, not a generic proxy.

## Node client

`@landmap/integrations` ships `Crawl4aiClient` (`src/crawl4ai.ts`) which spawns
this server on demand (Windows `.venv/Scripts/python.exe`, else `python3`) and
calls `/crawl`. The Hono API exposes `GET /integrations/crawl4ai/live` which
returns a live crawl of the requested open-data URL.

> Note: in serverless (Vercel) a long-lived Python process isn't available; there
> the `/live` UI falls back to the direct-API integrations (IBGE/SIDRA/BCB/
> BrasilAPI), which need no browser and work from edge functions.
