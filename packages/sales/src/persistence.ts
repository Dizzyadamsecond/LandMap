import type { Subscription } from './types.js';

/**
 * Durable persistence for the autonomous sales engine.
 *
 * Goal: reach 1.000 assinaturas sem perder o progresso quando a função
 * serverless reinicia (cold start zera o store em memória).
 *
 * Backend: Vercel KV via REST (sem dependência extra). Se as env vars
 * KV_REST_API_URL / KV_REST_API_TOKEN não estiverem setadas, degrada para
 * no-op (funciona só em memória, dentro da mesma instância quente).
 */

const KEY = 'landmap:sales';

export const SALES_CAP = 1000;

export interface PersistedSales {
  subscriptions: Subscription[];
  totalSales: number;
  firstSaleAt: string | null;
  firstSaleNotified: boolean;
  updatedAt: string;
}

function kvEnv(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

async function kvGet(key: string): Promise<string | null> {
  const env = kvEnv();
  if (!env) return null;
  try {
    const res = await fetch(`${env.url}/get/${encodeURIComponent(key)}`, {
      headers: authHeader(env.token),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: string | null };
    return data.result ?? null;
  } catch {
    return null;
  }
}

async function kvSet(key: string, value: string): Promise<boolean> {
  const env = kvEnv();
  if (!env) return false;
  try {
    const res = await fetch(`${env.url}/set/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { ...authHeader(env.token), 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function emptyPersisted(): PersistedSales {
  return {
    subscriptions: [],
    totalSales: 0,
    firstSaleAt: null,
    firstSaleNotified: false,
    updatedAt: new Date().toISOString(),
  };
}

export async function loadSales(): Promise<PersistedSales | null> {
  const raw = await kvGet(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedSales>;
    return {
      subscriptions: Array.isArray(parsed.subscriptions) ? (parsed.subscriptions as Subscription[]) : [],
      totalSales: parsed.totalSales ?? 0,
      firstSaleAt: parsed.firstSaleAt ?? null,
      firstSaleNotified: parsed.firstSaleNotified ?? false,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function saveSales(snapshot: PersistedSales): Promise<boolean> {
  snapshot.updatedAt = new Date().toISOString();
  return kvSet(KEY, JSON.stringify(snapshot));
}

/** Rehidrata o store a partir do KV (mantém o progresso entre cold starts). */
export async function hydrateStore(subscriptions: Subscription[]): Promise<Subscription[]> {
  const snap = await loadSales();
  if (snap && Array.isArray(snap.subscriptions) && snap.subscriptions.length > 0) {
    return snap.subscriptions;
  }
  return subscriptions;
}

export async function persistFrom(
  subscriptions: Subscription[],
  opts?: { firstSaleAt?: string | null; firstSaleNotified?: boolean },
): Promise<PersistedSales> {
  const snap: PersistedSales = {
    subscriptions,
    totalSales: subscriptions.length,
    firstSaleAt: opts?.firstSaleAt ?? (subscriptions.length > 0 ? new Date().toISOString() : null),
    firstSaleNotified: opts?.firstSaleNotified ?? false,
    updatedAt: new Date().toISOString(),
  };
  await saveSales(snap);
  return snap;
}
