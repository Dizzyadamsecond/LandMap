/**
 * Client-side event tracking helper
 * Sends events to /api/events/track and /api/events/cta endpoints
 *
 * Usage:
 *   import { track, trackCta } from '@/track';
 *   track('feature_used', 'map_zoom', { metadata: { level: 5 } });
 *   trackCta('pricing_cta', 'click', { variant: 'annual' });
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

// Generate or retrieve session ID from localStorage
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  const key = '__landmap_session_id';
  let sid = localStorage.getItem(key);
  if (!sid) {
    sid = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, sid);
  }
  return sid;
}

// Get user ID from localStorage (if available)
function getUserId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const user = localStorage.getItem('__landmap_user_id');
    return user || undefined;
  } catch {
    return undefined;
  }
}

export interface TrackOptions {
  user_id?: string;
  session_id?: string;
  page?: string;
  metadata?: Record<string, unknown>;
}

export interface CtaTrackOptions {
  user_id?: string;
  session_id?: string;
  page?: string;
  variant?: string;
}

/**
 * Track a product event
 * @param event_type - Type of event (e.g., 'feature_used', 'page_view', 'error', 'conversion')
 * @param event_name - Optional descriptive name
 * @param options - Additional tracking options
 */
export async function track(
  event_type: string,
  event_name?: string,
  options: TrackOptions = {}
) {
  if (typeof window === 'undefined') return;

  try {
    const url = new URL(`${API_BASE}/events/track`, window.location.origin);

    const payload = {
      event_type,
      event_name,
      page: options.page || window.location.pathname,
      user_id: options.user_id || getUserId(),
      session_id: options.session_id || getSessionId(),
      metadata: options.metadata,
    };

    // Use beacon API for reliability (doesn't require response)
    if ('sendBeacon' in navigator) {
      navigator.sendBeacon(url.toString(), JSON.stringify(payload));
    } else {
      // Fallback to fetch (with keepalive for background requests)
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    }
  } catch (error) {
    // Silently fail - don't interrupt user experience for tracking errors
    console.debug('[track] error:', error);
  }
}

/**
 * Track a CTA (Call-To-Action) event
 * @param cta_id - Identifier for the CTA (e.g., 'pricing_upgrade', 'signup_hero')
 * @param action - Action type: 'impression' | 'click' | 'dismiss'
 * @param options - Additional tracking options
 */
export async function trackCta(
  cta_id: string,
  action: 'impression' | 'click' | 'dismiss',
  options: CtaTrackOptions = {}
) {
  if (typeof window === 'undefined') return;

  try {
    const url = new URL(`${API_BASE}/events/cta`, window.location.origin);

    const payload = {
      cta_id,
      action,
      page: options.page || window.location.pathname,
      user_id: options.user_id || getUserId(),
      session_id: options.session_id || getSessionId(),
      cta_variant: options.variant,
    };

    if ('sendBeacon' in navigator) {
      navigator.sendBeacon(url.toString(), JSON.stringify(payload));
    } else {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    }
  } catch (error) {
    console.debug('[trackCta] error:', error);
  }
}

/**
 * Track page view automatically on mount
 * Call this in useEffect or root layout
 */
export function trackPageView(pageName?: string) {
  track('page_view', pageName);
}
