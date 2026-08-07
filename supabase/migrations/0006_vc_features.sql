-- VC-Essential Features Schema (Event Sourcing + OLTP/OLAP separation)

-- 1. Risk Assessment & Scoring
CREATE TABLE IF NOT EXISTS risk_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL UNIQUE,
  score numeric(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  label text NOT NULL CHECK (label IN ('very_low', 'low', 'medium', 'high', 'very_high')),
  signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  creditworthiness_score numeric(5,2),
  creditworthiness_factors jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
);

CREATE INDEX idx_risk_assessments_score ON risk_assessments(score DESC);
CREATE INDEX idx_risk_assessments_label ON risk_assessments(label);

-- 2. Compliance & KYC/AML Automation
CREATE TABLE IF NOT EXISTS kyc_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('pending', 'verified', 'rejected', 'expired')),
  face_verification_status text,
  document_verification_status text,
  aml_screening_status text,
  ofac_screening_status text,
  verified_at timestamptz,
  expires_at timestamptz,
  provider text NOT NULL DEFAULT 'onfido',
  provider_request_id text,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_kyc_verifications_status ON kyc_verifications(status);
CREATE INDEX idx_kyc_verifications_user_id ON kyc_verifications(user_id);

CREATE TABLE IF NOT EXISTS compliance_audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  transaction_id uuid,
  event_type text NOT NULL,
  action text NOT NULL,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_compliance_audit_user ON compliance_audit_trail(user_id);
CREATE INDEX idx_compliance_audit_timestamp ON compliance_audit_trail(created_at DESC);

-- 3. Document Management & OCR
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_id uuid,
  document_type text NOT NULL,
  file_path text NOT NULL,
  file_size_bytes bigint,
  mime_type text,
  ocr_status text DEFAULT 'pending',
  ocr_text text,
  extracted_data jsonb,
  signature_status text DEFAULT 'unsigned',
  signed_at timestamptz,
  signer_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
  FOREIGN KEY (signer_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_ocr_status ON documents(ocr_status);

-- 4. Real-Time Analytics (OLAP)
CREATE TABLE IF NOT EXISTS portfolio_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  total_invested_cents bigint,
  roi_pct numeric(6,2),
  risk_exposure_pct numeric(6,2),
  roi_1m numeric(6,2),
  roi_3m numeric(6,2),
  roi_6m numeric(6,2),
  roi_ytd numeric(6,2),
  cohort_segment text,
  property_count int,
  avg_holding_days int,
  liquidation_rate_pct numeric(5,2),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_portfolio_analytics_user ON portfolio_analytics(user_id);
CREATE INDEX idx_portfolio_analytics_roi ON portfolio_analytics(roi_pct DESC);

CREATE TABLE IF NOT EXISTS market_heat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location text NOT NULL,
  location_lat float,
  location_lng float,
  demand_index numeric(6,2) NOT NULL,
  price_trend text NOT NULL CHECK (price_trend IN ('up', 'stable', 'down')),
  price_change_pct numeric(6,2),
  inventory_level int,
  transaction_volume_24h int,
  transaction_volume_7d int,
  avg_price_per_sqm_brl bigint,
  median_days_to_sell int,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_market_heat_location ON market_heat(location);
CREATE INDEX idx_market_heat_demand ON market_heat(demand_index DESC);
CREATE INDEX idx_market_heat_updated ON market_heat(updated_at DESC);

-- 5. Enterprise API Integration
CREATE TABLE IF NOT EXISTS api_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,
  provider_name text NOT NULL,
  oauth_token text,
  oauth_refresh_token text,
  token_expires_at timestamptz,
  webhook_url text,
  webhook_secret text,
  status text NOT NULL DEFAULT 'active',
  last_sync_at timestamptz,
  sync_error_message text,
  config jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_api_integrations_user ON api_integrations(user_id);
CREATE INDEX idx_api_integrations_provider ON api_integrations(provider);
CREATE INDEX idx_api_integrations_status ON api_integrations(status);

-- 6. AI Matching Engine Results
CREATE TABLE IF NOT EXISTS ai_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  property_id uuid NOT NULL,
  match_score numeric(5,2) NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  match_factors jsonb NOT NULL DEFAULT '{}'::jsonb,
  predicted_offer_price_cents bigint,
  probability_acceptance_pct numeric(5,2),
  model_version text,
  created_at timestamptz DEFAULT now(),
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE INDEX idx_ai_matches_buyer ON ai_matches(buyer_id, created_at DESC);
CREATE INDEX idx_ai_matches_score ON ai_matches(match_score DESC);
CREATE UNIQUE INDEX idx_ai_matches_unique ON ai_matches(buyer_id, property_id);

-- 7. Price Prediction (Time Series)
CREATE TABLE IF NOT EXISTS price_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  prediction_type text NOT NULL CHECK (prediction_type IN ('7d', '30d', '90d', '1y')),
  predicted_price_cents bigint NOT NULL,
  confidence_interval_lower_cents bigint,
  confidence_interval_upper_cents bigint,
  confidence_pct numeric(5,2),
  model_version text,
  factors jsonb,
  created_at timestamptz DEFAULT now(),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE INDEX idx_price_predictions_property ON price_predictions(property_id, prediction_type);
CREATE INDEX idx_price_predictions_confidence ON price_predictions(confidence_pct DESC);

-- 8. Fraud Detection Signals
CREATE TABLE IF NOT EXISTS fraud_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  transaction_id uuid,
  anomaly_score numeric(5,2) NOT NULL CHECK (anomaly_score >= 0 AND anomaly_score <= 100),
  signal_type text NOT NULL,
  reason text,
  action_taken text CHECK (action_taken IN ('flagged', 'blocked', 'reviewed', 'cleared')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_fraud_signals_user ON fraud_signals(user_id);
CREATE INDEX idx_fraud_signals_score ON fraud_signals(anomaly_score DESC);
CREATE INDEX idx_fraud_signals_status ON fraud_signals(action_taken);

-- 9. Event Sourcing (immutable log)
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_id uuid NOT NULL,
  aggregate_type text NOT NULL,
  event_type text NOT NULL,
  data jsonb NOT NULL,
  metadata jsonb,
  version int NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_events_aggregate ON events(aggregate_id, version);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_timestamp ON events(created_at DESC);

-- RLS Policies
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_signals ENABLE ROW LEVEL SECURITY;

-- RLS: Users can see their own KYC
CREATE POLICY kyc_self ON kyc_verifications
  FOR SELECT
  USING (auth.uid()::uuid = user_id);

-- RLS: Users can see their own documents
CREATE POLICY documents_self ON documents
  FOR SELECT
  USING (auth.uid()::uuid = user_id);

-- RLS: Users can see their own analytics
CREATE POLICY analytics_self ON portfolio_analytics
  FOR SELECT
  USING (auth.uid()::uuid = user_id);

-- RLS: Users can see their integrations
CREATE POLICY integrations_self ON api_integrations
  FOR SELECT
  USING (auth.uid()::uuid = user_id);

-- RLS: Users can see matches for them
CREATE POLICY ai_matches_self ON ai_matches
  FOR SELECT
  USING (auth.uid()::uuid = buyer_id);

-- Admin can see fraud signals (without RLS initially; add later if needed)
