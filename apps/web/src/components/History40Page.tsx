'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ProductPageShell } from './ProductPageShell';
import { Card, Badge } from '@landmap/ui';
import { useHistory40, seriesPath, type SeriesPoint } from '../lib/history40';

const LABELS: Record<string, string> = {
  cdi: 'CDI',
  ipca: 'IPCA',
  inpc: 'INPC',
  igpm: 'IGP-M',
  igpdi: 'IGP-DI',
  inccdi: 'INCC-DI',
  selic_acum: 'Selic acum.',
  ipca15: 'IPCA-15',
};

const COLORS: Record<string, string> = {
  cdi: 'var(--primary)',
  ipca: 'var(--success)',
  inpc: 'var(--warning)',
  igpm: 'var(--accent)',
  igpdi: 'var(--destructive)',
  inccdi: 'var(--gold-soft, var(--warning))',
  selic_acum: 'var(--primary)',
  ipca15: 'var(--success)',
};

function Spark40({ points, color }: { points: SeriesPoint[]; color: string }) {
  const d = useMemo(() => seriesPath(points, 640, 110), [points]);
  if (!d) return null;
  return (
    <svg viewBox="0 0 640 110" className="h-28 w-full" preserveAspectRatio="none" aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function LiveBadge({ status }: { status: 'connecting' | 'live' | 'fallback' | 'error' }) {
  const map = {
    connecting: { label: '…', cls: 'bg-[var(--warning)]' },
    live: { label: 'LIVE WS', cls: 'bg-[var(--success)]' },
    fallback: { label: 'LIVE SSE', cls: 'bg-[var(--primary)]' },
    error: { label: 'OFF', cls: 'bg-[var(--destructive)]' },
  } as const;
  const m = map[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--card)] border border-[var(--border)] px-2.5 py-1 text-[10px] font-semibold">
      <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${m.cls}`} />
      {m.label}
    </span>
  );
}

export default function History40Page() {
  const t = useTranslations('history40');
  const { snapshot, lastTick, status } = useHistory40();
  const [selected, setSelected] = useState<string>('ipca');

  const seriesKeys = snapshot ? Object.keys(snapshot.series).filter((k) => (snapshot!.series[k]?.length ?? 0) > 10) : [];

  const totalPoints = snapshot?.meta.totalPoints ?? 0;
  const years = snapshot?.meta
    ? `${snapshot.meta.start.slice(3)} → ${snapshot.meta.end.slice(3)}`
    : '…';

  const points = snapshot?.series[selected] ?? [];
  const last = lastTick?.series[selected];
  const color = COLORS[selected] ?? 'var(--primary)';

  return (
    <ProductPageShell
      eyebrow={t('eyebrow')}
      title={t('title')}
      description={t('description')}
      maxWidth="7xl"
    >
      {/* Headline */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs text-foreground/60">{t('years')}</div>
          <div className="mt-1 font-display text-2xl font-bold tabular-nums">{years}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-foreground/60">{t('points')}</div>
          <div className="mt-1 font-display text-2xl font-bold tabular-nums">
            {totalPoints.toLocaleString()}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-foreground/60">{t('series')}</div>
          <div className="mt-1 font-display text-2xl font-bold tabular-nums">{seriesKeys.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-foreground/60">{t('transport')}</div>
          <div className="mt-1">
            <LiveBadge status={status} />
          </div>
        </Card>
      </div>

      {/* Series picker */}
      <div className="mt-6 flex flex-wrap gap-2">
        {seriesKeys.map((k) => (
          <button
            key={k}
            onClick={() => setSelected(k)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              selected === k
                ? 'border-[var(--ring)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            {LABELS[k] ?? k}
          </button>
        ))}
      </div>

      {/* Main chart */}
      <Card className="mt-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">{LABELS[selected] ?? selected} — 40 anos</h2>
          {last && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-[var(--muted-foreground)]">{last.date}</span>
              <span className="font-bold tabular-nums" style={{ color }}>
                {last.value.toFixed(2)}%
              </span>
              {last.changePct !== undefined && (
                <Badge className={last.changePct >= 0 ? 'bg-[var(--success)]/15 text-[var(--success)]' : 'bg-[var(--destructive)]/15 text-[var(--destructive)]'}>
                  {last.changePct >= 0 ? '▲' : '▼'} {Math.abs(last.changePct).toFixed(2)}%
                </Badge>
              )}
            </div>
          )}
        </div>
        <div className="mt-3">
          <Spark40 points={points} color={color} />
        </div>
        <p className="mt-2 text-[11px] text-[var(--muted-foreground)]">
          {t('source')}: {snapshot?.meta.source ?? '…'} · {t('points')}: {points.length.toLocaleString()}
        </p>
      </Card>

      {/* All series mini-grid */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {seriesKeys.slice(0, 8).map((k) => {
          const pts = snapshot!.series[k];
          const lastVal = lastTick?.series[k];
          return (
            <Card key={k} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{LABELS[k] ?? k}</span>
                <span className="text-xs font-bold tabular-nums" style={{ color: COLORS[k] ?? 'var(--primary)' }}>
                  {lastVal ? lastVal.value.toFixed(2) : pts[pts.length - 1]?.value.toFixed(2)}%
                </span>
              </div>
              <div className="mt-2">
                <Spark40 points={pts} color={COLORS[k] ?? 'var(--primary)'} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Latest tick raw */}
      {lastTick && (
        <Card className="mt-6 p-4">
          <div className="text-xs text-[var(--muted-foreground)]">
            {t('lastTick')}: {lastTick.ts}
          </div>
          <pre className="mt-2 max-h-40 overflow-auto text-[11px] text-[var(--muted-foreground)]">
            {JSON.stringify(lastTick.series, null, 1)}
          </pre>
        </Card>
      )}
    </ProductPageShell>
  );
}
