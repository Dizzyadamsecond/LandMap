'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  Building2,
  TrendingUp,
  Bot,
  Zap,
  Check,
  X,
  Satellite,
  User,
  Filter,
  Activity,
} from '../../../components/lovable/icons';
import { ProductPageShell } from '../../../components/ProductPageShell';
import { Reveal } from '../../../components/Motion';
import { ErrorBoundary } from '../../../components/ErrorBoundary';
import { Card, Badge, Stat, Progress, buttonVariants, cn } from '@landmap/ui';
import { useSalesEngine } from './useSalesEngine';
import type { SalesAgent, SalesTask, AgentEvent, AutonomyLevel } from '@landmap/sales';

const AUTONOMY_LABEL: Record<AutonomyLevel, string> = {
  off: 'Desligado',
  copilot: 'Copiloto',
  autopilot: 'Autopilot',
};

const ROLE_LABEL: Record<string, string> = {
  prospector: 'Prospektor',
  qualifier: 'Qualificador',
  outreacher: 'Outreach',
  closer: 'Closer',
  account_manager: 'Account',
  forecaster: 'Forecaster',
  seo_agent: 'SEO',
  lead_enricher: 'Enriquecer',
  market_intel: 'Market Intel',
  onboarding: 'Onboarding',
  negotiator: 'Negociador',
  followup: 'Follow-up',
  cold_recovery: 'Recuperação',
  waba_followup: 'WABA',
  subscriptor: 'Assinaturas',
};

function statusTone(s: SalesAgent['status']): string {
  if (s === 'running') return 'text-[var(--primary)]';
  if (s === 'paused') return 'text-[var(--muted-foreground)]';
  return 'text-[var(--success)]';
}

function AgentRoster({ agents }: { agents: SalesAgent[] }) {
  return (
    <Card variant="default" className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <User className="h-4 w-4 text-[var(--primary)]" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]">
          Agentes ({agents.length})
        </h2>
      </div>
      <ul className="space-y-2">
        {agents.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate text-sm font-medium text-[var(--foreground)]">
                <Bot className="h-3.5 w-3.5 shrink-0" />
                {a.name}
              </p>
              <p className="truncate text-xs text-[var(--muted-foreground)]">
                {ROLE_LABEL[a.role] ?? a.role}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={`text-xs font-medium ${statusTone(a.status)}`}>
                {a.status === 'running' ? 'ativo' : a.status === 'paused' ? 'pausado' : 'idle'}
              </span>
              <span className="text-xs tabular-nums text-[var(--muted-foreground)]">
                {a.successToday}/{a.actionsToday}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TaskQueue({
  tasks,
  onApprove,
  onReject,
}: {
  tasks: SalesTask[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const pending = tasks.filter((t) => t.status === 'pending');
  return (
    <Card variant="default" className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Filter className="h-4 w-4 text-[var(--primary)]" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]">
          Fila de tarefas ({pending.length})
        </h2>
      </div>
      {pending.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          Nenhuma tarefa aguardando. Rode um ciclo para gerar ações.
        </p>
      ) : (
        <ul className="space-y-3">
          {pending.slice(0, 6).map((t) => (
            <li key={t.id} className="rounded-lg border border-[var(--border)] p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-[var(--foreground)]">{t.title}</p>
                <Badge variant="outline" className="shrink-0">{t.kind}</Badge>
              </div>
              {t.draft && (
                <p className="mt-1 line-clamp-3 text-xs text-[var(--muted-foreground)]">{t.draft}</p>
              )}
              {t.advanceTo && (
                <p className="mt-1 text-xs text-[var(--primary)]">Avança para: {t.advanceTo}</p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => onApprove(t.id)}
                  className={cn(buttonVariants({ size: 'sm', variant: 'default' }), 'gap-1')}
                >
                  <Check className="h-3.5 w-3.5" /> Aprovar
                </button>
                <button
                  type="button"
                  onClick={() => onReject(t.id)}
                  className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'gap-1')}
                >
                  <X className="h-3.5 w-3.5" /> Rejeitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function EventFeed({ events }: { events: AgentEvent[] }) {
  const recent = [...events].slice(0, 8);
  return (
    <Card variant="default" className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4 text-[var(--primary)]" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]">
          Atividade
        </h2>
      </div>
      {recent.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">Sem eventos ainda.</p>
      ) : (
        <ul className="space-y-2">
          {recent.map((e) => (
            <li key={e.id} className="flex items-start gap-2 text-xs">
              <span
                className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                  e.level === 'success'
                    ? 'bg-[var(--success)]'
                    : e.level === 'warn' || e.level === 'escalation'
                      ? 'bg-[var(--destructive)]'
                      : 'bg-[var(--primary)]'
                }`}
              />
              <span className="text-[var(--foreground)]">
                {e.title}
                {e.detail && <span className="text-[var(--muted-foreground)]"> — {e.detail}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function SalesCockpit() {
  const locale = useLocale();
  const lh = (p: string) => `/${locale}${p}`;
  const { state, running, cycle, setLevel, approve, reject } = useSalesEngine();

  const totals = state.analytics?.totals;
  const daily = state.daily;
  const pct = daily.goal ? Math.min(100, Math.round((daily.subs / daily.goal) * 100)) : 0;

  return (
    <ProductPageShell
      backHref="/map"
      eyebrow={
        <>
          <Building2 className="h-3 w-3" /> Vendas autônomas
        </>
      }
      title="Cockpit de vendas"
      description="Esquadrão de agentes autônomos com human-in-the-loop. Rode ciclos e aprove tarefas."
    >
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Pipeline" value={totals ? `R$ ${(totals.pipelineValue / 1000).toFixed(0)}k` : '—'} />
        <Stat label="Ganhos" value={totals ? String(totals.wonCount) : '—'} />
        <Stat label="Leads" value={String(state.leads.length)} />
        <Stat label="Deals" value={String(state.deals.length)} />
      </section>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link href={lh('/map')} className={cn(buttonVariants({ size: 'sm' }))}>
          Mapa
        </Link>
        <Link href={lh('/leads')} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          Leads
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-lg border border-[var(--border)] p-0.5">
            {(['off', 'copilot', 'autopilot'] as AutonomyLevel[]).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevel(lvl)}
                aria-pressed={state.autonomy === lvl}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition',
                  state.autonomy === lvl
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                )}
              >
                {AUTONOMY_LABEL[lvl]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => cycle()}
            disabled={running}
            className={cn(buttonVariants({ size: 'sm' }), 'gap-1', running && 'opacity-60')}
          >
            <Zap className={`h-3.5 w-3.5 ${running ? 'animate-spin' : ''}`} />
            {running ? 'Rodando…' : 'Rodar ciclo'}
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
          <Satellite className="h-3.5 w-3.5" /> Meta diária de assinaturas: {daily.subs}/{daily.goal}
        </span>
        <div className="flex-1">
          <Progress value={pct} />
        </div>
      </div>

      <Reveal className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <TaskQueue tasks={state.tasks} onApprove={approve} onReject={reject} />
          <EventFeed events={state.events} />
        </div>
        <div className="space-y-4">
          <AgentRoster agents={state.agents} />
          {totals && (
            <Card variant="default" className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[var(--primary)]" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]">
                  Funil
                </h2>
              </div>
              <ul className="space-y-1.5">
                {totals.winRate > 0 && (
                  <li className="flex justify-between text-xs text-[var(--muted-foreground)]">
                    <span>Taxa de conversão</span>
                    <span className="text-[var(--foreground)]">{Math.round(totals.winRate * 100)}%</span>
                  </li>
                )}
                <li className="flex justify-between text-xs text-[var(--muted-foreground)]">
                  <span>Ticket médio</span>
                  <span className="text-[var(--foreground)]">
                    R$ {(totals.avgDealSize / 1000).toFixed(0)}k
                  </span>
                </li>
                <li className="flex justify-between text-xs text-[var(--muted-foreground)]">
                  <span>Reuniões agendadas</span>
                  <span className="text-[var(--foreground)]">{totals.meetingsBooked}</span>
                </li>
              </ul>
            </Card>
          )}
        </div>
      </Reveal>
    </ProductPageShell>
  );
}

export default function SalesPage() {
  return (
    <ErrorBoundary>
      <SalesCockpit />
    </ErrorBoundary>
  );
}
