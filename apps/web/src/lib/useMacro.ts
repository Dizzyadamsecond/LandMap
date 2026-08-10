'use client';

import { useEffect, useState } from 'react';

export type MacroIndicators = {
  ipca: { value: number; date: string };
  selic: { value: number; date: string };
  cdi: { value: number; date: string };
  usd: { value: number; varPct: number; date: string };
};

export type MacroState = {
  loading: boolean;
  live: boolean;
  indicators: MacroIndicators | null;
  error?: string;
};

/**
 * Live macro indicators (IPCA / Selic / CDI / USD-BRL) from /api/macro.
 * Polls every `intervalMs` (default 60s). Falls back to the last known
 * payload if a refresh fails, so the UI never flashes an error.
 */
export function useMacro(intervalMs = 60_000): MacroState {
  const [state, setState] = useState<MacroState>({ loading: true, live: false, indicators: null });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch('/api/macro', { cache: 'no-store' });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        if (!alive) return;
        setState((prev) => ({
          loading: false,
          live: !!data.live,
          indicators: data.indicators as MacroIndicators,
          error: prev.error,
        }));
      } catch (e) {
        if (!alive) return;
        setState((prev) => ({
          loading: false,
          live: prev.live,
          indicators: prev.indicators,
          error: e instanceof Error ? e.message : 'network',
        }));
      }
    };
    load();
    const t = setInterval(load, intervalMs);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [intervalMs]);

  return state;
}
