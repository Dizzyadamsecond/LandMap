-- ============================================================================
-- LANDMAP PRODUCT EVENTS & RETENTION ANALYTICS — FASE 0 Foundation
-- ============================================================================
-- Tables: product_events, cta_events, user_retention_days
-- Materialized View: retention_cohort_matrix
-- Purpose: Track product usage, CTA engagement, and user retention cohorts
-- ============================================================================

-- ============================================================================
-- 1. PRODUCT_EVENTS — Core product telemetry
-- ============================================================================
CREATE TABLE product_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  event_type VARCHAR(64) NOT NULL,  -- 'feature_used', 'page_view', 'error', 'conversion'
  event_name VARCHAR(255),           -- e.g., 'feature_used:map', 'page_view:/portfolio'
  page VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_events_user_id ON product_events(user_id);
CREATE INDEX idx_product_events_event_type ON product_events(event_type);
CREATE INDEX idx_product_events_created_at ON product_events(created_at DESC);

-- ============================================================================
-- 2. CTA_EVENTS — Call-to-action tracking (impressions, clicks)
-- ============================================================================
CREATE TABLE cta_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  cta_id VARCHAR(255) NOT NULL,      -- e.g., 'signup_button_hero', 'trial_upgrade_modal'
  cta_variant VARCHAR(100),          -- A/B test variant: 'control', 'treatment_a', etc.
  page VARCHAR(255),
  action VARCHAR(64) NOT NULL,       -- 'impression' | 'click' | 'dismiss'
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_cta_events_cta_id ON cta_events(cta_id);
CREATE INDEX idx_cta_events_action ON cta_events(action);
CREATE INDEX idx_cta_events_created_at ON cta_events(created_at DESC);

-- ============================================================================
-- 3. USER_RETENTION_DAYS — Cohort-based retention tracking
-- ============================================================================
CREATE TABLE user_retention_days (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  cohort_week DATE NOT NULL,         -- Week of first signup (cohort start)
  PRIMARY KEY (user_id, activity_date)
);

CREATE INDEX idx_user_retention_cohort_week ON user_retention_days(cohort_week);

-- ============================================================================
-- 4. MATERIALIZED VIEW — retention_cohort_matrix (for analytics)
-- ============================================================================
CREATE MATERIALIZED VIEW retention_cohort_matrix AS
  SELECT
    urd.cohort_week,
    FLOOR(EXTRACT(DAY FROM (urd.activity_date - urd.cohort_week)) / 7)::INT AS week_number,
    COUNT(DISTINCT urd.user_id) AS active_users
  FROM user_retention_days urd
  GROUP BY urd.cohort_week, FLOOR(EXTRACT(DAY FROM (urd.activity_date - urd.cohort_week)) / 7)
  ORDER BY urd.cohort_week DESC, week_number ASC;

CREATE INDEX idx_retention_cohort_matrix_cohort_week ON retention_cohort_matrix(cohort_week DESC);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE product_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cta_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_retention_days ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own events
CREATE POLICY "Users can view their own product events"
  ON product_events
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own product events"
  ON product_events
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Allow authenticated users to view their own CTA events
CREATE POLICY "Users can view their own CTA events"
  ON cta_events
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own CTA events"
  ON cta_events
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Allow authenticated users to view their own retention days
CREATE POLICY "Users can view their own retention days"
  ON user_retention_days
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own retention days"
  ON user_retention_days
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 6. GRANTS — Admin & service role access
-- ============================================================================

GRANT SELECT, INSERT ON product_events TO authenticated;
GRANT SELECT, INSERT ON cta_events TO authenticated;
GRANT SELECT, INSERT ON user_retention_days TO authenticated;
GRANT SELECT ON retention_cohort_matrix TO authenticated;

-- Service role (backend): full access
GRANT ALL ON product_events TO service_role;
GRANT ALL ON cta_events TO service_role;
GRANT ALL ON user_retention_days TO service_role;
GRANT ALL ON retention_cohort_matrix TO service_role;
