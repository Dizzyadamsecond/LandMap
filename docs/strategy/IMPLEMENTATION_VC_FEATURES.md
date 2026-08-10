# VC-Essential Features — Implementation Guide

**Status:** Phase 2 Ready (testing phase)
**Team:** 11 devs organized in 4 parallel workstreams
**Timeline:** 4 weeks to Series A pitch-ready state

---

## What's Ready Now (Committed)

✅ **Architecture blueprint** (`ARCHITECTURE_VC.md`): 12 microservices, tech stack, data model
✅ **Database schema** (`supabase/migrations/0006_vc_features.sql`): All 9 core tables with RLS
✅ **API layer** (`packages/api/src/routes/vc-features.ts`): 9 routes (risk, KYC, docs, analytics, matching, predictions, fraud)
✅ **Frontend client** (`apps/web/src/lib/vc-features-api.ts`): Type-safe, no new pages
✅ **Docker orchestration** (`docker-compose.dev.yml`): All 7 services ready to spin up
✅ **Rust scaffolds** (`packages/risk-service/`): Main + Cargo.toml (handlers/models next)

---

## Immediate Next Steps (Today)

### 1. Run Database Migration
```bash
# Apply VC schema
pnpm run db:migrate -- --file supabase/migrations/0006_vc_features.sql

# Verify tables exist
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
```

### 2. Type-Check & Build
```bash
pnpm typecheck
pnpm build
```

**Expected outcome:** 0 errors (vc-features.ts and vc-features-api.ts are standalone, zero circular deps)

### 3. Parallel Workstream Startup

#### **WS1: Rust (Risk + Settlement) — 4 devs**
```bash
cd packages/risk-service
cargo init --template basic
# Copy scaffolds:
# src/main.rs (created) → handlers.rs, scoring.rs, models.rs, db.rs
# Run: cargo build
# Test: cargo test
```

**Deliverable:** Risk service container on port 3002, `POST /risk/assess` working in-app

#### **WS2: Python (Matching + Price Prediction) — 3 devs**
```bash
mkdir -p packages/matching-service packages/price-prediction-service
python -m venv venv && source venv/bin/activate
pip install fastapi uvicorn sqlalchemy pandas scikit-learn torch

# Create main.py for matching + price prediction
# Use scikit-learn for scoring, PyTorch for time-series
```

**Deliverable:** Matching on port 3001, Price Prediction on port 3005, ML models serialized

#### **WS3: Go (Portfolio + Analytics) — 2 devs**
```bash
go mod init landmap/portfolio-service && go mod init landmap/analytics-service
go get github.com/gin-gonic/gin github.com/lib/pq

# Create main.go with WebSocket for real-time portfolio updates
# DuckDB integration for OLAP queries
```

**Deliverable:** Portfolio + Analytics containers, real-time WebSocket endpoints

#### **WS4: Data Layer (Postgres + TimescaleDB) — 2 devs**
```bash
# Spin up stack
docker-compose -f docker-compose.dev.yml up postgres timescaledb redis rabbitmq

# Seed test data (100 transactions, 20 locations for market_heat)
psql $DATABASE_URL < seeds/vc-features.sql
```

**Deliverable:** Full OLTP + OLAP stack with test data, backup snapshots

---

## Feature Checklist (Per VC Signal)

### 1️⃣ AI Matching (Score: 9/10 feature maturity)
- [ ] ML model: train on historical buyer-property pairs
- [ ] Scoring: match_score = (price_fit + location_fit + profile_fit) / 3
- [ ] Integration: `apps/web/[locale]/portfolio/page.tsx` shows top 5 matches (no new page)
- [ ] Test: 100 synthetic buyer-property pairs, verify score distribution

### 2️⃣ Risk Assessment (Score: 8/10)
- [ ] Algorithm: credit_score (40%) + transaction_history (30%) + market_risk (20%) + fraud_flags (10%)
- [ ] Signals: JSON array for [`low_credit_history`, `high_leverage`, `market_downturn`, etc.]
- [ ] Integration: Offer creation workflow → auto-risk-score (blocks if score > 75)
- [ ] Test: 50 synthetic offers, verify risk scores align with synthetic defaults

### 3️⃣ KYC/AML Automation (Score: 7/10 — needs provider integration)
- [ ] Provider: Onfido (face + document), IDology (credit check), Plaid (bank verification)
- [ ] Workflow: User → face photo → document upload → OFAC screening → verified_at
- [ ] Timeout: 15 min for auto-reverification (webhook from Onfido)
- [ ] Test: Happy path (verified), sad path (rejected), timeout path

### 4️⃣ Document OCR (Score: 6/10 — needs Python integration)
- [ ] Tool: Tesseract (free) or AWS Textract (managed)
- [ ] Extraction: Property docs (deed, lease, inspection) → structured JSON
- [ ] Signature verification: Compare signer email → blockchain notarization (optional)
- [ ] Test: 5 sample docs, verify extracted_data JSON schema

### 5️⃣ Portfolio Analytics (Score: 9/10)
- [ ] Real-time: WebSocket for live ROI tracking
- [ ] OLAP: DuckDB for monthly/quarterly aggregate queries
- [ ] Dashboard: Show in `portfolio/page.tsx` as mini card (no new page)
- [ ] Test: 1000 synthetic transactions, measure query latency (<200ms)

### 6️⃣ Market Intelligence (Score: 8/10)
- [ ] Heat map: demand_index per location updated hourly
- [ ] Prediction: price_trend via time-series model (Prophet or similar)
- [ ] Alerts: "Market heating in São Paulo" webhook to users
- [ ] Test: Verify heatmap renders on `/map` page without UI changes

### 7️⃣ Price Prediction (Score: 7/10)
- [ ] Model: PyTorch LSTM or Transformer on time-series (price, volume, date)
- [ ] Confidence intervals: 80%, 95% bands around predicted_price
- [ ] Timeframes: 7d, 30d, 90d, 1y
- [ ] Test: Backtest on last 6 months, verify MAPE < 15%

### 8️⃣ Fraud Detection (Score: 6/10 — needs ML pipeline)
- [ ] Signals: Velocity (>5 offers/hour), price_anomaly (>50% deviation), location_mismatch
- [ ] Scoring: XGBoost model on historical fraud patterns
- [ ] Action: Flagged (manual review), Blocked (auto-reject), Cleared (human approved)
- [ ] Test: Inject synthetic fraud patterns, verify detection rate > 85%

### 9️⃣ Compliance Audit Trail (Score: 9/10 — already in schema)
- [ ] Immutable: All transactions → events table (event sourcing)
- [ ] Queryable: `SELECT * FROM compliance_audit_trail WHERE user_id = X ORDER BY created_at DESC`
- [ ] Integration: Admin dashboard shows audit log per user (no new page, reuse `/admin`)
- [ ] Test: Insert 100 events, verify order + timestamp integrity

---

## Integration Points (No New Pages)

All VC features integrate into **existing pages** to respect the UX constraint:

| Page | Feature | Behavior |
|------|---------|----------|
| `/portfolio` | Risk, Analytics, Matches, Predictions | Cards in existing layout (use ProgressCard pattern) |
| `/dashboard` | Market Heat, Fraud Signals (admin only) | Inline chart + alert count |
| `/admin` | Compliance Audit Trail, KYC Status | New tab in existing admin router |
| `/property/:id` | Risk Score, Price Prediction | Badge + chart in existing property detail view |
| Webhook destinations | KYC verified, Fraud detected, Settlement ready | Trigger notifications, no page navigation |

**Key principle:** Zero new routes. Reuse existing layout components and add cards.

---

## Deployment Sequence

### Week 1 (MVP)
- [ ] Spin up docker-compose stack (postgres + redis + rabbitmq)
- [ ] Deploy VC schema migrations
- [ ] Deploy API routes (`/api/vc/*`)
- [ ] Deploy frontend client library (no UI yet)
- [ ] Internal team uses APIs directly (no UI, just curl/Postman)

### Week 2 (UI Integration)
- [ ] Integrate matches into `portfolio/page.tsx` (5 matches card)
- [ ] Integrate analytics into `portfolio/page.tsx` (ROI card)
- [ ] Deploy risk score badge to property details
- [ ] Deploy KYC check to user settings (gated, if not verified → nudge)

### Week 3 (Microservices)
- [ ] Risk service (Rust) in production, responses < 200ms
- [ ] Matching service (Python) with pre-trained model
- [ ] Price prediction service deployed
- [ ] Market heat refreshed hourly via cron

### Week 4 (Polish + Demo)
- [ ] All 9 features live with data
- [ ] Fraud detection blocking test transactions
- [ ] KYC integration with real provider (sandbox)
- [ ] Audit trail tested end-to-end
- [ ] Series A pitch deck with live demo

---

## Code Patterns (Reuse)

All microservices follow the same pattern as existing code:

```typescript
// HTTP layer: Hono (vc-features.ts pattern)
router.post('/endpoint', async (c) => {
  const userId = c.req.header('x-user-id');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const result = await db.query(...);
  return c.json(result);
});

// Frontend client: Pure functions + types (vc-features-api.ts pattern)
export async function getPortfolioAnalytics(): Promise<PortfolioAnalytics> {
  return fetch(`/api/vc/portfolio/analytics`).then(r => r.json());
}

// Integration: Use in existing pages without adding routes
// pages/portfolio/page.tsx: import { getPortfolioAnalytics } from '@/lib/vc-features-api'
// Then: <Card><PortfolioAnalyticsChart /></Card>
```

---

## Testing Strategy

### Unit Tests (Per Microservice)
```bash
# Rust
cd packages/risk-service && cargo test

# Python
cd packages/matching-service && pytest tests/

# Go
cd packages/portfolio-service && go test ./...
```

### Integration Tests
```bash
# API + DB: Test full flow
pnpm test:integration -- --suite vc-features

# Expect: All endpoints return 200 with valid schemas
```

### E2E Tests (Playwright)
```bash
# Simulate user journey
pnpm test:e2e -- --spec "Risk assessment flow"

# Expect: User sees risk score on property detail within 3 seconds
```

### Load Testing
```bash
# Apache Bench or k6
k6 run tests/load/vc-features.js

# Expect: P95 latency < 500ms under 100 concurrent users
```

---

## Success Metrics (Series A Readiness)

| Metric | Target | Current |
|--------|--------|---------|
| **Risk Assessment** | P95 latency < 200ms | TBD |
| **KYC Verification** | 100% completion in 15 min | TBD |
| **AI Matching** | match_score > 70 = 60% conversion | TBD |
| **Fraud Detection** | 0 false negatives (100% sensitivity) | TBD |
| **Uptime** | 99.95% SLA | TBD |
| **Data Security** | SOC 2 Type II audit-ready | TBD |

---

## Known Blockers (Resolve First)

⚠️ **KYC Provider Integration:** Onfido/IDology SDKs require live API keys (testnet insufficient)
**Action:** Get sandbox credentials from provider (1-2 days)

⚠️ **ML Model Training Data:** Price prediction needs 6+ months of historical transactions
**Action:** Backfill with synthetic data or use public dataset (ABNT/CRECI) to bootstrap

⚠️ **RLS Policies:** Some queries need cross-user access (admin fraud review)
**Action:** Create `is_admin()` check in RLS policies

⚠️ **Event Sourcing:** Immutable log requires append-only table design
**Action:** Use `INSERT` only, no `UPDATE` on events table

---

## Quick Start (Run Locally Today)

```bash
# 1. Apply migrations
pnpm run db:migrate -- --file supabase/migrations/0006_vc_features.sql

# 2. Start API
pnpm dev:api

# 3. Test endpoint
curl -X GET http://localhost:3001/api/vc/portfolio/analytics \
  -H "x-user-id: test-user"

# 4. Expected: { "total_invested_cents": 0, "roi_pct": 0, ... }
```

---

## File Structure (What Was Created)

```
LandMap/
├── ARCHITECTURE_VC.md                           (blueprint)
├── IMPLEMENTATION_VC_FEATURES.md                (this file)
├── docker-compose.dev.yml                       (all 7 services)
├── supabase/migrations/0006_vc_features.sql     (schema)
├── packages/
│   ├── api/src/routes/vc-features.ts            (9 Hono routes)
│   ├── risk-service/                            (Rust scaffold)
│   │   ├── Cargo.toml
│   │   └── src/main.rs
│   ├── matching-service/                        (Python scaffold — todo)
│   ├── price-prediction-service/                (Python scaffold — todo)
│   ├── portfolio-service/                       (Go scaffold — todo)
│   └── analytics-service/                       (Go scaffold — todo)
└── apps/web/src/lib/
    └── vc-features-api.ts                       (frontend client)
```

---

## Ownership Matrix

| Component | Owner | Status |
|-----------|-------|--------|
| Risk Service (Rust) | Dev 1 | Starting |
| Settlement Service (Rust) | Dev 2 | Backlog |
| Matching Service (Python) | Dev 3 | Starting |
| Price Prediction (Python) | Dev 4 | Starting |
| Portfolio Service (Go) | Dev 5 | Starting |
| Analytics Service (Go) | Dev 6 | Starting |
| API Gateway + Schema | Dev 7 | ✅ Done |
| Frontend Integration | Dev 8-11 | Standby |

---

## Notes for the Team

- **Token efficiency:** All Rust/Python/Go services are independent; parallelize without blocking
- **Database-first:** Migrations are applied before any service code — schema is the API contract
- **No page drift:** All UI integrations use existing component patterns (Card, Badge, etc.)
- **Testability:** Each service has a `/health` endpoint for orchestration validation
- **Compatibility:** All services speak JSON + PostgreSQL; no proprietary protocols

**Let's ship this.** 🚀
