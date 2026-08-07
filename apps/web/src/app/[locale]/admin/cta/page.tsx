'use client';

import { useEffect, useState } from 'react';
import { RequireAuth } from '../../../../components/RequireAuth';
import { ArrowRight, TrendingUp } from '../../../../components/lovable/icons';
import Link from 'next/link';
import { useParams } from 'next/navigation';

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <p className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">{hint}</p>}
    </div>
  );
}

function AdminCtaPageInner() {
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/events/cta-report', { cache: 'no-store' })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-8 w-56 animate-pulse rounded bg-[var(--muted)]" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--muted)]" />
          ))}
        </div>
      </div>
    );
  }

  const ctas = data?.ctaByCampaign ?? [];
  const totalImpressions = data?.totals?.impressions ?? 0;
  const totalClicks = data?.totals?.clicks ?? 0;
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0';

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Conversão</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">CTAs</h1>
              <p className="mt-1 text-[var(--muted-foreground)]">Impressões, cliques e taxa de conversão por variante.</p>
            </div>
          </div>
          <Link
            href={`/${locale}/admin`}
            className="inline-flex items-center rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--muted)]"
          >
            Voltar
          </Link>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Impressões" value={totalImpressions.toLocaleString('pt-BR')} hint="Total de visualizações" />
        <StatCard label="Cliques" value={totalClicks.toLocaleString('pt-BR')} hint="Total de interações" />
        <StatCard label="CTR" value={`${ctr}%`} hint="Taxa de clique" />
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">CTAs Principais</h3>
        <div className="mt-4 space-y-3">
          {ctas.length > 0 ? (
            ctas.slice(0, 10).map((cta: any, idx: number) => (
              <Link
                key={cta.ctaId || idx}
                href={`/${locale}/admin/cta/${cta.ctaId || idx}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--muted)] px-4 py-3 transition hover:border-[var(--primary)]"
              >
                <span className="min-w-0 flex-1 truncate text-sm text-[var(--foreground)]">{cta.ctaId || `CTA ${idx + 1}`}</span>
                <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                  <span>{(cta.impressions || 0).toLocaleString('pt-BR')}</span>
                  <span>{((cta.ctr || 0) * 100).toFixed(1)}%</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">Nenhum CTA rastreado ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminCtaPage() {
  return (
    <RequireAuth>
      <AdminCtaPageInner />
    </RequireAuth>
  );
}
