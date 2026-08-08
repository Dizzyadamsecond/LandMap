'use client';

import { useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import {
  LayoutGrid,
  Satellite,
  Briefcase,
  Building2,
  Radio,
  Search,
  ExternalLink,
  RefreshCw,
  Check,
  X,
} from '../../../components/lovable/icons';
import { Card, Badge, cn } from '@landmap/ui';
import { BR_APIS, BR_API_CATEGORIES, type BrApi } from '../../../lib/brApis';

const CATEGORY_ICON: Record<BrApi['category'], React.ComponentType<{ className?: string }>> = {
  Geografia: LayoutGrid,
  Clima: Satellite,
  Economia: Briefcase,
  Governo: Briefcase,
  Telecom: Radio,
  Imobiliário: Building2,
  Utilidades: RefreshCw,
};

interface ProbeState {
  status: 'idle' | 'loading' | 'ok' | 'error';
  statusCode?: number;
  bytes?: number;
  message?: string;
}

export default function BrasilApisPage() {
  const locale = useLocale();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<string>('Todas');
  const [probes, setProbes] = useState<Record<string, ProbeState>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BR_APIS.filter((a) => {
      const matchCat = cat === 'Todas' || a.category === cat;
      const matchQ =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [query, cat]);

  async function testApi(api: BrApi) {
    setProbes((p) => ({ ...p, [api.id]: { status: 'loading' } }));
    try {
      const res = await fetch(`/api/br/${api.id}`, { cache: 'no-store' });
      const ct = res.headers.get('content-length');
      let bytes = ct ? parseInt(ct, 10) : undefined;
      let message: string | undefined;
      try {
        const body = await res.json();
        if (typeof body?.status === 'number') bytes = JSON.stringify(body).length;
        if (body?.error) message = body.error;
      } catch {
        const txt = await res.text();
        bytes = txt.length;
      }
      setProbes((p) => ({
        ...p,
        [api.id]: {
          status: res.ok ? 'ok' : 'error',
          statusCode: res.status,
          bytes,
          message,
        },
      }));
    } catch (e) {
      setProbes((p) => ({
        ...p,
        [api.id]: {
          status: 'error',
          message: e instanceof Error ? e.message : 'network error',
        },
      }));
    }
  }

  const total = BR_APIS.length;
  const testedOk = Object.values(probes).filter((p) => p.status === 'ok').length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
            <LayoutGrid className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-3xl font-semibold text-[var(--foreground)]">APIs Públicas do Brasil</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              {total} endpoints gratuitos e abertos — geografia, clima, economia, governo e mais.
              Teste ao vivo sem sair da página.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar API…"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            <option>Todas</option>
            {BR_API_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <p className="mt-3 text-xs text-[var(--muted-foreground)]">
          Live: <span className="font-medium text-[var(--foreground)]">{testedOk}</span> de{' '}
          {Object.keys(probes).length} testadas com sucesso.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((api, i) => {
          const Icon = CATEGORY_ICON[api.category];
          const probe = probes[api.id];
          return (
            <motion.div
              key={api.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.015, 0.4) }}
            >
              <Card className="flex h-full flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--foreground)]">{api.name}</h3>
                      <Badge className="mt-0.5 bg-[var(--primary)]/10 text-[var(--primary)]">{api.category}</Badge>
                    </div>
                  </div>
                  <ProbeBadge probe={probe} />
                </div>
                <p className="flex-1 text-xs leading-relaxed text-[var(--muted-foreground)]">{api.description}</p>
                <div className="flex items-center justify-between gap-2">
                  <a
                    href={api.docs}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)]"
                  >
                    Docs <ExternalLink className="h-3 w-3" />
                  </a>
                  <button
                    onClick={() => testApi(api)}
                    disabled={probe?.status === 'loading'}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-50',
                    )}
                  >
                    {probe?.status === 'loading' ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    Testar
                  </button>
                </div>
                {probe?.status === 'ok' && (
                  <p className="text-[11px] text-emerald-500">
                    ✓ {probe.statusCode} · {probe.bytes ? `${probe.bytes} B` : 'ok'}
                  </p>
                )}
                {probe?.status === 'error' && (
                  <p className="text-[11px] text-red-500">
                    ✗ {probe.statusCode || 'erro'} · {probe.message || 'falhou'}
                  </p>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </main>
  );
}

function ProbeBadge({ probe }: { probe?: ProbeState }) {
  if (!probe || probe.status === 'idle') return <span className="text-[var(--muted-foreground)]">·</span>;
  if (probe.status === 'loading')
    return <RefreshCw className="h-4 w-4 animate-spin text-[var(--muted-foreground)]" />;
  if (probe.status === 'ok')
    return <Check className="h-4 w-4 text-emerald-500" />;
  return <X className="h-4 w-4 text-red-500" />;
}
