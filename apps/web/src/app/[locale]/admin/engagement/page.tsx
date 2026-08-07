'use client';

import { RequireAuth } from '../../../../components/RequireAuth';
import { Activity, TrendingUp } from '../../../../components/lovable/icons';
import Link from 'next/link';
import { useParams } from 'next/navigation';

function AdminEngagementPageInner() {
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';

  const features = [
    { name: 'Mapa', users: 8932, percentage: 94.5, trend: '+12%' },
    { name: 'Favoritos', users: 6234, percentage: 65.8, trend: '+8%' },
    { name: 'Comparador', users: 3421, percentage: 36.1, trend: '+5%' },
    { name: 'Chat', users: 1892, percentage: 19.9, trend: '+22%' },
    { name: 'Relatórios', users: 892, percentage: 9.4, trend: '+3%' },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Engajamento</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">Feature Usage</h1>
              <p className="mt-1 text-[var(--muted-foreground)]">Ranking de features por adoção de usuários</p>
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

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Top Features por Uso</h3>
        <div className="mt-4 space-y-3">
          {features.map((feature) => (
            <div key={feature.name} className="flex items-center gap-4">
              <span className="w-24 text-sm font-medium text-[var(--foreground)]">{feature.name}</span>
              <div className="flex-1">
                <div className="h-8 rounded-full bg-[var(--muted)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] transition-all duration-300"
                    style={{ width: `${feature.percentage}%` }}
                  />
                </div>
              </div>
              <div className="w-16 text-right">
                <p className="text-sm font-semibold text-[var(--foreground)]">{feature.percentage}%</p>
                <p className="text-xs text-green-600">{feature.trend}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Detalhes de Uso
        </h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="pb-2 text-left text-[var(--muted-foreground)]">Feature</th>
                <th className="pb-2 text-center text-[var(--muted-foreground)]">Usuários Ativos</th>
                <th className="pb-2 text-center text-[var(--muted-foreground)]">Sessões (7d)</th>
                <th className="pb-2 text-center text-[var(--muted-foreground)]">Tempo Médio</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature) => (
                <tr key={feature.name} className="border-b border-[var(--border)]">
                  <td className="py-3 text-[var(--foreground)]">{feature.name}</td>
                  <td className="py-3 text-center text-[var(--foreground)]">{feature.users.toLocaleString('pt-BR')}</td>
                  <td className="py-3 text-center text-[var(--foreground)]">{Number(feature.users * 1.2).toFixed(0)}</td>
                  <td className="py-3 text-center text-[var(--foreground)]">8m 23s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminEngagementPage() {
  return (
    <RequireAuth>
      <AdminEngagementPageInner />
    </RequireAuth>
  );
}
