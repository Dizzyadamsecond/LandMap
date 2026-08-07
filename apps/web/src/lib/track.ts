/**
 * Product events tracking library
 * Sends events to /api/events/* endpoints for analytics
 */

export interface ProductEvent {
  eventType?: 'feature_used' | 'page_view' | 'error' | 'conversion';
  eventName?: string;
  page?: string;
  metadata?: Record<string, any>;
}

export interface CtaEvent {
  ctaId: string;
  ctaVariant?: string;
  page?: string;
  action: 'impression' | 'click' | 'dismiss';
}

/**
 * Track a general product event
 * POST /events/track
 */
export async function track(event: ProductEvent): Promise<void> {
  try {
    const payload = {
      eventType: event.eventType || 'page_view',
      eventName: event.eventName,
      page: event.page || typeof window !== 'undefined' ? window.location.pathname : undefined,
      metadata: event.metadata,
    };

    await fetch('/api/events/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Silently fail if tracking endpoint unavailable
    });
  } catch (e) {
    console.debug('[track] error:', e);
  }
}

/**
 * Track a CTA (call-to-action) event
 * POST /events/cta
 */
export async function trackCta(event: CtaEvent): Promise<void> {
  try {
    const payload = {
      ctaId: event.ctaId,
      ctaVariant: event.ctaVariant,
      page: event.page || typeof window !== 'undefined' ? window.location.pathname : undefined,
      action: event.action,
    };

    await fetch('/api/events/cta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Silently fail if tracking endpoint unavailable
    });
  } catch (e) {
    console.debug('[trackCta] error:', e);
  }
}

/**
 * Track a feature usage event
 * Convenience wrapper for track()
 */
export async function trackFeature(featureName: string, metadata?: Record<string, any>): Promise<void> {
  await track({
    eventType: 'feature_used',
    eventName: `feature_used:${featureName}`,
    metadata,
  });
}

/**
 * Track a page view event
 * Convenience wrapper for track()
 */
export async function trackPageView(page: string, metadata?: Record<string, any>): Promise<void> {
  await track({
    eventType: 'page_view',
    page,
    metadata,
  });
}

/**
 * Track a conversion event
 * Convenience wrapper for track()
 */
export async function trackConversion(name: string, metadata?: Record<string, any>): Promise<void> {
  await track({
    eventType: 'conversion',
    eventName: name,
    metadata,
  });
}
