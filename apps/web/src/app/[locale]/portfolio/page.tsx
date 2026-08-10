'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  LandMapWordmark,
  Star,
} from '../../../components/lovable/icons';
import { Reveal } from '../../../components/Motion';
import { Card, Badge, Stat, buttonVariants, cn, EmptyState, ProgressCard } from '@landmap/ui';
import { PortfolioActions } from '../../../components/PortfolioActions';
import {
  INTELLIGENCE_REGIONS,
  fmtPriceSqm,
  scoreLabel,
} from '../../../lib/mapIntelligence';
import { getFavoriteIds } from '../../../lib/favorites';
import { useProgress } from '../../../lib/useProgress';

/** Carteira: favoritos de regiões (localStorage) + amostra intelligence. */
export default function PortfolioPage() {
  const locale = useLocale();
  const lh = (p: string) => `/${locale}${p}`;
  const [favIds, setFavIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>('');
  const { progress, loading: progressLoading } = useProgress(userId);

  useEffect(() => {
    try {
      setFavIds(getFavoriteIds());
      setUserId(localStorage.getItem('user_id') || '');
    } catch {
      setFavIds([]);
    }
  }, []);

  const fromIntel = useMemo(() => {
    // Match favorites by name/id when possible; else top score sample
    const byName = INTELLIGENCE_REGIONS.filter(
      (r) => favIds.includes(r.id) || favIds.some((id) => id.includes(r.name)),
    );
    if (byName.length > 0) return byName;
    return INTELLIGENCE_REGIONS.filter((r) => r.score >= 85).slice(0, 4);
  }, [favIds]);

  const totalValue = fromIntel.reduce((s, r) => s + r.priceSqm * 200, 0);
  const avgScore =
    fromIntel.length > 0
      ? Math.round(fromIntel.reduce((s, r) => s + r.score, 0) / fromIntel.length)
      : 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col overflow-x-hidden bg-background px-4 pb-28 pt-6">
      <header className="flex items-center justify-between">
        <Link
          href={lh('/favorites')}
          aria-label="Voltar"
          className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <LandMapWordmark />
        <div className="w-9" />
      </header>

      <div className="mt-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Building2 className="h-3 w-3" />
          Carteira
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
          Carteira de regiões
        </h1>
        <p className="mt-2 text-sm text-foreground/60">
          Áreas salvas e oportunidades de alto Score LandMap.
        </p>
      </div>

      <section className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Ativos" value={String(fromIntel.length)} />
        <Stat label="Score médio" value={String(avgScore)} />
        <Stat label="Proxy m²×200" value={fmtPriceSqm(totalValue)} />
      </section>

      {/* KPI one-pager summary */}
      <Card className="mt-6 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-4">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          <Star className="h-3 w-3" />
          ROI Estimado
        </div>
        <div className="grid grid-cols-3 gap-4 pt-3">
          <div>
            <p className="text-xs text-muted-foreground">ROI 12m</p>
            <p className="mt-1 text-lg font-bold text-primary">+7.2%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Trending</p>
            <p className="mt-1 text-lg font-bold text-success">🔥 Alta</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Risk Score</p>
            <p className="mt-1 text-lg font-bold text-yellow-500">Médio</p>
          </div>
        </div>
      </Card>

      {/* Seu portfólio vs Mercado */}
      <Card className="mt-6 border-accent/20 bg-gradient-to-r from-accent/5 to-transparent p-4">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
          📊 Seu portfólio vs Mercado
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 border-r border-border/50 pr-4">
            <p className="text-[10px] font-semibold text-muted-foreground">SUA CARTEIRA</p>
            <div>
              <p className="text-xs text-muted-foreground">Score médio</p>
              <p className="text-lg font-bold">{avgScore}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Diversificação</p>
              <p className="text-sm font-semibold">✓ Balanceada</p>
            </div>
          </div>
          <div className="space-y-2 pl-4">
            <p className="text-[10px] font-semibold text-muted-foreground">MERCADO</p>
            <div>
              <p className="text-xs text-muted-foreground">Score médio BR</p>
              <p className="text-lg font-bold">72</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Comparação</p>
              <p className="text-sm font-semibold text-success">↑ +{avgScore - 72} vs BR</p>
            </div>
          </div>
        </div>
      </Card>

      {userId && (
        <div className="mt-4">
          <ProgressCard progress={progress} loading={progressLoading} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={lh('/favorites')} className={cn(buttonVariants({ size: 'sm' }))}>
          <Star className="mr-1 h-3.5 w-3.5" />
          Favoritos
        </Link>
        <Link href={lh('/compare')} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          Comparar
        </Link>
        <PortfolioActions />
        <Link href={lh('/map')} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
          Mapa
        </Link>
      </div>

      {fromIntel.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Carteira vazia"
            description="Salve regiões em Favoritos ou explore o mapa intelligence."
          />
        </div>
      ) : (
        <Reveal className="mt-6 space-y-3">
          {fromIntel.map((r) => (
            <Card key={r.id} variant="interactive" className="p-4">
              <Link href={lh('/map')} className="block">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.city}, {r.state} · {fmtPriceSqm(r.priceSqm)}/m²
                    </p>
                  </div>
                  <Badge variant={r.score >= 85 ? 'success' : 'info'}>
                    {scoreLabel(r.score)} · {r.score}
                  </Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                  {r.highlights[0]}
                </p>
              </Link>
            </Card>
          ))}
        </Reveal>
      )}
    </main>
  );
}
