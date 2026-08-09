'use client';

import { useState } from 'react';
import { RequireAuth } from '../../../../components/RequireAuth';
import { AlertTriangle, ArrowLeft } from '../../../../components/lovable/icons';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface ChurnedUser {
  id: string;
  name: string;
  email: string;
  lastActive: string;
  daysSinceActive: number;
  plan: string;
  ltv: number;
  riskLevel: 'high' | 'medium' | 'low';
}

function AdminChurnRiskPageInner() {
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const users: ChurnedUser[] = [
    {
      id: '1',
      name: 'João Silva',
      email: 'joao@example.com',
      lastActive: '2026-06-15',
      daysSinceActive: 45,
      plan: 'plus',
      ltv: 2500,
      riskLevel: 'high',
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'maria@example.com',
      lastActive: '2026-07-01',
      daysSinceActive: 30,
      plan: 'plus',
      ltv: 1200,
      riskLevel: 'medium',
    },
    {
      id: '3',
      name: 'Carlos Mendes',
      email: 'carlos@example.com',
      lastActive: '2026-07-10',
      daysSinceActive: 20,
      plan: 'free',
      ltv: 0,
      riskLevel: 'low',
    },
  ];

  const filtered = users.filter((u) => (filter === 'all' ? true : u.riskLevel === filter));
  const highRiskCount = users.filter((u) => u.riskLevel === 'high').length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href={`/${locale}/admin/retention`} className="text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Risco de Churn</h1>
          </div>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Usuários em risco de cancelamento (não ativos há +14 dias)</p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">Risco Alto</p>
          <p className="mt-2 text-2xl font-semibold text-red-600">{highRiskCount}</p>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">+45 dias sem atividade</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">Risco Médio</p>
          <p className="mt-2 text-2xl font-semibold text-yellow-600">{users.filter((u) => u.riskLevel === 'medium').length}</p>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">20-45 dias sem atividade</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">Risco Baixo</p>
          <p className="mt-2 text-2xl font-semibold text-green-600">{users.filter((u) => u.riskLevel === 'low').length}</p>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">14-20 dias sem atividade</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h3 className="font-semibold text-[var(--foreground)]">Lista de Usuários</h3>
        </div>

        <div className="mt-4 flex gap-2">
          {(['all', 'high', 'medium', 'low'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                filter === level
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
              }`}
            >
              {level === 'all' ? 'Todos' : level === 'high' ? 'Alto' : level === 'medium' ? 'Médio' : 'Baixo'}
            </button>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="pb-2 text-left text-[var(--muted-foreground)]">Usuário</th>
                <th className="pb-2 text-left text-[var(--muted-foreground)]">Última Atividade</th>
                <th className="pb-2 text-center text-[var(--muted-foreground)]">Dias Inativo</th>
                <th className="pb-2 text-center text-[var(--muted-foreground)]">LTV</th>
                <th className="pb-2 text-center text-[var(--muted-foreground)]">Risco</th>
                <th className="pb-2 text-right text-[var(--muted-foreground)]">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-[var(--border)]">
                  <td className="py-3">
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{user.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-3 text-[var(--foreground)]">{user.lastActive}</td>
                  <td className="py-3 text-center text-[var(--foreground)]">{user.daysSinceActive}</td>
                  <td className="py-3 text-center text-[var(--foreground)]">R$ {user.ltv.toLocaleString('pt-BR')}</td>
                  <td className="py-3 text-center">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${
                      user.riskLevel === 'high'
                        ? 'bg-red-500/20 text-red-700'
                        : user.riskLevel === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-700'
                          : 'bg-green-500/20 text-green-700'
                    }`}>
                      {user.riskLevel}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button className="text-xs text-[var(--primary)] transition hover:opacity-70">Contatar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminChurnRiskPage() {
  return (
    <RequireAuth>
      <AdminChurnRiskPageInner />
    </RequireAuth>
  );
}
