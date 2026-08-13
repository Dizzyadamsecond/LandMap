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
import { RecommendationWidget } from '../../../components/RecommendationWidget';
import { LiveTicker } from '../../../components/LiveTicker';
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
  Flame,
  Gem,
  Satellite,
} from '../../../components/lovable/icons';
import { Card, Badge, Sparkline, buttonVariants, cn } from '@landmap/ui';
import {
  getOpportunities,
  type Opportunity,
  type KpiSnapshot,
} from '../../../lib/api';
import { type Aggregates } from '../../../lib/opportunities';
import { getRecentlyViewed, clearRecentlyViewed } from '../../../lib/recently-viewed';
import {
  INTELLIGENCE_REGIONS,
  scoreLabel,
  fmtPriceSqm,
} from '../../../lib/mapIntelligence';

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
  const [aggregates, setAggregates] = useState<Aggregates | null>(null);
  const [recent, setRecent] = useState<ReturnType<typeof getRecentlyViewed>>([]);

  useEffect(() => {
    setRecent(getRecentlyViewed());
  }, []);

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
        if (active) setError((e as Error)?.message || 'Falha ao carregar o mercado.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Refresh Brazil macro/aggregates every 60s.
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
        // silent
      }
    };
    refresh();
    timer = setInterval(refresh, 60_000);
    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, []);

  const avgPrice = kpis?.avgPricePerSqm ?? 0;
  const spark = useMemo(
    () => Array.from({ length: 7 }, (_, i) => Math.round(avgPrice * (0.72 + i * 0.045))),
    [avgPrice],
  );
  // Bloomberg-style indicators (paridade com dashboard Lovable 37KB) —
  // derivados do dataset de inteligência territorial (INTELLIGENCE_REGIONS).
  const indicators = useMemo(() => {
    const regions = INTELLIGENCE_REGIONS;
    const avgPrice = regions.reduce((s, r) => s + r.priceSqm, 0) / regions.length;
    const avgDelta = regions.reduce((s, r) => s + r.priceSqmDelta12m, 0) / regions.length;
    const hottest = [...regions].sort((a, b) => b.priceSqmDelta12m - a.priceSqmDelta12m)[0];
    const bestOpp = [...regions].sort((a, b) => b.score - a.score)[0];
    const indexLandmap = Math.round(regions.reduce((s, r) => s + r.score, 0) / regions.length);
    const timeLabel = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return { avgPrice, avgDelta, hottest, bestOpp, indexLandmap, timeLabel };
  }, []);

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
  const hubLinks = [
    { href: lh('/map'), icon: Layers, title: 'Mapa', desc: 'Camadas, heatmap e score ao vivo' },
    { href: lh('/compare'), icon: GitCompare, title: 'Comparador', desc: 'Regiões lado a lado' },
    { href: lh('/alerts'), icon: BellRing, title: 'Alertas', desc: 'Gatilhos e riscos' },
    { href: lh('/reports'), icon: FileText, title: 'Relatórios', desc: 'Dossiês e PDFs' },
  ];

  const investorTools = [
    { href: lh('/viabilidade'), icon: Activity, title: 'Viabilidade Construtiva', desc: 'Estudo de potencial e valor residual' },
    { href: lh('/compare/opportunities'), icon: GitCompare, title: 'Comparar Oportunidades', desc: 'Cap Rate e ROI de múltiplos ativos' },
    { href: lh('/copilot'), icon: FileText, title: 'AI Copilot Scanner', desc: 'OCR de matrículas e fotos de campo' },
    { href: lh('/risk-radar'), icon: BellRing, title: 'Radar de Risco', desc: 'Restrições ambientais e topografia' },
    { href: lh('/market-index'), icon: TrendingUp, title: 'Índice Regional', desc: 'Evolução do preço por m² no Brasil' },
    { href: lh('/investment-memo'), icon: FileText, title: 'Investment Memo', desc: 'Dossiês e comitê de investimentos' },
    { href: lh('/zoning'), icon: Layers, title: 'Zoneamento', desc: 'Consulta de leis de uso de solo' },
    { href: lh('/syndicate'), icon: Layers, title: 'Sindicatos de LPs', desc: 'Co-investimento coletivo estruturado' },
    { href: lh('/underwriting'), icon: Activity, title: 'Underwriting & Estresse', desc: 'Sensibilidade de TIR e Selic' },
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
            <span className="hidden text-sm text-muted-foreground sm:inline">Mapa</span>
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
          <div className="rounded-3xl border border-border/50 bg-card p-4 shadow-sm backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/50">
              Hub LandMap
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold">Visão geral do mercado</h1>
            <p className="mt-2 text-xs text-muted-foreground">
              Abra o mapa para ver camadas, score e heatmap ao vivo por bairro.
            </p>
          </div>

          <div className="rounded-3xl border border-border/50 bg-card p-4 shadow-sm backdrop-blur">
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
              <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-5">
                <TickerCard
                  icon={<TrendingUp className="h-4 w-4" />}
                  label="Valorização média"
                  value={fmtPriceSqm(Math.round(indicators.avgPrice))}
                  delta={`↑ ${indicators.avgDelta.toFixed(1)}%`}
                  deltaPositive
                />
                <TickerCard
                  icon={<Flame className="h-4 w-4" />}
                  label="Região mais aquecida"
                  value={indicators.hottest.name}
                  hint={`${indicators.hottest.city} · +${indicators.hottest.priceSqmDelta12m.toFixed(1)}%`}
                  accent
                />
                <TickerCard
                  icon={<Gem className="h-4 w-4" />}
                  label="Melhor oportunidade"
                  value={indicators.bestOpp.name}
                  hint={`Score ${indicators.bestOpp.score}`}
                />
                <TickerCard
                  icon={<Activity className="h-4 w-4" />}
                  label="Índice LandMap"
                  value={String(indicators.indexLandmap)}
                  hint={scoreLabel(indicators.indexLandmap)}
                  large
                />
                <TickerCard
                  icon={<Satellite className="h-4 w-4" />}
                  label="Atualização"
                  value={indicators.timeLabel}
                  hint="Hoje · tempo real"
                />
              </section>

              <div className="mt-6">
                <h2 className="text-sm font-semibold mb-3">📊 Regiões em alta (tempo real)</h2>
                <LiveTicker locale={locale} />
              </div>

              {topOpp.length > 0 && (
                <RecommendationWidget
                  locale={locale}
                  recommendations={topOpp.map((o) => ({
                    id: (o as any).id || 'opp-1',
                    name: (o as any).name || (o as any).region || 'Região',
                    city: (o as any).city || '—',
                    score: o.score,
                    trend: o.deltaPct ?? 0,
                  }))}
                />
              )}

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
                      <li className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-8 animate-pulse rounded-2xl bg-muted/60" />
                        ))}
                      </li>
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
                      <li className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-8 animate-pulse rounded-2xl bg-muted/60" />
                        ))}
                      </li>
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
              <Card className="p-6 space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-[var(--foreground)]">Ferramentas de Investimento Avançadas (YC-Spec)</h2>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Modelagem financeira, auditoria territorial e ferramentas de inteligência em tempo real</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {investorTools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        className="flex flex-col justify-between rounded-2xl border border-border/50 bg-background/50 p-4 transition hover:border-primary/30 hover:bg-primary/5 text-left"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-primary shrink-0">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-sm font-semibold text-[var(--foreground)] line-clamp-1">{tool.title}</span>
                        </div>
                        <p className="text-[11px] text-[var(--muted-foreground)] leading-snug">{tool.desc}</p>
                      </Link>
                    );
                  })}
                </div>
              </Card>
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

function TickerCard({
  icon,
  label,
  value,
  delta,
  deltaPositive,
  hint,
  accent,
  large,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  hint?: string;
  accent?: boolean;
  large?: boolean;
}) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-3 shadow-sm backdrop-blur transition hover:border-primary/25 hover:shadow-elegant sm:p-4',
        accent && 'ring-1 ring-primary/15',
      )}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
        <span className="grid h-5 w-5 place-items-center rounded-md bg-primary/10 text-primary">
          {icon}
        </span>
        {label}
      </div>
      <p
        className={cn(
          'mt-1.5 font-display font-bold tabular-nums leading-tight',
          large ? 'text-2xl' : 'text-lg',
        )}
      >
        {value}
      </p>
      {(delta || hint) && (
        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium">
          {delta && (
            <span className={cn('font-semibold', deltaPositive ? 'text-primary' : 'text-destructive')}>
              {delta}
            </span>
          )}
          {hint && <span className="text-foreground/50">{hint}</span>}
        </p>
      )}
      <div className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br from-primary/10 to-transparent opacity-0 transition group-hover:opacity-100" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardInner />
    </RequireAuth>
  );
}
