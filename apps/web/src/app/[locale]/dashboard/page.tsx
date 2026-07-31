'use client';

/**
 * Dashboard = atalho para o Mapa Intelligence (paridade Lovable:
 * a superfície "Mapa — LandMap" é o mapa full-bleed em /map).
 * Mantém overview KPI + CTA para o mapa.
 *
 * Integração de mercado: consome /api/opportunities (lib/opportunities.ts)
 * — dados vivos do dataset (properties.json), não constantes estáticas.
 */

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { RequireAuth } from '../../../components/RequireAuth';
import {
  LandMapWordmark,
  TrendingUp,
  MapPin,
  Activity,
  ArrowLeft,
  Layers,
  BellRing,
  GitCompare,
  FileText,
} from '../../../components/lovable/icons';
import { Card, Badge, Stat, Sparkline, buttonVariants, cn } from '@landmap/ui';
import {
  getOpportunities,
  type Opportunity,
  type KpiSnapshot,
} from '../../../lib/api';

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

function DashboardInner() {
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
  const spark = useMemo(
    () => Array.from({ length: 7 }, (_, i) => Math.round(avgPrice * (0.72 + i * 0.045))),
    [avgPrice],
  );
  const topVal = useMemo(
    () =>
      [...opportunities]
        .filter((o) => o.type === 'valorizacao_yoy')
        .sort((a, b) => (b.deltaPct ?? 0) - (a.deltaPct ?? 0))
        .slice(0, 3),
    [opportunities],
  );
  const topOpp = useMemo(
    () => [...opportunities].sort((a, b) => b.score - a.score).slice(0, 3),
    [opportunities],
  );
  const hottest = kpis?.topCities[0]?.city ?? '—';
  const score = kpis?.confidence ?? '—';
  const hubLinks = [
    { href: lh('/map'), icon: Layers, title: 'Mapa', desc: 'Camadas, heatmap e score ao vivo' },
    { href: lh('/compare'), icon: GitCompare, title: 'Comparador', desc: 'Regiões lado a lado' },
    { href: lh('/alerts'), icon: BellRing, title: 'Alertas', desc: 'Gatilhos e riscos' },
    { href: lh('/reports'), icon: FileText, title: 'Relatórios', desc: 'Dossiês e PDFs' },
  ];

  return (
    <main className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Link href={lh('/')} aria-label="Início" className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <LandMapWordmark />
            <span className="hidden text-sm text-muted-foreground sm:inline">Painel</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 shadow-sm backdrop-blur md:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-success">
                Mercado vivo
              </span>
            </div>
            <Link href={lh('/map')} className={cn(buttonVariants({ size: 'sm' }), 'min-h-9')}>
              <Layers className="mr-1.5 h-3.5 w-3.5" />
              Abrir mapa
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="space-y-3 self-start">
          <div className="rounded-3xl border border-border/50 bg-white/95 p-4 shadow-sm backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/50">
              Hub LandMap
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold">Visão geral do mercado</h1>
            <p className="mt-2 text-xs text-muted-foreground">
              Abra o mapa para ver camadas, score e heatmap ao vivo por bairro.
            </p>
          </div>

          <div className="rounded-3xl border border-border/50 bg-white/95 p-4 shadow-sm backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/50">
              Navegação
            </p>
            <div className="mt-3 space-y-2">
              {hubLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-start gap-3 rounded-2xl border border-border/50 bg-background/70 p-3 transition hover:border-primary/30 hover:bg-primary/5"
                  >
                    <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">{item.title}</span>
                      <span className="mt-0.5 block text-xs leading-snug text-foreground/55">
                        {item.desc}
                      </span>
                    </span>
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
              <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Preço médio m²" value={loading || !kpis ? '—' : fmtBRL(avgPrice)} />
                <Stat label="Cidades" value={loading || !kpis ? '—' : String(kpis.topCities.length)} />
                <Stat label="Mais aquecida" value={hottest} />
                <Stat label="Score LandMap" value={loading || !kpis ? '—' : String(score)} />
              </section>

              <Card className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold">Fluxo do índice</h2>
                  <Badge variant="outline">Últimos 7 anos</Badge>
                </div>
                <Sparkline data={spark} width={320} height={56} />
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="p-4">
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    Top valorização (12m)
                  </h2>
                  <ul className="space-y-2">
                    {loading ? (
                      <li className="text-sm text-muted-foreground">Carregando…</li>
                    ) : topVal.length === 0 ? (
                      <li className="text-sm text-muted-foreground">Sem dados de valorização.</li>
                    ) : (
                      topVal.map((o) => (
                        <li key={o.id} className="flex justify-between text-sm">
                          <span>{o.city}</span>
                          <span className="font-medium text-primary">{fmtPct(o.deltaPct ?? 0)}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </Card>
                <Card className="p-4">
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    Top oportunidades
                  </h2>
                  <ul className="space-y-2">
                    {loading ? (
                      <li className="text-sm text-muted-foreground">Carregando…</li>
                    ) : topOpp.length === 0 ? (
                      <li className="text-sm text-muted-foreground">Sem oportunidades.</li>
                    ) : (
                      topOpp.map((o) => (
                        <li key={o.id} className="flex justify-between text-sm">
                          <span>{o.neighborhood || o.city}</span>
                          <Badge variant="outline">{o.score}</Badge>
                        </li>
                      ))
                    )}
                  </ul>
                </Card>
              </div>
            </>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href={lh('/map')} className={cn(buttonVariants({ size: 'lg' }))}>
              Abrir mapa
            </Link>
            <Link href={lh('/plans')} className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
              Planos
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardInner />
    </RequireAuth>
  );
}
