'use client';

import { useState } from 'react';
import { RequireAuth } from '../../../../components/RequireAuth';
import { AlertTriangle, Plus, Trash2 } from '../../../../components/lovable/icons';
import Link from 'next/link';
import { useParams } from 'next/navigation';

function AdminAlertRulesPageInner() {
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';
  const [rules, setRules] = useState([
    { id: '1', name: 'High churn rate', condition: 'Churn > 5%', enabled: true },
    { id: '2', name: 'Low engagement', condition: 'DAU < 100', enabled: true },
    { id: '3', name: 'Error spike', condition: 'Errors > 50/min', enabled: false },
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Alert Rules</h1>
            <p className="mt-1 text-[var(--muted-foreground)]">Alertas automáticos por métrica</p>
          </div>
        </div>
      </header>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Regras Ativas</h3>
        <div className="mt-4 space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--muted)] px-4 py-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--foreground)]">{rule.name}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{rule.condition}</p>
              </div>
              <button
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  rule.enabled
                    ? 'bg-green-500/20 text-green-700'
                    : 'bg-gray-500/20 text-gray-700'
                }`}
              >
                {rule.enabled ? 'Ativo' : 'Inativo'}
              </button>
              <button className="text-[var(--muted-foreground)] transition hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminAlertRulesPage() {
  return (
    <RequireAuth>
      <AdminAlertRulesPageInner />
    </RequireAuth>
  );
}
