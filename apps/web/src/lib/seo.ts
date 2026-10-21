import type { Metadata } from 'next';
import { LANDMAP_OG_IMAGE } from './og-image';

/**
 * SEO factory — metadata único por rota (i18n pt-BR/en-US/es-ES).
 *
 * Problema que resolve: 151 page.tsx existem em [locale], mas só ~16 rotas têm
 * layout com metadata próprio — o resto herda o título/description genérico do
 * layout raiz ("LandMap — Inteligência de terrenos"), gerando títulos duplicados.
 *
 * Uso (layout segmentado da rota):
 *   import { buildRouteMetadata } from '../../../lib/seo';
 *   export async function generateMetadata({ params }) {
 *     return buildRouteMetadata({ route: 'terrenos', locale: (await params).locale });
 *   }
 *
 * O `alternates` (canonical + hreflang + x-default) é gerado automaticamente,
 * igual ao padrão do layout raiz, prevenindo duplicatas por locale.
 */

export const LANDMAP_SITE_URL = 'https://landmapwebprod2.vercel.app';
export const LOCALES = ['pt-BR', 'en-US', 'es-ES'] as const;
export type Locale = (typeof LOCALES)[number];

export interface RouteSeo {
  title: Record<Locale, string>;
  description: Record<Locale, string>;
}

const DEFAULT_DESC: Record<Locale, string> = {
  'pt-BR':
    'LandMap: mapa de valorização, ranking de regiões e histórico de preço por m² para decisões de terreno no Brasil.',
  'en-US':
    'LandMap: appreciation map, region ranking and price-per-m² history for smarter land decisions in Brazil.',
  'es-ES':
    'LandMap: mapa de valorización, ranking de regiones e historial de precio por m² para decisiones de terreno en Brasil.',
};

/** Dicionário de rotas públicas indexáveis — adicione aqui novas rotas. */
export const ROUTE_SEO: Record<string, RouteSeo> = {
  map: {
    title: {
      'pt-BR': 'Mapa de inteligência territorial — calor de valorização | LandMap',
      'en-US': 'Territorial intelligence map — appreciation heat | LandMap',
      'es-ES': 'Mapa de inteligencia territorial — calor de valorización | LandMap',
    },
    description: {
      'pt-BR':
        'Mapa interativo do Brasil com heatmap de valorização, score LandMap por região e análise de terrenos em tempo real.',
      'en-US':
        'Interactive Brazil map with appreciation heatmap, LandMap score by region and real-time land analysis.',
      'es-ES':
        'Mapa interactivo de Brasil con mapa de calor de valorización, score LandMap por región y análisis de terrenos en tiempo real.',
    },
  },
  dashboard: {
    title: {
      'pt-BR': 'Dashboard do mercado — preço médio m² e regiões | LandMap',
      'en-US': 'Market dashboard — average price per m² and regions | LandMap',
      'es-ES': 'Panel del mercado — precio medio por m² y regiones | LandMap',
    },
    description: {
      'pt-BR':
        'Visão geral do mercado: preço médio do m², regiões em destaque e score LandMap em um só painel.',
      'en-US':
        'Market overview: average price per m², highlighted regions and the LandMap score in one panel.',
      'es-ES':
        'Visión general del mercado: precio medio por m², regiones destacadas y el score LandMap en un solo panel.',
    },
  },
  compare: {
    title: {
      'pt-BR': 'Comparador de regiões e imóveis | LandMap',
      'en-US': 'Region and property comparator | LandMap',
      'es-ES': 'Comparador de regiones e inmuebles | LandMap',
    },
    description: {
      'pt-BR':
        'Compare regiões, bairros e imóveis lado a lado por preço do m², valorização, score e potencial de retorno.',
      'en-US':
        'Compare regions, neighborhoods and properties side by side by price per m², appreciation, score and return potential.',
      'es-ES':
        'Compara regiones, barrios e inmuebles lado a lado por precio por m², valorización, score y potencial de retorno.',
    },
  },
  search: {
    title: {
      'pt-BR': 'Buscar terrenos e imóveis no Brasil | LandMap',
      'en-US': 'Search land and property in Brazil | LandMap',
      'es-ES': 'Buscar terrenos e inmuebles en Brasil | LandMap',
    },
    description: {
      'pt-BR':
        'Busque terrenos e imóveis por cidade, bairro ou CEP e encontre oportunidades com grade A–F e valorização.',
      'en-US':
        'Search land and property by city, neighborhood or ZIP and find opportunities with A–F grades and appreciation.',
      'es-ES':
        'Busca terrenos e inmuebles por ciudad, barrio o CP y encuentra oportunidades con calificación A–F y valorización.',
    },
  },
  terrenos: {
    title: {
      'pt-BR': 'Terrenos à venda no Brasil com análise de valorização | LandMap',
      'en-US': 'Land for sale in Brazil with appreciation analysis | LandMap',
      'es-ES': 'Terrenos en venta en Brasil con análisis de valorización | LandMap',
    },
    description: {
      'pt-BR':
        'Encontre terrenos à venda com grade A–F, retorno de investimento, valorização por bairro e dados reais de 20 cidades brasileiras.',
      'en-US':
        'Find land for sale with A–F grades, investment return, neighborhood appreciation and real data from 20 Brazilian cities.',
      'es-ES':
        'Encuentra terrenos en venta con calificación A–F, retorno de inversión, valorización por barrio y datos reales de 20 ciudades brasileñas.',
    },
  },
  investor: {
    title: {
      'pt-BR': 'Investidor Imobiliário — cap rate, IRR e ROI | LandMap',
      'en-US': 'Real Estate Investor — cap rate, IRR and ROI | LandMap',
      'es-ES': 'Inversor Inmobiliario — cap rate, IRR y ROI | LandMap',
    },
    description: {
      'pt-BR':
        'Métricas de investimento imobiliário: cap rate, cash-on-cash, IRR, ROI, price-to-rent e fluxo de caixa para decidir com dados.',
      'en-US':
        'Real estate investment metrics: cap rate, cash-on-cash, IRR, ROI, price-to-rent and cash flow to decide with data.',
      'es-ES':
        'Métricas de inversión inmobiliaria: cap rate, cash-on-cash, IRR, ROI, price-to-rent y flujo de caja para decidir con datos.',
    },
  },
  worldmonitor: {
    title: {
      'pt-BR': 'WorldMonitor — Oportunidades solares e datacenters em tempo real | LandMap',
      'en-US': 'WorldMonitor — Solar and data center opportunities in real time | LandMap',
      'es-ES': 'WorldMonitor — Oportunidades solares y datacenters en tiempo real | LandMap',
    },
    description: {
      'pt-BR':
        'Radiação solar, infraestrutura de datacenters e usinas reais: scoring de oportunidade A–F atualizado a cada 6 horas.',
      'en-US':
        'Solar radiation, data center infrastructure and real power plants: A–F opportunity scoring updated every 6 hours.',
      'es-ES':
        'Radiación solar, infraestructura de datacenters y plantas reales: puntuación de oportunidad A–F actualizada cada 6 horas.',
    },
  },
  history40: {
    title: {
      'pt-BR': '40 anos da economia brasileira — CDI, IPCA, Selic e IGP-M | LandMap',
      'en-US': '40 years of the Brazilian economy — CDI, IPCA, Selic, IGP-M | LandMap',
      'es-ES': '40 años de la economía brasileña — CDI, IPCA, Selic e IGP-M | LandMap',
    },
    description: {
      'pt-BR':
        'Histórico real de 8 séries oficiais do Banco Central (1986–2026): CDI, IPCA, Selic, IGP-M e mais, em tempo real.',
      'en-US':
        'Real history of 8 official Central Bank series (1986–2026): CDI, IPCA, Selic, IGP-M and more, in real time.',
      'es-ES':
        'Historial real de 8 series oficiales del Banco Central (1986–2026): CDI, IPCA, Selic, IGP-M y más, en tiempo real.',
    },
  },
  market: {
    title: {
      'pt-BR': 'Mercado Imobiliário Brasileiro — preço por m² e tendências | LandMap',
      'en-US': 'Brazilian Real Estate Market — price per m² and trends | LandMap',
      'es-ES': 'Mercado Inmobiliario Brasileño — precio por m² y tendencias | LandMap',
    },
    description: {
      'pt-BR':
        'Índices de mercado, preço médio por m² por cidade e tendências de valorização para orientar compra, venda e investimento.',
      'en-US':
        'Market indices, average price per m² by city and appreciation trends to guide buying, selling and investing.',
      'es-ES':
        'Índices de mercado, precio medio por m² por ciudad y tendencias de valorización para orientar compra, venta e inversión.',
    },
  },
  cities: {
    title: {
      'pt-BR': 'Cidades — Inteligência imobiliária por município | LandMap',
      'en-US': 'Cities — Real estate intelligence by municipality | LandMap',
      'es-ES': 'Ciudades — Inteligencia inmobiliaria por municipio | LandMap',
    },
    description: {
      'pt-BR':
        'Compare 20 cidades brasileiras por preço do m², valorização histórica e potencial de investimento em terrenos e imóveis.',
      'en-US':
        'Compare 20 Brazilian cities by price per m², historical appreciation and investment potential in land and property.',
      'es-ES':
        'Compara 20 ciudades brasileñas por precio del m², valorización histórica y potencial de inversión en terrenos e inmuebles.',
    },
  },
  neighborhoods: {
    title: {
      'pt-BR': 'Bairros — Valorização e preço por m² | LandMap',
      'en-US': 'Neighborhoods — Appreciation and price per m² | LandMap',
      'es-ES': 'Barrios — Valorización y precio por m² | LandMap',
    },
    description: {
      'pt-BR':
        'Ranking de bairros por valorização, preço por m² e potencial de retorno para decisões de terreno e imóvel no Brasil.',
      'en-US':
        'Neighborhood ranking by appreciation, price per m² and return potential for land and property decisions in Brazil.',
      'es-ES':
        'Ranking de barrios por valorización, precio por m² y potencial de retorno para decisiones de terreno e inmueble en Brasil.',
    },
  },
  valorization: {
    title: {
      'pt-BR': 'Valorização Imobiliária — histórico e projeção | LandMap',
      'en-US': 'Real Estate Appreciation — history and forecast | LandMap',
      'es-ES': 'Valorización Inmobiliaria — historial y proyección | LandMap',
    },
    description: {
      'pt-BR':
        'Histórico de valorização por região, tendência de preço por m² e projeção para comprar antes da curva no Brasil.',
      'en-US':
        'Appreciation history by region, price-per-m² trend and forecast to buy ahead of the curve in Brazil.',
      'es-ES':
        'Historial de valorización por región, tendencia de precio por m² y proyección para comprar antes de la curva en Brasil.',
    },
  },
  insights: {
    title: {
      'pt-BR': 'Insights do mercado imobiliário brasileiro | LandMap',
      'en-US': 'Brazilian real estate market insights | LandMap',
      'es-ES': 'Insights del mercado inmobiliario brasileño | LandMap',
    },
    description: {
      'pt-BR':
        'Análises e dados do mercado imobiliário: valorização, leilões, terrenos, retorno de investimento e tendências por região.',
      'en-US':
        'Real estate analysis and data: appreciation, auctions, land, investment return and regional trends.',
      'es-ES':
        'Análisis y datos del mercado inmobiliario: valorización, subastas, terrenos, retorno de inversión y tendencias por región.',
    },
  },
  metodologia: {
    title: {
      'pt-BR': 'Metodologia de avaliação e grades A–F | LandMap',
      'en-US': 'Scoring methodology and A–F grades | LandMap',
      'es-ES': 'Metodología de evaluación y calificaciones A–F | LandMap',
    },
    description: {
      'pt-BR':
        'Como o LandMap calcula valorização, potencial de retorno e as grades A–F de cada terreno, bairro e cidade.',
      'en-US':
        'How LandMap calculates appreciation, return potential and the A–F grades for each land, neighborhood and city.',
      'es-ES':
        'Cómo calcula LandMap la valorización, el potencial de retorno y las calificaciones A–F de cada terreno, barrio y ciudad.',
    },
  },
  sobre: {
    title: {
      'pt-BR': 'Sobre o LandMap — inteligência territorial brasileira | LandMap',
      'en-US': 'About LandMap — Brazilian territorial intelligence | LandMap',
      'es-ES': 'Sobre LandMap — inteligencia territorial brasileña | LandMap',
    },
    description: {
      'pt-BR':
        'Plataforma aberta de inteligência imobiliária: dados reais de mercado, mapa interativo, RAG e ferramentas para decidir com confiança.',
      'en-US':
        'Open real estate intelligence platform: real market data, interactive map, RAG and tools to decide with confidence.',
      'es-ES':
        'Plataforma abierta de inteligencia inmobiliaria: datos reales de mercado, mapa interactivo, RAG y herramientas para decidir con confianza.',
    },
  },
  brasil: {
    title: {
      'pt-BR': 'Brasil — Inteligência territorial para decisões imobiliárias | LandMap',
      'en-US': 'Brazil — Territorial intelligence for real estate decisions | LandMap',
      'es-ES': 'Brasil — Inteligencia territorial para decisiones inmobiliarias | LandMap',
    },
    description: {
      'pt-BR':
        'Panorama nacional de terrenos, imóveis e investimento: valorização, preço por m² e oportunidades em todo o Brasil.',
      'en-US':
        'National overview of land, property and investment: appreciation, price per m² and opportunities across Brazil.',
      'es-ES':
        'Panorama nacional de terrenos, inmuebles e inversión: valorización, precio por m² y oportunidades en todo Brasil.',
    },
  },
  glossary: {
    title: {
      'pt-BR': 'Glossário imobiliário — cap rate, IRR, price-to-rent | LandMap',
      'en-US': 'Real estate glossary — cap rate, IRR, price-to-rent | LandMap',
      'es-ES': 'Glosario inmobiliario — cap rate, IRR, price-to-rent | LandMap',
    },
    description: {
      'pt-BR':
        'Entenda os termos essenciais do mercado imobiliário e de investimento em linguagem simples, com exemplos práticos.',
      'en-US':
        'Understand the essential real estate and investment terms in plain language, with practical examples.',
      'es-ES':
        'Entiende los términos esenciales del mercado inmobiliario y de inversión en lenguaje sencillo, con ejemplos prácticos.',
    },
  },
  resources: {
    title: {
      'pt-BR': 'Recursos e guias de investimento imobiliário | LandMap',
      'en-US': 'Real estate investment resources and guides | LandMap',
      'es-ES': 'Recursos y guías de inversión inmobiliaria | LandMap',
    },
    description: {
      'pt-BR':
        'Guias práticos para comprar terreno, avaliar imóvel, participar de leilões e calcular retorno de investimento no Brasil.',
      'en-US':
        'Practical guides to buying land, appraising property, joining auctions and calculating investment return in Brazil.',
      'es-ES':
        'Guías prácticas para comprar terreno, evaluar inmueble, participar en subastas y calcular retorno de inversión en Brasil.',
    },
  },
};

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || LANDMAP_SITE_URL).replace(/\/$/, '');
}

export function normalizeLocale(locale?: string): Locale {
  return (LOCALES as readonly string[]).includes(locale ?? '') ? (locale as Locale) : 'pt-BR';
}

export function buildRouteMetadata(opts: {
  route: string;
  locale?: string;
  title?: string;
  description?: string;
  noindex?: boolean;
}): Metadata {
  const locale = normalizeLocale(opts.locale);
  const siteUrl = getSiteUrl();
  const def = ROUTE_SEO[opts.route];
  const path = opts.route ? `/${opts.route}` : '';
  const url = `${siteUrl}/${locale}${path}`;

  const title = opts.title || def?.title[locale] || 'LandMap';
  const description = opts.description || def?.description[locale] || DEFAULT_DESC[locale];

  const languages: Record<string, string> = { 'x-default': `${siteUrl}/pt-BR${path}` };
  for (const l of LOCALES) languages[l] = `${siteUrl}/${l}${path}`;

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    alternates: { canonical: url, languages },
    openGraph: {
      title,
      description,
      url,
      siteName: 'LandMap',
      type: 'website',
      locale,
      images: [{ url: LANDMAP_OG_IMAGE, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [LANDMAP_OG_IMAGE],
    },
    robots: opts.noindex ? { index: false, follow: false } : { index: true, follow: true },
  };
}
