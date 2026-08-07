'use client';

import { useEffect, useState } from 'react';
import { RequireAuth } from '../../../../components/RequireAuth';
import { Users } from '../../../../components/lovable/icons';
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

function AdminRetentionPageInner() {
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/events/retention?scope=cohort', { cache: 'no-store' })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-8 w-56 animate-pulse rounded bg-[var(--muted)]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Retenção</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">Usuários</h1>
              <p className="mt-1 text-[var(--muted-foreground)]">Cohort analysis, DAU/WAU/MAU e churn risk.</p>
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
        <StatCard label="DAU" value={data?.dau?.toLocaleString('pt-BR') ?? '0'} hint="Usuários ativos diários" />
        <StatCard label="WAU" value={data?.wau?.toLocaleString('pt-BR') ?? '0'} hint="Usuários ativos semanais" />
        <StatCard label="MAU" value={data?.mau?.toLocaleString('pt-BR') ?? '0'} hint="Usuários ativos mensais" />
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Cohort Matrix (Semanas)</h3>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">Usuários por semana de signup (linhas) vs semanas passadas (colunas)</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="pb-2 text-left text-[var(--muted-foreground)]">Cohort Week</th>
                <th className="pb-2 text-center text-[var(--muted-foreground)]">W0</th>
                <th className="pb-2 text-center text-[var(--muted-foreground)]">W1</th>
                <th className="pb-2 text-center text-[var(--muted-foreground)]">W2</th>
                <th className="pb-2 text-center text-[var(--muted-foreground)]">W3</th>
              </tr>
            </thead>
            <tbody>
              {data?.cohortMatrix?.length ? (
                data.cohortMatrix.slice(0, 10).map((row: any, idx: number) => (
                  <tr key={idx} className="border-b border-[var(--border)]">
                    <td className="py-2 text-[var(--foreground)]">{row.cohort_week || `Week ${idx}`}</td>
                    <td className="py-2 text-center text-[var(--foreground)]">{row.week_0 || '—'}</td>
                    <td className="py-2 text-center text-[var(--foreground)]">{row.week_1 || '—'}</td>
                    <td className="py-2 text-center text-[var(--foreground)]">{row.week_2 || '—'}</td>
                    <td className="py-2 text-center text-[var(--foreground)]">{row.week_3 || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-[var(--muted-foreground)]">
                    Sem dados de cohort ainda
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Link
          href={`/${locale}/admin/retention/active-users`}
          className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--primary)]"
        >
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Usuários Ativos</h3>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">Gráfico de tendência DAU/WAU/MAU →</p>
        </Link>
        <Link
          href={`/${locale}/admin/churn-risk`}
          className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--primary)]"
        >
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Churn Risk</h3>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">Usuários em risco de cancelamento →</p>
        </Link>
      </div>
    </div>
  );
}

export default function AdminRetentionPage() {
  return (
    <RequireAuth>
      <AdminRetentionPageInner />
    </RequireAuth>
  );
}
