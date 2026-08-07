-- ============================================================================
-- LANDMAP MUNICIPALITIES DATA — Brazilian geographic foundation
-- ============================================================================
-- Tables: municipalities (5,570 Brazilian municipalities from IBGE)
-- Purpose: Geographic data for map features, location filtering, and analytics
-- ============================================================================

-- ============================================================================
-- 1. MUNICIPALITIES — IBGE official dataset
-- ============================================================================
CREATE TABLE municipalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ibge_code VARCHAR(7) UNIQUE NOT NULL,  -- IBGE municipality code (7 digits)
  name VARCHAR(255) NOT NULL,            -- Official municipality name
  state CHAR(2) NOT NULL,                -- State abbreviation (SP, RJ, MG, etc.)
  region VARCHAR(20),                    -- Region: North, Northeast, Center-West, Southeast, South
  population INT,                        -- Estimated population
  area_km2 FLOAT,                        -- Area in square kilometers
  lat FLOAT,                             -- Latitude (geographic center)
  lng FLOAT,                             -- Longitude (geographic center)
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- 2. INDEXES — For fast queries
-- ============================================================================
CREATE INDEX idx_municipalities_state ON municipalities(state);
CREATE INDEX idx_municipalities_ibge_code ON municipalities(ibge_code);
CREATE INDEX idx_municipalities_region ON municipalities(region);
CREATE INDEX idx_municipalities_name ON municipalities(name);
CREATE INDEX idx_municipalities_location ON municipalities(lat, lng);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE municipalities ENABLE ROW LEVEL SECURITY;

-- Allow public read access (municipalities are public data)
CREATE POLICY "Anyone can view municipalities"
  ON municipalities
  FOR SELECT
  USING (true);

-- Allow service role (backend) to insert/update
CREATE POLICY "Service role can manage municipalities"
  ON municipalities
  FOR ALL
  USING (true);

-- ============================================================================
-- 4. GRANTS
-- ============================================================================
GRANT SELECT ON municipalities TO anon;
GRANT SELECT ON municipalities TO authenticated;
GRANT ALL ON municipalities TO service_role;
