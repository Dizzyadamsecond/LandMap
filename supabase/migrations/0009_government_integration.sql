-- ============================================================================
-- GOVERNMENT INTEGRATION SCHEMA (Elon 10: Efficiency Automation)
-- ============================================================================
-- Multi-country government registry bridge
-- Tracks property registrations, permits, compliance across Brasil, México, Colombia, Argentina
-- ============================================================================

-- ============================================================================
-- 1. GOVERNMENT REGISTRATIONS TABLE
-- ============================================================================

CREATE TABLE government_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Property & owner
  property_id UUID NOT NULL REFERENCES properties_latam(id) ON DELETE CASCADE,
  country VARCHAR(2) NOT NULL,
  owner_id VARCHAR(100) NOT NULL, -- CPF (BR), RFC (MX), CC (CO), CUIT (AR)
  owner_name VARCHAR(255) NOT NULL,

  -- Transaction details
  transaction_type VARCHAR(50) NOT NULL, -- sale, transfer, mortgage, lien
  transaction_date DATE NOT NULL,
  consideration_amount DECIMAL(15, 2),

  -- Government tracking
  government_reference VARCHAR(255) UNIQUE, -- Government portal reference number
  status VARCHAR(50) NOT NULL DEFAULT 'submitted', -- submitted, in_review, approved, registered, rejected
  submitted_at TIMESTAMP DEFAULT NOW(),
  last_checked TIMESTAMP,
  completed_at TIMESTAMP,

  -- Current step in process
  current_step VARCHAR(255),
  estimated_completion_date DATE,

  -- Compliance tracking
  compliance_checks JSONB, -- {"kyc": true, "aml": true, "title_clear": true, ...}
  documents_required TEXT[], -- Array of required documents
  documents_submitted TEXT[], -- Submitted docs

  -- Audit trail
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(property_id, owner_id, transaction_type, transaction_date)
);

CREATE INDEX idx_gov_regs_country_status ON government_registrations(country, status);
CREATE INDEX idx_gov_regs_property_id ON government_registrations(property_id);
CREATE INDEX idx_gov_regs_owner_id ON government_registrations(owner_id, country);
CREATE INDEX idx_gov_regs_completed ON government_registrations(status, completed_at DESC);

-- ============================================================================
-- 2. PERMITS TABLE (Construction, Renovation, Environmental)
-- ============================================================================

CREATE TABLE permits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Property & location
  property_id UUID NOT NULL REFERENCES properties_latam(id) ON DELETE CASCADE,
  country VARCHAR(2) NOT NULL,
  city VARCHAR(255) NOT NULL,
  municipality_code VARCHAR(50), -- Brazil IBGE code, Mexico INEGI code, etc.

  -- Permit details
  permit_type VARCHAR(50) NOT NULL, -- construction, renovation, commercial, environmental
  project_description TEXT,
  estimated_cost DECIMAL(15, 2),
  estimated_duration_days INT,

  -- Government tracking
  municipal_reference VARCHAR(255) UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'submitted', -- submitted, under_review, approved, conditional, rejected, expired
  submitted_at TIMESTAMP DEFAULT NOW(),
  last_checked TIMESTAMP,
  approved_at TIMESTAMP,

  -- Review stages
  current_review_stage VARCHAR(255),
  review_stages JSONB, -- {"structural": "approved", "environmental": "pending", ...}

  -- Inspection tracking
  inspection_date TIMESTAMP,
  inspection_status VARCHAR(50),
  final_inspection_date TIMESTAMP,

  -- Documents
  documents_submitted TEXT[],
  documents_pending TEXT[],

  -- Regulatory rules applied
  regulations_version VARCHAR(50),
  compliant BOOLEAN,
  compliance_notes TEXT,

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(property_id, permit_type, submitted_at)
);

CREATE INDEX idx_permits_country_city ON permits(country, city);
CREATE INDEX idx_permits_property_id ON permits(property_id);
CREATE INDEX idx_permits_status ON permits(status);
CREATE INDEX idx_permits_approval_date ON permits(approved_at DESC NULLS LAST);

-- ============================================================================
-- 3. TAX ASSESSMENTS TABLE
-- ============================================================================

CREATE TABLE tax_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  property_id UUID NOT NULL REFERENCES properties_latam(id) ON DELETE CASCADE,
  country VARCHAR(2) NOT NULL,
  city VARCHAR(255) NOT NULL,

  -- Assessment details
  assessed_value DECIMAL(15, 2) NOT NULL,
  assessment_date DATE NOT NULL,
  tax_rate DECIMAL(5, 4), -- e.g., 0.0125 = 1.25%
  annual_tax_amount DECIMAL(15, 2),

  -- Assessment history
  last_assessment_date DATE,
  last_assessed_value DECIMAL(15, 2),
  value_change_pct DECIMAL(5, 2),

  -- Next assessment
  next_reassessment_date DATE,
  assessment_cycle_years INT, -- How often reassessed

  -- Tax status
  tax_status VARCHAR(50), -- current, delinquent, contested, exempt
  exemptions TEXT[], -- Array: ["historic_preservation", "agricultural_exemption"]
  appeals_deadline DATE,

  -- Government reference
  government_reference VARCHAR(255),
  assessed_by VARCHAR(255), -- Assessor name/ID

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tax_assessments_property ON tax_assessments(property_id);
CREATE INDEX idx_tax_assessments_country_city ON tax_assessments(country, city);
CREATE INDEX idx_tax_assessments_date ON tax_assessments(assessment_date DESC);

-- ============================================================================
-- 4. REGULATORY CHANGES & ALERTS TABLE
-- ============================================================================

CREATE TABLE regulatory_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  country VARCHAR(2) NOT NULL,
  city VARCHAR(255),
  state_province VARCHAR(100),

  -- Change details
  change_type VARCHAR(50), -- zoning, tax_rate, building_code, environmental_rule, licensing
  title VARCHAR(255) NOT NULL,
  description TEXT,
  affected_property_types TEXT[], -- ["residential", "commercial"]
  severity VARCHAR(20), -- low, medium, high, critical

  -- Dates
  announced_date TIMESTAMP,
  effective_date DATE NOT NULL,
  expiration_date DATE,

  -- Source & reference
  source_document VARCHAR(255), -- Law number, regulation code
  source_url VARCHAR(500),
  government_body VARCHAR(255),

  -- Impact assessment
  properties_affected INT,
  estimated_impact_value DECIMAL(15, 2), -- $ value affected
  impact_description TEXT,

  -- Notifications
  properties_notified INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_regulatory_changes_country ON regulatory_changes(country);
CREATE INDEX idx_regulatory_changes_effective_date ON regulatory_changes(effective_date DESC);
CREATE INDEX idx_regulatory_changes_type ON regulatory_changes(change_type);

-- ============================================================================
-- 5. GOVERNMENT PORTAL LOGS (for troubleshooting)
-- ============================================================================

CREATE TABLE government_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  country VARCHAR(2) NOT NULL,
  endpoint VARCHAR(500),
  method VARCHAR(10), -- GET, POST, PATCH
  status_code INT,
  response_time_ms INT,

  request_payload JSONB,
  response_payload JSONB,
  error_message TEXT,

  registration_id UUID REFERENCES government_registrations(id),
  permit_id UUID REFERENCES permits(id),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_gov_logs_country_date ON government_api_logs(country, created_at DESC);
CREATE INDEX idx_gov_logs_status_code ON government_api_logs(status_code);

-- ============================================================================
-- 6. GOVERNMENT EFFICIENCY METRICS VIEW
-- ============================================================================

CREATE MATERIALIZED VIEW government_efficiency_metrics AS
SELECT
  'registrations' as category,
  country,
  city,
  COUNT(*) as total_submitted,
  COUNT(CASE WHEN status = 'registered' THEN 1 END) as completed,
  COUNT(CASE WHEN status IN ('submitted', 'in_review') THEN 1 END) as pending,
  AVG(EXTRACT(DAY FROM (
    CASE WHEN status = 'registered' THEN completed_at - submitted_at ELSE NULL END
  ))) as avg_days_to_completion,
  MIN(EXTRACT(DAY FROM (
    CASE WHEN status = 'registered' THEN completed_at - submitted_at ELSE NULL END
  ))) as min_days,
  MAX(EXTRACT(DAY FROM (
    CASE WHEN status = 'registered' THEN completed_at - submitted_at ELSE NULL END
  ))) as max_days

FROM government_registrations
GROUP BY country, city

UNION ALL

SELECT
  'permits' as category,
  country,
  city,
  COUNT(*) as total_submitted,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as completed,
  COUNT(CASE WHEN status IN ('submitted', 'under_review') THEN 1 END) as pending,
  AVG(EXTRACT(DAY FROM (
    CASE WHEN status = 'approved' THEN approved_at - submitted_at ELSE NULL END
  ))) as avg_days_to_completion,
  MIN(EXTRACT(DAY FROM (
    CASE WHEN status = 'approved' THEN approved_at - submitted_at ELSE NULL END
  ))) as min_days,
  MAX(EXTRACT(DAY FROM (
    CASE WHEN status = 'approved' THEN approved_at - submitted_at ELSE NULL END
  ))) as max_days

FROM permits
GROUP BY country, city;

CREATE INDEX idx_gov_efficiency_country_city ON government_efficiency_metrics(country, city);

-- ============================================================================
-- 7. TRIGGERS & MAINTENANCE
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_government_registrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_government_registrations_updated_at
BEFORE UPDATE ON government_registrations
FOR EACH ROW
EXECUTE FUNCTION update_government_registrations_updated_at();

-- Auto-notify when registration completes
CREATE OR REPLACE FUNCTION notify_registration_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'registered' AND OLD.status != 'registered' THEN
    INSERT INTO notifications (user_id, type, title, body)
    SELECT u.id, 'registration_completed', 'Property Registered',
           'Your property registration is complete: ' || NEW.property_id
    FROM users u WHERE u.id = (SELECT owner_id FROM properties_latam WHERE id = NEW.property_id LIMIT 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_registration_completion
AFTER UPDATE ON government_registrations
FOR EACH ROW
EXECUTE FUNCTION notify_registration_completion();

-- ============================================================================
-- 8. GRANTS
-- ============================================================================

GRANT SELECT ON government_registrations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON government_registrations TO authenticated;
GRANT SELECT ON permits TO authenticated;
GRANT SELECT, INSERT, UPDATE ON permits TO authenticated;
GRANT SELECT ON tax_assessments TO authenticated;
GRANT SELECT ON regulatory_changes TO authenticated;
GRANT SELECT ON government_efficiency_metrics TO authenticated;

-- Admin only
GRANT SELECT ON government_api_logs TO admin;
GRANT DELETE ON government_api_logs TO admin;

COMMIT;
