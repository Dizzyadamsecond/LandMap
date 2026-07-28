'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Sparkles, TrendingUp, Layers, GitCompare, BellRing, FileText } from '../../../components/lovable/icons';
import { ProductPageShell } from '../../../components/ProductPageShell';
import { Reveal } from '../../../components/Motion';
import { Card, Badge, Stat, Sparkline, buttonVariants, cn } from '@landmap/ui';
import {
  INTELLIGENCE_REGIONS,
  fmtDelta,
  topByValorization,
} from '../../../lib/mapIntelligence';

export default function InsightsPage() {
  const locale = useLocale();
  const lh = (p: string) => `/${locale}${p}`;
  const tops = topByValorization(5);
  const spark = tops.map((r) => Math.round(r.priceSqmDelta12m * 10));
  const hubLinks = [
    { href: lh('/map'), icon: Layers, label: 'Mapa' },
    { href: lh('/compare'), icon: GitCompare, label: 'Comparar' },
    { href: lh('/alerts'), icon: BellRing, label: 'Alertas' },
    { href: lh('/reports'), icon: FileText, label: 'Relatórios' },
  ];

  return (
    <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-6 xl:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="space-y-3 self-start">
        <div className="rounded-3xl border border-border/50 bg-white/95 p-4 shadow-sm backdrop-blur">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/50">Insights</p>
          <h1 className="mt-2 font-display text-2xl font-semibold">Insights de mercado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Síntese narrativa a partir das camadas do mapa intelligence.
          </p>
          <Link href={lh('/map')} className={cn(buttonVariants({ size: 'sm' }), 'mt-4 w-full')}>
            Validar no mapa
          </Link>
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
          <Stat label="Insights" value="5" />
          <Stat label="Top 12m" value={tops[0]?.name ?? '—'} />
          <Stat label="Delta max" value={fmtDelta(tops[0]?.priceSqmDelta12m ?? 0)} />
        </section>

        <Card className="p-4">
          <p className="mb-2 text-xs text-muted-foreground">Dispersão de valorização (amostra)</p>
          <Sparkline data={spark} width={280} height={48} />
        </Card>

        <Reveal className="space-y-3">
          {tops.map((r, i) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge variant="outline">#{i + 1}</Badge>
                  <p className="mt-2 font-semibold">{r.name}</p>
                  <p className="mt-1 text-sm text-foreground/70">{r.highlights[0]}</p>
                </div>
                <span className="flex items-center gap-1 text-sm font-semibold text-primary">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {fmtDelta(r.priceSqmDelta12m)}
                </span>
              </div>
            </Card>
          ))}
        </Reveal>
      </section>
    </div>
  );
}
