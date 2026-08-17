'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { RequireAuth } from '../../../components/RequireAuth';
import { REGIONS, RegionInsight, scoreToFillColor } from '../../../lib/landmap-regions';
import { Layers } from '../../../components/lovable/icons';

export default function ComparePage() {
  return (
    <RequireAuth>
      <CompareInner />
    </RequireAuth>
  );
}

function CompareInner() {
  const locale = useLocale();
  const searchParams = useSearchParams();

  const initialA = searchParams.get('a') || 'meireles';
  const initialB = searchParams.get('b') || 'aldíota' || (REGIONS[1]?.id ?? '');

  const [aId, setAId] = useState<string>(initialA);
  const [bId, setBId] = useState<string>(initialB);

  useEffect(() => {
    const qA = searchParams.get('a');
    const qB = searchParams.get('b');
    if (qA) setAId(qA);
    if (qB) setBId(qB);
  }, [searchParams]);

  const a = REGIONS.find((r) => r.id === aId) || REGIONS[0];
  const b = REGIONS.find((r) => r.id === bId) || REGIONS[1];

  const chartYears = [2019, 2020, 2021, 2022, 2023, 2024, 2025];

  const maxPrice = Math.max(
    ...(a?.priceHistory.map((p) => p.value) || [1]),
    ...(b?.priceHistory.map((p) => p.value) || [1]),
  );
  const minPrice = Math.min(
    ...(a?.priceHistory.map((p) => p.value) || [0]),
    ...(b?.priceHistory.map((p) => p.value) || [0]),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Comparação</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">
          Comparar duas regiões
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preço por m², score LandMap, infraestrutura, zoneamento e tendência histórica.
        </p>
      </header>

      {/* Selectors */}
      <div className="grid gap-4 rounded-2xl border border-border/60 bg-white p-6 shadow-sm sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
            Região A
          </label>
          <select
            value={aId}
            onChange={(e) => setAId(e.target.value)}
            className="w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.city}/{r.state}) · Score {r.score}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
            Região B
          </label>
          <select
            value={bId}
            onChange={(e) => setBId(e.target.value)}
            className="w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.city}/{r.state}) · Score {r.score}
              </option>
            ))}
          </select>
        </div>
      </div>

      {a && b ? (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <RegionCard region={a} color="#003594" />
            <RegionCard region={b} color="#3b82f6" />
          </div>

          {/* Historic Trend Chart */}
          <div className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">
                  Tendência histórica de preço por m²
                </h2>
                <p className="text-xs text-muted-foreground">Evolução do m² entre 2019 e 2025</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#003594]" />
                  <span>{a.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#3b82f6]" />
                  <span>{b.name}</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full pt-4">
              <DualSparkline
                dataA={a.priceHistory.map((p) => p.value)}
                dataB={b.priceHistory.map((p) => p.value)}
                labels={chartYears.map(String)}
                min={minPrice}
                max={maxPrice}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-border/60 bg-white p-12 text-center text-muted-foreground">
          Selecione duas regiões para começar a comparação.
        </div>
      )}
    </div>
  );
}

function RegionCard({ region, color }: { region: RegionInsight; color: string }) {
  const infraScore = region.layerScores.infrastructure;
  return (
    <div className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {region.city} · {region.state}
          </span>
          <h3 className="font-display text-2xl font-bold text-foreground">{region.name}</h3>
        </div>
        <div
          className="grid h-10 w-10 place-items-center rounded-xl text-white font-bold text-sm shadow-sm"
          style={{ backgroundColor: scoreToFillColor(region.score) }}
        >
          {region.score}
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <Row
          label="Preço por m²"
          value={`R$ ${region.priceSqm.toLocaleString('pt-BR')}`}
          accent
        />
        <Row
          label="Variação 12m"
          value={`+${region.priceSqmDelta12m.toFixed(1)}%`}
        />
        <Row
          label="Liquidez"
          value={region.liquidity.toUpperCase()}
        />
        <Row
          label="Zoneamento"
          value={region.zoning}
        />
        <Row
          label="Renda média"
          value={`R$ ${region.incomeAvg.toLocaleString('pt-BR')}`}
        />

        <div className="pt-2">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Infraestrutura</span>
            <span className="font-semibold">{infraScore}/100</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${infraScore}%`, backgroundColor: scoreToFillColor(infraScore) }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 pb-2 text-xs last:border-none last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ? 'text-base font-bold text-primary' : 'font-semibold text-foreground'}>
        {value}
      </span>
    </div>
  );
}

function DualSparkline({
  dataA,
  dataB,
  labels,
  min,
  max,
}: {
  dataA: number[];
  dataB: number[];
  labels: string[];
  min: number;
  max: number;
}) {
  const w = 800;
  const h = 200;
  const pad = 24;
  const range = max - min || 1;

  const pointsA = dataA.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / (dataA.length - 1);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return [x, y] as const;
  });

  const pointsB = dataB.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / (dataB.length - 1);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return [x, y] as const;
  });

  const pathA = pointsA.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const pathB = pointsB.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  return (
    <div className="h-full w-full flex flex-col justify-between">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-44 w-full overflow-visible">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
          const y = h - pad - r * (h - pad * 2);
          return (
            <line
              key={idx}
              x1={pad}
              y1={y}
              x2={w - pad}
              y2={y}
              stroke="var(--border)"
              strokeDasharray="4 4"
              strokeOpacity="0.6"
            />
          );
        })}

        {/* Path A */}
        <path
          d={pathA}
          fill="none"
          stroke="#003594"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pointsA.map(([x, y], i) => (
          <circle key={`a-${i}`} cx={x} cy={y} r={4} fill="#003594" stroke="#ffffff" strokeWidth="2" />
        ))}

        {/* Path B */}
        <path
          d={pathB}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pointsB.map(([x, y], i) => (
          <circle key={`b-${i}`} cx={x} cy={y} r={4} fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
        ))}
      </svg>

      <div className="flex justify-between px-6 text-[11px] font-medium text-muted-foreground">
        {labels.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}
