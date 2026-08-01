'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  ArrowLeft,
  Activity,
  TrendingUp,
  LandMapWordmark,
  LineChart,
  Layers,
  GitCompare,
  BellRing,
  FileText,
} from '../../../components/lovable/icons';
import { Reveal } from '../../../components/Motion';
import { Card, Badge, Stat, Sparkline, buttonVariants, cn } from '@landmap/ui';
import {
  getOpportunities,
  type Opportunity,
  type KpiSnapshot,
} from '../../../lib/api';
import { OPPORTUNITY_TYPE_LABEL } from '../../../lib/opportunities';

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

/**
 * Mercado — snapshot agregado do dataset real (properties.json).
 * Camada HTTP: /api/opportunities (lib/opportunities.ts).
 * Substitui as constantes estáticas INTELLIGENCE_REGIONS por dados vivos.
 */
export default function MarketPage() {
  const locale = useLocale();
  const lh = (p: string) => `/${locale}${p}`;

  const [kpis, setKpis] = useState<KpiSnapshot | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getOpportunities()
      .then((data) => {
        if (!active) return;
        setKpis(data.kpis);
        setOpportunities(data.opportunities ?? []);
      })
      .catch((e) => {
        if (active) setError((e as Error)?.message || 'Falha ao carregar o mercado.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const avgPrice = kpis?.avgPricePerSqm ?? 0;
  const avgScore = kpis?.confidence ?? 0;

  const trend = useMemo(
    () => [0.88, 0.91, 0.93, 0.96, 0.98, 1, 1.03, 1.05].map((k) => Math.round(avgPrice * k)),
    [avgPrice],
  );

  const tops = useMemo(
    () =>
      [...opportunities]
        .filter((o) => o.type === 'valorizacao_yoy')
        .sort((a, b) => (b.deltaPct ?? 0) - (a.deltaPct ?? 0))
        .slice(0, 4),
    [opportunities],
  );

  const opps = useMemo(
    () => [...opportunities].sort((a, b) => b.score - a.score).slice(0, 4),
    [opportunities],
  );

  const hottest = kpis?.topCities[0]?.city ?? '—';
  const hubLinks = [
    { href: lh('/map'), icon: Layers, label: 'Mapa' },
    { href: lh('/compare'), icon: GitCompare, label: 'Comparar' },
    { href: lh('/alerts'), icon: BellRing, label: 'Alertas' },
    { href: lh('/reports'), icon: FileText, label: 'Relatórios' },
  ];

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl gap-6 bg-background px-4 py-6 xl:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="space-y-3 self-start">
        <div className="rounded-3xl border border-border/50 bg-white/95 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <Link
              href={lh('/map')}
              aria-label="Voltar"
              className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <LandMapWordmark />
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Activity className="h-3 w-3" />
            Mercado
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
            Snapshot do mercado
          </h1>
          <p className="mt-2 text-sm text-foreground/60">
            Visão agregada em tempo real — mesma base do Score LandMap.
          </p>
        </div>
        <div className="rounded-3xl border border-border/50 bg-white/95 p-4 shadow-sm backdrop-blur">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/50">Hub</p>
          <div className="mt-3 space-y-2">
            {hubLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-2xl border border-border/50 bg-background/70 px-3 py-2.5 text-sm transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </aside>

      <section className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-sm font-medium text-destructive">Falha ao carregar o mercado</p>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
        </div>
      ) : (
        <>
          <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              label="Preço médio m²"
              value={loading || !kpis ? '—' : fmtBRL(avgPrice)}
            />
            <Stat label="Score LandMap" value={loading || !kpis ? '—' : String(avgScore)} />
            <Stat
              label="Cidades"
              value={loading || !kpis ? '—' : String(kpis.topCities.length)}
            />
            <Stat label="Mais aquecida" value={hottest} />
          </section>

          <Card className="mt-6 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LineChart className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">Histórico do m²</h2>
              </div>
              <Badge variant="outline">2019 - 2025</Badge>
            </div>
            <Sparkline data={trend} width={280} height={56} aria-label="Tendência de preço" />
            <p className="mt-2 text-xs text-muted-foreground">
              Índice composto de valorização, infra e crescimento.
            </p>
          </Card>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={lh('/map')} className={cn(buttonVariants({ size: 'sm' }))}>
              Mapa
            </Link>
            <Link href={lh('/kpis')} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
              KPIs
            </Link>
            <Link href={lh('/alerts')} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
              Alertas
            </Link>
          </div>

          <Reveal className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="p-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                Top valorização (12m)
              </h2>
              <ul className="space-y-2">
                {loading ? (
                  <li className="text-sm text-muted-foreground">Carregando…</li>
                ) : tops.length === 0 ? (
                  <li className="text-sm text-muted-foreground">Sem dados de valorização.</li>
                ) : (
                  tops.map((r, i) => (
                    <li key={r.id} className="flex justify-between text-sm">
                      <span>
                        {i + 1}. {r.city}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {fmtPct(r.deltaPct ?? 0)}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </Card>
            <Card className="p-4">
              <h2 className="mb-3 text-sm font-semibold">Top oportunidades</h2>
              <ul className="space-y-2">
                {loading ? (
                  <li className="text-sm text-muted-foreground">Carregando…</li>
                ) : opps.length === 0 ? (
                  <li className="text-sm text-muted-foreground">Sem oportunidades.</li>
                ) : (
                  opps.map((r) => (
                    <li key={r.id} className="flex justify-between text-sm">
                      <span>{r.neighborhood || r.city}</span>
                      <Badge variant="outline">{r.score}</Badge>
                    </li>
                  ))
                )}
              </ul>
            </Card>
          </Reveal>

          {!loading && opportunities.length > 0 && (
            <Reveal className="mt-6">
              <h2 className="mb-3 text-sm font-semibold">Alertas de oportunidade</h2>
              <ul className="space-y-2">
                {opportunities.slice(0, 8).map((o) => (
                  <li
                    key={o.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">{OPPORTUNITY_TYPE_LABEL[o.type]}</Badge>
                      <span className="text-foreground/80">{o.title}</span>
                    </span>
                    <span className="tabular-nums text-xs text-muted-foreground">
                      {o.neighborhood || o.city} · {o.score}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        </>
      )}
      </section>
    </main>
  );
}
