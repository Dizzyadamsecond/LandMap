'use client';

import { useCallback, useEffect, useState } from 'react';

type Sub = {
  id: string;
  leadId: string;
  plan: string;
  status: string;
  mrr: number;
  currency: string;
  closedByAgent: string;
  source: string;
  createdAt: string;
};
type Daily = {
  date: string;
  goal: number;
  subs: number;
  trials: number;
  paid: number;
  leads: number;
  deals: number;
};

export default function AdminSubscriptionsPage() {
  const [daily, setDaily] = useState<Daily | null>(null);
  const [items, setItems] = useState<Sub[]>([]);
  const [total, setTotal] = useState(0);
  const [mrr, setMrr] = useState(0);
  const [active, setActive] = useState(0);
  const [trials, setTrials] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/sales/subscriptions');
      const d = await r.json();
      setDaily(d.daily);
      setItems(d.items ?? []);
      setTotal(d.total ?? 0);
      setMrr(d.mrr ?? 0);
      setActive(d.active ?? 0);
      setTrials(d.trials ?? 0);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'falha');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const goal = daily?.goal ?? 1000;
  const pct = goal ? Math.round((total / goal) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--primary)]">Admin · só interno</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Assinaturas
          </h1>
          <p className="mt-1 text-[var(--muted-foreground)]">
            Meta diária do esquadrão de agentes · {goal}/dia
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs text-[var(--muted-foreground)]"
        >
          Atualizar
        </button>
      </header>

      {error && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--muted-foreground)]">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] text-[var(--muted-foreground)]">Progresso da meta (hoje)</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--foreground)]">
              {total} / {goal} ({pct}%)
            </p>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            {daily?.date ? `Dia ${daily.date}` : ''}
          </p>
        </div>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-[var(--muted)]">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-all"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'MRR (BRL)', value: mrr },
          { label: 'Ativas', value: active },
          { label: 'Trials', value: trials },
          { label: 'Total', value: total },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
            <p className="text-[11px] text-[var(--muted-foreground)]">{c.label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--foreground)]">{c.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Últimas assinaturas</h2>
        <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto">
          {items.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2">
              <div>
                <p className="font-mono text-[11px] text-[var(--muted-foreground)]">{s.id}</p>
                <p className="text-sm font-medium">
                  {s.plan.toUpperCase()} · {s.status}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm tabular-nums">
                  {s.currency} {s.mrr}/mês
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  {s.closedByAgent.replace('agent-', '')} · {s.source}
                </p>
              </div>
            </li>
          ))}
          {items.length === 0 && <li className="text-xs text-[var(--muted-foreground)]">Nenhuma ainda.</li>}
        </ul>
      </section>
    </div>
  );
}
