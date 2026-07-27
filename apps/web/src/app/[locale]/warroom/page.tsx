'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { RequireAuth } from '../../../components/RequireAuth';
import { Card, Badge, Button, MetricStat, Progress, Sparkline, cn } from '@landmap/ui';
import { Bot, Activity, Zap, TrendingUp, AlertTriangle } from '../../../components/lovable/icons';

interface AgentView {
  id: string;
  name: string;
  role: string;
  status: string;
  currentTask?: string;
  actionsToday: number;
  successToday: number;
}
interface ModeView {
  simulated: boolean;
  realChannel: boolean;
  realPayments: boolean;
  realLeads: boolean;
  note: string;
}
interface SalesState {
  generatedAt: string;
  autonomy: string;
  total: number;
  active: number;
  trials: number;
  mrr: number;
  goal: number;
  daily: { subs: number; trials: number; paid: number; leads: number; deals: number; goal: number };
  firstSaleAt: string | null;
  agents: AgentView[];
  totals: { leads: number; deals: number; tasks: number; events: number };
  mode: ModeView;
}

const POLL_MS = 3000;

export default function WarRoomPage() {
  const locale = useLocale();
  const [state, setState] = useState<SalesState | null>(null);
  const [loading, setLoading] = useState(true);
  const [firing, setFiring] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const r = await fetch('/api/sales/state', { cache: 'no-store' });
      if (!r.ok) return;
      const j = (await r.json()) as SalesState;
      setState(j);
      setHistory((h) => [...h.slice(-39), j.total]);
    } catch {
      /* mantém último estado */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
    timer.current = setInterval(fetchState, POLL_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [fetchState]);

  const fireCycle = useCallback(async () => {
    setFiring(true);
    try {
      await fetch('/api/sales/loop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycles: 400 }),
      });
      await fetchState();
    } finally {
      setFiring(false);
    }
  }, [fetchState]);

  const pct = state && state.goal ? Math.round((state.total / state.goal) * 100) : 0;

  return (
    <RequireAuth>
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col bg-background px-4 py-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--primary)]">
              <Zap className="h-4 w-4" /> War Room · Vendas em tempo real
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">LandMap Sales Engine</h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {state ? `Atualizado ${new Date(state.generatedAt).toLocaleTimeString('pt-BR')}` : 'Conectando…'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {state?.mode.simulated && (
              <Badge variant="warning" className="gap-1">
                <AlertTriangle className="h-3 w-3" /> MODO SIMULADO
              </Badge>
            )}
            <Badge variant="outline" className="gap-1">
              <Activity className="h-3 w-3" /> autonomia: {state?.autonomy ?? '—'}
            </Badge>
            <Button size="sm" onClick={fireCycle} disabled={firing}>
              <Zap className="mr-2 h-4 w-4" /> {firing ? 'Disparando…' : 'Disparar ciclo'}
            </Button>
          </div>
        </header>

        {state?.mode.simulated && (
          <div className="mt-4 rounded-lg border border-[var(--warning)]/40 bg-[var(--warning)]/10 p-3 text-xs text-[var(--warning)]">
            {state.mode.note} Este dashboard mostra o motor acumulando em tempo real. Para virar venda real, plugue
            STRIPE_SECRET_KEY (pagamento) + RESEND_API_KEY/TWILIO (envio) + lista de leads no .env.
          </div>
        )}

        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricStat label="Assinaturas (total)" value={state?.total ?? 0} hint={`meta ${state?.goal?.toLocaleString() ?? ''}`} />
          <MetricStat label="Ativas" value={state?.active ?? 0} />
          <MetricStat label="Trials" value={state?.trials ?? 0} />
          <MetricStat label="MRR (R$)" value={(state?.mrr ?? 0).toLocaleString('pt-BR')} />
        </section>

        <section className="mt-4 grid gap-3 lg:grid-cols-3">
          <Card className="p-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Progresso até a meta</p>
              <span className="text-sm font-bold text-[var(--primary)]">{pct}%</span>
            </div>
            <Progress value={pct} className="mt-2" />
            <div className="mt-4 flex items-center gap-3">
              <Sparkline data={history.length ? history : [0, 0]} className="h-12 flex-1 text-[var(--primary)]" />
              <div className="text-right text-xs text-[var(--muted-foreground)]">
                <p>hoje: {state?.daily.subs ?? 0}</p>
                <p>leads: {state?.totals.leads ?? 0} · deals: {state?.totals.deals ?? 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-medium">Primeira venda</p>
            <p className="mt-2 text-lg font-semibold">
              {state?.firstSaleAt ? new Date(state.firstSaleAt).toLocaleString('pt-BR') : 'ainda não'}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
              <TrendingUp className="h-3 w-3" /> {state?.totals.events ?? 0} eventos de agente
            </p>
          </Card>
        </section>

        <section className="mt-6">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
            <Bot className="h-4 w-4" /> Agentes ({state?.agents.length ?? 0})
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {state?.agents.map((a) => (
              <Card key={a.id} className="p-4">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      a.status === 'running' ? 'bg-[var(--primary)] animate-pulse' : 'bg-neutral-500',
                    )}
                  />
                  <h3 className="font-semibold">{a.name}</h3>
                </div>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{a.role}</p>
                <p className="mt-2 text-sm text-foreground/70 line-clamp-2">{a.currentTask ?? 'em espera'}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                  <span>{a.actionsToday} ações</span>
                  <span>{a.successToday} ok</span>
                </div>
              </Card>
            ))}
            {!state && loading && <p className="text-sm text-[var(--muted-foreground)]">Carregando motor…</p>}
          </div>
        </section>
      </div>
    </RequireAuth>
  );
}
