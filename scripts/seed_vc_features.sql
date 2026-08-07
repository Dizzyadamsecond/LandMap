-- Seed script for VC Features testing
-- Populates test data for Risk Assessment, Matching, etc.

-- Create test users
INSERT INTO users (id, email, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'buyer1@test.com', NOW()),
  ('22222222-2222-2222-2222-222222222222', 'buyer2@test.com', NOW()),
  ('33333333-3333-3333-3333-333333333333', 'seller1@test.com', NOW())
ON CONFLICT DO NOTHING;

-- Create test properties
INSERT INTO properties (id, owner_id, title, location, price_cents, property_type, features, created_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'Apartamento luxo Pinheiros', 'São Paulo', 50000000, 'apartamento', '{"bedrooms": 3, "area_m2": 150}', NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'Casa Vila Madalena', 'São Paulo', 75000000, 'casa', '{"bedrooms": 4, "area_m2": 250}', NOW()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'Terreno Alphaville', 'São Paulo', 30000000, 'terreno', '{"area_m2": 500}', NOW())
ON CONFLICT DO NOTHING;

-- Create test offers
INSERT INTO offers (id, buyer_id, property_id, amount_cents, status, created_at) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 48000000, 'pending', NOW()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 72000000, 'pending', NOW()),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 29000000, 'pending', NOW())
ON CONFLICT DO NOTHING;

-- Create test risk assessments
INSERT INTO risk_assessments (id, offer_id, score, label, signals, creditworthiness_score, created_at) VALUES
  ('99999999-9999-9999-9999-999999999999', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 25.5, 'low', '[]'::jsonb, 85.0, NOW()),
  ('88888888-8888-8888-8888-888888888888', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 55.0, 'medium', '[{"type": "unusual_price", "severity": "medium"}]'::jsonb, 72.5, NOW()),
  ('77777777-7777-7777-7777-777777777777', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 42.3, 'medium', '[]'::jsonb, 78.0, NOW())
ON CONFLICT DO NOTHING;

-- Create test KYC verifications
INSERT INTO kyc_verifications (id, user_id, status, face_verification_status, document_verification_status, aml_screening_status, verified_at, provider, created_at) VALUES
  ('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'verified', 'success', 'success', 'passed', NOW() - interval '1 day', 'onfido', NOW() - interval '1 day'),
  ('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'pending', 'success', 'pending', 'pending', NULL, 'onfido', NOW())
ON CONFLICT DO NOTHING;

-- Create test portfolio analytics
INSERT INTO portfolio_analytics (id, user_id, total_invested_cents, roi_pct, risk_exposure_pct, roi_1m, roi_3m, roi_6m, roi_ytd, property_count, created_at) VALUES
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 77000000, 8.5, 25.0, 2.1, 6.3, 8.5, 12.2, 2, NOW()),
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 72000000, 5.2, 20.0, 1.2, 3.8, 5.2, 7.1, 1, NOW())
ON CONFLICT DO NOTHING;

-- Create test market heat data
INSERT INTO market_heat (id, location, location_lat, location_lng, demand_index, price_trend, price_change_pct, inventory_level, transaction_volume_24h, transaction_volume_7d, avg_price_per_sqm_brl, median_days_to_sell, created_at) VALUES
  ('22222222-2222-2222-2222-222222222222', 'São Paulo', -23.5505, -46.6333, 78.5, 'up', 5.2, 145, 23, 156, 12500, 18, NOW()),
  ('11111111-1111-1111-1111-111111111111', 'Rio de Janeiro', -22.9068, -43.1729, 65.0, 'stable', 0.8, 89, 12, 78, 9800, 25, NOW()),
  ('00000000-0000-0000-0000-000000000000', 'Belo Horizonte', -19.9167, -43.9345, 55.2, 'down', -2.1, 67, 8, 52, 7200, 32, NOW())
ON CONFLICT DO NOTHING;

-- Create test AI matches
INSERT INTO ai_matches (id, buyer_id, property_id, match_score, match_factors, predicted_offer_price_cents, probability_acceptance_pct, model_version, created_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 85.5, '{"price_fit": 90, "location_fit": 85, "feature_fit": 75}'::jsonb, 48500000, 78.0, 'v1.0', NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbab', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 72.3, '{"price_fit": 65, "location_fit": 75, "feature_fit": 80}'::jsonb, 73000000, 65.0, 'v1.0', NOW()),
  ('cccccccc-cccc-cccc-cccc-ccccccccccab', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 88.1, '{"price_fit": 88, "location_fit": 90, "feature_fit": 85}'::jsonb, 74000000, 85.0, 'v1.0', NOW())
ON CONFLICT DO NOTHING;

-- Create test price predictions
INSERT INTO price_predictions (id, property_id, prediction_type, predicted_price_cents, confidence_interval_lower_cents, confidence_interval_upper_cents, confidence_pct, model_version, created_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '30d', 50750000, 48212500, 53287500, 85.0, 'v1.0-simple', NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbac', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '30d', 76875000, 73031250, 80718750, 82.0, 'v1.0-simple', NOW()),
  ('cccccccc-cccc-cccc-cccc-ccccccccccac', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '30d', 30450000, 28927500, 31972500, 78.0, 'v1.0-simple', NOW())
ON CONFLICT DO NOTHING;

-- Create test fraud signals
INSERT INTO fraud_signals (id, user_id, transaction_id, anomaly_score, signal_type, reason, action_taken, created_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaad', '22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 35.2, 'unusual_price', 'Offer 4% below market', 'reviewed', NOW())
ON CONFLICT DO NOTHING;

-- Create test documents
INSERT INTO documents (id, user_id, property_id, document_type, file_path, ocr_status, ocr_text, signature_status, created_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaae', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'deed', '/uploads/deed_123.pdf', 'complete', 'Property deed for Pinheiros apartment...', 'unsigned', NOW())
ON CONFLICT DO NOTHING;

-- Create test compliance audit trail
INSERT INTO compliance_audit_trail (id, user_id, event_type, action, details, ip_address, created_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaf', '11111111-1111-1111-1111-111111111111', 'risk_assessment', 'assessed_offer', '{"offer_id": "dddddddd-dddd-dddd-dddd-dddddddddddd", "score": 25.5}'::jsonb, '192.168.1.1'::inet, NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbaf', '11111111-1111-1111-1111-111111111111', 'kyc_verification', 'verified_identity', '{"status": "verified", "provider": "onfido"}'::jsonb, '192.168.1.1'::inet, NOW())
ON CONFLICT DO NOTHING;

-- Log seed completion
SELECT 'Seed completed: ' || NOW()::text as status;
