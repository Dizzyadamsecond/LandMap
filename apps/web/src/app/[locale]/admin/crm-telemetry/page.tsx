'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BellRing, Code2, Check, X, CalendarClock, Bot, Activity } from '../../../../components/lovable/icons';
import { Card, Badge, Button, Stat, buttonVariants, cn } from '@landmap/ui';

type TelemetryLog = {
  id: string;
  agent: string;
  action: string;
  status: 'success' | 'warning' | 'error';
  latency: number;
  time: string;
  crmSynced: boolean;
};

const INITIAL_TELEMETRY: TelemetryLog[] = [
  { id: 'log-1', agent: 'Valquiria (Qualificadora)', action: 'Análise de Matrícula OCR', status: 'success', latency: 124, time: '14:50:22', crmSynced: true },
  { id: 'log-2', agent: 'Felipe (Follow-up)', action: 'Webhook Lead Triggered', status: 'success', latency: 85, time: '14:48:10', crmSynced: true },
  { id: 'log-3', agent: 'Sistema Core', action: 'Twenty CRM Sync Lead', status: 'warning', latency: 450, time: '14:45:00', crmSynced: false },
  { id: 'log-4', agent: 'Amanda (Cold Recovery)', action: 'Simulador WABA Auto-reply', status: 'error', latency: 980, time: '14:42:15', crmSynced: false },
];

export default function CrmTelemetryPage() {
  const params = useParams();
  const locale = params.locale || 'pt-BR';
  const [logs, setLogs] = useState<TelemetryLog[]>(INITIAL_TELEMETRY);
  const [activeTab, setActiveTab] = useState<'all' | 'errors'>('all');

  const filtered = logs.filter((l) => activeTab === 'all' || l.status === 'error');

  function simulateIncomingEvent() {
    const nextLog: TelemetryLog = {
      id: `log-${Math.random().toString(36).slice(2, 6)}`,
      agent: Math.random() > 0.5 ? 'Valquiria (Qualificadora)' : 'Felipe (Follow-up)',
      action: 'Webhook Outbound HMAC Triggered',
      status: Math.random() > 0.8 ? 'error' : 'success',
      latency: Math.floor(50 + Math.random() * 200),
      time: new Date().toLocaleTimeString(),
      crmSynced: Math.random() > 0.3,
    };
    setLogs((prev) => [nextLog, ...prev]);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      {/* Header */}
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Developer Ops · Admin</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">Telemetria de CRM & Agentes</h1>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Painel de telemetria das integrações com o CRM Twenty, envio de WhatsApp e execução de loops dos robôs autônomos</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/${locale}/admin`}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full')}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Painel Admin
            </Link>
            <Button onClick={simulateIncomingEvent} size="sm" className="rounded-full">
              <Bot className="mr-1.5 h-4 w-4" />
              Simular Evento
            </Button>
          </div>
        </div>
      </header>

      {/* Grid Specs */}
      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        {/* Telemetry log ledger */}
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold">Fila de Eventos em Tempo Real</h2>
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('all')}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs transition',
                  activeTab === 'all' ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'hover:bg-[var(--primary)]/5'
                )}
              >
                Todos
              </button>
              <button
                onClick={() => setActiveTab('errors')}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs transition',
                  activeTab === 'errors' ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'hover:bg-[var(--primary)]/5'
                )}
              >
                Erros
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs text-[var(--muted-foreground)] uppercase">
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Agente / Fonte</th>
                  <th className="pb-3">Ação executada</th>
                  <th className="pb-3">Latência</th>
                  <th className="pb-3">Sync CRM</th>
                  <th className="pb-3">Horário</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-sm">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--primary)]/5 transition">
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        {log.status === 'success' && <Check className="h-4 w-4 text-success" />}
                        {log.status === 'warning' && <X className="h-4 w-4 text-warning" />}
                        {log.status === 'error' && <X className="h-4 w-4 text-destructive" />}
                        <span className="font-semibold text-xs capitalize">{log.status}</span>
                      </div>
                    </td>
                    <td className="py-3 font-semibold text-xs">{log.agent}</td>
                    <td className="py-3 font-mono text-xs text-[var(--primary)]">{log.action}</td>
                    <td className="py-3 text-[var(--muted-foreground)]">
                      <div className="flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {log.latency}ms
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge variant={log.crmSynced ? 'success' : 'outline'}>
                        {log.crmSynced ? 'Sincronizado' : 'Pendente'}
                      </Badge>
                    </td>
                    <td className="py-3 text-[var(--muted-foreground)] text-xs">
                      {log.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Sync Summary */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Taxa de Sucesso CRM</h3>
            <p className="mt-2 text-3xl font-bold text-[var(--foreground)]">92.4%</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">Volume de sincronização saudável</p>
          </Card>

          <Card className="p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Status das Conexões</h4>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Twenty CRM API:</span>
              <span className="font-semibold text-success">Online</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">WhatsApp WABA Gateway:</span>
              <span className="font-semibold text-success">Online</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">RAG Vector DB:</span>
              <span className="font-semibold text-success">Connected</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
