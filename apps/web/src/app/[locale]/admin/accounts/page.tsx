'use client';

import { RequireAuth } from '../../../../components/RequireAuth';
import { Users } from '../../../../components/lovable/icons';
import Link from 'next/link';
import { useParams } from 'next/navigation';

function AdminAccountsPageInner() {
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';

  const accounts = [
    { id: '1', name: 'Acme Corp', email: 'admin@acme.com', users: 45, health: 'healthy', mrr: 5000 },
    { id: '2', name: 'Tech Startup', email: 'ops@techstartup.io', users: 12, health: 'at_risk', mrr: 1200 },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Contas</h1>
            <p className="mt-1 text-[var(--muted-foreground)]">Health scores de clientes</p>
          </div>
        </div>
      </header>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="pb-2 text-left text-[var(--muted-foreground)]">Conta</th>
              <th className="pb-2 text-center text-[var(--muted-foreground)]">Usuários</th>
              <th className="pb-2 text-center text-[var(--muted-foreground)]">MRR</th>
              <th className="pb-2 text-center text-[var(--muted-foreground)]">Health</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc) => (
              <tr key={acc.id} className="border-b border-[var(--border)]">
                <td className="py-3">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{acc.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{acc.email}</p>
                  </div>
                </td>
                <td className="py-3 text-center text-[var(--foreground)]">{acc.users}</td>
                <td className="py-3 text-center text-[var(--foreground)]">R$ {acc.mrr.toLocaleString('pt-BR')}</td>
                <td className="py-3 text-center">
                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${
                    acc.health === 'healthy' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                  }`}>
                    {acc.health}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminAccountsPage() {
  return (
    <RequireAuth>
      <AdminAccountsPageInner />
    </RequireAuth>
  );
}
