import type { MetadataRoute } from "next";
import { i18n } from "../i18n";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://landmapprod.vercel.app"
).replace(/\/$/, "");

// Rotas públicas indexáveis (LandMap + Lovable-parity). Excluímos intencionalmente
// painéis autenticados/app-only e rotas de sistema para não vazar área privada no SEO.
// Regra: se a rota exige login (dashboard, leads, cockpit, portfolio, alerts, etc.),
// ela NÃO entra no sitemap — página autenticada indexada só desperdiça crawl budget.
const PUBLIC_ROUTES = [
  "",
  "search",
  "map",
  "regions",
  "plans",
  "insights",
  "market",
  "cities",
  "neighborhoods",
  "valorization",
  "terrenos",
  "investor",
  "live",
  "studio",
  "calculator",
  "status",
  "chat",
  "rag",
  "assistant",
  "glossary",
  "resources",
  "world",
  "world-3d",
  "worldmonitor",
  "history40",
  "developers",
  "integrations",
  "sobre",
  "privacy",
  "terms",
  "cookies",
  "aviso-legal",
  "metodologia",
  "cobertura",
  "fontes",
  "brasil",
  "syndicate",
  "underwriting",
  "viabilidade",
  "consorcio",
  "investment-memo",
  "risk-radar",
  "radar-insights",
  "market-index",
] as const;

const PRIORITY_BY_ROUTE: Record<string, number> = {
  "": 1.0,
  search: 0.9,
  map: 0.8,
  regions: 0.7,
  insights: 0.7,
  market: 0.7,
  cities: 0.6,
  neighborhoods: 0.6,
  valorization: 0.6,
  terrenos: 0.6,
  investor: 0.6,
  plans: 0.6,
  dashboard: 0.5,
  "world-3d": 0.5,
  world: 0.5,
  worldmonitor: 0.6,
  history40: 0.6,
  "property": 0.7,
};

function priorityFor(route: string): number {
  if (route.startsWith("property/")) return PRIORITY_BY_ROUTE["property"] ?? 0.6;
  return PRIORITY_BY_ROUTE[route] ?? 0.3;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of i18n.locales) {
    for (const route of PUBLIC_ROUTES) {
      const path = route === "" ? "" : `/${route}`;
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: now,
        changeFrequency: route === "" ? "daily" : "weekly",
        priority: priorityFor(route),
      });
    }
  }

  return entries;
}
