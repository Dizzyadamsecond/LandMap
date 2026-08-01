'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { RequireAuth } from '../../../components/RequireAuth';
import { Star, GitCompare, Layers, BellRing, FileText } from '../../../components/lovable/icons';
import { useFavorites } from '../../../lib/favorites';
import { REGIONS, fmtBRL, fmtPrice } from '../../../lib/regions-data';

function RegionsPageInner() {
  const locale = useLocale();
  const lh = (p: string) => `/${locale}${p}`;
  const { ids, hydrated, isFavorite, toggle } = useFavorites();

  const compareIds = ids.length > 0 ? ids : REGIONS.map((r) => r.id);
  const compareHref = `${lh('/compare')}?ids=${compareIds.join(',')}`;
  const hubLinks = [
    { href: lh('/map'), icon: Layers, label: 'Mapa' },
    { href: lh('/alerts'), icon: BellRing, label: 'Alertas' },
    { href: lh('/reports'), icon: FileText, label: 'Relatórios' },
  ];

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-500 xl:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="space-y-3 self-start">
        <div className="rounded-3xl border border-border/50 bg-white/95 p-4 shadow-sm backdrop-blur">
          <p className="text-sm font-medium text-primary">Regiões monitoradas</p>
          <h1 className="mt-2 font-display text-2xl font-semibold">Bairros de Fortaleza</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Preços médios anunciados e observados, faixa estimada e confiança dos dados.
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
        <div className="hidden overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] md:block">
          <div className="w-full overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr>
                  <th className="h-10 w-10 px-2 text-left align-middle font-medium text-[var(--muted-foreground)]">
                    <span className="sr-only">Favoritar</span>
                  </th>
                  <th className="h-10 px-2 text-left align-middle font-medium text-[var(--muted-foreground)]">
                    Bairro
                  </th>
                  <th className="h-10 px-2 text-right align-middle font-medium text-[var(--muted-foreground)]">
                    Anunciado (R$/m²)
                  </th>
                  <th className="h-10 px-2 text-right align-middle font-medium text-[var(--muted-foreground)]">
                    Faixa estimada
                  </th>
                  <th className="h-10 px-2 text-right align-middle font-medium text-[var(--muted-foreground)]">
                    Dados
                  </th>
                  <th className="h-10 px-2 text-left align-middle font-medium text-[var(--muted-foreground)]">
                    Confiança
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {REGIONS.map((region) => {
                  const active = hydrated && isFavorite(region.id);
                  return (
                    <tr key={region.id} className="border-b transition-colors hover:bg-[var(--muted)]">
                      <td className="p-2 align-middle">
                        <button
                          type="button"
                          onClick={() => toggle(region.id)}
                          aria-label={active ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                          className="inline-flex items-center justify-center rounded-md p-1 transition-colors hover:bg-[var(--muted)]"
                        >
                          <Star
                            className={`h-4 w-4 ${active ? 'text-warning' : 'text-[var(--muted-foreground)]'}`}
                            fill={active ? 'currentColor' : 'none'}
                          />
                        </button>
                      </td>
                      <td className="p-2 align-middle font-medium">{region.name}</td>
                      <td className="p-2 align-middle text-right tabular-nums font-semibold">{fmtBRL(region.avgObservedPrice)}</td>
                      <td className="p-2 align-middle text-right tabular-nums text-[var(--muted-foreground)]">
                        {fmtPrice(region.minPrice)} – {fmtPrice(region.maxPrice)}
                      </td>
                      <td className="p-2 align-middle text-right tabular-nums">{region.dataPoints}</td>
                      <td className="p-2 align-middle">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < region.confidence ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                              fill={i < region.confidence ? 'currentColor' : 'none'}
                            />
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-3 md:hidden">
          {REGIONS.map((region) => {
            const active = hydrated && isFavorite(region.id);
            return (
              <article key={region.id} className="rounded-2xl border border-border/50 bg-white/95 p-4 shadow-sm backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/50">Bairro</p>
                    <h2 className="mt-1 font-display text-lg font-semibold text-foreground">{region.name}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(region.id)}
                    aria-label={active ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background text-foreground transition hover:border-primary/30 hover:bg-primary/5"
                  >
                    <Star
                      className={`h-4 w-4 ${active ? 'text-warning' : 'text-[var(--muted-foreground)]'}`}
                      fill={active ? 'currentColor' : 'none'}
                    />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-border/50 bg-background/70 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/50">Observado</p>
                    <p className="mt-1 font-semibold tabular-nums text-foreground">{fmtBRL(region.avgObservedPrice)}</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-background/70 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/50">Faixa</p>
                    <p className="mt-1 font-semibold tabular-nums text-foreground">
                      {fmtPrice(region.minPrice)} – {fmtPrice(region.maxPrice)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-background/70 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/50">Dados</p>
                    <p className="mt-1 font-semibold tabular-nums text-foreground">{region.dataPoints}</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-background/70 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/50">Confiança</p>
                    <div className="mt-1 flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < region.confidence ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                          fill={i < region.confidence ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default function RegionsPage() {
  return (
    <RequireAuth>
      <RegionsPageInner />
    </RequireAuth>
  );
}
