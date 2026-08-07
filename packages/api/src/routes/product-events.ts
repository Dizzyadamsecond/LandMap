import { Hono } from 'hono';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

/**
 * Product Events & Retention Analytics — FASE 0 Foundation
 *
 * Self-hosted event tracking (zero vendors, zero deps beyond Hono).
 * Events persisted to NDJSON files. Compatible with future Supabase migration.
 *
 * POST  /events/track                  { event_type, event_name?, page?, metadata?, user_id?, session_id? }
 * POST  /events/cta                    { cta_id, action, cta_variant?, page?, user_id?, session_id? }
 * GET   /events/summary?days=30        → aggregation by (event_type, date)
 * GET   /events/cta-report?days=30     → CTA impressions, clicks, CTR
 * GET   /events/retention?weeks=8      → retention cohort matrix
 */

const DATA_DIR = join(process.cwd(), 'data');
const PRODUCT_EVENTS_FILE = join(DATA_DIR, 'product-events.ndjson');
const CTA_EVENTS_FILE = join(DATA_DIR, 'cta-events.ndjson');
const RETENTION_FILE = join(DATA_DIR, 'user-retention.ndjson');

type ProductEvent = {
  id: string;
  user_id?: string;
  session_id?: string;
  event_type: string;
  event_name?: string;
  page?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
};

type CtaEvent = {
  id: string;
  user_id?: string;
  session_id?: string;
  cta_id: string;
  cta_variant?: string;
  page?: string;
  action: 'impression' | 'click' | 'dismiss';
  created_at: string;
};

type RetentionRecord = {
  user_id: string;
  activity_date: string;
  cohort_week?: string;
};

// ============================================================================
// Helpers
// ============================================================================

function ensureDataDir() {
  mkdirSync(DATA_DIR, { recursive: true });
}

function readNdjson<T>(filepath: string): T[] {
  if (!existsSync(filepath)) return [];
  try {
    return readFileSync(filepath, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as T;
        } catch {
          return null;
        }
      })
      .filter((item): item is T => item !== null);
  } catch {
    return [];
  }
}

function appendNdjson(filepath: string, obj: unknown) {
  ensureDataDir();
  appendFileSync(filepath, JSON.stringify(obj) + '\n');
}

function getCohortWeek(date: Date): string {
  const d = new Date(date);
  const dayOfWeek = d.getUTCDay();
  const diffToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
  d.setUTCDate(d.getUTCDate() - diffToMonday);
  return d.toISOString().split('T')[0];
}

// ============================================================================
// Router
// ============================================================================

export function createProductEventsRouter() {
  const router = new Hono();

  /**
   * POST /events/track
   * Track a product event (feature_used, page_view, error, conversion, etc.)
   */
  router.post('/track', async (c) => {
    const body = await c.req.json().catch(() => null);

    if (!body || typeof body.event_type !== 'string') {
      return c.json({ error: 'event_type is required' }, 400);
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    const event: ProductEvent = {
      id,
      user_id: typeof body.user_id === 'string' ? body.user_id.slice(0, 255) : undefined,
      session_id: typeof body.session_id === 'string' ? body.session_id.slice(0, 255) : undefined,
      event_type: body.event_type.slice(0, 64),
      event_name: typeof body.event_name === 'string' ? body.event_name.slice(0, 255) : undefined,
      page: typeof body.page === 'string' ? body.page.slice(0, 255) : undefined,
      metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : undefined,
      created_at: now,
    };

    appendNdjson(PRODUCT_EVENTS_FILE, event);

    // Update retention cohort if user_id is present
    if (event.user_id) {
      const today = new Date().toISOString().split('T')[0];
      const existing = readNdjson<RetentionRecord>(RETENTION_FILE);
      const userRetention = existing.find((r) => r.user_id === event.user_id && r.activity_date === today);

      if (!userRetention) {
        const cohort_week = existing.find((r) => r.user_id === event.user_id)?.cohort_week || getCohortWeek(new Date());
        const retention: RetentionRecord = {
          user_id: event.user_id,
          activity_date: today,
          cohort_week,
        };
        appendNdjson(RETENTION_FILE, retention);
      }
    }

    return c.json({ id, created_at: now }, 200);
  });

  /**
   * POST /events/cta
   * Track CTA (call-to-action) impressions and clicks
   */
  router.post('/cta', async (c) => {
    const body = await c.req.json().catch(() => null);

    if (!body || typeof body.cta_id !== 'string' || typeof body.action !== 'string') {
      return c.json({ error: 'cta_id and action are required' }, 400);
    }

    const validActions = ['impression', 'click', 'dismiss'];
    if (!validActions.includes(body.action)) {
      return c.json({ error: `action must be one of: ${validActions.join(', ')}` }, 400);
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    const event: CtaEvent = {
      id,
      user_id: typeof body.user_id === 'string' ? body.user_id.slice(0, 255) : undefined,
      session_id: typeof body.session_id === 'string' ? body.session_id.slice(0, 255) : undefined,
      cta_id: body.cta_id.slice(0, 255),
      cta_variant: typeof body.cta_variant === 'string' ? body.cta_variant.slice(0, 100) : undefined,
      page: typeof body.page === 'string' ? body.page.slice(0, 255) : undefined,
      action: body.action,
      created_at: now,
    };

    appendNdjson(CTA_EVENTS_FILE, event);
    return c.json({ id, created_at: now }, 200);
  });

  /**
   * GET /events/summary?days=30
   * Aggregate product events by (event_type, date)
   */
  router.get('/summary', (c) => {
    const days = Math.min(+(c.req.query('days') || 30), 365);
    const since = Date.now() - days * 864e5;
    const events = readNdjson<ProductEvent>(PRODUCT_EVENTS_FILE).filter(
      (e) => new Date(e.created_at).getTime() >= since,
    );

    const summary: Record<string, Record<string, number>> = {};

    for (const event of events) {
      const date = event.created_at.split('T')[0];
      const key = `${event.event_type}:${date}`;

      if (!summary[event.event_type]) summary[event.event_type] = {};
      summary[event.event_type][date] = (summary[event.event_type][date] ?? 0) + 1;
    }

    const data = Object.entries(summary).flatMap(([event_type, byDate]) =>
      Object.entries(byDate).map(([date, count]) => ({ event_type, date, count })),
    );

    return c.json({ windowDays: days, data }, 200);
  });

  /**
   * GET /events/cta-report?days=30
   * Aggregate CTA events: impressions, clicks, CTR by cta_id
   */
  router.get('/cta-report', (c) => {
    const days = Math.min(+(c.req.query('days') || 30), 365);
    const since = Date.now() - days * 864e5;
    const events = readNdjson<CtaEvent>(CTA_EVENTS_FILE).filter(
      (e) => new Date(e.created_at).getTime() >= since,
    );

    const report: Record<
      string,
      {
        cta_id: string;
        impressions: number;
        clicks: number;
        dismissals: number;
        ctr: number;
        variant_stats: Record<string, { impressions: number; clicks: number; ctr: number }>;
      }
    > = {};

    for (const event of events) {
      if (!report[event.cta_id]) {
        report[event.cta_id] = {
          cta_id: event.cta_id,
          impressions: 0,
          clicks: 0,
          dismissals: 0,
          ctr: 0,
          variant_stats: {},
        };
      }

      const rec = report[event.cta_id];
      if (event.action === 'impression') rec.impressions += 1;
      else if (event.action === 'click') rec.clicks += 1;
      else if (event.action === 'dismiss') rec.dismissals += 1;

      const variant = event.cta_variant || 'default';
      if (!rec.variant_stats[variant]) {
        rec.variant_stats[variant] = { impressions: 0, clicks: 0, ctr: 0 };
      }
      if (event.action === 'impression') rec.variant_stats[variant].impressions += 1;
      else if (event.action === 'click') rec.variant_stats[variant].clicks += 1;
    }

    // Compute CTRs
    for (const rec of Object.values(report)) {
      rec.ctr = rec.impressions > 0 ? +(rec.clicks / rec.impressions).toFixed(4) : 0;
      for (const vstat of Object.values(rec.variant_stats)) {
        vstat.ctr = vstat.impressions > 0 ? +(vstat.clicks / vstat.impressions).toFixed(4) : 0;
      }
    }

    const data = Object.values(report);
    return c.json({ windowDays: days, data }, 200);
  });

  /**
   * GET /events/retention?weeks=8
   * Retention cohort matrix: cohort_week → weeks [0, 1, 2, ...] → active_users count
   */
  router.get('/retention', (c) => {
    const weeks = Math.min(+(c.req.query('weeks') || 8), 52);
    const now = new Date();
    const sinceCohort = new Date(now.getTime() - weeks * 7 * 864e5);

    const records = readNdjson<RetentionRecord>(RETENTION_FILE);
    const cohortMap: Record<string, Set<string>> = {};

    for (const record of records) {
      const cohort = record.cohort_week || getCohortWeek(new Date(record.activity_date));
      const cohortDate = new Date(cohort);

      if (cohortDate < sinceCohort) continue;

      if (!cohortMap[cohort]) cohortMap[cohort] = new Set();
      cohortMap[cohort].add(record.user_id);
    }

    const cohorts = Object.entries(cohortMap)
      .sort(([a], [b]) => b.localeCompare(a)) // DESC by date
      .map(([cohort_week, users]) => {
        const cohortDate = new Date(cohort_week);
        const weeks_data: Array<{ week_number: number; active_users: number }> = [];

        // For each week since cohort, count active users
        for (let w = 0; w < weeks; w++) {
          const weekStart = new Date(cohortDate);
          weekStart.setDate(weekStart.getDate() + w * 7);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);

          const weekStartStr = weekStart.toISOString().split('T')[0];
          const weekEndStr = weekEnd.toISOString().split('T')[0];

          const activeInWeek = records
            .filter(
              (r) =>
                r.cohort_week === cohort_week &&
                r.activity_date >= weekStartStr &&
                r.activity_date <= weekEndStr,
            )
            .map((r) => r.user_id);

          weeks_data.push({
            week_number: w,
            active_users: new Set(activeInWeek).size,
          });
        }

        return { cohort_week, weeks: weeks_data };
      });

    return c.json({ weeks, cohorts }, 200);
  });

  return router;
}
