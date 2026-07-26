/**
 * Web Push subscription ledger (LandMap PWA).
 * Em produção, VAPID público + `web-push` enviam para os browsers.
 * Sem a dependência instalada, mantemos o ledger e registramos o dispatch.
 */
export type PushSubscription = {
  endpoint: string;
  keys?: { p256dh?: string; auth?: string };
  createdAt: string;
};

const g = globalThis as unknown as {
  __landmapPushSubs?: Map<string, PushSubscription>;
};

function subs() {
  if (!g.__landmapPushSubs) g.__landmapPushSubs = new Map();
  return g.__landmapPushSubs;
}

export function savePushSubscription(sub: PushSubscription): number {
  subs().set(sub.endpoint, sub);
  return subs().size;
}

export function listPushSubscriptions(): PushSubscription[] {
  return [...subs().values()];
}

export function getPushStatus(): { configured: boolean; subscribers: number } {
  return { configured: Boolean(process.env.VAPID_PUBLIC_KEY), subscribers: subs().size };
}
