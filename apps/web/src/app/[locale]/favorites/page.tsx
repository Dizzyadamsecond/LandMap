'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { RequireAuth } from '../../../components/RequireAuth';
import { useLocale } from 'next-intl';
import { Card, EmptyState } from '@landmap/ui';
import { Building2, MapPin, Star, X, Layers } from '../../../components/lovable/icons';
import { useFavorites } from '../../../lib/favorites';

type FavoriteProperty = {
  id: string;
  address: string;
  totalPrice: number;
  pricePerSqm: number;
  regionName: string;
  confidence: number;
};

type ApiFavorite = {
  id: string;
  title: string;
  city: string;
  state: string;
  neighborhood?: string;
  price?: number;
  pricePerM2?: number;
};

const fmtPerSqm = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

function fmtBRL(n: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);
}

function ConfidenceStars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Confiança ${value} de 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < value ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
          fill={i < value ? 'currentColor' : 'none'}
        />
      ))}
    </div>
  );
}

function toFavorite(item: ApiFavorite): FavoriteProperty {
  return {
    id: item.id,
    address: item.title || `${item.neighborhood || item.city}`,
    totalPrice: item.price || 0,
    pricePerSqm: item.pricePerM2 || 0,
    regionName: item.neighborhood || item.city,
    confidence: 0,
  };
}

function FavoritesPageInner() {
  const locale = useLocale();
  const lh = (p: string) => `/${locale}${p}`;
  const { ids, hydrated, toggle } = useFavorites();

  const [items, setItems] = useState<Record<string, ApiFavorite>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ids.length) {
      setItems({});
      return;
    }
    let active = true;
    setLoading(true);
    fetch(`/api/favorites?ids=${encodeURIComponent(ids.join(','))}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Falha ao carregar favoritos'))))
      .then((data) => {
        if (!active) return;
        const map: Record<string, ApiFavorite> = {};
        for (const it of (data.items ?? []) as ApiFavorite[]) {
          map[it.id] = it;
        }
        setItems(map);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [ids]);

  const regions = useMemo(
    () =>
      ids
        .map((id) => items[id])
        .filter((it): it is ApiFavorite => Boolean(it)),
    [ids, items],
  );

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <p className="text-sm font-medium text-[var(--primary)]">Meus favoritos</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Terrenos e regiões salvos</h1>
        </header>
        <EmptyState title="Carregando seus favoritos…" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--primary)]">Biblioteca pessoal</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Meus favoritos
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={lh('/map')}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--muted)] px-4 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--muted)]/70"
          >
            <Layers className="h-4 w-4 text-[var(--primary)]" />
            Ver no mapa
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)]">
            ⌘K
          </div>
        </div>
      </header>

      <section>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          <h2 className="text-base font-semibold">Terrenos favoritos</h2>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {loading ? (
            <div className="col-span-full space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/60" />
              ))}
            </div>
          ) : regions.length === 0 ? (
            <div className="col-span-full">
              <EmptyState title="Nenhum terreno favoritado ainda." />
            </div>
          ) : (
            regions.map((item) => {
              const fav = toFavorite(item);
              return (
                <Card key={fav.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
                        <p className="truncate font-semibold text-[var(--foreground)]">
                          {fav.address}
                        </p>
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {fav.regionName}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggle(fav.id)}
                      aria-label="Remover terreno dos favoritos"
                      className="rounded-md p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--destructive)]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-semibold text-[var(--foreground)]">
                      {fmtBRL(fav.totalPrice)}
                    </span>
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {fav.totalPrice > 0 ? `${fmtPerSqm(fav.pricePerSqm)} /m²` : '—'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-0.5">
                      <ConfidenceStars value={fav.confidence || 0} />
                    </div>
                    <Link
                      href={`${lh('/map')}?fav=${encodeURIComponent(fav.id)}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)] transition hover:underline"
                    >
                      <Layers className="h-3 w-3" />
                      Ver no mapa
                    </Link>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

export default function FavoritesPage() {
  return (
    <RequireAuth>
      <FavoritesPageInner />
    </RequireAuth>
  );
}
