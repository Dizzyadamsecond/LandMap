'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  ArrowLeft,
  TrendingUp,
  LandMapWordmark,
  Layers,
  GitCompare,
  BellRing,
  FileText,
} from '../../../components/lovable/icons';
import { Reveal } from '../../../components/Motion';
import { Card, Badge, Stat, Progress, Sparkline, buttonVariants, cn } from '@landmap/ui';
import {
  COPY,
  INTELLIGENCE_REGIONS,
  fmtPriceSqm,
} from '../../../lib/mapIntelligence';

export default function ValorizationPage() {
  const locale = useLocale();
  const lh = (p: string) => `/${locale}${p}`;

  const ranked = [...INTELLIGENCE_REGIONS].sort(
    (a, b) => (b.layerScores.valorization ?? 0) - (a.layerScores.valorization ?? 0),
  );
  const top = ranked[0];
  const series = ranked.slice(0, 8).map((r) => r.layerScores.valorization ?? 0);
  const hubLinks = [
    { href: lh('/map'), icon: Layers, label: 'Mapa' },
    { href: lh('/compare'), icon: GitCompare, label: 'Comparar' },
    { href: lh('/alerts'), icon: BellRing, label: 'Alertas' },
    { href: lh('/reports'), icon: FileText, label: 'Relatórios' },
  ];

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl gap-6 bg-background px-4 py-6 xl:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="space-y-3 self-start">
        <div className="rounded-3xl border border-border/50 bg-card p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <Link
              href={lh('/market')}
              aria-label="Voltar"
              className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <LandMapWordmark />
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <TrendingUp className="h-3 w-3" />
            Valorização m²
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">
            Camada de valorização
          </h1>
          <p className="mt-2 text-sm text-foreground/60">
            Mesma camada do mapa intelligence — ranking 12m e preço/m².
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

      <section>
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label={COPY.hottest} value={top?.name ?? '—'} />
          <Stat
            label="Índice top"
            value={String(top?.layerScores.valorization ?? 0)}
            trend={(top?.layerScores.valorization ?? 0) / 10}
          />
          <Stat label={COPY.avgPrice} value={fmtPriceSqm(top?.priceSqm ?? 0)} />
        </section>

        <Card className="mt-6 p-4">
          <p className="mb-2 text-xs text-muted-foreground">{COPY.history}</p>
          <Sparkline data={series} width={300} height={48} />
        </Card>

        <div className="mt-4 flex gap-2">
          <Link href={lh('/map')} className={cn(buttonVariants({ size: 'sm' }))}>
            Ver no mapa
          </Link>
          <Link href={lh('/cities')} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            Cidades
          </Link>
        </div>

        <Reveal className="mt-6 space-y-3">
        {ranked.map((r, i) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold">
                  <span className="mr-2 tabular-nums text-muted-foreground">{i + 1}.</span>
                  {r.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {fmtPriceSqm(r.priceSqm)}/m² · Score {r.score}
                </p>
              </div>
              <Badge variant="outline">{r.layerScores.valorization}</Badge>
            </div>
            <Progress className="mt-3" value={r.layerScores.valorization ?? 0} />
          </Card>
        ))}
        </Reveal>
      </section>
    </main>
  );
}
