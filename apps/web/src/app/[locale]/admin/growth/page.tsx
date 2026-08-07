'use client';

import { useState } from 'react';
import { RequireAuth } from '../../../../components/RequireAuth';
import { TrendingUp } from '../../../../components/lovable/icons';
import Link from 'next/link';
import { useParams } from 'next/navigation';

function AdminGrowthPageInner() {
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Crescimento</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">Growth Metrics</h1>
              <p className="mt-1 text-[var(--muted-foreground)]">Signups, activation rate, week-over-week trends</p>
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
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">Signups (7d)</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">342</p>
          <p className="mt-1 text-[11px] text-green-600">+28% vs semana passada</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">Activation Rate</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">34.2%</p>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">Signup → Feature use</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">WoW Growth</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">+15%</p>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">Semana vs semana</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Gráfico de Signups</h3>
        <div className="mt-6 h-64 rounded-lg bg-[var(--muted)]" />
      </div>
    </div>
  );
}

export default function AdminGrowthPage() {
  return (
    <RequireAuth>
      <AdminGrowthPageInner />
    </RequireAuth>
  );
}
