'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Property } from './api';

const STORAGE_KEY = 'landmap_favorites';

/* ------------------------------------------------------------------ */
/*  Type helpers                                                      */
/* ------------------------------------------------------------------ */

export type FavoriteType = 'property' | 'region';

function makeFavoritId(type: FavoriteType, id: string): string {
  return `${type}_${id}`;
}

export function parseFavoriteId(fav: string): { type: FavoriteType; id: string } | null {
  if (fav.startsWith('property_')) {
    return { type: 'property', id: fav.slice(9) };
  }
  if (fav.startsWith('region_')) {
    return { type: 'region', id: fav.slice(7) };
  }
  // fallback: assume legacy format is property
  return { type: 'property', id: fav };
}

export function isFavoritType(fav: string, type: FavoriteType): boolean {
  const parsed = parseFavoriteId(fav);
  return parsed?.type === type;
}

/* ------------------------------------------------------------------ */
/*  Raw storage helpers (works outside React too)                     */
/* ------------------------------------------------------------------ */

function readIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

/** Add or remove an id. Returns the updated list. */
export function toggleFavoriteId(id: string): string[] {
  const current = readIds();
  const idx = current.indexOf(id);
  const next = idx === -1 ? [...current, id] : current.filter((x) => x !== id);
  writeIds(next);
  return next;
}

export function isFavoriteId(id: string): boolean {
  return readIds().includes(id);
}

/** Alias imperativo de `isFavoriteId` (usado fora de React, ex.: mapa do dashboard). */
export const isFavorite = isFavoriteId;

/**
 * Item rico enviado pelo mapa do dashboard. Só o `id` entra no índice de
 * favoritos; os demais campos ficam em cache para render otimista enquanto
 * `/api/favorites` não responde.
 */
export type FavoriteSeed = {
  id: string;
  address?: string;
  totalPrice?: number;
  pricePerSqm?: number;
  regionName?: string;
  confidence?: number;
};

const SEED_KEY = 'landmap_favorites_seed';

function readSeeds(): Record<string, FavoriteSeed> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(SEED_KEY);
    return raw ? (JSON.parse(raw) as Record<string, FavoriteSeed>) : {};
  } catch {
    return {};
  }
}

function writeSeeds(seeds: Record<string, FavoriteSeed>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SEED_KEY, JSON.stringify(seeds));
  } catch {
    /* quota — o índice de ids continua válido */
  }
}

/** Metadados em cache de um favorito (vazio quando só temos o id). */
export function getFavoriteSeed(id: string): FavoriteSeed | undefined {
  return readSeeds()[id];
}

/** Adiciona um favorito (id ou item completo). Retorna a lista atualizada. */
export function addFavorite(fav: string | FavoriteSeed): string[] {
  const seed: FavoriteSeed = typeof fav === 'string' ? { id: fav } : fav;
  if (!seed?.id) return readIds();

  const current = readIds();
  const next = current.includes(seed.id) ? current : [...current, seed.id];
  writeIds(next);

  if (typeof fav !== 'string') {
    writeSeeds({ ...readSeeds(), [seed.id]: seed });
  }
  return next;
}

/** Remove um favorito pelo id. Retorna a lista atualizada. */
export function removeFavorite(id: string): string[] {
  const next = readIds().filter((x) => x !== id);
  writeIds(next);

  const seeds = readSeeds();
  if (seeds[id]) {
    delete seeds[id];
    writeSeeds(seeds);
  }
  return next;
}

export function getFavoriteIds(): string[] {
  return readIds();
}

export function getFavoriteIdsByType(type: FavoriteType): string[] {
  return readIds().filter((id) => isFavoritType(id, type));
}

export function clearFavorites(): void {
  writeIds([]);
  writeSeeds({});
}

/* ------------------------------------------------------------------ */
/*  React hook                                                        */
/* ------------------------------------------------------------------ */

export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setIds(readIds());
    setHydrated(true);
  }, []);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const idx = prev.indexOf(id);
      const next = idx === -1 ? [...prev, id] : prev.filter((x) => x !== id);
      writeIds(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (id: string) => ids.includes(id),
    [ids],
  );

  const clear = useCallback(() => {
    writeIds([]);
    setIds([]);
  }, []);

  return { ids, hydrated, toggle, isFavorite, clear } as const;
}

/* ------------------------------------------------------------------ */
/*  Post-login sync helpers                                           */
/* ------------------------------------------------------------------ */

export type SyncPayload = {
  ids: string[];
  email?: string;
};

/**
 * Call after successful login to push local favorites to server and
 * pull any server-side favorites down.
 */
export async function syncFavoritesAfterLogin(email: string) {
  const local = readIds();

  try {
    const res = await fetch('/api/favorites/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ids: local, email } satisfies SyncPayload),
    });

    if (!res.ok) return; // graceful fallback – keep local
    const data = (await res.json()) as { merged: string[] };
    writeIds(data.merged);
  } catch {
    /* offline — keep local */
  }
}

/** Merge a set of ids into the local store (used after server sync). */
export function mergeFavoriteIds(ids: string[]) {
  const current = readIds();
  const merged = Array.from(new Set([...current, ...ids]));
  writeIds(merged);
  return merged;
}
