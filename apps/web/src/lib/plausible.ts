export type PlausibleEventName =
  | 'signup'
  | 'purchase_intent'
  | 'lead_created'
  | 'map_view'
  | 'plan_selected'
  | string;

declare global {
  interface Window {
    plausible?: ((eventName: PlausibleEventName, props?: Record<string, unknown>) => void) & {
      q?: Array<[PlausibleEventName, Record<string, unknown>?]>;
      init?: (opts?: Record<string, unknown>) => void;
      o?: Record<string, unknown>;
    };
  }
}

export function trackPlausible(eventName: PlausibleEventName, props?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (typeof window.plausible === 'function') window.plausible(eventName, props);
}
