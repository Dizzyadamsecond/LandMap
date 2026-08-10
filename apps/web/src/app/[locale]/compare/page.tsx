'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, EmptyState, Badge, buttonVariants, cn, Input } from '@landmap/ui';
import { GitCompare, Star, Layers, BellRing, FileText, MapPin, Plus, X } from '../../../components/lovable/icons';
import { getRegionById, fmtBRL, fmtPrice } from '../../../lib/regions-data';
import { RequireAuth } from '../../../components/RequireAuth';
import { INTELLIGENCE_REGIONS } from '../../../lib/mapIntelligence';

type CompareRow = {
  id: string;
  name: string;
  city?: string;
  state?: string;
  avgObservedPrice: number;
  minPrice: number;
  maxPrice: number;
  confidence: number;
  dataPoints?: number;
};

function resolveRows(ids: string[]): CompareRow[] {
  const out: CompareRow[] = [];
  const seen = new Set<string>();
  for (const raw of ids) {
    const token = raw.trim();
    if (!token || seen.has(token.toLowerCase())) continue;
    seen.add(token.toLowerCase());

    const byId = getRegionById(token);
    if (byId) {
      out.push({ ...byId, id: byId.id });
      continue;
    }

    const match = INTELLIGENCE_REGIONS.find(
      (r) =>
        r.name.toLowerCase() === token.toLowerCase() ||
        r.city.toLowerCase() === token.toLowerCase() ||
        `${r.name}, ${r.city}`.toLowerCase() === token.toLowerCase(),
    );
    if (match) {
      out.push({
        id: match.id,
        name: match.name,
        city: match.city,
        state: match.state,
        avgObservedPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        confidence: match.score,
        dataPoints: 0,
      });
      continue;
    }

    const named = token.includes(',') ? token : `${token}, Brasil`;
    out.push({
      id: `hood-${token.toLowerCase()}`,
      name: named,
      city: named,
      state: '',
      avgObservedPrice: 0,
      minPrice: 0,
      maxPrice: 0,
      confidence: 0,
      dataPoints: 0,
    });
  }
  return out;
}

function CompareInner() {
  const locale = useLocale();
  const lh = (p: string) => `/${locale}${p}`;
  const searchParams = useSearchParams();
  const idsParam = (searchParams.get('ids') as string | null) ?? undefined;
  const initial = idsParam ? idsParam.split(',').filter(Boolean) : [];

  const [selectedIds, setSelectedIds] = useState<string[]>(initial);
  const [draft, setDraft] = useState('');
  const [items, setItems] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const rows = useMemo(() => resolveRows(selectedIds), [selectedIds]);

  useEffect(() => {
    if (!rows.length) return;
    const keys = rows.map((r) => `${r.city}|${r.state}|${r.name}`).filter(Boolean);
    const missing = keys.filter((k) => !items[k]);
    if (!missing.length) return;
    let active = true;
    setLoading(true);
    const qs = keys.join(',');
    fetch(`/neighborhoods/by-ids?ids=${encodeURIComponent(qs)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Falha ao carregar comparação'))))
      .then((data) => {
        if (!active) return;
        const map: Record<string, any> = {};
        for (const it of data.items ?? []) {
          map[`${it.city}|${it.state}|${it.name}`] = it;
        }
        setItems((prev) => ({ ...prev, ...map }));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const updateQuery = (next: string[]) => {
    setSelectedIds(next);
    const url = new URL(window.location.href);
    url.searchParams.set('ids', next.join(','));
    window.history.replaceState({}, '', url.toString());
  };

  const addItem = () => {
    const token = draft.trim();
    if (!token) return;
    const next = [...selectedIds, token];
    updateQuery(next);
    setDraft('');
  };

  const removeItem = (id: string) => {
    updateQuery(selectedIds.filter((item) => item !== id));
  };

  const hubLinks = [
    { href: lh('/map'), icon: Layers, label: 'Mapa' },
    { href: lh('/alerts'), icon: BellRing, label: 'Alertas' },
    { href: lh('/reports'), icon: FileText, label: 'Relatórios' },
  ];

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-500 xl:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="space-y-3 self-start">
        <div className="rounded-3xl border border-border/50 bg-card p-4 shadow-sm backdrop-blur">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-foreground/50">
            <GitCompare className="h-3.5 w-3.5" />
            Comparação
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold">Comparar duas regiões</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Preço por m², volume de dados, confiança, infraestrutura e tendência histórica.
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
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={lh('/regions')}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90"
            >
              Ver regiões
            </Link>
            <Link
              href={lh('/neighborhoods')}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-card px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-muted"
            >
              <MapPin className="h-4 w-4" /> Bairros
            </Link>
          </div>
        </div>

        <Card className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addItem();
                }
              }}
              placeholder="Adicionar bairro ou cidade…"
              className="sm:max-w-xs"
            />
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] transition hover:bg-[var(--primary)]/90"
            >
              <Plus className="h-4 w-4" /> Adicionar
            </button>
          </div>
          {selectedIds.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedIds.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-muted/40 px-2.5 py-1 text-xs font-medium"
                >
                  {id}
                  <button
                    type="button"
                    aria-label={`Remover ${id}`}
                    onClick={() => removeItem(id)}
                    className="grid h-4 w-4 place-items-center rounded-full transition hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </Card>

        {rows.length === 0 ? (
          <EmptyState
            title="Selecione duas regiões para começar a comparação."
            description="Adicione regiões, cidades ou bairros para compará-los lado a lado."
          />
        ) : (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
            {loading && (
              <div className="border-b border-[var(--border)] bg-muted/30 px-3 py-2 text-xs text-foreground/60">
                Atualizando métricas do dataset…
              </div>
            )}
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr>
                    <th className="h-10 px-2 text-left align-middle font-medium text-[var(--muted-foreground)]">
                      Região
                    </th>
                    {rows.map((r) => (
                      <th key={r.id} className="h-10 px-2 text-right align-middle font-medium">
                        {r.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  <tr className="border-b">
                    <td className="p-2 align-middle text-[var(--muted-foreground)]">Cidade/UF</td>
                    {rows.map((r) => {
                      const key = `${r.city}|${r.state}|${r.name}`;
                      const it = items[key];
                      return (
                        <td key={r.id} className="p-2 text-right tabular-nums">
                          {it ? `${it.city}/${it.state}` : `${r.city}${r.state ? `/${r.state}` : ''}`}
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 align-middle text-[var(--muted-foreground)]">Observado (R$/m²)</td>
                    {rows.map((r) => {
                      const key = `${r.city}|${r.state}|${r.name}`;
                      const it = items[key];
                      return (
                        <td key={r.id} className="p-2 text-right tabular-nums font-semibold">
                          {it ? fmtBRL(it.avgPricePerSqm) : '—'}
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 align-middle text-[var(--muted-foreground)]">Faixa estimada</td>
                    {rows.map((r) => {
                      const key = `${r.city}|${r.state}|${r.name}`;
                      const it = items[key];
                      return (
                        <td key={r.id} className="p-2 text-right tabular-nums text-[var(--muted-foreground)]">
                          {it ? `${fmtBRL(it.minPricePerSqm)} – ${fmtBRL(it.maxPricePerSqm)}` : '—'}
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 align-middle text-[var(--muted-foreground)]">Dados</td>
                    {rows.map((r) => {
                      const key = `${r.city}|${r.state}|${r.name}`;
                      const it = items[key];
                      return (
                        <td key={r.id} className="p-2 text-right tabular-nums">
                          {it ? String(it.count) : (r.dataPoints ? String(r.dataPoints) : '—')}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-2 align-middle text-[var(--muted-foreground)]">Média preço</td>
                    {rows.map((r) => {
                      const key = `${r.city}|${r.state}|${r.name}`;
                      const it = items[key];
                      return (
                        <td key={r.id} className="p-2 text-right tabular-nums font-semibold">
                          {it ? fmtBRL(it.avgPrice) : '—'}
                        </td>
                      );
                    })}
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
