-- ============================================================================
-- ENERGY SYSTEMS SCHEMA (Elon 4: Tesla Infrastructure Layer)
-- ============================================================================
-- Every property as energy node: solar, consumption, storage, grid, microgrids
-- ============================================================================

-- ============================================================================
-- 1. SOLAR POTENTIAL TABLE
-- ============================================================================

CREATE TABLE solar_potential (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL UNIQUE REFERENCES properties_latam(id) ON DELETE CASCADE,

  -- Roof characteristics (from satellite)
  roof_orientation VARCHAR(2), -- N, NE, E, SE, S, SW, W, NW
  roof_tilt_angle_degrees DECIMAL(5, 2),
  roof_area_sqm DECIMAL(10, 2),
  usable_area_sqm DECIMAL(10, 2), -- After obstructions

  -- Solar irradiance
  annual_irradiance_kwh_per_sqm DECIMAL(8, 2),
  monthly_irradiance JSONB, -- {"jan": 150, "feb": 160, ...}

  -- Production potential
  annual_production_kwh INT,
  peak_capacity_kw DECIMAL(10, 2),
  panel_efficiency_pct DECIMAL(5, 2) DEFAULT 18,

  -- Economic analysis
  installation_cost DECIMAL(12, 2),
  payback_period_years DECIMAL(5, 2),
  annual_revenue_grid_feed_usd DECIMAL(10, 2),
  feed_in_tariff_usd_per_kwh DECIMAL(6, 3),

  -- Metadata
  satellite_data_date DATE,
  analysis_confidence_pct INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_solar_potential_property ON solar_potential(property_id);
CREATE INDEX idx_solar_potential_annual_production ON solar_potential(annual_production_kwh DESC);

-- ============================================================================
-- 2. ENERGY CONSUMPTION TABLE
-- ============================================================================

CREATE TABLE energy_consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL UNIQUE REFERENCES properties_latam(id) ON DELETE CASCADE,

  property_type VARCHAR(50), -- residential, commercial, office, retail, industrial
  size_sqm INT,

  -- Climate zone
  climate_zone VARCHAR(50),

  -- Consumption estimates
  estimated_annual_kwh INT,
  peak_demand_kw DECIMAL(10, 2),
  seasonal_variation JSONB, -- {"winter": 1.2, "spring": 1, "summer": 0.8, "fall": 1}
  monthly_estimate JSONB, -- {"jan": 2500, "feb": 2400, ...}

  -- EV charging
  ev_charging_annual_kwh INT DEFAULT 0,
  ev_charging_peak_kw DECIMAL(10, 2) DEFAULT 0,

  -- Metadata
  estimation_method VARCHAR(50), -- historical, comparable, model-based
  confidence_pct INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_energy_consumption_property ON energy_consumption(property_id);
CREATE INDEX idx_energy_consumption_type_climate ON energy_consumption(property_type, climate_zone);

-- ============================================================================
-- 3. ENERGY STORAGE (BATTERY) TABLE
-- ============================================================================

CREATE TABLE energy_storage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties_latam(id) ON DELETE CASCADE,

  -- Storage system
  battery_capacity_kwh DECIMAL(10, 2),
  battery_type VARCHAR(50), -- liion, lfp, flow, other
  charge_rate_kw DECIMAL(10, 2),
  discharge_rate_kw DECIMAL(10, 2),
  roundtrip_efficiency_pct DECIMAL(5, 2), -- 85-95% for Li-ion

  -- Physical
  installation_date DATE,
  warranty_years INT,
  manufacturer VARCHAR(255),
  model VARCHAR(255),

  -- Economics
  installation_cost DECIMAL(12, 2),
  replacement_cost_estimate DECIMAL(12, 2),
  annual_maintenance_cost DECIMAL(10, 2),

  -- Status monitoring (for existing systems)
  current_state_of_charge_pct DECIMAL(5, 2),
  health_score DECIMAL(5, 2), -- 0-100
  last_health_check TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_energy_storage_property ON energy_storage(property_id);
CREATE INDEX idx_energy_storage_health ON energy_storage(health_score DESC);

-- ============================================================================
-- 4. GRID INTEGRATION TABLE
-- ============================================================================

CREATE TABLE grid_integration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL UNIQUE REFERENCES properties_latam(id) ON DELETE CASCADE,

  -- Grid connection
  grid_connection_point_geometry GEOMETRY(Point, 4326),
  distance_to_transformer_m INT,
  distance_to_substation_m INT,
  transformer_reference VARCHAR(255),

  -- Grid characteristics
  grid_voltage_level VARCHAR(20), -- LV, MV, HV
  available_capacity_kw INT,
  grid_frequency_hz DECIMAL(5, 2),

  -- Grid stability metrics
  voltage_stability_score INT, -- 0-100
  frequency_stability_score INT, -- 0-100
  harmonic_distortion_pct DECIMAL(5, 2),
  grid_stability_score INT, -- Overall

  -- Interconnection
  interconnection_status VARCHAR(50), -- none, approved, installed, active
  interconnection_date DATE,
  interconnection_cost_estimate DECIMAL(12, 2),
  smart_meter_installed BOOLEAN DEFAULT FALSE,
  bidirectional_metering BOOLEAN DEFAULT FALSE, -- Can feed back to grid

  -- Monitoring
  last_grid_analysis_date DATE,
  analysis_method VARCHAR(50),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_grid_integration_property ON grid_integration(property_id);
CREATE INDEX idx_grid_integration_geometry ON grid_integration USING GIST(grid_connection_point_geometry);
CREATE INDEX idx_grid_integration_capacity ON grid_integration(available_capacity_kw);

-- ============================================================================
-- 5. MICROGRIDS TABLE
-- ============================================================================

CREATE TABLE microgrids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Location
  city VARCHAR(255) NOT NULL,
  country VARCHAR(2) NOT NULL,
  center_geometry GEOMETRY(Point, 4326),

  -- Properties in microgrid
  properties UUID[] NOT NULL, -- Array of property_ids
  property_count INT,

  -- Operator
  operator_id UUID REFERENCES auth.users(id),
  operator_contact VARCHAR(255),

  -- Microgrid statistics
  total_production_capacity_kw DECIMAL(10, 2),
  total_annual_consumption_kwh INT,
  total_storage_capacity_kwh DECIMAL(10, 2),
  total_peak_demand_kw DECIMAL(10, 2),

  -- Performance metrics
  self_sufficiency_ratio DECIMAL(5, 3), -- 0-1, coverage of local demand by local generation
  resilience_score INT, -- 0-100, can operate during grid outages
  reliability_score INT, -- 0-100, uptime percentage
  efficiency_score INT, -- 0-100

  -- Economics
  annual_cost_savings_usd INT,
  annual_carbon_savings_tons INT,
  payback_period_years DECIMAL(5, 2),

  -- Status
  status VARCHAR(50) DEFAULT 'planning', -- planning, operational, maintenance, decommissioned
  commissioned_date DATE,

  -- Configuration
  control_system VARCHAR(255), -- Controller model/type
  communication_protocol VARCHAR(50), -- modbus, mqtt, dnp3
  has_islanding_capability BOOLEAN,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_microgrids_city_country ON microgrids(city, country);
CREATE INDEX idx_microgrids_status ON microgrids(status);
CREATE INDEX idx_microgrids_self_sufficiency ON microgrids(self_sufficiency_ratio DESC);

-- ============================================================================
-- 6. MICROGRID REVENUE SHARING TABLE
-- ============================================================================

CREATE TABLE microgrid_revenue_sharing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  microgrid_id UUID NOT NULL REFERENCES microgrids(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties_latam(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id),

  -- Ownership stake
  stake_pct DECIMAL(5, 2), -- % ownership of microgrid
  capacity_contributed_kw DECIMAL(10, 2), -- Solar + storage contribution

  -- Revenue terms
  revenue_share_pct DECIMAL(5, 2), -- % of microgrid revenue this owner gets
  payment_frequency VARCHAR(50), -- monthly, quarterly, annual
  minimum_payment_usd INT,

  -- Status
  contract_signed_date DATE,
  status VARCHAR(50) DEFAULT 'active', -- active, suspended, terminated

  -- Financial tracking
  total_revenue_ytd_usd DECIMAL(12, 2),
  last_payment_date DATE,
  last_payment_amount DECIMAL(10, 2),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_revenue_sharing_microgrid ON microgrid_revenue_sharing(microgrid_id);
CREATE INDEX idx_revenue_sharing_owner ON microgrid_revenue_sharing(owner_id);
CREATE INDEX idx_revenue_sharing_property ON microgrid_revenue_sharing(property_id);

-- ============================================================================
-- 7. ENERGY MARKET PRICING TABLE
-- ============================================================================

CREATE TABLE energy_market_prices (
  id BIGSERIAL PRIMARY KEY,

  date DATE NOT NULL,
  country VARCHAR(2) NOT NULL,

  -- Pricing
  wholesale_price_usd_per_mwh DECIMAL(10, 2),
  retail_price_usd_per_kwh DECIMAL(6, 4),
  feed_in_tariff_usd_per_kwh DECIMAL(6, 4), -- What utilities pay for rooftop solar

  -- Demand
  peak_demand_mw INT,
  average_demand_mw INT,

  -- Supply mix
  renewable_pct DECIMAL(5, 2), -- % of electricity from renewables
  solar_pct DECIMAL(5, 2),
  wind_pct DECIMAL(5, 2),
  hydro_pct DECIMAL(5, 2),

  -- Carbon intensity
  co2_per_mwh INT, -- grams CO2 per MWh

  UNIQUE(date, country)
);

CREATE INDEX idx_energy_prices_date_country ON energy_market_prices(country, date DESC);

-- ============================================================================
-- 8. ENERGY ANALYSIS REPORTS TABLE
-- ============================================================================

CREATE TABLE energy_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties_latam(id) ON DELETE CASCADE,

  report_type VARCHAR(50), -- solar_potential, consumption_estimate, microgrid_analysis, net_metering
  report_date DATE DEFAULT CURRENT_DATE,

  -- Report data (JSON for flexibility)
  solar_data JSONB,
  consumption_data JSONB,
  storage_data JSONB,
  grid_data JSONB,
  microgrid_data JSONB,

  -- Recommendations
  recommendations JSONB, -- [{title, description, cost, benefit, payback_years}]

  -- Attachments
  report_pdf_url VARCHAR(500),
  charts_json JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_energy_reports_property_type ON energy_reports(property_id, report_type);
CREATE INDEX idx_energy_reports_date ON energy_reports(report_date DESC);

-- ============================================================================
-- 9. TRIGGERS & VIEWS
-- ============================================================================

-- View: Energy readiness score (0-100)
CREATE MATERIALIZED VIEW property_energy_readiness AS
SELECT
  p.id as property_id,
  COALESCE(ROUND(
    (CASE WHEN s.annual_production_kwh > 0 THEN 25 ELSE 0 END) +
    (CASE WHEN e.estimated_annual_kwh > 0 THEN 25 ELSE 0 END) +
    (CASE WHEN st.battery_capacity_kwh > 0 THEN 25 ELSE 0 END) +
    (CASE WHEN g.bidirectional_metering THEN 25 ELSE 0 END)
  ), 0)::INT as energy_readiness_score,

  COALESCE(s.annual_production_kwh, 0) as solar_production_kwh,
  COALESCE(e.estimated_annual_kwh, 0) as estimated_consumption_kwh,
  COALESCE(st.battery_capacity_kwh, 0) as storage_capacity_kwh

FROM properties_latam p
LEFT JOIN solar_potential s ON p.id = s.property_id
LEFT JOIN energy_consumption e ON p.id = e.property_id
LEFT JOIN energy_storage st ON p.id = st.property_id
LEFT JOIN grid_integration g ON p.id = g.property_id;

CREATE INDEX idx_energy_readiness_score ON property_energy_readiness(energy_readiness_score DESC);

-- ============================================================================
-- 10. GRANTS
-- ============================================================================

GRANT SELECT ON solar_potential TO authenticated;
GRANT SELECT ON energy_consumption TO authenticated;
GRANT SELECT ON grid_integration TO authenticated;
GRANT SELECT ON microgrids TO authenticated;
GRANT SELECT, INSERT, UPDATE ON microgrid_revenue_sharing TO authenticated;
GRANT SELECT ON energy_market_prices TO authenticated;
GRANT SELECT ON energy_reports TO authenticated;
GRANT SELECT ON property_energy_readiness TO authenticated;

COMMIT;
