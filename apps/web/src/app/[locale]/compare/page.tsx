'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, EmptyState, Badge, buttonVariants, cn } from '@landmap/ui';
import { GitCompare, Star, Layers, BellRing, FileText } from '../../../components/lovable/icons';
import { getRegionById, fmtBRL, fmtPrice } from '../../../lib/regions-data';
import { RequireAuth } from '../../../components/RequireAuth';

function CompareInner() {
  const locale = useLocale();
  const lh = (p: string) => `/${locale}${p}`;
  const params = useParams();
  const searchParams = useSearchParams();
  const idsParam = (searchParams.get('ids') as string | null) ?? undefined;
  const ids = idsParam ? idsParam.split(',').filter(Boolean) : [];
  const regions = ids
    .map((id) => getRegionById(id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));
  const hubLinks = [
    { href: lh('/map'), icon: Layers, label: 'Mapa' },
    { href: lh('/alerts'), icon: BellRing, label: 'Alertas' },
    { href: lh('/reports'), icon: FileText, label: 'Relatórios' },
  ];

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-500 xl:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="space-y-3 self-start">
        <div className="rounded-3xl border border-border/50 bg-white/95 p-4 shadow-sm backdrop-blur">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-foreground/50">
            <GitCompare className="h-3.5 w-3.5" />
            Comparação
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold">Comparar regiões</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Diff de preço por m² e faixa estimada entre regiões de terrenos.
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
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    'flex h-auto items-center justify-start gap-2 rounded-2xl px-3 py-2.5',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </aside>

      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge variant="outline">Comparador</Badge>
            <p className="mt-2 text-sm text-foreground/70">
              Lado a lado com métricas de preço, confiança e volume.
            </p>
          </div>
          <Link
            href={lh('/regions')}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90"
          >
            Ver regiões
          </Link>
        </div>

        {regions.length === 0 ? (
          <EmptyState
            title="Nenhuma região selecionada para comparação."
            description="Selecione regiões em Regiões ou Favoritos para compará-las lado a lado."
          />
        ) : (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr>
                  <th className="h-10 px-2 text-left align-middle font-medium text-[var(--muted-foreground)]">
                    Região
                  </th>
                  {regions.map((r) => (
                    <th key={r.id} className="h-10 px-2 text-right align-middle font-medium">
                      {r.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                <tr className="border-b">
                  <td className="p-2 align-middle text-[var(--muted-foreground)]">Observado (R$/m²)</td>
                  {regions.map((r) => (
                    <td key={r.id} className="p-2 text-right tabular-nums font-semibold">
                      {fmtBRL(r.avgObservedPrice)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2 align-middle text-[var(--muted-foreground)]">Faixa estimada</td>
                  {regions.map((r) => (
                    <td key={r.id} className="p-2 text-right tabular-nums text-[var(--muted-foreground)]">
                      {fmtPrice(r.minPrice)} – {fmtPrice(r.maxPrice)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2 align-middle text-[var(--muted-foreground)]">Dados</td>
                  {regions.map((r) => (
                    <td key={r.id} className="p-2 text-right tabular-nums">
                      {r.dataPoints}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-2 align-middle text-[var(--muted-foreground)]">Confiança</td>
                  {regions.map((r) => (
                    <td key={r.id} className="p-2">
                      <div className="flex items-center justify-end gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < r.confidence ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'
                            }`}
                            fill={i < r.confidence ? 'currentColor' : 'none'}
                          />
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default function ComparePage() {
  return (
    <RequireAuth>
      <CompareInner />
    </RequireAuth>
  );
}
