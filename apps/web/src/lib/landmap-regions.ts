// Mock inteligência territorial — Fortaleza/CE.
// Estrutura modular: cada região tem coordenadas, score 0-100, e camadas de dados.
// Substituir por integrações reais (IBGE, prefeituras, APIs geoespaciais) sem alterar a UI.

export interface RegionMetric {
  label: string;
  value: string;
  hint?: string;
}

export interface RegionTimelineEvent {
  year: number;
  title: string;
  category: "infra" | "empreendimento" | "publico" | "economia";
}

export interface RegionInsight {
  id: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  score: number; // Score LandMap 0-100
  priceSqm: number;
  priceSqmDelta12m: number; // %
  liquidity: "baixa" | "media" | "alta";
  population: number;
  incomeAvg: number;
  hdi: number;
  gdp: number;
  gdpGrowth: number;
  zoning: string;
  environmentalRisk: "baixo" | "medio" | "alto";
  floodRisk: "baixo" | "medio" | "alto";
  layerScores: {
    valorization: number;
    growth: number;
    infrastructure: number;
    development: number;
    safety: number;
    mobility: number;
    urbanQuality: number;
    populationDensity: number;
  };
  priceHistory: { year: number; value: number }[];
  timeline: RegionTimelineEvent[];
  highlights: string[];
}

export const FORTALEZA_CENTER: [number, number] = [-3.7327, -38.5267];

export const REGIONS: RegionInsight[] = [
  {
    id: "meireles",
    name: "Meireles",
    city: "Fortaleza",
    state: "CE",
    lat: -3.7275,
    lng: -38.4986,
    score: 92,
    priceSqm: 14800,
    priceSqmDelta12m: 11.4,
    liquidity: "alta",
    population: 38600,
    incomeAvg: 9800,
    hdi: 0.912,
    gdp: 2.4,
    gdpGrowth: 6.2,
    zoning: "ZR-2 / ZC-3",
    environmentalRisk: "baixo",
    floodRisk: "baixo",
    layerScores: {
      valorization: 94,
      growth: 78,
      infrastructure: 96,
      development: 88,
      safety: 82,
      mobility: 90,
      urbanQuality: 95,
      populationDensity: 88,
    },
    priceHistory: [
      { year: 2019, value: 9800 },
      { year: 2020, value: 10400 },
      { year: 2021, value: 11600 },
      { year: 2022, value: 12800 },
      { year: 2023, value: 13500 },
      { year: 2024, value: 14100 },
      { year: 2025, value: 14800 },
    ],
    timeline: [
      { year: 2022, title: "Requalificação da orla", category: "publico" },
      { year: 2023, title: "Novo hotel 5 estrelas", category: "empreendimento" },
      { year: 2024, title: "Corredor cicloviário integrado", category: "infra" },
      { year: 2026, title: "Torre corporativa AAA prevista", category: "empreendimento" },
    ],
    highlights: [
      "Uma das maiores liquidez do estado",
      "Densidade hoteleira e corporativa premium",
      "Baixo risco ambiental e boa mobilidade",
    ],
  },
  {
    id: "aldeota",
    name: "Aldeota",
    city: "Fortaleza",
    state: "CE",
    lat: -3.7385,
    lng: -38.5023,
    score: 89,
    priceSqm: 12300,
    priceSqmDelta12m: 9.1,
    liquidity: "alta",
    population: 45200,
    incomeAvg: 8600,
    hdi: 0.898,
    gdp: 2.1,
    gdpGrowth: 5.4,
    zoning: "ZR-3",
    environmentalRisk: "baixo",
    floodRisk: "baixo",
    layerScores: {
      valorization: 88,
      growth: 74,
      infrastructure: 92,
      development: 84,
      safety: 78,
      mobility: 86,
      urbanQuality: 91,
      populationDensity: 92,
    },
    priceHistory: [
      { year: 2019, value: 8100 },
      { year: 2020, value: 8600 },
      { year: 2021, value: 9500 },
      { year: 2022, value: 10400 },
      { year: 2023, value: 11100 },
      { year: 2024, value: 11700 },
      { year: 2025, value: 12300 },
    ],
    timeline: [
      { year: 2022, title: "Novo shopping vertical", category: "empreendimento" },
      { year: 2024, title: "Ampliação hospitalar", category: "publico" },
      { year: 2025, title: "Recapeamento Av. Santos Dumont", category: "infra" },
    ],
    highlights: [
      "Corredor comercial mais denso da cidade",
      "Alta concentração de escolas premium",
      "Estoque de terrenos escasso",
    ],
  },
  {
    id: "cocobeach",
    name: "Cocó",
    city: "Fortaleza",
    state: "CE",
    lat: -3.7554,
    lng: -38.4826,
    score: 84,
    priceSqm: 9800,
    priceSqmDelta12m: 13.8,
    liquidity: "alta",
    population: 22800,
    incomeAvg: 7900,
    hdi: 0.881,
    gdp: 1.6,
    gdpGrowth: 7.9,
    zoning: "ZR-2 / APA Cocó",
    environmentalRisk: "medio",
    floodRisk: "baixo",
    layerScores: {
      valorization: 90,
      growth: 88,
      infrastructure: 84,
      development: 86,
      safety: 80,
      mobility: 82,
      urbanQuality: 88,
      populationDensity: 68,
    },
    priceHistory: [
      { year: 2019, value: 5800 },
      { year: 2020, value: 6300 },
      { year: 2021, value: 7100 },
      { year: 2022, value: 7900 },
      { year: 2023, value: 8600 },
      { year: 2024, value: 9200 },
      { year: 2025, value: 9800 },
    ],
    timeline: [
      { year: 2023, title: "Novo parque linear", category: "publico" },
      { year: 2024, title: "3 lançamentos residenciais de alto padrão", category: "empreendimento" },
      { year: 2026, title: "Novo BRT previsto", category: "infra" },
    ],
    highlights: [
      "Maior valorização dos últimos 12 meses",
      "Fronteira nova entre premium e alto padrão",
      "APA impõe teto de gabarito em parte do bairro",
    ],
  },
  {
    id: "papicu",
    name: "Papicu",
    city: "Fortaleza",
    state: "CE",
    lat: -3.7462,
    lng: -38.4778,
    score: 76,
    priceSqm: 7400,
    priceSqmDelta12m: 8.7,
    liquidity: "media",
    population: 24100,
    incomeAvg: 5400,
    hdi: 0.842,
    gdp: 1.1,
    gdpGrowth: 5.1,
    zoning: "ZR-2",
    environmentalRisk: "baixo",
    floodRisk: "medio",
    layerScores: {
      valorization: 76,
      growth: 82,
      infrastructure: 78,
      development: 74,
      safety: 62,
      mobility: 88,
      urbanQuality: 74,
      populationDensity: 82,
    },
    priceHistory: [
      { year: 2019, value: 4900 },
      { year: 2020, value: 5200 },
      { year: 2021, value: 5700 },
      { year: 2022, value: 6200 },
      { year: 2023, value: 6600 },
      { year: 2024, value: 7000 },
      { year: 2025, value: 7400 },
    ],
    timeline: [
      { year: 2022, title: "Terminal integrado", category: "infra" },
      { year: 2024, title: "Novo hospital regional", category: "publico" },
    ],
    highlights: [
      "Hub de mobilidade da zona leste",
      "Preço competitivo com liquidez saudável",
      "Boa relação preço x infraestrutura",
    ],
  },
  {
    id: "sapiranga",
    name: "Sapiranga",
    city: "Fortaleza",
    state: "CE",
    lat: -3.7791,
    lng: -38.4783,
    score: 72,
    priceSqm: 4900,
    priceSqmDelta12m: 15.2,
    liquidity: "media",
    population: 35400,
    incomeAvg: 4200,
    hdi: 0.798,
    gdp: 0.8,
    gdpGrowth: 8.6,
    zoning: "ZR-1 / ZE",
    environmentalRisk: "medio",
    floodRisk: "baixo",
    layerScores: {
      valorization: 84,
      growth: 92,
      infrastructure: 68,
      development: 82,
      safety: 66,
      mobility: 72,
      urbanQuality: 68,
      populationDensity: 60,
    },
    priceHistory: [
      { year: 2019, value: 2600 },
      { year: 2020, value: 2900 },
      { year: 2021, value: 3300 },
      { year: 2022, value: 3800 },
      { year: 2023, value: 4200 },
      { year: 2024, value: 4500 },
      { year: 2025, value: 4900 },
    ],
    timeline: [
      { year: 2022, title: "Novo eixo viário Alberto Craveiro", category: "infra" },
      { year: 2024, title: "Condomínios clube em expansão", category: "empreendimento" },
      { year: 2026, title: "Duplicação da CE-025 prevista", category: "infra" },
    ],
    highlights: [
      "Fronteira de expansão urbana com maior crescimento %",
      "Ticket de entrada baixo com forte tendência de alta",
      "Grande estoque disponível para loteadoras",
    ],
  },
  {
    id: "eusebio",
    name: "Eusébio Centro",
    city: "Eusébio",
    state: "CE",
    lat: -3.8898,
    lng: -38.4506,
    score: 81,
    priceSqm: 3800,
    priceSqmDelta12m: 18.6,
    liquidity: "alta",
    population: 55200,
    incomeAvg: 4800,
    hdi: 0.771,
    gdp: 4.2,
    gdpGrowth: 11.4,
    zoning: "ZM / ZE",
    environmentalRisk: "baixo",
    floodRisk: "baixo",
    layerScores: {
      valorization: 90,
      growth: 96,
      infrastructure: 74,
      development: 92,
      safety: 78,
      mobility: 76,
      urbanQuality: 78,
      populationDensity: 52,
    },
    priceHistory: [
      { year: 2019, value: 1600 },
      { year: 2020, value: 1900 },
      { year: 2021, value: 2300 },
      { year: 2022, value: 2700 },
      { year: 2023, value: 3100 },
      { year: 2024, value: 3400 },
      { year: 2025, value: 3800 },
    ],
    timeline: [
      { year: 2022, title: "Novo shopping regional", category: "empreendimento" },
      { year: 2023, title: "Instalação de 2 galpões logísticos", category: "economia" },
      { year: 2025, title: "Novo campus universitário", category: "publico" },
    ],
    highlights: [
      "Maior crescimento de PIB da região metropolitana",
      "Vetor logístico ligado ao Porto do Pecém",
      "Alto retorno projetado para investimento em terras",
    ],
  },
  {
    id: "cambeba",
    name: "Cambeba",
    city: "Fortaleza",
    state: "CE",
    lat: -3.8199,
    lng: -38.4909,
    score: 78,
    priceSqm: 5600,
    priceSqmDelta12m: 10.4,
    liquidity: "media",
    population: 18600,
    incomeAvg: 6100,
    hdi: 0.847,
    gdp: 1.3,
    gdpGrowth: 6.8,
    zoning: "ZR-2 / ZE",
    environmentalRisk: "baixo",
    floodRisk: "baixo",
    layerScores: {
      valorization: 78,
      growth: 84,
      infrastructure: 82,
      development: 76,
      safety: 74,
      mobility: 80,
      urbanQuality: 78,
      populationDensity: 58,
    },
    priceHistory: [
      { year: 2019, value: 3400 },
      { year: 2020, value: 3800 },
      { year: 2021, value: 4200 },
      { year: 2022, value: 4700 },
      { year: 2023, value: 5000 },
      { year: 2024, value: 5300 },
      { year: 2025, value: 5600 },
    ],
    timeline: [
      { year: 2022, title: "Centro administrativo estadual", category: "publico" },
      { year: 2024, title: "Novo hospital", category: "publico" },
    ],
    highlights: [
      "Polo administrativo e de serviços",
      "Boa infraestrutura viária",
      "Terrenos de médio porte disponíveis",
    ],
  },
  {
    id: "montese",
    name: "Montese",
    city: "Fortaleza",
    state: "CE",
    lat: -3.7666,
    lng: -38.5305,
    score: 58,
    priceSqm: 3200,
    priceSqmDelta12m: 3.2,
    liquidity: "media",
    population: 34500,
    incomeAvg: 3100,
    hdi: 0.752,
    gdp: 0.6,
    gdpGrowth: 2.4,
    zoning: "ZR-1",
    environmentalRisk: "medio",
    floodRisk: "medio",
    layerScores: {
      valorization: 54,
      growth: 46,
      infrastructure: 70,
      development: 48,
      safety: 44,
      mobility: 74,
      urbanQuality: 58,
      populationDensity: 80,
    },
    priceHistory: [
      { year: 2019, value: 2600 },
      { year: 2020, value: 2700 },
      { year: 2021, value: 2800 },
      { year: 2022, value: 2900 },
      { year: 2023, value: 3000 },
      { year: 2024, value: 3100 },
      { year: 2025, value: 3200 },
    ],
    timeline: [
      { year: 2023, title: "Requalificação de praças", category: "publico" },
    ],
    highlights: [
      "Bairro consolidado com valorização estável",
      "Boa conexão com centro e leste",
      "Baixa oferta de novos empreendimentos",
    ],
  },
  {
    id: "barra-do-ceara",
    name: "Barra do Ceará",
    city: "Fortaleza",
    state: "CE",
    lat: -3.7027,
    lng: -38.5891,
    score: 42,
    priceSqm: 2100,
    priceSqmDelta12m: -2.8,
    liquidity: "baixa",
    population: 76400,
    incomeAvg: 1900,
    hdi: 0.681,
    gdp: 0.4,
    gdpGrowth: 1.1,
    zoning: "ZR-1",
    environmentalRisk: "alto",
    floodRisk: "alto",
    layerScores: {
      valorization: 30,
      growth: 34,
      infrastructure: 52,
      development: 38,
      safety: 32,
      mobility: 62,
      urbanQuality: 44,
      populationDensity: 88,
    },
    priceHistory: [
      { year: 2019, value: 2200 },
      { year: 2020, value: 2250 },
      { year: 2021, value: 2200 },
      { year: 2022, value: 2180 },
      { year: 2023, value: 2160 },
      { year: 2024, value: 2130 },
      { year: 2025, value: 2100 },
    ],
    timeline: [],
    highlights: [
      "Região com desvalorização recente",
      "Risco ambiental costeiro elevado",
      "Baixa entrada de empreendimentos novos",
    ],
  },
];

export const LAYERS = [
  { id: "valorization", label: "Valorização m²", accent: "primary" },
  { id: "growth", label: "Velocidade de crescimento", accent: "primary" },
  { id: "development", label: "Índice de desenvolvimento", accent: "primary" },
  { id: "infrastructure", label: "Infraestrutura", accent: "primary" },
  { id: "safety", label: "Segurança", accent: "primary" },
  { id: "mobility", label: "Mobilidade", accent: "primary" },
  { id: "urbanQuality", label: "Qualidade urbana", accent: "primary" },
  { id: "populationDensity", label: "Densidade populacional", accent: "primary" },
] as const;

export type LayerId = typeof LAYERS[number]["id"];

export function scoreToColor(score: number): string {
  // Verde (Top Oportunidade) -> Verde Claro -> Âmbar -> Laranja -> Vermelho
  if (score >= 80) return "#16a34a";
  if (score >= 65) return "#22c55e";
  if (score >= 50) return "#eab308";
  if (score >= 35) return "#f97316";
  return "#dc2626";
}

export function scoreToFillColor(score: number): string {
  if (score >= 80) return "#16a34a";
  if (score >= 65) return "#22c55e";
  if (score >= 50) return "#eab308";
  if (score >= 35) return "#f97316";
  return "#dc2626";
}

export function scoreLabel(score: number): string {
  if (score >= 80) return "Excepcional";
  if (score >= 65) return "Alto potencial";
  if (score >= 50) return "Médio";
  if (score >= 35) return "Baixo";
  return "Crítico";
}
