// apps/web/src/lib/useLandOpportunities.ts
// Hook client-side que consome o SSE /api/live/land-stream e expõe o ranking
// nacional de oportunidade de terreno em tempo real (recompilado a cada tick).
'use client';

import { useEffect, useRef, useState } from 'react';

export interface LandOpportunityLive {
  id: number;
  municipio: string;
  uf: string;
  regiao: string;
  lat: number;
  lng: number;
  score: number;
  grade: string;
  pricePerM2: number;
  reasons: string[];
  subscores: {
    valor: number;
    crescimento: number;
    financiamento: number;
    liquidez: number;
    risco: number;
  };
}

export interface LandSnapshotLive {
  generatedAt: string;
  live: boolean;
  coverage: { municipios: number; ufs: number; regioes: number };
  macro: { selic: number; ipca: number; usdBrl?: number };
  top: LandOpportunityLive[];
}

export function useLandOpportunities() {
  const [snapshot, setSnapshot] = useState<LandSnapshotLive | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const es = new EventSource('/api/live/land-stream');
    esRef.current = es;

    es.addEventListener('snapshot', (e) => {
      try {
        setSnapshot(JSON.parse((e as MessageEvent).data));
        setConnected(true);
        setError(null);
      } catch {
        /* ignore malformed */
      }
    });

    es.addEventListener('error', () => {
      setConnected(false);
      setError('Conexão ao vivo interrompida. Reconectando…');
    });

    return () => {
      es.close();
      esRef.current = null;
    };
  }, []);

  return { snapshot, connected, error };
}
