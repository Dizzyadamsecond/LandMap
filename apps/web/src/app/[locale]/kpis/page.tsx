'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { RequireAuth } from '../../../components/RequireAuth';
import { Reveal } from '../../../components/Motion';
import { MetricStat, Badge, Skeleton } from '@landmap/ui';
import {
  getOpportunities,
  type Opportunity,
  type KpiSnapshot,
  type OpportunitySeverity,
} from '../../../lib/api';
import { type Aggregates } from '../../../lib/opportunities';
import {
  OPPORTUNITY_TYPE_LABEL,
  opportunitySeverityColor,
} from '../../../lib/opportunities';

function fmtBRL(n: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtPct(n: number): string {
  return `${n > 0 ? '+' : ''}${n.toFixed(1)}%`;
}

function severityVariant(sev: OpportunitySeverity): 'default' | 'warning' | 'destructive' {
  switch (sev) {
    case 'alta':
      return 'destructive';
    case 'media':
      return 'warning';
    default:
      return 'default';
  }
}

/** Collapsible KPI section — permite minimizar/mostrar os cards (pedido: "minimizar os outros KPIs"). */
function KpiSection({
  id,
  title,
  collapsed,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  collapsed: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4">
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={!collapsed}
        className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-left transition hover:border-[var(--primary)]/40"
      >
        <span className="text-sm font-semibold text-[var(--foreground)]">{title}</span>
        <span
          className="text-[var(--muted-foreground)] transition-transform duration-200"
          style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
          aria-hidden
        >
          ▾
        </span>
      </button>
      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{
          gridTemplateRows: collapsed ? '0fr' : '1fr',
          opacity: collapsed ? 0 : 1,
          marginTop: collapsed ? 0 : 12,
        }}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </section>
  );
}

function KpisPageInner() {
  const locale = useLocale();
  const lh = (p: string) => `/${locale}${p}`;
  const t = useTranslations('kpis');

  const [kpis, setKpis] = useState<KpiSnapshot | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aggregates, setAggregates] = useState<Aggregates | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    macro: false,
    market: false,
    cities: false,
  });
  const toggleSection = (id: string) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getOpportunities()
      .then((data) => {
        if (!active) return;
        setKpis(data.kpis);
        setOpportunities(data.opportunities ?? []);
        setAggregates((data as unknown as { aggregates?: Aggregates }).aggregates ?? null);
      })
      .catch((e) => {
        if (active) setError((e as Error)?.message || t('loadError'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [t]);

  // Auto-refresh Brazil macro/aggregates every 60s.
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;
    const refresh = async () => {
      try {
        const res = await fetch('/api/market/aggregates', { headers: { accept: 'application/json' } });
        if (!res.ok) return;
        const data = (await res.json()) as { aggregates?: Aggregates };
        if (active) setAggregates(data.aggregates ?? null);
      } catch {
        // silent background refresh
      }
    };
    refresh();
    timer = setInterval(refresh, 60_000);
    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, []);

  const topCities = useMemo(() => kpis?.topCities ?? [], [kpis]);

  return (
    <main className="relative min-h-screen text-[var(--foreground)]">
      <div className="pointer-events-none fixed bottom-4 left-4 z-[999] md:bottom-6 md:left-6">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-[var(--border)]/40 bg-[var(--card)]/90 px-3 py-1.5 shadow-sm backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
          <span className="font-display text-xs font-bold tracking-tight text-[var(--primary)]">
            LandMap
          </span>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <Reveal>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[var(--primary)]">{t('eyebrow')}</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
                {t('title')}
              </h1>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">{t('subtitle')}</p>
            </div>
            <Link
              href={lh('/map')}
              className="btn btn-ghost !px-3 !py-1.5 !text-xs"
            >
              {t('viewMap')}
            </Link>
          </div>
        </Reveal>

        {error ? (
          <Reveal className="mt-6">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-10 text-center">
              <p className="text-sm font-medium text-[var(--foreground)]">{t('loadError')}</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{error}</p>
            </div>
          </Reveal>
        ) : (
          <>
            <Reveal delay={0.1} className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricStat
                  label={t('totalProperties')}
                  value={loading || !kpis ? '—' : kpis.total.toLocaleString('pt-BR')}
                  hint={t('catalogHint')}
                  tone="neutral"
                />
                <MetricStat
                  label={t('avgPricePerM2')}
                  value={loading || !kpis ? '—' : fmtBRL(kpis.avgPricePerSqm)}
                  hint={aggregates ? `Liquidez ${aggregates.liquidityScore}` : t('medianHint')}
                  tone="primary"
                />
                <MetricStat
                  label={t('appreciationYoy')}
                  value={loading || !kpis ? '—' : fmtPct(kpis.avgAppreciationYoy)}
                  thresholds={[{ min: 0, tone: 'primary' }]}
                  numeric={kpis?.avgAppreciationYoy}
                  tone="primary"
                />
                <MetricStat
                  label={t('confidence')}
                  value={loading || !kpis ? '—' : `${kpis.confidence}%`}
                  numeric={kpis?.confidence}
                  thresholds={[
                    { min: 85, tone: 'primary' },
                    { min: 70, tone: 'primary' },
                    { min: 0, tone: 'warning' },
                  ]}
                  hint={t('confidenceHint')}
                />
              </div>
            </Reveal>

            <Reveal delay={0.15} className="mt-6">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                      {t('globalCoverage') ?? 'Cobertura global'}
                    </p>
                    <p className="mt-1 text-sm text-[var(--foreground)]">
                      {(loading || !kpis)
                        ? '—'
                        : `${kpis.total.toLocaleString('pt-BR')} imóveis · ${topCities.length} cidades no ranking`}
                    </p>
                  </div>
                  <Link
                    href={lh('/map')}
                    className="btn btn-ghost !px-3 !py-1.5 !text-xs"
                  >
                    {t('viewMap')}
                  </Link>
                </div>
                {topCities.length > 0 && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {topCities.slice(0, 6).map((c, i) => (
                      <div
                        key={`${c.city}-${c.state}`}
                        className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[var(--foreground)]">
                            <span className="mr-1 text-[var(--muted-foreground)]">#{i + 1}</span>
                            {c.city}/{c.state}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {c.count.toLocaleString('pt-BR')} imóveis
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-[var(--primary)]">
                          {fmtBRL(c.avgPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>

            <KpiSection id="macro" title={t('macroSection')} collapsed={!!collapsed.macro} onToggle={toggleSection}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricStat
                  label="Cidades"
                  value={loading || !aggregates ? '—' : String(aggregates.totalCities)}
                  tone="success"
                />
                <MetricStat
                  label="IPCA"
                  value={aggregates?.macro?.ipca ? `${aggregates.macro.ipca.value.toFixed(2)}%` : '—'}
                  hint={aggregates?.macro?.ipca ? aggregates.macro.ipca.date : t('catalogHint')}
                  tone="success"
                />
                <MetricStat
                  label="Selic"
                  value={aggregates?.macro?.selic ? `${aggregates.macro.selic.value.toFixed(2)}%` : '—'}
                  hint={aggregates?.macro?.selic ? aggregates.macro.selic.date : ''}
                  tone="success"
                />
                <MetricStat
                  label="USD"
                  value={aggregates?.macro?.fx ? fmtBRL(aggregates.macro.fx.value) : '—'}
                  hint={aggregates?.macro?.fx ? aggregates.macro.fx.date : ''}
                  tone="success"
                />
              </div>
            </KpiSection>

            <KpiSection id="market" title={t('marketSection')} collapsed={!!collapsed.market} onToggle={toggleSection}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricStat
                  label={t('availabilityRate')}
                  value={loading || !kpis ? '—' : `${kpis.availabilityRate}%`}
                  tone="success"
                />
                <MetricStat
                  label={t('avgPrice')}
                  value={loading || !kpis ? '—' : fmtBRL(kpis.avgPrice)}
                  tone="success"
                />
                <MetricStat
                  label={t('medianPricePerM2')}
                  value={loading || !kpis ? '—' : fmtBRL(kpis.medianPricePerSqm)}
                  tone="success"
                />
                <MetricStat
                  label={t('opportunities')}
                  value={loading ? '—' : opportunities.length.toLocaleString('pt-BR')}
                  hint={t('opportunitiesHint')}
                  tone="success"
                />
              </div>
            </KpiSection>

            <Reveal delay={0.2} className="mt-10">
              <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
                {t('topCities')}
              </h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-24" />
                    ))
                  : topCities.slice(0, 8).map((c) => (
                      <MetricStat
                        key={`${c.city}-${c.state}`}
                        label={`${c.city}, ${c.state}`}
                        value={fmtBRL(c.avgPrice)}
                        hint={`${c.count} ${t('units')}`}
                        tone="neutral"
                      />
                    ))}
              </div>
            </Reveal>

            <Reveal delay={0.25} className="mt-10">
              <div className="flex items-end justify-between gap-4">
                <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
                  {t('opportunitiesTitle')}
                </h2>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {loading ? '' : `${opportunities.length} ${t('alerts')}`}
                </span>
              </div>

              <div className="mt-3 space-y-3">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-20" />
                  ))
                ) : opportunities.length === 0 ? (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-10 text-center">
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {t('noOpportunities')}
                    </p>
                  </div>
                ) : (
                  opportunities.map((o) => (
                    <div
                      key={o.id}
                      className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--primary)]/50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={severityVariant(o.severity)}>
                            {t(`severity.${o.severity}`)}
                          </Badge>
                          <span className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                            {OPPORTUNITY_TYPE_LABEL[o.type]}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                          {o.title}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                          {o.description}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end">
                        <div className="text-right">
                          <p
                            className="font-display text-xl font-bold tabular-nums"
                            style={{ color: opportunitySeverityColor(o.severity) }}
                          >
                            {o.score}
                          </p>
                          <p className="text-[11px] text-[var(--muted-foreground)]">
                            {t('score')}
                          </p>
                        </div>
                        {o.deltaPct !== undefined && o.type === 'preco_abaixo_media' && (
                          <span className="rounded-full bg-[var(--primary)]/10 px-2 py-1 text-[11px] font-medium text-[var(--primary)]">
                            {fmtPct(o.deltaPct)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Reveal>
          </>
        )}
      </section>
    </main>
  );
}

export default function KpisPage() {
  return (
    <RequireAuth>
      <KpisPageInner />
    </RequireAuth>
  );
}
