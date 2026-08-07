/**
 * ============================================================================
 * LandMap LATAM API — Multi-Country Infrastructure
 * ============================================================================
 * Unified API for Brazil, Mexico, Colombia, Argentina, Chile, Perú
 * Routes handle country-specific compliance, currencies, regulations
 *
 * Architecture:
 * - /api/latam/{country}/* routes for country-specific operations
 * - Shared base schema with country overrides
 * - Currency conversion (BRL/MXN/COP/ARS/CLP/PEN ↔ USD)
 * - Compliance engine (per country regulations)
 * ============================================================================
 */

import { Hono } from 'hono';
import { z } from 'zod';

type Env = {
  db: any;
  cache: any;
};

const latamRoutes = new Hono<{ Bindings: Env }>();

// ============================================================================
// Types
// ============================================================================

type Country = 'BR' | 'MX' | 'CO' | 'AR' | 'CL' | 'PE';

interface CountryConfig {
  country: Country;
  name: string;
  currency: string;
  language: string;
  timezone: string;
  phone_prefix: string;
  regulations: string[];
  compliance_rules: Record<string, string>;
}

interface PropertyLatAm {
  id: string;
  country: Country;
  address: string;
  price_local: number;
  price_usd: number;
  area_m2: number;
  bathrooms: number;
  bedrooms: number;
  property_type: 'apartment' | 'house' | 'land' | 'commercial';
  compliance_status: Record<string, boolean>;
}

// ============================================================================
// Country Configurations (Database would be source of truth)
// ============================================================================

const COUNTRY_CONFIG: Record<Country, CountryConfig> = {
  BR: {
    country: 'BR',
    name: 'Brasil',
    currency: 'BRL',
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    phone_prefix: '+55',
    regulations: ['CVM', 'CCI', 'CRIE', 'CRECI'],
    compliance_rules: {
      min_property_value: '50000 BRL',
      investor_kyc: 'required',
      local_id: 'CPF/CNPJ',
      income_verification: 'required',
    },
  },
  MX: {
    country: 'MX',
    name: 'México',
    currency: 'MXN',
    language: 'es-MX',
    timezone: 'America/Mexico_City',
    phone_prefix: '+52',
    regulations: ['CNBV', 'INFONAVIT', 'SIC', 'FIRA'],
    compliance_rules: {
      min_property_value: '1000000 MXN',
      investor_kyc: 'required',
      local_id: 'RFC',
      income_verification: 'required_for_financing',
    },
  },
  CO: {
    country: 'CO',
    name: 'Colombia',
    currency: 'COP',
    language: 'es-CO',
    timezone: 'America/Bogota',
    phone_prefix: '+57',
    regulations: ['FINCA', 'DNP', 'DIAN', 'SFC'],
    compliance_rules: {
      min_property_value: '100000000 COP',
      investor_kyc: 'required',
      local_id: 'CC',
      income_verification: 'required',
    },
  },
  AR: {
    country: 'AR',
    name: 'Argentina',
    currency: 'ARS',
    language: 'es-AR',
    timezone: 'America/Argentina/Buenos_Aires',
    phone_prefix: '+54',
    regulations: ['BCRA', 'CNV', 'AFSCA'],
    compliance_rules: {
      min_property_value: '1000000 ARS',
      investor_kyc: 'required',
      local_id: 'DNI/CUIT',
      income_verification: 'required',
      currency_control: 'restricted_outflow',
    },
  },
  CL: {
    country: 'CL',
    name: 'Chile',
    currency: 'CLP',
    language: 'es-CL',
    timezone: 'America/Santiago',
    phone_prefix: '+56',
    regulations: ['SVS', 'CMF', 'SII'],
    compliance_rules: {
      min_property_value: '50000000 CLP',
      investor_kyc: 'required',
      local_id: 'RUT',
      income_verification: 'required',
    },
  },
  PE: {
    country: 'PE',
    name: 'Perú',
    currency: 'PEN',
    language: 'es-PE',
    timezone: 'America/Lima',
    phone_prefix: '+51',
    regulations: ['SMV', 'APRA', 'SUNAT'],
    compliance_rules: {
      min_property_value: '500000 PEN',
      investor_kyc: 'required',
      local_id: 'DNI',
      income_verification: 'required',
    },
  },
};

// Currency exchange rates (cached hourly)
const EXCHANGE_RATES: Record<Country, number> = {
  BR: 5.2,  // 1 USD = 5.2 BRL
  MX: 17.5, // 1 USD = 17.5 MXN
  CO: 4200, // 1 USD = 4200 COP
  AR: 1000, // 1 USD = 1000 ARS (simplified, real rates vary)
  CL: 850,  // 1 USD = 850 CLP
  PE: 3.7,  // 1 USD = 3.7 PEN
};

// ============================================================================
// 1. COUNTRY INFO
// ============================================================================

/**
 * GET /api/latam/countries
 * List all available countries + config
 */
latamRoutes.get('/countries', async (c) => {
  const countries = Object.values(COUNTRY_CONFIG).map((cfg) => ({
    country: cfg.country,
    name: cfg.name,
    currency: cfg.currency,
    language: cfg.language,
    regulations: cfg.regulations,
  }));

  return c.json({
    type: 'FeatureCollection',
    countries,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/latam/{country}/config
 * Get country-specific configuration
 */
latamRoutes.get('/:country/config', async (c) => {
  const country = (c.req.param('country') || '').toUpperCase() as Country;

  if (!COUNTRY_CONFIG[country]) {
    return c.json({ error: 'Country not supported' }, 400);
  }

  const config = COUNTRY_CONFIG[country];

  return c.json({
    country: config.country,
    name: config.name,
    currency: config.currency,
    language: config.language,
    timezone: config.timezone,
    regulations: config.regulations,
    compliance_rules: config.compliance_rules,
    exchange_rate_to_usd: EXCHANGE_RATES[country],
  });
});

// ============================================================================
// 2. PROPERTY SEARCH (COUNTRY-SPECIFIC)
// ============================================================================

/**
 * GET /api/latam/{country}/properties/search
 * Search properties in a specific country
 *
 * Query params:
 * - query: text search
 * - min_price, max_price: price range (in local currency)
 * - property_type: apartment, house, land, commercial
 * - bedrooms, bathrooms: filters
 * - limit: max results
 */
latamRoutes.get('/:country/properties/search', async (c) => {
  const country = (c.req.param('country') || '').toUpperCase() as Country;

  if (!COUNTRY_CONFIG[country]) {
    return c.json({ error: 'Invalid country' }, 400);
  }

  const query = c.req.query('query') || '';
  const minPrice = parseFloat(c.req.query('min_price') || '0');
  const maxPrice = parseFloat(c.req.query('max_price') || '999999999');
  const propertyType = c.req.query('property_type');
  const bedrooms = c.req.query('bedrooms');
  const limit = Math.min(parseInt(c.req.query('limit') || '100', 10), 1000);

  try {
    // Build dynamic SQL based on country
    let sql = `
      SELECT
        id, country, address, price_local, price_usd,
        area_m2, bedrooms, bathrooms, property_type,
        ST_AsGeoJSON(geometry) as geometry
      FROM properties
      WHERE country = $1
        AND price_local BETWEEN $2 AND $3
    `;

    const params: any[] = [country, minPrice, maxPrice];

    if (propertyType) {
      params.push(propertyType);
      sql += ` AND property_type = $${params.length}`;
    }

    if (bedrooms) {
      params.push(parseInt(bedrooms, 10));
      sql += ` AND bedrooms >= $${params.length}`;
    }

    if (query) {
      params.push(`%${query}%`);
      sql += ` AND (address ILIKE $${params.length} OR city ILIKE $${params.length})`;
    }

    sql += ` ORDER BY price_local ASC LIMIT $${params.length + 1}`;
    params.push(limit);

    const results = await c.env.db?.query(sql, params);

    return c.json({
      type: 'FeatureCollection',
      country,
      currency: COUNTRY_CONFIG[country].currency,
      features: (results || []).map((p: any) => ({
        type: 'Feature',
        id: p.id,
        geometry: JSON.parse(p.geometry || '{}'),
        properties: {
          address: p.address,
          price_local: p.price_local,
          price_usd: p.price_usd,
          area_m2: p.area_m2,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          property_type: p.property_type,
        },
      })),
      total: results?.length || 0,
    });
  } catch (error) {
    return c.json({ error: 'Search failed', details: String(error) }, 500);
  }
});

// ============================================================================
// 3. PRICE CONVERSION (CURRENCY)
// ============================================================================

/**
 * GET /api/latam/convert?amount=100000&from=BR&to=USD
 * Convert between currencies
 */
latamRoutes.get('/convert', async (c) => {
  const amount = parseFloat(c.req.query('amount') || '0');
  const from = (c.req.query('from') || '').toUpperCase() as Country;
  const to = (c.req.query('to') || 'USD').toUpperCase();

  if (!amount || amount <= 0) {
    return c.json({ error: 'Invalid amount' }, 400);
  }

  if (!COUNTRY_CONFIG[from]) {
    return c.json({ error: 'Invalid source country' }, 400);
  }

  try {
    // Convert to USD first
    const amountUsd = amount / EXCHANGE_RATES[from];

    // Convert to target
    if (to === 'USD') {
      return c.json({
        from_amount: amount,
        from_currency: COUNTRY_CONFIG[from].currency,
        to_amount: amountUsd,
        to_currency: 'USD',
        rate: EXCHANGE_RATES[from],
        timestamp: new Date().toISOString(),
      });
    }

    const toCountry = to as Country;
    if (!COUNTRY_CONFIG[toCountry]) {
      return c.json({ error: 'Invalid target country' }, 400);
    }

    const amountConverted = amountUsd * EXCHANGE_RATES[toCountry];

    return c.json({
      from_amount: amount,
      from_currency: COUNTRY_CONFIG[from].currency,
      to_amount: amountConverted,
      to_currency: COUNTRY_CONFIG[toCountry].currency,
      rate_from_usd: EXCHANGE_RATES[from],
      rate_to_usd: EXCHANGE_RATES[toCountry],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json({ error: 'Conversion failed', details: String(error) }, 500);
  }
});

// ============================================================================
// 4. COMPLIANCE CHECK (PER COUNTRY)
// ============================================================================

/**
 * POST /api/latam/{country}/compliance/check
 * Verify if investor/property/deal meets country regulations
 *
 * Body:
 * {
 *   "investor_type": "individual" | "company",
 *   "investor_nationality": "BR" | "MX" | ...,
 *   "property_value_local": 1000000,
 *   "transaction_type": "buy" | "rent" | "invest" | "fractional",
 *   "financing_requested": true/false
 * }
 */
latamRoutes.post('/:country/compliance/check', async (c) => {
  const country = (c.req.param('country') || '').toUpperCase() as Country;

  if (!COUNTRY_CONFIG[country]) {
    return c.json({ error: 'Invalid country' }, 400);
  }

  const body = await c.req.json();
  const { investor_type, investor_nationality, property_value_local, transaction_type, financing_requested } = body;

  const config = COUNTRY_CONFIG[country];
  const compliance: Record<string, boolean> = {};

  try {
    // Check: Minimum property value
    const minValue = parseInt(
      config.compliance_rules.min_property_value?.split(' ')[0] || '0',
      10
    );
    compliance['minimum_value_met'] = property_value_local >= minValue;

    // Check: KYC required
    compliance['kyc_required'] = config.compliance_rules.investor_kyc === 'required';

    // Check: Income verification
    if (financing_requested) {
      compliance['income_verification_required'] =
        config.compliance_rules.income_verification === 'required' ||
        config.compliance_rules.income_verification === 'required_for_financing';
    }

    // Check: Currency controls (Argentina-specific)
    if (country === 'AR' && investor_nationality !== 'AR') {
      compliance['currency_restrictions'] = config.compliance_rules.currency_control === 'restricted_outflow';
    }

    // Calculate compliance score
    const passedChecks = Object.values(compliance).filter((v) => v === true).length;
    const totalChecks = Object.keys(compliance).length;
    const complianceScore = (passedChecks / totalChecks) * 100;

    return c.json({
      country,
      transaction_type,
      compliance_checks: compliance,
      compliance_score: complianceScore,
      approved: complianceScore >= 80,
      regulations_reference: config.regulations,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json({ error: 'Compliance check failed', details: String(error) }, 500);
  }
});

// ============================================================================
// 5. MULTI-COUNTRY PORTFOLIO
// ============================================================================

/**
 * GET /api/latam/portfolio/summary
 * Aggregate portfolio across all countries
 *
 * Requires: x-user-id header
 */
latamRoutes.get('/portfolio/summary', async (c) => {
  const userId = c.req.header('x-user-id');
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Get properties across all countries
    const sql = `
      SELECT
        country,
        COUNT(*) as property_count,
        SUM(area_m2) as total_area_m2,
        AVG(price_usd) as avg_price_usd,
        SUM(price_usd) as total_value_usd
      FROM properties
      WHERE owner_id = $1
      GROUP BY country
      ORDER BY total_value_usd DESC
    `;

    const byCountry = await c.env.db?.query(sql, [userId]);

    // Calculate global totals
    const globalTotal = (byCountry || []).reduce(
      (acc: any, row: any) => ({
        property_count: acc.property_count + row.property_count,
        total_area_m2: acc.total_area_m2 + row.total_area_m2,
        total_value_usd: acc.total_value_usd + row.total_value_usd,
      }),
      { property_count: 0, total_area_m2: 0, total_value_usd: 0 }
    );

    return c.json({
      user_id: userId,
      global_summary: globalTotal,
      by_country: byCountry,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json({ error: 'Portfolio summary failed', details: String(error) }, 500);
  }
});

// ============================================================================
// 6. REGULATORY ALERTS (PER COUNTRY)
// ============================================================================

/**
 * GET /api/latam/{country}/alerts/regulatory
 * Get recent regulatory changes affecting real estate
 *
 * Example: CVM resolution changes, INFONAVIT updates, zoning changes
 */
latamRoutes.get('/:country/alerts/regulatory', async (c) => {
  const country = (c.req.param('country') || '').toUpperCase() as Country;

  if (!COUNTRY_CONFIG[country]) {
    return c.json({ error: 'Invalid country' }, 400);
  }

  try {
    const sql = `
      SELECT
        id, title, description, impact_level, effective_date, source
      FROM regulatory_alerts
      WHERE country = $1
        AND effective_date >= NOW() - INTERVAL '30 days'
      ORDER BY effective_date DESC
      LIMIT 20
    `;

    const alerts = await c.env.db?.query(sql, [country]);

    return c.json({
      country,
      country_name: COUNTRY_CONFIG[country].name,
      alerts: alerts || [],
      total: (alerts || []).length,
    });
  } catch (error) {
    return c.json({ error: 'Alerts retrieval failed', details: String(error) }, 500);
  }
});

export default latamRoutes;
