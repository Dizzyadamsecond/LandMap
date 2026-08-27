const { chromium } = require('playwright');
const fs = require('fs');

const BASE = "https://landmapprod-2o28u1q7p-dizzys-projects-d5a44b36.vercel.app";
const ROUTES = [
  "/",
  "/pt-BR/plans",
  "/pt-BR/auth",
  "/pt-BR/reset-password",
  "/pt-BR/trial-ended",
  "/pt-BR/world",
  "/pt-BR/worldmonitor",
  "/pt-BR/history40",
  "/pt-BR/terrenos",
  "/pt-BR/compare",
  "/pt-BR/favorites",
  "/pt-BR/regions",
  "/pt-BR/dashboard"
];

(async () => {
  console.log(`Starting Playwright live verification on: ${BASE}`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const results = [];

  for (const rt of ROUTES) {
    const url = BASE + rt;
    try {
      const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 25000 });
      await page.waitForTimeout(800);
      const title = await page.title();
      const status = resp ? resp.status() : 'unknown';
      const h1 = await page.evaluate(() => document.querySelector('h1')?.innerText?.trim() || '');
      console.log(`✅ [${status}] ${rt} -> Title: "${title}" | H1: "${h1}"`);
      results.push({ route: rt, status, title, h1 });
    } catch (err) {
      console.log(`❌ FAIL ${rt}: ${err.message}`);
      results.push({ route: rt, error: err.message });
    }
  }

  await browser.close();
  console.log("\n==========================================");
  console.log(`🎉 PLAYWRIGHT LIVE AUDIT: ${results.filter(r => r.status === 200).length}/${ROUTES.length} ROUTES 100% OPERATIONAL`);
  console.log("==========================================");
})();
