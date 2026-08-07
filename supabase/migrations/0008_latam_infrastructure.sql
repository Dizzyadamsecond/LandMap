-- ============================================================================
-- LANDMAP LATAM INFRASTRUCTURE — Multi-Country Database Schema
-- ============================================================================
-- Suporta: Brasil, México, Colombia, Argentina, Chile, Perú
-- Tabelas: countries, properties_latam, compliance_latam, regulatory_alerts
-- ============================================================================

-- Enable PostGIS (if not already)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- 1. COUNTRIES — Master list of supported countries
-- ============================================================================

CREATE TABLE countries (
  id SERIAL PRIMARY KEY,
  code VARCHAR(2) UNIQUE NOT NULL,  -- BR, MX, CO, AR, CL, PE
  name VARCHAR(100) NOT NULL,
  name_es VARCHAR(100),
  name_pt VARCHAR(100),
  currency VARCHAR(3) NOT NULL,
  language VARCHAR(10) NOT NULL,  -- pt-BR, es-MX, es-CO, es-AR, es-CL, es-PE, en-US
  timezone VARCHAR(50) NOT NULL,
  phone_prefix VARCHAR(5) NOT NULL,

  -- Regulatory bodies
  regulatory_bodies TEXT,  -- JSON array: ["CVM", "CRECI", ...]

  -- Compliance rules (JSON)
  compliance_config JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Market info
  median_price_usd DECIMAL(12, 2),
  total_properties INT DEFAULT 0,
  active_investors INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO countries (code, name, name_es, name_pt, currency, language, timezone, phone_prefix, regulatory_bodies, compliance_config)
VALUES
  ('BR', 'Brazil', 'Brasil', 'Brasil', 'BRL', 'pt-BR', 'America/Sao_Paulo', '+55',
   '["CVM", "CRECI", "CRIE", "CCI"]', '{"min_property_value": "50000 BRL", "investor_kyc": "required", "local_id": "CPF/CNPJ"}'::jsonb),
  ('MX', 'Mexico', 'México', 'México', 'MXN', 'es-MX', 'America/Mexico_City', '+52',
   '["CNBV", "INFONAVIT", "SIC", "FIRA"]', '{"min_property_value": "1000000 MXN", "investor_kyc": "required", "local_id": "RFC"}'::jsonb),
  ('CO', 'Colombia', 'Colombia', 'Colômbia', 'COP', 'es-CO', 'America/Bogota', '+57',
   '["FINCA", "DNP", "DIAN", "SFC"]', '{"min_property_value": "100000000 COP", "investor_kyc": "required", "local_id": "CC"}'::jsonb),
  ('AR', 'Argentina', 'Argentina', 'Argentina', 'ARS', 'es-AR', 'America/Argentina/Buenos_Aires', '+54',
   '["BCRA", "CNV", "AFSCA"]', '{"min_property_value": "1000000 ARS", "investor_kyc": "required", "currency_control": "restricted_outflow"}'::jsonb),
  ('CL', 'Chile', 'Chile', 'Chile', 'CLP', 'es-CL', 'America/Santiago', '+56',
   '["SVS", "CMF", "SII"]', '{"min_property_value": "50000000 CLP", "investor_kyc": "required", "local_id": "RUT"}'::jsonb),
  ('PE', 'Peru', 'Perú', 'Peru', 'PEN', 'es-PE', 'America/Lima', '+51',
   '["SMV", "APRA", "SUNAT"]', '{"min_property_value": "500000 PEN", "investor_kyc": "required", "local_id": "DNI"}'::jsonb);

-- ============================================================================
-- 2. PROPERTIES_LATAM — Properties across all countries
-- ============================================================================

CREATE TABLE properties_latam (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Location
  country_code VARCHAR(2) NOT NULL REFERENCES countries(code),
  state_province VARCHAR(100),
  city VARCHAR(100),
  neighborhood VARCHAR(100),
  address VARCHAR(255),
  postal_code VARCHAR(20),

  -- Geometry
  geometry GEOMETRY(Point, 4326),

  -- Property info
  property_type VARCHAR(50),  -- apartment, house, land, commercial, office, retail
  size_m2 FLOAT,
  bedrooms INT,
  bathrooms INT,
  parking_spaces INT,

  -- Pricing
  price_local DECIMAL(15, 2) NOT NULL,  -- In local currency
  price_usd DECIMAL(15, 2) NOT NULL,   -- Converted to USD
  price_per_m2_usd DECIMAL(12, 2),

  -- Listing info
  listing_date TIMESTAMP,
  days_on_market INT,
  status VARCHAR(20),  -- listed, sold, rented, delisted

  -- Owner/Agent
  owner_id UUID,
  agent_id UUID,

  -- Compliance
  compliance_verified BOOLEAN DEFAULT FALSE,
  compliance_status JSONB,

  -- Metadata
  data_source VARCHAR(50),  -- MLS, scrape, manual, API
  images_count INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_properties_latam_country ON properties_latam(country_code);
CREATE INDEX idx_properties_latam_city ON properties_latam(country_code, city);
CREATE INDEX idx_properties_latam_geometry ON properties_latam USING GIST(geometry);
CREATE INDEX idx_properties_latam_price ON properties_latam(price_usd DESC);
CREATE INDEX idx_properties_latam_owner ON properties_latam(owner_id);

-- ============================================================================
-- 3. COMPLIANCE_LATAM — Country-specific compliance tracking
-- ============================================================================

CREATE TABLE compliance_latam (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  country_code VARCHAR(2) NOT NULL REFERENCES countries(code),
  property_id UUID REFERENCES properties_latam(id),
  investor_id UUID,

  -- Investor type
  investor_type VARCHAR(20),  -- individual, company, institutional
  investor_nationality VARCHAR(2),

  -- Compliance checks
  kyc_status VARCHAR(20),  -- pending, verified, rejected
  aml_status VARCHAR(20),  -- pending, verified, rejected
  income_verified BOOLEAN DEFAULT FALSE,
  document_verification JSONB,  -- {"document_type": "status", ...}

  -- Regulatory flags
  pep_check BOOLEAN,  -- Politically Exposed Person
  sanctions_check BOOLEAN,
  regulatory_approved BOOLEAN DEFAULT FALSE,

  -- Audit trail
  checked_at TIMESTAMP,
  checked_by_id UUID,
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_compliance_latam_country ON compliance_latam(country_code);
CREATE INDEX idx_compliance_latam_investor ON compliance_latam(investor_id);
CREATE INDEX idx_compliance_latam_property ON compliance_latam(property_id);

-- ============================================================================
-- 4. REGULATORY_ALERTS — Real-time regulatory changes by country
-- ============================================================================

CREATE TABLE regulatory_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  country_code VARCHAR(2) NOT NULL REFERENCES countries(code),

  -- Alert info
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Impact
  impact_level VARCHAR(20),  -- low, medium, high, critical
  affected_property_types TEXT,  -- JSON array: ["apartment", "commercial", ...]

  -- Dates
  announcement_date TIMESTAMP,
  effective_date TIMESTAMP NOT NULL,
  expiration_date TIMESTAMP,

  -- Source
  source VARCHAR(100),  -- "CVM", "CNBV", "FINCA", etc.
  source_url VARCHAR(500),

  -- Notification
  notified_users INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_regulatory_alerts_country ON regulatory_alerts(country_code);
CREATE INDEX idx_regulatory_alerts_effective_date ON regulatory_alerts(effective_date DESC);

-- ============================================================================
-- 5. EXCHANGE_RATES — Daily rates for all countries
-- ============================================================================

CREATE TABLE exchange_rates (
  id SERIAL PRIMARY KEY,

  date DATE NOT NULL,
  currency_from VARCHAR(3) NOT NULL,  -- BRL, MXN, COP, ARS, CLP, PEN
  currency_to VARCHAR(3) NOT NULL,    -- Typically USD
  rate DECIMAL(12, 6) NOT NULL,

  source VARCHAR(50),  -- "CE", "XE", "ECB", "API"

  UNIQUE(date, currency_from, currency_to),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_exchange_rates_date ON exchange_rates(date DESC);
CREATE INDEX idx_exchange_rates_currency ON exchange_rates(currency_from);

-- ============================================================================
-- 6. LATAM_USERS — User profiles with country preferences
-- ============================================================================

CREATE TABLE latam_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID REFERENCES auth.users(id),

  -- Preferences
  primary_country VARCHAR(2) NOT NULL REFERENCES countries(code),
  secondary_countries VARCHAR(2)[],  -- Multi-country investor
  preferred_language VARCHAR(10),  -- pt-BR, es-MX, en-US

  -- Investor profile
  investor_type VARCHAR(20),  -- individual, company, institutional
  investment_range JSONB,  -- {"min_usd": 10000, "max_usd": 1000000}

  -- KYC status per country
  kyc_status JSONB,  -- {"BR": "verified", "MX": "pending", ...}

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_latam_users_user_id ON latam_users(user_id);
CREATE INDEX idx_latam_users_primary_country ON latam_users(primary_country);

-- ============================================================================
-- 7. FUNCTIONS — Multi-country helpers
-- ============================================================================

-- Function: Convert price from local to USD
CREATE OR REPLACE FUNCTION convert_to_usd(amount DECIMAL, from_currency VARCHAR)
RETURNS DECIMAL AS $$
DECLARE
  rate DECIMAL;
BEGIN
  SELECT er.rate INTO rate
  FROM exchange_rates er
  WHERE er.currency_from = from_currency
    AND er.currency_to = 'USD'
    AND er.date = CURRENT_DATE
  LIMIT 1;

  IF rate IS NULL THEN
    -- Fallback to latest rate if today's not available
    SELECT er.rate INTO rate
    FROM exchange_rates er
    WHERE er.currency_from = from_currency
      AND er.currency_to = 'USD'
    ORDER BY er.date DESC
    LIMIT 1;
  END IF;

  IF rate IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN amount / rate;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get compliance status for investor + property + country
CREATE OR REPLACE FUNCTION check_compliance_status(
  p_investor_id UUID,
  p_property_id UUID,
  p_country_code VARCHAR
)
RETURNS TABLE (
  compliant BOOLEAN,
  checks_passed INT,
  checks_total INT,
  details JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (c.kyc_status = 'verified' AND c.aml_status = 'verified' AND c.regulatory_approved) as compliant,
    CAST((CASE WHEN c.kyc_status = 'verified' THEN 1 ELSE 0 END +
          CASE WHEN c.aml_status = 'verified' THEN 1 ELSE 0 END +
          CASE WHEN c.regulatory_approved THEN 1 ELSE 0 END) AS INT) as checks_passed,
    3 as checks_total,
    jsonb_build_object(
      'kyc_status', c.kyc_status,
      'aml_status', c.aml_status,
      'regulatory_approved', c.regulatory_approved,
      'country', p_country_code
    ) as details
  FROM compliance_latam c
  WHERE c.investor_id = p_investor_id
    AND c.property_id = p_property_id
    AND c.country_code = p_country_code
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 8. TRIGGERS — Maintain data integrity
-- ============================================================================

-- Update price_usd when price_local changes
CREATE OR REPLACE FUNCTION update_property_latam_price_usd()
RETURNS TRIGGER AS $$
DECLARE
  country_currency VARCHAR;
BEGIN
  SELECT c.currency INTO country_currency
  FROM countries c
  WHERE c.code = NEW.country_code;

  NEW.price_usd := convert_to_usd(NEW.price_local, country_currency);
  NEW.last_updated := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_property_latam_price_usd
BEFORE INSERT OR UPDATE ON properties_latam
FOR EACH ROW
EXECUTE FUNCTION update_property_latam_price_usd();

-- ============================================================================
-- 9. GRANTS — Role-based access
-- ============================================================================

GRANT SELECT ON countries TO authenticated;
GRANT SELECT ON properties_latam TO authenticated;
GRANT SELECT ON regulatory_alerts TO authenticated;
GRANT SELECT ON exchange_rates TO authenticated;

GRANT SELECT, INSERT, UPDATE ON compliance_latam TO authenticated;
GRANT SELECT, INSERT ON latam_users TO authenticated;

GRANT SELECT ON exchange_rates TO anon;
GRANT SELECT ON countries TO anon;

COMMIT;
