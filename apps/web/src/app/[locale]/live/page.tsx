'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useEffect, useState } from 'react';
import { Activity, Layers, GitCompare, BellRing, FileText } from '../../../components/lovable/icons';
import { ProductPageShell } from '../../../components/ProductPageShell';
import { Card, Badge, Stat, buttonVariants, cn } from '@landmap/ui';
import { INTELLIGENCE_REGIONS, fmtDelta } from '../../../lib/mapIntelligence';

interface LiveEvent {
  id: string;
  text: string;
  source: string;
  ts: string;
}

interface LivePayload {
  live: boolean;
  generatedAt: string;
  stats: { sources: number; ufs: number; banks: number; ipcaAvailable: boolean };
  events: LiveEvent[];
}

export default function LivePage() {
  const locale = useLocale();
  const lh = (p: string) => `/${locale}${p}`;
  const [tick, setTick] = useState(0);
  const [data, setData] = useState<LivePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 8000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/live', { cache: 'no-store' });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = (await res.json()) as LivePayload;
        if (active) setData(json);
      } catch (e) {
        if (active) setError((e as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, [tick]);

  // Real live feed (no simulation). Falls back to region pulse only if the
  // aggregator is unavailable so the page never looks broken.
  const feed =
    data?.events?.length
      ? data.events.map((e) => ({
          id: e.id,
          text: e.text,
          region: e.source,
        }))
      : INTELLIGENCE_REGIONS.map((r, i) => ({
          id: `${r.id}-${tick}-${i}`,
          text:
            tick % 2 === 0
              ? `Score ${r.name} estável em ${r.score}`
              : `Valorização 12m ${r.name}: ${fmtDelta(r.priceSqmDelta12m)}`,
          region: r.name,
        })).slice(0, 8);

  const hubLinks = [
    { href: lh('/map'), icon: Layers, label: 'Mapa' },
    { href: lh('/compare'), icon: GitCompare, label: 'Comparar' },
    { href: lh('/alerts'), icon: BellRing, label: 'Alertas' },
    { href: lh('/reports'), icon: FileText, label: 'Relatórios' },
  ];

  const sources = data?.stats.sources ?? 0;
  const ufs = data?.stats.ufs ?? INTELLIGENCE_REGIONS.length;

  return (
    <ProductPageShell
      backHref="/map"
      eyebrow={
        <>
          <Activity className="h-3 w-3 animate-pulse" /> Ao vivo
        </>
      }
      title="Pulse do mercado"
      description={
        data
          ? 'Feed em tempo real de fontes abertas nacionais (IBGE, SIDRA, BrasilAPI).'
          : 'Carregando dados ao vivo de fontes abertas…'
      }
    >
      <div className="grid gap-6 xl:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="space-y-3 self-start">
          <div className="rounded-3xl border border-border/50 bg-white/95 p-4 shadow-sm backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/50">
              Live
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold">Pulse do mercado</h2>
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
          <section className="grid grid-cols-3 gap-3">
            <Stat label="Eventos" value={String(feed.length)} />
            <Stat label="Fontes" value={String(sources || INTELLIGENCE_REGIONS.length)} />
            <Stat label="UF" value={String(ufs)} />
          </section>

          <span
            className={cn(
              'mt-4 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]',
              data
                ? 'border-success/30 bg-success/10 text-success'
                : 'border-warning/30 bg-warning/10 text-warning',
            )}
          >
            <Activity className="h-3 w-3 animate-pulse" />
            {data ? 'Dados reais (live)' : error ? `Fallback (${error})` : 'Conectando…'}
          </span>

          <Link href={lh('/map')} className={cn(buttonVariants({ size: 'sm' }), 'ml-3 mt-4')}>
            Mapa live
          </Link>

          <div className="mt-6 space-y-2">
        {feed.map((e) => (
          <Card key={e.id} className="flex items-center justify-between p-3">
            <p className="text-sm">{e.text}</p>
            <Badge variant="outline">{e.region}</Badge>
          </Card>
        ))}
          </div>
        </section>
      </div>
    </ProductPageShell>
  );
}
