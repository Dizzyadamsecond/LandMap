'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ProductPageShell } from './ProductPageShell';
import { Card, Badge } from '@landmap/ui';

interface Opportunity {
  city: string;
  state: string;
  lat: number;
  lng: number;
  solarScore: number;
  solarGrade: string;
  annualKwhPerKwp: number;
  datacenterScore: number;
  datacenterGrade: string;
  datacentersOsm: number;
  substationsOsm: number;
  solarGeneratorsOsm: number;
  avgTempC: number;
  updatedAt: string | null;
}

interface Overview {
  generatedAt: string;
  cities: number;
  records: number;
  topSolar: Array<{ city: string; state: string; score: number; grade: string }>;
  topDataCenter: Array<{ city: string; state: string; score: number; grade: string }>;
}

function ScoreBar({ value, grade }: { value: number; grade: string }) {
  const tone =
    grade === 'A' ? 'bg-[var(--success)]' :
    grade === 'B' ? 'bg-[var(--primary)]' :
    grade === 'C' ? 'bg-[var(--warning)]' :
    'bg-[var(--destructive)]';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--muted)]">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums">{value}</span>
      <Badge className="px-1.5 py-0 text-[10px]">{grade}</Badge>
    </div>
  );
}

export default function WorldMonitorPage() {
  const t = useTranslations('worldmonitor');
  const [rows, setRows] = useState<Opportunity[] | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t0 = setInterval(() => setTick((x) => x + 1), 30000);
    return () => clearInterval(t0);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [opp, ov] = await Promise.all([
          fetch('/api/worldmonitor/opportunities', { cache: 'no-store' }),
          fetch('/api/worldmonitor/overview', { cache: 'no-store' }),
        ]);
        if (!opp.ok || !ov.ok) throw new Error(`status ${opp.status}/${ov.status}`);
        if (!active) return;
        setRows((await opp.json()) as Opportunity[]);
        setOverview((await ov.json()) as Overview);
        setError(null);
      } catch (e) {
        if (active) setError((e as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, [tick]);

  const sorted = rows ? [...rows].sort((a, b) => (b.solarScore + b.datacenterScore) - (a.solarScore + a.datacenterScore)) : [];

  return (
    <ProductPageShell
      eyebrow={t('eyebrow')}
      title={t('title')}
      description={t('description')}
      maxWidth="7xl"
    >
      {/* Headline metrics */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs text-foreground/60">{t('city')}s</div>
          <div className="mt-1 font-display text-2xl font-bold tabular-nums">
            {overview?.cities ?? '–'}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-foreground/60">Registros</div>
          <div className="mt-1 font-display text-2xl font-bold tabular-nums">
            {overview?.records?.toLocaleString() ?? '–'}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-foreground/60">{t('lastUpdate')}</div>
          <div className="mt-1 font-display text-sm font-bold tabular-nums">
            {overview?.generatedAt
              ? new Date(overview.generatedAt).toLocaleString()
              : '–'}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-foreground/60">PyTorch</div>
          <div className="mt-1 font-display text-sm font-bold">SolarYieldNet ✓</div>
        </Card>
      </div>

      {/* Top lists */}
      {overview && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Card className="p-4">
            <h2 className="text-sm font-semibold">{t('solarTitle')} — Top</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {overview.topSolar.map((s) => (
                <li key={s.city} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{s.city}/{s.state}</span>
                  <ScoreBar value={s.score} grade={s.grade} />
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-4">
            <h2 className="text-sm font-semibold">{t('datacenterTitle')} — Top</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {overview.topDataCenter.map((s) => (
                <li key={s.city} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{s.city}/{s.state}</span>
                  <ScoreBar value={s.score} grade={s.grade} />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* Combined ranking table */}
      <div className="mt-6">
        <h2 className="text-base font-semibold">{t('rankingTitle')}</h2>
        {error && !rows ? (
          <Card className="mt-3 p-6 text-sm text-foreground/60">{t('noData')} ({error})</Card>
        ) : !rows ? (
          <Card className="mt-3 p-6 text-sm text-foreground/60">{t('loading')}</Card>
        ) : (
          <Card className="mt-3 overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-foreground/50">
                    <th className="px-4 py-3">{t('city')}</th>
                    <th className="px-4 py-3">{t('solarScore')}</th>
                    <th className="px-4 py-3">{t('annualYield')}</th>
                    <th className="px-4 py-3">{t('dcScore')}</th>
                    <th className="px-4 py-3">{t('dcOsm')}</th>
                    <th className="px-4 py-3">{t('substations')}</th>
                    <th className="px-4 py-3">{t('avgTemp')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r) => (
                    <tr key={`${r.city}|${r.state}`} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-2.5 font-medium">
                        {r.city} <span className="text-foreground/40">/ {r.state}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <ScoreBar value={r.solarScore} grade={r.solarGrade} />
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-foreground/80">
                        {r.annualKwhPerKwp}
                      </td>
                      <td className="px-4 py-2.5">
                        <ScoreBar value={r.datacenterScore} grade={r.datacenterGrade} />
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">{r.datacentersOsm}</td>
                      <td className="px-4 py-2.5 tabular-nums">{r.substationsOsm}</td>
                      <td className="px-4 py-2.5 tabular-nums">{r.avgTempC}°C</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Sources */}
      <div className="mt-6">
        <h2 className="text-base font-semibold">{t('source')}</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm text-foreground/70">
          <li>• {t('openmeteo')}</li>
          <li>• {t('overpass')}</li>
          <li>• {t('wri')}</li>
          <li>• {t('torch')}</li>
        </ul>
      </div>
    </ProductPageShell>
  );
}
