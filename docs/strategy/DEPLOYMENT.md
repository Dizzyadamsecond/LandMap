# 🚀 Production Deployment Guide

**Status:** Ready for Staging | Series A Demo Ready

---

## Pre-Deployment Checklist

- [ ] Database migrations applied (`supabase/migrations/0006_vc_features.sql`)
- [ ] All tests passing (`pnpm typecheck`, `pnpm test`)
- [ ] Docker images built locally
- [ ] Environment variables configured (`.env.production`)
- [ ] KYC provider credentials (Onfido/IDology) obtained
- [ ] SSL certificates ready (Vercel auto-manages)
- [ ] Monitoring/alerting configured (Sentry, DataDog, etc.)

---

## Stage 1: Local Validation (Day 1)

```bash
# 1. Apply schema
pnpm run db:migrate -- --file supabase/migrations/0006_vc_features.sql

# 2. Seed test data
psql $DATABASE_URL < scripts/seed_vc_features.sql

# 3. Start services
pnpm dev:api                           # Terminal 1
docker-compose -f docker-compose.dev.yml up  # Terminal 2

# 4. Run E2E tests
bash scripts/test_vc_e2e.sh            # Terminal 3

# 5. Verify TypeScript
pnpm typecheck
```

**Expected output:**
```
✅ All E2E Tests Passed!
✓ Risk Assessment: low (25.5 pts)
✓ KYC Verification: pending
✓ Portfolio Analytics: $770,000 invested
✓ Market Intelligence: Demand 78.5 (up)
✓ AI Matching: 3 recommendations
```

---

## Stage 2: Staging Deployment (Vercel + Render)

### Option A: Vercel (Next.js Frontend + Proxy Routes)

```bash
# Build & deploy web app (includes /api/vc proxy routes)
vercel deploy --prod

# Env vars to set in Vercel project:
# DATABASE_URL=postgresql://...
# REDIS_URL=redis://...
# RABBITMQ_URL=amqp://...
```

### Option B: Render (Microservices)

Deploy each microservice independently:

```bash
# Risk Service (Rust)
cd packages/risk-service
cargo build --release
# Deploy via Render with:
# - Build Command: cargo build --release
# - Start Command: ./target/release/risk-service
# - Env: DATABASE_URL, SERVICE_PORT=3002

# Matching Service (Python)
cd packages/matching-service
# Deploy via Render with:
# - Build Command: pip install -r requirements.txt
# - Start Command: uvicorn main:app --host 0.0.0.0 --port 3001

# Portfolio Service (Go)
cd packages/portfolio-service
go mod download
go build
# Deploy via Render with:
# - Build Command: go build -o portfolio-service
# - Start Command: ./portfolio-service
```

---

## Stage 3: Production Architecture

```
┌─────────────────────────────────────┐
│         Cloudflare (DNS/WAF)        │
└──────────────────┬──────────────────┘
                   │
         ┌─────────┴──────────┐
         │                    │
    ┌────▼────┐         ┌────▼────┐
    │ Vercel  │         │ Render   │
    │ (Web)   │         │(Services)│
    └────┬────┘         └────┬─────┘
         │                   │
    ┌────▼──────────────────▼────┐
    │   API Gateway (Nginx)      │
    │   - Rate limiting          │
    │   - SSL termination        │
    │   - Load balancing         │
    └────┬──────────────────┬────┘
         │                  │
    ┌────▼────┐        ┌────▼─────┐
    │Risk/Port│        │Matching/ │
    │folio    │        │Price     │
    └────┬────┘        └────┬─────┘
         │                  │
    ┌────▼──────────────────▼────┐
    │   PostgreSQL + RLS         │
    │   TimescaleDB (audit)      │
    │   Redis (cache)            │
    │   RabbitMQ (queue)         │
    └────────────────────────────┘
```

---

## Environment Variables

### Production (.env.production)

```bash
# Database
DATABASE_URL=postgresql://prod_user:PASS@rds.amazonaws.com/landmap_prod
TIMESCALE_URL=postgresql://prod_user:PASS@timescale-cloud/landmap_audit

# Cache & Queue
REDIS_URL=redis://cache.aws.com:6379
RABBITMQ_URL=amqp://queue.aws.com

# Services
RISK_SERVICE_URL=https://risk-service.render.com
MATCHING_SERVICE_URL=https://matching.render.com
PORTFOLIO_SERVICE_URL=https://portfolio.render.com

# KYC/AML Providers
ONFIDO_API_KEY=<your_prod_key>
ONFIDO_WEBHOOK_TOKEN=<your_token>

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
DATADOG_API_KEY=...

# Security
JWT_SECRET=<generate_with_openssl_rand_-_hex_32>
ENCRYPTION_KEY=<32_character_hex>
```

---

## Database Replication & Backup

### PostgreSQL Replication (AWS RDS)

```bash
# Create read replica
aws rds create-db-instance-read-replica \
  --db-instance-identifier landmap-prod-read-01 \
  --source-db-instance-identifier landmap-prod

# Enable automated backups
aws rds modify-db-instance \
  --db-instance-identifier landmap-prod \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00"
```

### TimescaleDB Backups

```bash
# Automated backups via Timescale Cloud
# (Web console handles 24/7 backups)

# Manual backup
pg_dump -h timescale-cloud.com -U user -d landmap_audit > audit_backup.sql

# Restore from backup
psql -h timescale-cloud.com -U user -d landmap_audit < audit_backup.sql
```

---

## Monitoring & Alerting

### Sentry (Error Tracking)

```bash
# Install Sentry
npm install @sentry/next @sentry/node

# Initialize in apps/web/src/app/layout.tsx
import * as Sentry from "@sentry/next";
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [new Sentry.Replay()],
});
```

### DataDog (Metrics)

```bash
# Install agent
npm install @datadog/browser-rum @datadog/browser-logs

# Start RUM
datadogRum.init({
  applicationId: process.env.DATADOG_APP_ID,
  clientToken: process.env.DATADOG_CLIENT_TOKEN,
});

# Alerts: P95 latency > 500ms → Page on-call
```

### Health Checks

```bash
# /health endpoint on all services
GET /health
# Expected: {"status": "ok", "service": "risk-service", "db": "connected"}

# Monitor from external service (Uptime Robot)
https://prod.api.landmap.com/health -> Every 5 minutes
```

---

## Security Hardening

### SSL/TLS

```bash
# Vercel auto-manages SSL (free via Let's Encrypt)
# For custom domains: vercel.json includes domain config

# Force HTTPS
next.config.js:
module.exports = {
  redirects: async () => [
    {
      source: '/:path*',
      destination: 'https://:host/:path*',
      permanent: true,
    },
  ],
};
```

### Rate Limiting

```bash
# Middleware: apps/web/src/middleware.ts
import { RateLimiter } from 'limiter';

const limiter = new RateLimiter({
  tokensPerInterval: 120,  // 120 requests
  interval: 60000,         // per 1 minute
});

// Check: if (!await limiter.tryRemoveTokens(1)) return 429
```

### Data Encryption

```bash
# At-rest: PostgreSQL built-in encryption
# In-transit: TLS 1.3 (Vercel enforces)

# Application-side (sensitive PII):
const crypto = require('crypto');
const encrypted = crypto
  .createCipheriv('aes-256-cbc', key, iv)
  .update(plaintext, 'utf8', 'hex')
  .final('hex');
```

---

## Performance Optimization

### Caching Strategy

```bash
# Redis cache for:
# - User sessions (TTL: 24h)
# - Risk assessments (TTL: 1h)
# - Market heat data (TTL: 1h)
# - AI matches (TTL: 30m)

# CDN (Vercel Edge Network):
# - Static assets: immutable, 1 year
# - HTML pages: 60s, stale-while-revalidate 300s
# - API responses: per-endpoint (see next.config.js)
```

### Database Indexing

```sql
-- Already created in migrations:
CREATE INDEX idx_risk_assessments_score ON risk_assessments(score DESC);
CREATE INDEX idx_ai_matches_score ON ai_matches(match_score DESC);
CREATE INDEX idx_portfolio_analytics_roi ON portfolio_analytics(roi_pct DESC);

-- Monitor slow queries
SELECT query, calls, mean_exec_time 
FROM pg_stat_statements 
WHERE mean_exec_time > 100 
ORDER BY mean_exec_time DESC;
```

### Load Testing

```bash
# Run k6 load tests before prod deploy
k6 run scripts/load_test.js --vus 100 --duration 5m

# Expected results:
# - P95 latency: < 500ms
# - P99 latency: < 1000ms
# - Error rate: < 0.1%
# - Throughput: > 1000 req/sec
```

---

## Deployment Checklist

### Pre-Deploy
- [ ] All features tested locally ✓
- [ ] Database migrations validated
- [ ] Secrets rotated
- [ ] Monitoring alerts configured
- [ ] Rollback plan documented
- [ ] Team notified of deployment window
- [ ] Load tests passed

### Deployment
- [ ] Deploy database first (schema changes)
- [ ] Deploy backend services (Render)
- [ ] Deploy frontend (Vercel)
- [ ] Verify health checks
- [ ] Run smoke tests
- [ ] Monitor error rates (5 minutes)
- [ ] Monitor latency (5 minutes)

### Post-Deploy
- [ ] Verify all endpoints responding
- [ ] Check error logs (Sentry)
- [ ] Verify metrics (DataDog)
- [ ] Test user flow end-to-end
- [ ] Document any issues
- [ ] Notify stakeholders

---

## Rollback Procedure

If something goes wrong:

```bash
# Revert database migrations
psql $DATABASE_URL -c "
  DELETE FROM risk_assessments 
  WHERE created_at > NOW() - interval '1 hour';
"

# Rollback frontend (Vercel)
vercel rollback production

# Rollback services (Render)
# Re-deploy previous git commit SHA
git push origin <previous_commit>
```

---

## Series A Demo Setup

For live pitch demo, prepare:

```bash
# Demo environment (isolated from production)
DATABASE_URL=postgresql://demo_user:...@demo.db
API_URL=https://demo.api.landmap.com

# Pre-seed demo data (100 offers, 5 matches each)
psql $DATABASE_URL < scripts/seed_vc_features.sql

# Set up demo user accounts:
# - buyer@demo.com (excellent credit, many matches)
# - seller@demo.com (multiple properties)
# - admin@demo.com (access to all admin features)

# Demo flow:
# 1. Show /portfolio page → Analytics loaded
# 2. Create new offer → Risk score computed in 200ms
# 3. Show AI matches → Top 5 recommendations
# 4. Show KYC status → "Verified"
# 5. Show market heatmap → São Paulo demand 78.5%
# 6. Show fraud detection → 1 alert triggered
# 7. Show audit trail → All transactions logged

# Record demo video (~5 min):
# pnpm dev → open /portfolio → create offer → show results
```

---

## Support & On-Call

### Escalation Path

**Severity 1 (Down):** VP Eng → CTO → AWS Support  
**Severity 2 (Degraded):** Tech Lead → On-Call  
**Severity 3 (Bug):** Bug triage next morning  

### Critical Metrics to Monitor

- API latency (P95, P99)
- Error rate (% of requests)
- Database connection pool utilization
- Cache hit rate
- Risk assessment speed (< 200ms)
- KYC verification status distribution

---

## Success Criteria

| Metric | Target | Monitoring |
|--------|--------|------------|
| Uptime | 99.95% | Uptime Robot |
| P95 Latency | < 500ms | DataDog |
| Error Rate | < 0.1% | Sentry |
| Risk Score Time | < 200ms | Application logs |
| KYC Turnaround | 15m avg | Database queries |

---

**Next:** Review `QUICK_START.md` for first-time setup. 🚀
