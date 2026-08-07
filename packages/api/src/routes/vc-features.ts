import { Hono } from 'hono';

type Env = {
  db: any;
};

export function vcFeaturesRoutes(app: Hono<{ Bindings: Env }>) {
  const router = new Hono<{ Bindings: Env }>();

  // === RISK ASSESSMENT ===
  router.post('/risk/assess', async (c) => {
    const { offerId, buyerId, propertyId, offerAmountCents, buyerProfile } = await c.req.json();
    const userId = c.req.header('x-user-id');

    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    try {
      const result = await c.env.db.query(
        `INSERT INTO risk_assessments (offer_id, score, label, signals, creditworthiness_score, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id, score, label, signals, creditworthiness_score`,
        [
          offerId,
          75, // TODO: Call Rust risk-service
          'medium',
          JSON.stringify([{ type: 'low_credit_history', severity: 'medium' }]),
          80,
        ]
      );

      return c.json(result.rows[0], 201);
    } catch (e) {
      console.error('Risk assessment error:', e);
      return c.json({ error: 'Assessment failed' }, 500);
    }
  });

  router.get('/risk/:assessmentId', async (c) => {
    const { assessmentId } = c.req.param();
    const userId = c.req.header('x-user-id');

    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    try {
      const result = await c.env.db.query(
        `SELECT id, score, label, signals, creditworthiness_score, created_at
         FROM risk_assessments WHERE id = $1`,
        [assessmentId]
      );

      if (!result.rows.length) return c.json({ error: 'Not found' }, 404);
      return c.json(result.rows[0]);
    } catch (e) {
      console.error('Risk fetch error:', e);
      return c.json({ error: 'Fetch failed' }, 500);
    }
  });

  // === KYC/AML VERIFICATION ===
  router.post('/kyc/verify', async (c) => {
    const { provider = 'onfido' } = await c.req.json();
    const userId = c.req.header('x-user-id');

    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    try {
      const result = await c.env.db.query(
        `INSERT INTO kyc_verifications (user_id, status, provider, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING id, status, created_at`,
        [userId, 'pending', provider]
      );

      return c.json(result.rows[0], 201);
    } catch (e) {
      console.error('KYC error:', e);
      return c.json({ error: 'KYC failed' }, 500);
    }
  });

  router.get('/kyc/status', async (c) => {
    const userId = c.req.header('x-user-id');

    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    try {
      const result = await c.env.db.query(
        `SELECT id, status, face_verification_status, document_verification_status,
                aml_screening_status, verified_at
         FROM kyc_verifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );

      if (!result.rows.length) {
        return c.json({ status: 'not_started' });
      }
      return c.json(result.rows[0]);
    } catch (e) {
      console.error('KYC fetch error:', e);
      return c.json({ error: 'Fetch failed' }, 500);
    }
  });

  // === DOCUMENT MANAGEMENT ===
  router.post('/documents', async (c) => {
    const { propertyId, documentType, filePath, mimeType } = await c.req.json();
    const userId = c.req.header('x-user-id');

    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    try {
      const result = await c.env.db.query(
        `INSERT INTO documents (user_id, property_id, document_type, file_path, mime_type, ocr_status, created_at)
         VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
         RETURNING id, document_type, ocr_status`,
        [userId, propertyId, documentType, filePath, mimeType]
      );

      return c.json(result.rows[0], 201);
    } catch (e) {
      console.error('Document error:', e);
      return c.json({ error: 'Document upload failed' }, 500);
    }
  });

  router.get('/documents/:documentId', async (c) => {
    const { documentId } = c.req.param();
    const userId = c.req.header('x-user-id');

    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    try {
      const result = await c.env.db.query(
        `SELECT id, document_type, ocr_status, ocr_text, extracted_data,
                signature_status, created_at
         FROM documents WHERE id = $1 AND user_id = $2`,
        [documentId, userId]
      );

      if (!result.rows.length) return c.json({ error: 'Not found' }, 404);
      return c.json(result.rows[0]);
    } catch (e) {
      console.error('Document fetch error:', e);
      return c.json({ error: 'Fetch failed' }, 500);
    }
  });

  // === PORTFOLIO ANALYTICS ===
  router.get('/portfolio/analytics', async (c) => {
    const userId = c.req.header('x-user-id');

    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    try {
      const result = await c.env.db.query(
        `SELECT id, total_invested_cents, roi_pct, risk_exposure_pct,
                roi_1m, roi_3m, roi_6m, roi_ytd, property_count, updated_at
         FROM portfolio_analytics WHERE user_id = $1`,
        [userId]
      );

      if (!result.rows.length) {
        return c.json({
          total_invested_cents: 0,
          roi_pct: 0,
          risk_exposure_pct: 0,
          property_count: 0,
        });
      }
      return c.json(result.rows[0]);
    } catch (e) {
      console.error('Analytics fetch error:', e);
      return c.json({ error: 'Fetch failed' }, 500);
    }
  });

  // === MARKET INTELLIGENCE ===
  router.get('/market/heat/:location', async (c) => {
    const { location } = c.req.param();

    try {
      const result = await c.env.db.query(
        `SELECT id, location, demand_index, price_trend, price_change_pct,
                inventory_level, transaction_volume_24h, transaction_volume_7d,
                avg_price_per_sqm_brl, median_days_to_sell, updated_at
         FROM market_heat WHERE location = $1 ORDER BY updated_at DESC LIMIT 1`,
        [location]
      );

      if (!result.rows.length) {
        return c.json({ location, demand_index: 0, price_trend: 'stable' });
      }
      return c.json(result.rows[0]);
    } catch (e) {
      console.error('Market heat error:', e);
      return c.json({ error: 'Fetch failed' }, 500);
    }
  });

  // === AI MATCHING ===
  router.get('/matching/recommendations', async (c) => {
    const userId = c.req.header('x-user-id');
    const limit = c.req.query('limit') || '10';

    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    try {
      const result = await c.env.db.query(
        `SELECT am.id, am.property_id, am.match_score, am.match_factors,
                am.predicted_offer_price_cents, am.probability_acceptance_pct,
                p.title, p.location, p.price_cents
         FROM ai_matches am
         JOIN properties p ON p.id = am.property_id
         WHERE am.buyer_id = $1
         ORDER BY am.match_score DESC
         LIMIT $2`,
        [userId, limit]
      );

      return c.json({ matches: result.rows });
    } catch (e) {
      console.error('Matching error:', e);
      return c.json({ error: 'Fetch failed' }, 500);
    }
  });

  // === PRICE PREDICTION ===
  router.get('/predictions/:propertyId/:timeframe', async (c) => {
    const { propertyId, timeframe } = c.req.param();

    try {
      const result = await c.env.db.query(
        `SELECT id, predicted_price_cents, confidence_interval_lower_cents,
                confidence_interval_upper_cents, confidence_pct, factors, created_at
         FROM price_predictions
         WHERE property_id = $1 AND prediction_type = $2
         ORDER BY created_at DESC LIMIT 1`,
        [propertyId, timeframe]
      );

      if (!result.rows.length) {
        return c.json({ error: 'No prediction available' }, 404);
      }
      return c.json(result.rows[0]);
    } catch (e) {
      console.error('Prediction error:', e);
      return c.json({ error: 'Fetch failed' }, 500);
    }
  });

  // === FRAUD DETECTION ===
  router.post('/fraud/signal', async (c) => {
    const { transactionId, anomalyScore, signalType, reason } = await c.req.json();
    const userId = c.req.header('x-user-id');

    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    try {
      const result = await c.env.db.query(
        `INSERT INTO fraud_signals (user_id, transaction_id, anomaly_score, signal_type, reason, action_taken, created_at)
         VALUES ($1, $2, $3, $4, $5, 'flagged', NOW())
         RETURNING id, anomaly_score, action_taken`,
        [userId, transactionId, anomalyScore, signalType, reason]
      );

      return c.json(result.rows[0], 201);
    } catch (e) {
      console.error('Fraud signal error:', e);
      return c.json({ error: 'Signal failed' }, 500);
    }
  });

  return router;
}
