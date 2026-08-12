'use client';

import { useEffect, useRef, useState } from 'react';

export interface SeriesPoint {
  date: string;
  value: number;
}

export interface History40Snapshot {
  type: 'history40.snapshot';
  series: Record<string, SeriesPoint[]>;
  meta: { source: string; start: string; end: string; totalPoints: number; seriesCount: number };
  generatedAt: string;
}

export interface History40Tick {
  type: 'history40.tick';
  series: Record<string, { value: number; date: string; changePct?: number }>;
  ts: string;
}

export type History40Message = History40Snapshot | History40Tick;

export type RealtimeStatus = 'connecting' | 'live' | 'fallback' | 'error';

/**
 * Real-time 40y macro feed.
 *
 * Transport strategy (auto):
 *   1. WebSocket nativo ws://<api>/ws/history40 — usado quando @landmap/api
 *      roda como servidor Node (dev:api) e o endpoint responde.
 *   2. Fallback SSE /api/history40/stream — funciona em qualquer runtime
 *      (Vercel incluído) com os MESMOS payloads.
 */
export function useHistory40() {
  const [snapshot, setSnapshot] = useState<History40Snapshot | null>(null);
  const [lastTick, setLastTick] = useState<History40Tick | null>(null);
  const [status, setStatus] = useState<RealtimeStatus>('connecting');
  const esRef = useRef<EventSource | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let disposed = false;

    const applyMessage = (raw: string) => {
      if (disposed) return;
      try {
        const msg = JSON.parse(raw) as History40Message;
        if (msg.type === 'history40.snapshot') setSnapshot(msg);
        else if (msg.type === 'history40.tick') setLastTick(msg);
      } catch {
        /* ignore malformed frames */
      }
    };

    // 1) WebSocket nativo (dev com @landmap/api)
    const tryWebSocket = (): boolean => {
      if (typeof WebSocket === 'undefined') return false;
      const proto = typeof location !== 'undefined' && location.protocol === 'https:' ? 'wss' : 'ws';
      const host = typeof location !== 'undefined' ? location.host : 'localhost:3000';
      try {
        const ws = new WebSocket(`${proto}://${host}/ws/history40`);
        wsRef.current = ws;
        ws.onopen = () => {
          if (disposed) return;
          // O snapshot chega pelo WS; status live
          setStatus('live');
        };
        ws.onmessage = (e) => {
          if (typeof e.data === 'string') applyMessage(e.data);
        };
        ws.onerror = () => {
          // não conseguiu (ex.: Vercel) → cai para SSE
          if (!disposed) setStatus('fallback');
          try {
            ws.close();
          } catch {
            /* noop */
          }
        };
        ws.onclose = () => {
          if (!disposed && wsRef.current === ws) setStatus('fallback');
        };
        return true;
      } catch {
        return false;
      }
    };

    // 2) SSE fallback
    const openSse = () => {
      const es = new EventSource('/api/history40/stream');
      esRef.current = es;
      es.addEventListener('snapshot', (e) => applyMessage((e as MessageEvent).data));
      es.addEventListener('tick', (e) => applyMessage((e as MessageEvent).data));
      es.onopen = () => {
        if (!disposed) setStatus('fallback');
      };
      es.onerror = () => {
        if (!disposed) setStatus('error');
      };
    };

    if (!tryWebSocket()) openSse();
    // Se o WS não mandar snapshot em ~2.5s, assume indisponível e abre SSE
    const timeout = setTimeout(() => {
      if (!disposed && !snapshot && wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          /* noop */
        }
        openSse();
      }
    }, 2500);

    return () => {
      disposed = true;
      clearTimeout(timeout);
      try {
        esRef.current?.close();
      } catch {
        /* noop */
      }
      try {
        wsRef.current?.close();
      } catch {
        /* noop */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { snapshot, lastTick, status };
}

/** Serializa (date,value) num path SVG 0..w x 0..h. */
export function seriesPath(points: SeriesPoint[], w = 600, h = 120): string {
  if (!points.length) return '';
  const vals = points.map((p) => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const step = w / Math.max(1, points.length - 1);
  return points
    .map((p, i) => {
      const x = i * step;
      const y = h - ((p.value - min) / span) * (h - 6) - 3;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}
