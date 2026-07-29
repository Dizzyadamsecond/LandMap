#!/usr/bin/env python3
"""Auditoria automatizada de paridade UI LandMap vs padrão Lovable.

Sobe o dev server (se necessário), varre todas as rotas [locale], confirma
que cada página renderiza (HTTP 200) e usa o design system (tokens
oklch hue 265 / componentes @landmap/ui). Gera relatorio em
_ui_parity_report.json.

Uso:
  python audit_ui_parity.py            # usa localhost:3210
  BASE=http://localhost:3210 python audit_ui_parity.py
"""
import os, sys, time, json, urllib.request, urllib.error, subprocess

CD = os.path.dirname(os.path.abspath(__file__))
LOCALE = "pt-BR"
PORT = int(os.environ.get("PORT", "3210"))
BASE = os.environ.get("BASE", f"http://localhost:{PORT}")
PROG = os.path.join(CD, "_ui_parity_report.json")

# rotas [locale] descobertas via glob
import glob as _g
loc = os.path.join(CD, "apps/web/src/app/[locale]")
routes = []
for dp, dn, fn in os.walk(loc):
    for f in fn:
        if f == "page.tsx":
            rel = os.path.relpath(dp, loc).replace("\\", "/")
            routes.append(rel if rel != "." else "")
routes = sorted(set(routes))


def ensure_server():
    try:
        urllib.request.urlopen(f"{BASE}/{LOCALE}", timeout=4)
        return True
    except Exception:
        pass
    # start dev server
    web = os.path.join(CD, "apps/web")
    next_bin = os.path.join(web, "node_modules", ".bin", "next.cmd")
    si = getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0)
    try:
        out = open(os.path.join(CD, "devserver.log"), "a", encoding="utf-8")
    except OSError:
        out = subprocess.DEVNULL
    subprocess.Popen([next_bin, "dev", "-p", str(PORT)], cwd=web, creationflags=si,
                     stdout=out, stderr=subprocess.STDOUT)
    for _ in range(60):
        try:
            urllib.request.urlopen(f"{BASE}/{LOCALE}", timeout=4); return True
        except Exception:
            time.sleep(2)
    return False


def check(route):
    url = f"{BASE}/{LOCALE}/{route}".rstrip("/")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=20) as r:
            html = r.read().decode("utf-8", "replace")
        ok = r.status == 200
        # design-system markers in served HTML (class names / inline styles / tokens)
        markers = {
            "oklch_token": ("oklch" in html) or ("--primary" in html),
            "ui_component": ("landmap/ui" in html) or ("__landmap" in html),
            "font_dm_sans": ("DM+Sans" in html) or ("DM Sans" in html),
            "font_space_grotesk": ("Space+Grotesk" in html) or ("Space Grotesk" in html),
        }
        score = sum(markers.values())
        return {"route": route or "(root)", "status": r.status, "ok": ok,
                "score": score, "markers": markers, "bytes": len(html)}
    except urllib.error.HTTPError as e:
        return {"route": route or "(root)", "status": e.code, "ok": False,
                "score": 0, "markers": {}, "bytes": 0, "error": str(e)}
    except Exception as e:
        return {"route": route or "(root)", "status": 0, "ok": False,
                "score": 0, "markers": {}, "error": repr(e)[:80]}


def main():
    print(f"Auditoria UI paridade — {len(routes)} rotas em {BASE}/{LOCALE}")
    if not ensure_server():
        print("ERRO: dev server nao subiu"); sys.exit(1)
    results = [check(r) for r in routes]
    passed = [r for r in results if r["ok"] and r.get("score", 0) >= 2]
    failed = [r for r in results if not r["ok"]]
    weak = [r for r in results if r["ok"] and r.get("score", 0) < 2]
    report = {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "base": BASE, "total": len(results), "passed": len(passed),
        "failed": len(failed), "weak": len(weak),
        "details": results,
    }
    json.dump(report, open(PROG, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    print(f"\nRESULTADO: {len(passed)}/{len(results)} OK | {len(failed)} falharam | {len(weak)} fracas")
    for r in failed:
        print(f"  FAIL {r['route']:<26} status={r['status']} {r.get('error','')}")
    for r in weak:
        print(f"  WEAK {r['route']:<26} score={r['score']}")
    print(f"\nRelatorio: {PROG}")


if __name__ == "__main__":
    main()
