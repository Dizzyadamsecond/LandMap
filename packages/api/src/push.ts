/**
 * Web Push subscription ledger + sender (LandMap PWA).
 * Em produção, VAPID + `web-push` enviam para os browsers inscritos.
 * Se VAPID_PUBLIC_KEY/PRIVATE_KEY não estiverem setados, geramos um par
 * efêmero em runtime (válido enquanto o processo viver) para que o push
 * funcione em dev/teste sem configuração prévia.
 */
import * as webpush from 'web-push';

export type PushSubscription = {
  endpoint: string;
  keys?: { p256dh?: string; auth?: string };
  createdAt: string;
};

const g = globalThis as unknown as {
  __landmapPushSubs?: Map<string, PushSubscription>;
  __landmapVapid?: { publicKey: string; privateKey: string };
};

function subs() {
  if (!g.__landmapPushSubs) g.__landmapPushSubs = new Map();
  return g.__landmapPushSubs;
}

function ensureVapid() {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:contato@landmap.com.br';
  if (pub && priv) {
    webpush.setVapidDetails(subject, pub, priv);
    return { publicKey: pub, configured: true };
  }
  // Par efêmero (runtime) para dev/teste — push funciona sem segredo prévio.
  if (!g.__landmapVapid) {
    g.__landmapVapid = webpush.generateVAPIDKeys();
  }
  webpush.setVapidDetails(subject, g.__landmapVapid.publicKey, g.__landmapVapid.privateKey);
  return { publicKey: g.__landmapVapid.publicKey, configured: false };
}

export function getVapidPublicKey(): string {
  return ensureVapid().publicKey;
}

export function savePushSubscription(sub: PushSubscription): number {
  subs().set(sub.endpoint, sub);
  return subs().size;
}

export function listPushSubscriptions(): PushSubscription[] {
  return Array.from(subs().values());
}

export function getPushStatus(): { configured: boolean; subscribers: number; vapidPublicKey: string } {
  const v = ensureVapid();
  return { configured: v.configured, subscribers: subs().size, vapidPublicKey: v.publicKey };
}

export type PushPayload = {
  title?: string;
  body: string;
  url?: string;
  tag?: string;
};

/**
 * Envia um push para todos os inscritos. Retorna quantos foram entregues
 * e remove inscrições inválidas (410 Gone / erro de envio).
 */
export async function sendPushToAll(payload: PushPayload): Promise<{ sent: number; removed: number }> {
  ensureVapid();
  const all = listPushSubscriptions();
  let sent = 0;
  let removed = 0;
  await Promise.all(
    all.map(async (sub) => {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.keys?.p256dh ?? '', auth: sub.keys?.auth ?? '' },
      };
      try {
        await webpush.sendNotification(
          pushSub as any,
          JSON.stringify({
            title: payload.title || 'LandMap',
            body: payload.body,
            url: payload.url || '/pt-BR',
            tag: payload.tag || 'landmap',
          }),
        );
        sent += 1;
      } catch (err: any) {
        const status = err?.statusCode ?? err?.status;
        // Inscrição expirada/inválida → remove do ledger.
        if (status === 410 || status === 404 || (status >= 400 && status < 500)) {
          subs().delete(sub.endpoint);
          removed += 1;
        }
      }
    }),
  );
  return { sent, removed };
}
