"""
PWA funcional + paridade mobile — validação Playwright ao vivo (v2).

Testes:
  1. Service worker: registrado + ativado + controla a página
  2. Instalabilidade: manifest link + beforeinstallprompt (UA Chrome Android)
  3. Offline: carrega a home, desconecta, recarrega → app shell serve
  4. Paridade mobile: bottom nav (nav.fixed.bottom-0) + mapa fullscreen + home
     com mesmo H1 do desktop; sidebar desktop vs bottom nav mobile
"""
import json
from playwright.sync_api import sync_playwright

BASE = "https://landmapprod.vercel.app"
CHROME = r"C:\Users\forrydev\AppData\Local\ms-playwright\chromium-1234\chrome-win64\chrome.exe"

results = []


def check(name, ok, detail=""):
    results.append((name, ok, detail))
    print(f"{'OK ' if ok else 'FAIL'} {name} {detail}")


with sync_playwright() as p:
    # --- Mobile (Chrome Android — beforeinstallprompt é Chrome-only) ---
    ctx = p.chromium.launch_persistent_context(
        "", headless=True, executable_path=CHROME,
        viewport={"width": 390, "height": 844},
        user_agent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 "
                   "(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    )
    page = ctx.new_page()
    page.goto(BASE + "/pt-BR", wait_until="networkidle", timeout=60000)
    page.wait_for_timeout(3000)

    sw_state = page.evaluate("""async () => {
        if (!('serviceWorker' in navigator)) return 'no-sw-support';
        const regs = await navigator.serviceWorker.getRegistrations();
        if (!regs.length) return 'no-registration';
        const reg = regs[0];
        return { scope: reg.scope, active: !!reg.active, state: reg.active ? reg.active.state : null,
                 controlled: !!navigator.serviceWorker.controller };
    }""")
    check("SW registrado + activated", isinstance(sw_state, dict) and sw_state.get("state") == "activated",
          json.dumps(sw_state))

    check("link manifest no DOM", page.evaluate("() => !!document.querySelector('link[rel=manifest]')"))

    bpp = page.evaluate("""async () => {
        const fired = await new Promise((resolve) => {
            const t = setTimeout(() => resolve(false), 5000);
            window.addEventListener('beforeinstallprompt', () => { clearTimeout(t); resolve(true); }, { once: true });
        });
        return fired;
    }""")
    check("beforeinstallprompt (instalável Chrome)", bpp)

    offline_keys = page.evaluate("""async () => {
        const names = await caches.keys();
        if (!names.length) return [];
        const c = await caches.open(names[0]);
        return (await c.keys()).map(k => new URL(k.url).pathname);
    }""")
    check("precache do shell", any(p in offline_keys for p in ("/", "/pt-BR")), json.dumps(offline_keys[:5]))

    page.reload(wait_until="networkidle", timeout=60000)
    page.wait_for_timeout(2500)
    ctx.set_offline(True)
    try:
        page.reload(wait_until="domcontentloaded", timeout=15000)
        page.wait_for_timeout(2500)
        h1 = page.evaluate("() => document.querySelector('h1')?.innerText || ''")
        check("offline reload serve shell", bool(h1), f"h1={h1[:50]}")
    except Exception:
        try:
            page.goto(BASE + "/pt-BR", wait_until="domcontentloaded", timeout=15000)
            h1 = page.evaluate("() => document.querySelector('h1')?.innerText || ''")
            check("offline goto serve shell", bool(h1), f"h1={h1[:50]}")
        except Exception as e:
            check("offline", False, str(e)[:120])
    ctx.set_offline(False)

    # --- Mobile bottom nav (rota com AppShell) ---
    page.goto(BASE + "/pt-BR/insights", wait_until="networkidle", timeout=60000)
    page.wait_for_timeout(2500)
    mobile_nav = page.evaluate("""() => {
        const nav = [...document.querySelectorAll('nav')].find(n => {
            const s = getComputedStyle(n);
            return s.position === 'fixed' && parseFloat(s.bottom || '-1') >= 0 && n.innerText.trim().length > 0;
        });
        if (!nav) return { found: false, items: [] };
        const items = [...nav.querySelectorAll('a,button')].map(e => e.innerText.replace(/\\s+/g,' ').trim()).filter(Boolean);
        return { found: true, items: [...new Set(items)].slice(0, 8) };
    }""")
    check("mobile bottom nav", mobile_nav["found"] and len(mobile_nav["items"]) >= 3,
          json.dumps(mobile_nav))
    print("  bottom nav items:", mobile_nav.get("items"))

    # --- Paridade de conteúdo: home mobile vs desktop (mesmo H1) ---
    mobile_h1 = page.evaluate("() => document.querySelector('h1')?.innerText.replace(/\\s+/g,' ').trim() || ''")

    desktop_ctx = p.chromium.launch_persistent_context(
        "", headless=True, executable_path=CHROME, viewport={"width": 1440, "height": 900})
    dpage = desktop_ctx.new_page()
    dpage.goto(BASE + "/pt-BR/insights", wait_until="networkidle", timeout=60000)
    dpage.wait_for_timeout(2500)
    desktop_h1 = dpage.evaluate("() => document.querySelector('h1')?.innerText.replace(/\\s+/g,' ').trim() || ''")
    desktop_sidebar = dpage.evaluate("""() => {
        const aside = document.querySelector('aside');
        if (!aside) return false;
        const s = getComputedStyle(aside);
        return s.display !== 'none' && aside.innerText.includes('Mapa');
    }""")
    check("paridade H1 mobile == desktop", mobile_h1 == desktop_h1 and bool(mobile_h1),
          f"mob={mobile_h1[:40]} | desk={desktop_h1[:40]}")
    check("desktop sidebar presente (desktop-only)", desktop_sidebar)
    desktop_ctx.close()

    # --- /map mobile: fullscreen (sem h1, com leaflet) + bottom nav ---
    page.goto(BASE + "/pt-BR/map", wait_until="networkidle", timeout=60000)
    page.wait_for_timeout(2500)
    map_info = page.evaluate("""() => {
        const leaflet = !!document.querySelector('.leaflet-container');
        const nav = [...document.querySelectorAll('nav')].find(n => {
            const s = getComputedStyle(n);
            return s.position === 'fixed' && parseFloat(s.bottom || '-1') >= 0 && n.innerText.trim().length > 0;
        });
        return { leaflet, hasNav: !!nav, navText: nav ? nav.innerText.replace(/\\s+/g,' ').slice(0, 80) : '' };
    }""")
    check("mapa fullscreen mobile (leaflet)", map_info["leaflet"])
    check("mapa mobile bottom nav", map_info["hasNav"], map_info["navText"])

    ctx.close()

fails = [r for r in results if not r[1]]
print(f"\n=== RESULT: {len(results) - len(fails)}/{len(results)} pass ===")
for name, ok, detail in fails:
    print("  FAIL:", name, "|", detail)
raise SystemExit(1 if fails else 0)
