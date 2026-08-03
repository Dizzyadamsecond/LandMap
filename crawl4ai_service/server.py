"""
LandMap Live Crawler Service
=============================
A small, dependency-light HTTP server that wraps crawl4ai so the Node/TS stack
can trigger real, browser-backed crawls of public Brazilian open-data pages and
receive clean markdown / extracted links back as JSON.

Run (production / dev):
    crawl4ai_service/.venv/Scripts/python.exe crawl4ai_service/server.py
        --host 127.0.0.1 --port 8777

Endpoints:
    GET  /health
    POST /crawl
         body: {
           "url": "https://...",
           "word_count_threshold": 10,        # optional
           "exclude_tags": ["nav","header","footer","script","style"],  # optional
           "only_main": true,                  # optional
           "max_links": 50,                    # optional, return discovered links
           "timeout": 30                        # optional seconds
         }
         -> {
              "ok": true,
              "url": "...",
              "markdown": "...",
              "links": ["..."],
              "title": "...",
              "elapsed_ms": 1234
            }
"""
from __future__ import annotations

import argparse
import asyncio
import json
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from importlib.metadata import version as _pkg_version
from urllib.parse import urlparse

import crawl4ai
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

try:
    CRAWL4AI_VERSION = _pkg_version("crawl4ai")
except Exception:  # pragma: no cover - version is non-essential
    CRAWL4AI_VERSION = "unknown"

DEFAULT_PORT = 8777
DEFAULT_HOST = "127.0.0.1"

# Hosts that are explicitly allowed to be crawled (open-data / public sources).
# We keep the surface deliberate: this is a live-data pipeline, not a generic
# proxy. Blocking everything else avoids SSRF / abuse.
ALLOWED_HOST_SUFFIXES = (
    "ibge.gov.br",
    "apisidra.ibge.gov.br",
    "servicodados.ibge.gov.br",
    "brasilapi.com.br",
    "api.bcb.gov.br",
    "dados.gov.br",
    "gov.br",
    "wikipedia.org",
    "pt.wikipedia.org",
)


def _is_allowed(url: str) -> bool:
    try:
        host = (urlparse(url).hostname or "").lower()
    except Exception:
        return False
    return any(host == s or host.endswith("." + s) for s in ALLOWED_HOST_SUFFIXES)


async def _crawl(payload: dict) -> dict:
    url = str(payload.get("url", ""))
    if not url:
        return {"ok": False, "error": "missing url"}
    if not _is_allowed(url):
        return {"ok": False, "error": f"host not allowed: {url}"}

    browser_cfg = BrowserConfig(headless=True, java_script_enabled=True)
    run_cfg = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS if payload.get("bypass_cache", True) else CacheMode.ENABLED,
        excluded_tags=payload.get("exclude_tags") or ["nav", "header", "footer", "script", "style"],
        word_count_threshold=int(payload.get("word_count_threshold", 10)),
        mean_delay=0.5,
        delay_before_return_html=1.0,
    )
    max_links = int(payload.get("max_links", 0))

    start = time.time()
    async with AsyncWebCrawler(config=browser_cfg) as crawler:
        result = await crawler.arun(url=url, config=run_cfg)

    elapsed = int((time.time() - start) * 1000)
    markdown = result.markdown or ""
    links: list[str] = []
    if max_links > 0 and result.links:
        seen: set[str] = set()
        for grp in ("internal", "external"):
            for item in result.links.get(grp, []) or []:
                href = item.get("href") if isinstance(item, dict) else None
                if href and href not in seen:
                    seen.add(href)
                    links.append(href)
                if len(links) >= max_links:
                    break
            if len(links) >= max_links:
                break

    return {
        "ok": bool(result.success),
        "url": url,
        "markdown": markdown,
        "links": links,
        "title": (result.metadata or {}).get("title", "") if result.metadata else "",
        "status_code": result.status_code,
        "elapsed_ms": elapsed,
    }


class Handler(BaseHTTPRequestHandler):
    def _send(self, code: int, obj: dict) -> None:
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):  # noqa: N802
        if self.path.split("?")[0] in ("/health", "/"):
            self._send(200, {"ok": True, "service": "landmap-crawl4ai", "version": CRAWL4AI_VERSION})
            return
        self._send(404, {"ok": False, "error": "not found"})

    def do_POST(self):  # noqa: N802
        if self.path.split("?")[0] != "/crawl":
            self._send(404, {"ok": False, "error": "not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0") or "0")
            raw = self.rfile.read(length) if length else b"{}"
            payload = json.loads(raw.decode("utf-8") or "{}")
        except Exception as exc:  # noqa: BLE001
            self._send(400, {"ok": False, "error": f"bad json: {exc}"})
            return
        try:
            result = asyncio.run(_crawl(payload))
            self._send(200 if result.get("ok") else 502, result)
        except Exception as exc:  # noqa: BLE001
            self._send(500, {"ok": False, "error": str(exc)})

    def log_message(self, *args):  # silence default logging
        return


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", default=DEFAULT_HOST)
    ap.add_argument("--port", type=int, default=DEFAULT_PORT)
    args = ap.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"landmap-crawl4ai listening on http://{args.host}:{args.port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
