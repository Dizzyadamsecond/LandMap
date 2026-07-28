'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useMemo } from 'react';
import {
  ArrowLeft,
  MapPin,
  TrendingUp,
  LandMapWordmark,
  Layers,
  GitCompare,
  BellRing,
  FileText,
} from '../../../components/lovable/icons';
import { Reveal } from '../../../components/Motion';
import { Card, Badge, Stat, buttonVariants, cn } from '@landmap/ui';
import { INTELLIGENCE_REGIONS, fmtPriceSqm } from '../../../lib/mapIntelligence';

export default function CitiesPage() {
  const locale = useLocale();
  const lh = (p: string) => `/${locale}${p}`;

  const cities = useMemo(() => {
    const map = new Map<
      string,
      { city: string; state: string; count: number; avgPrice: number; avgScore: number; maxGrowth: number }
    >();
    for (const r of INTELLIGENCE_REGIONS) {
      const key = `${r.city}|${r.state}`;
      const cur = map.get(key) ?? {
        city: r.city,
        state: r.state,
        count: 0,
        avgPrice: 0,
        avgScore: 0,
        maxGrowth: 0,
      };
      cur.count += 1;
      cur.avgPrice += r.priceSqm;
      cur.avgScore += r.score;
      cur.maxGrowth = Math.max(cur.maxGrowth, r.layerScores.growth ?? 0);
      map.set(key, cur);
    }
    return [...map.values()]
      .map((c) => ({
        ...c,
        avgPrice: Math.round(c.avgPrice / c.count),
        avgScore: Math.round(c.avgScore / c.count),
      }))
      .sort((a, b) => b.avgScore - a.avgScore);
  }, []);

  const totalBairros = INTELLIGENCE_REGIONS.length;
  const altaMedia =
    cities.length > 0
      ? (cities.reduce((s, c) => s + c.maxGrowth, 0) / cities.length / 10).toFixed(1)
      : '0';
  const hubLinks = [
    { href: lh('/map'), icon: Layers, label: 'Mapa' },
    { href: lh('/compare'), icon: GitCompare, label: 'Comparar' },
    { href: lh('/alerts'), icon: BellRing, label: 'Alertas' },
    { href: lh('/reports'), icon: FileText, label: 'Relatórios' },
  ];

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-6 xl:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="space-y-3 self-start">
        <div className="rounded-3xl border border-border/50 bg-white/95 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <Link
              href={lh('/dashboard')}
              aria-label="Voltar"
              className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <LandMapWordmark />
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <MapPin className="h-3 w-3" />
            Cidades
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">Guia de cidades</h1>
          <p className="mt-2 text-sm text-foreground/60">
            Cobertura LandMap por cidade — ligada ao mapa intelligence e ao Free.
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
      <section className="grid grid-cols-3 gap-3">
        <Stat label="Cidades" value={String(cities.length)} />
        <Stat label="Bairros" value={String(totalBairros)} />
        <Stat label="Alta média" value={`${altaMedia}%`} trend={Number(altaMedia)} />
      </section>

      <div className="flex flex-wrap gap-2">
        <Link href={lh('/dashboard')} className={cn(buttonVariants({ size: 'sm' }))}>
          Mapa intelligence
        </Link>
        <Link href={lh('/map')} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          Mapa Free
        </Link>
        <Link href={lh('/neighborhoods')} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
          Bairros
        </Link>
      </div>

      <Reveal className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {cities.map((c) => (
          <Card key={`${c.city}-${c.state}`} variant="interactive">
            <Link href={lh('/neighborhoods')} className="block">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">
                  {c.city}{' '}
                  <span className="text-xs font-normal text-muted-foreground">{c.state}</span>
                </p>
                <Badge variant="outline">{c.count} bairros</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Preço médio {fmtPriceSqm(c.avgPrice)}/m² · Score {c.avgScore}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">crescimento máx. camada</span>
                <span className="flex items-center gap-1 text-sm font-medium text-primary">
                  <TrendingUp className="h-3 w-3" />
                  {c.maxGrowth}
                </span>
              </div>
            </Link>
          </Card>
        ))}
      </Reveal>
      </section>
    </main>
  );
}
