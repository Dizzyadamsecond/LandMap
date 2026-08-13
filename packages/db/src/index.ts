export type PropertyStatus = 'active' | 'sold' | 'rented' | 'reserved';

export type PropertyType = 'apartamento' | 'casa' | 'terreno' | 'comercial';
export type PropertyModality = 'venda' | 'aluguel' | 'lancamento';

/** Brazilian states (UF). */
export type UF =
  | 'AC' | 'AL' | 'AP' | 'AM' | 'BA' | 'CE' | 'DF' | 'ES' | 'GO' | 'MA'
  | 'MT' | 'MS' | 'MG' | 'PA' | 'PB' | 'PR' | 'PE' | 'PI' | 'RJ' | 'RN'
  | 'RS' | 'RO' | 'RR' | 'SC' | 'SP' | 'SE' | 'TO';

export type Property = {
  id: string;
  title: string;
  city: string;
  state: string;
  price: number;
  areaM2: number;
  bedrooms?: number;
  type: PropertyType;
  modality: PropertyModality;
  available: boolean;
  latitude?: number;
  longitude?: number;
  neighborhood?: string;
  zone?: string;
  street?: string;
  status: PropertyStatus;
  createdAt: string;
  updatedAt: string;
  images: string[];
  tags: string[];
  /** Residential detail — optional so legacy 10k records stay valid. */
  bathrooms?: number;
  suites?: number;
  parkingSpaces?: number;
  condoFee?: number;
  furnished?: boolean;
  floor?: number;
  buildingName?: string;
};

/* ------------------------------------------------------------------ */
/*  Leilões (auction lots) — first-class structured dataset            */
/* ------------------------------------------------------------------ */

export type AuctionCategory = 'terreno' | 'casa' | 'apartamento' | 'comercial' | 'rural' | 'outro';
export type AuctionType = 'judicial' | 'extrajudicial' | 'bank' | 'public';
export type AuctionLotStatus = 'open' | 'scheduled' | 'closed' | 'unknown';
export type AuctionGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

/**
 * A single auction lot (imóvel em leilão). Covers casas, apartamentos,
 * terrenos e comerciais, de leilão judicial, extrajudicial ou de banco.
 * Discount vs. market value (`discountPct`) and an opportunity grade make
 * it directly comparable to the residential `Property` dataset.
 */
export type AuctionLot = {
  id: string;
  source: string;
  sourceUrl?: string;
  title: string;
  description?: string;
  category: AuctionCategory;
  auctionType: AuctionType;
  city: string;
  state: UF;
  neighborhood?: string;
  street?: string;
  latitude?: number;
  longitude?: number;
  areaM2?: number;
  bedrooms?: number;
  bathrooms?: number;
  suites?: number;
  parkingSpaces?: number;
  floor?: number;
  /** Lance mínimo / valor inicial do leilão. */
  price?: number;
  /** Avaliação de mercado (edital) — usado para calcular o desconto. */
  marketPrice?: number;
  /** Desconto percentual do lance em relação à avaliação de mercado. */
  discountPct?: number;
  auctionDate?: string;
  status: AuctionLotStatus;
  matricula?: string;
  editalUrl?: string;
  origemDivida?: string;
  /** Oportunidade LandMap (A–F). */
  grade?: AuctionGrade;
  score?: number;
  risks?: string[];
  drivers?: string[];
  tags?: string[];
  updatedAt: string;
};

export type PriceHistory = {
  propertyId: string;
  date: string;
  price: number;
  event: 'listing' | 'reduction' | 'sold' | 'rented';
};

export type DbSchema = {
  properties: Property[];
};

/* ---- Query layer (pool-injectable, SQL-injection safe) ---- */
export {
  mapPropertyRow,
  getPropertyById,
  listProperties,
  insertProperty,
  updateProperty,
  softDeleteProperty,
} from './query.js';
export type {
  PgPoolLike,
  NewProperty,
  ListPropertiesOptions,
} from './query.js';

