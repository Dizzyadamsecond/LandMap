'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Autenticação MOCKADA do Google.
 *
 * Não faz nenhuma chamada de rede nem OAuth real — apenas simula o fluxo
 * (latência + gravação de uma "sessão" em localStorage) para que o design de
 * login social fique 100% visível e testável em qualquer ambiente, inclusive
 * no deploy estático. Trocar por OAuth real depois é só substituir
 * `signInWithGoogleMock` por `signInWithGoogle` do provedor escolhido.
 */

export type MockUser = {
  id: string;
  name: string;
  email: string;
  provider: 'google' | 'email' | 'guest';
  /** Plano efetivo — guest/free liberam o produto sem paywall. */
  plan?: 'free' | 'access' | 'plus' | 'pro' | 'business';
  userType?: UserType;
};

export type UserType =
  | 'corretor'
  | 'investidor'
  | 'fundo'
  | 'incorporadora'
  | 'comprador';

const STORAGE_KEY = 'landmap_mock_user';
const USER_TYPE_KEY = 'landmap_user_type';

/** Persiste o segmento escolhido no cadastro (usado também sem login real). */
export function storeUserType(type: UserType): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(USER_TYPE_KEY, type);
  } catch {
    /* ignore */
  }
}

export function readUserType(): UserType | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(USER_TYPE_KEY);
    return raw ? (raw as UserType) : null;
  } catch {
    return null;
  }
}

const MOCK_GOOGLE_USER: MockUser = {
  id: 'google_' + Math.random().toString(36).slice(2, 10),
  name: 'Usuário Google',
  email: 'usuario@gmail.com',
  provider: 'google',
};

export function readMockUser(): MockUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MockUser) : null;
  } catch {
    return null;
  }
}

function writeMockUser(user: MockUser): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    if (user.userType) storeUserType(user.userType);
  } catch {
    /* ignore */
  }
}

/** Simula o popup/redirect do Google. Resolve após ~600ms com um perfil fake. */
export function signInWithGoogleMock(userType?: UserType): Promise<MockUser> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user: MockUser = {
        ...MOCK_GOOGLE_USER,
        id: 'google_' + Math.random().toString(36).slice(2, 10),
        plan: 'free',
        userType,
      };
      writeMockUser(user);
      resolve(user);
    }, 600);
  });
}

/** Login e-mail/senha mock — grava sessão local para passar o RequireAuth. */
export function signInWithEmailMock(opts?: {
  email?: string;
  name?: string;
  userType?: UserType;
}): Promise<MockUser> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user: MockUser = {
        id: 'email_' + Math.random().toString(36).slice(2, 10),
        name: opts?.name?.trim() || 'Usuário LandMap',
        email: opts?.email?.trim() || 'usuario@landmap.app',
        provider: 'email',
        plan: 'free',
        userType: opts?.userType ?? readUserType() ?? undefined,
      };
      writeMockUser(user);
      resolve(user);
    }, 400);
  });
}

/**
 * Acesso gratuito (visitante).
 * Garante sessão local com plan=free — mapa, regiões, favoritos etc. abrem sem paywall.
 */
export function signInAsGuestMock(userType?: UserType): MockUser {
  const existing = readMockUser();
  if (existing) return existing;
  const user: MockUser = {
    id: 'guest_' + Math.random().toString(36).slice(2, 10),
    name: 'Visitante',
    email: 'guest@landmap.app',
    provider: 'guest',
    plan: 'free',
    userType: userType ?? readUserType() ?? undefined,
  };
  writeMockUser(user);
  return user;
}

/** Garante sessão free se ainda não houver usuário (acesso aberto). */
export function ensureFreeAccess(): MockUser {
  return readMockUser() ?? signInAsGuestMock();
}

export function signOutMock(): void {
  if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
}

const LOCALE_PREFIX = /^\/(pt-BR|en-US|es-ES)(?=\/|$)/;

/** Strip any leading locale prefix, returning the bare path (always starts with /). */
function stripLocale(path: string): string {
  const without = path.replace(LOCALE_PREFIX, '');
  return without.startsWith('/') ? without : `/${without}`;
}

/**
 * Post-auth redirect helpers.
 *
 * The canonical free landing surface is `/map` (locale-prefixed, e.g. `/pt-BR/map`).
 * Internal paths in this app are ALWAYS locale-prefixed, so we must match against
 * `/pt-BR/map`, `/pt-BR/dashboard`, etc. — not the bare `/map`.
 *
 * `returnTo` may arrive either locale-prefixed (`/pt-BR/dashboard`) or bare
 * (`/dashboard`); we normalize to the requested locale and prevent open redirects
 * (only same-origin relative paths are honored).
 */
export function getPostAuthRedirect(returnTo?: string, locale = 'pt-BR'): string {
  const candidates: string[] = [];
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem('landmap:post_auth_return');
      if (stored) {
        window.localStorage.removeItem('landmap:post_auth_return');
        candidates.push(stored);
      }
    } catch {
      /* ignore */
    }
  }
  if (returnTo) candidates.push(returnTo);

  for (const c of candidates) {
    if (!c || c === '/' || c.startsWith('//') || /^[a-z]+:\/\//i.test(c)) continue;
    return `/${locale}${stripLocale(c)}`;
  }
  return `/${locale}/map`;
}

/** Persists the page the user should return to after auth (locale-prefixed path). */
export function setPostAuthReturn(href: string | undefined | null): void {
  if (!href || typeof window === 'undefined') return;
  if (href === '/' || href.startsWith('//') || /^[a-z]+:\/\//i.test(href)) return;
  try {
    window.localStorage.setItem('landmap:post_auth_return', href);
  } catch {
    /* ignore */
  }
}

export function clearPostAuthReturn(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem('landmap:post_auth_return');
  } catch {
    /* ignore */
  }
}

/** Returns true when the current free flow should treat `/map` as primary. */
export function isDashboardPrimaryFlow(): boolean {
  return false;
}

/** Hook de sessão mockada — fonte única de verdade do estado "logado". */
export function useMockUser() {
  const [user, setUser] = useState<MockUser | null>(null);

  useEffect(() => {
    setUser(readMockUser());
  }, []);

  const signIn = useCallback(async (userType?: UserType): Promise<MockUser> => {
    const u = await signInWithGoogleMock(userType);
    setUser(u);
    return u;
  }, []);

  const signInEmail = useCallback(
    async (opts?: { email?: string; name?: string; userType?: UserType }): Promise<MockUser> => {
      const u = await signInWithEmailMock(opts);
      setUser(u);
      return u;
    },
    [],
  );

  const signInGuest = useCallback((userType?: UserType): MockUser => {
    const u = signInAsGuestMock(userType);
    setUser(u);
    return u;
  }, []);

  const signOut = useCallback(() => {
    signOutMock();
    setUser(null);
  }, []);

  return { user, signIn, signInEmail, signInGuest, signOut };
}
