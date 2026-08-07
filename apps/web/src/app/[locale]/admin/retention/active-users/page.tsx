'use client';

import { useEffect, useState } from 'react';
import { RequireAuth } from '../../../../../components/RequireAuth';
import { TrendingUp, ArrowLeft } from '../../../../../components/lovable/icons';
import Link from 'next/link';
import { useParams } from 'next/navigation';

function StatCard({ label, value, change }: { label: string; value: string; change?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <p className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{value}</p>
      {change && <p className="mt-1 text-[11px] text-green-600">{change}</p>}
    </div>
  );
}

function AdminActiveUsersPageInner() {
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) return null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href={`/${locale}/admin/retention`} className="text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Usuários Ativos</h1>
          </div>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Tendência de DAU, WAU, MAU nos últimos 30 dias</p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="DAU Atual" value="1.234" change="+5% vs ontem" />
        <StatCard label="WAU Atual" value="5.678" change="+12% vs semana passada" />
        <StatCard label="MAU Atual" value="12.890" change="+8% vs mês passado" />
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[var(--primary)]" />
          <h3 className="font-semibold text-[var(--foreground)]">Gráfico de Usuários Ativos</h3>
        </div>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">Aqui iria o gráfico de linha (DAU/WAU/MAU) — integrar com Recharts ou similar</p>
        <div className="mt-8 h-64 rounded-lg bg-[var(--muted)]" />
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Breakdown por Tipo de Usuário</h3>
        <div className="mt-4 space-y-2">
          {[
            { type: 'Corretor', dau: 456, wau: 1200, mau: 2500 },
            { type: 'Investidor', dau: 345, wau: 1100, mau: 2800 },
            { type: 'Comprador', dau: 234, wau: 890, mau: 1900 },
          ].map((row) => (
            <div key={row.type} className="flex items-center justify-between border-b border-[var(--border)] pb-2 last:border-0 last:pb-0">
              <span className="text-sm text-[var(--foreground)]">{row.type}</span>
              <div className="flex gap-4 text-[11px] text-[var(--muted-foreground)]">
                <span>DAU: {row.dau}</span>
                <span>WAU: {row.wau}</span>
                <span>MAU: {row.mau}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminActiveUsersPage() {
  return (
    <RequireAuth>
      <AdminActiveUsersPageInner />
    </RequireAuth>
  );
}
