#!/usr/bin/env python3
"""
Validate the live LandMap PWA deterministically (paths reais do projeto).

Usage:
    python scripts/validate_pwa_live.py https://landmapprod.vercel.app

Checks:
    - HTTP 200 for /, /manifest.json, /sw.js, /offline.html, /api/health,
      /icons/icon-192.png, /icons/icon-512.png, /icons/icon-512-maskable.png,
      /icons/apple-touch-icon.png, /favicon.svg
    - Rendered HTML contains rel="manifest", theme-color, apple-touch-icon
    - Manifest parses; display == standalone; icons[] non-empty; every
      icons[].src and shortcuts[].icons[].src returns 200
"""
import json
import sys
import urllib.request
import urllib.error

PATHS = [
    "/", "/manifest.json", "/sw.js", "/offline.html", "/api/health",
    "/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-512-maskable.png",
    "/icons/apple-touch-icon.png", "/favicon.svg",
]


def fetch(url, method="HEAD"):
    try:
        req = urllib.request.Request(url, method=method,
                                     headers={"User-Agent": "LandMap-PWA-Check/1.0"})
        with urllib.request.urlopen(req, timeout=25) as r:
            return r.status, r.read().decode("utf-8", "replace") if method == "GET" else None
    except urllib.error.HTTPError as e:
        return e.code, None
    except Exception as e:  # noqa
        return None, str(e)[:120]


def main():
    if len(sys.argv) < 2:
        print("usage: validate_pwa_live.py <live-url>")
        sys.exit(2)
    base = sys.argv[1].rstrip("/")
    failures = []

    for p in PATHS:
        st, _ = fetch(base + p)
        ok = st == 200
        print(f"{'OK ' if ok else 'FAIL'} {st}  {p}")
        if not ok:
            failures.append(f"{p} -> {st}")

    # HTML wiring
    st, html = fetch(base + "/", method="GET")
    if html:
        checks = {
            "manifest link": 'rel="manifest"' in html and "/manifest.json" in html,
            "theme-color meta": 'name="theme-color"' in html,
            "apple-touch-icon link": "apple-touch-icon" in html,
            "viewport meta": 'name="viewport"' in html,
        }
        for k, v in checks.items():
            print(f"{'OK ' if v else 'FAIL'} HTML {k}")
            if not v:
                failures.append(f"HTML missing {k}")
    else:
        failures.append("could not fetch /")

    # Manifest parse + icon srcs
    st, body = fetch(base + "/manifest.json", method="GET")
    if st == 200 and body:
        try:
            m = json.loads(body)
            display = m.get("display")
            icons = m.get("icons", [])
            ok = display == "standalone" and len(icons) > 0
            print(f"{'OK ' if ok else 'FAIL'} manifest display={display} icons={len(icons)}")
            if not ok:
                failures.append("manifest display/standalone or icons empty")
            for icon in icons:
                src = icon.get("src", "")
                st2, _ = fetch(base + src)
                ok2 = st2 == 200
                print(f"{'OK ' if ok2 else 'FAIL'} icon {st2}  {src}")
                if not ok2:
                    failures.append(f"icon {src} -> {st2}")
            for sc in m.get("shortcuts", []):
                for icon in sc.get("icons", []):
                    src = icon.get("src", "")
                    st2, _ = fetch(base + src)
                    if st2 != 200:
                        failures.append(f"shortcut icon {src} -> {st2}")
        except Exception as e:
            failures.append(f"manifest parse -> {e}")
    else:
        failures.append("manifest fetch failed")

    print("\n=== RESULT ===")
    if failures:
        print("FAIL:", len(failures), "issue(s)")
        for f in failures:
            print("  -", f)
        sys.exit(1)
    print("PASS — PWA fully wired and live.")


if __name__ == "__main__":
    main()
