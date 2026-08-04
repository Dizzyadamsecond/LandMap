'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BellRing, Code2, Check, X, CalendarClock, Send } from '../../../../../components/lovable/icons';
import { Card, Badge, Button, Stat, buttonVariants, cn } from '@landmap/ui';

type WebhookLog = {
  id: string;
  event: string;
  url: string;
  status: number;
  latency: number;
  timestamp: string;
  signature: string;
};

const INITIAL_LOGS: WebhookLog[] = [
  {
    id: 'log-1',
    event: 'opportunity.found',
    url: 'https://api.twenty.crm/webhooks/landmap',
    status: 200,
    latency: 145,
    timestamp: new Date().toISOString(),
    signature: 'sha256=a719d3fbc910283bd78a9c01c0',
  },
  {
    id: 'log-2',
    event: 'lead.created',
    url: 'https://n8n.workflow.io/webhook/leads',
    status: 201,
    latency: 210,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    signature: 'sha256=11d248abefc9103847ac001bfa',
  },
  {
    id: 'log-3',
    event: 'daily.report',
    url: 'https://webhook.site/test-endpoint',
    status: 500,
    latency: 890,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    signature: 'sha256=efbc912384a8bc009384bbad32',
  },
];

export default function WebhookLedgerPage() {
  const params = useParams();
  const locale = params.locale || 'pt-BR';
  const [logs, setLogs] = useState<WebhookLog[]>(INITIAL_LOGS);
  const [sending, setSending] = useState(false);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(INITIAL_LOGS[0]);

  function triggerTestWebhook() {
    setSending(true);
    setTimeout(() => {
      const nextLog: WebhookLog = {
        id: `log-${Math.random().toString(36).slice(2, 6)}`,
        event: 'opportunity.found',
        url: 'https://api.twenty.crm/webhooks/landmap',
        status: 200,
        latency: Math.floor(100 + Math.random() * 200),
        timestamp: new Date().toISOString(),
        signature: `sha256=${Math.random().toString(16).slice(2, 18)}`,
      };
      setLogs((prev) => [nextLog, ...prev]);
      setSelectedLog(nextLog);
      setSending(false);
    }, 1000);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      {/* Header */}
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Developer Ops</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">Histórico de Webhooks</h1>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Painel de telemetria para requisições de webhooks outbound com assinaturas HMAC</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/${locale}/admin/webhooks`}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full')}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Configurar Webhooks
            </Link>
            <Button onClick={triggerTestWebhook} disabled={sending} size="sm" className="rounded-full">
              <Send className="mr-1.5 h-4 w-4" />
              Disparar Payload Teste
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        {/* Ledger logs */}
        <Card className="p-6 overflow-x-auto">
          <h2 className="text-lg font-bold mb-4">Registro de Eventos Enviados</h2>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs text-[var(--muted-foreground)] uppercase">
                <th className="pb-3">Status</th>
                <th className="pb-3">Evento</th>
                <th className="pb-3">Endpoint Target</th>
                <th className="pb-3">Latência</th>
                <th className="pb-3">Horário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-sm">
              {logs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={cn(
                    'cursor-pointer transition hover:bg-[var(--primary)]/5',
                    selectedLog?.id === log.id && 'bg-[var(--primary)]/5'
                  )}
                >
                  <td className="py-3">
                    <div className="flex items-center gap-1.5">
                      {log.status < 300 ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <X className="h-4 w-4 text-destructive" />
                      )}
                      <span className="font-semibold">{log.status}</span>
                    </div>
                  </td>
                  <td className="py-3 font-mono text-xs text-[var(--primary)]">{log.event}</td>
                  <td className="py-3 text-[var(--muted-foreground)] truncate max-w-[200px]" title={log.url}>
                    {log.url}
                  </td>
                  <td className="py-3 text-[var(--muted-foreground)]">
                    <div className="flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {log.latency}ms
                    </div>
                  </td>
                  <td className="py-3 text-[var(--muted-foreground)] text-xs">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Selected Log Inspector */}
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5">
            <Code2 className="h-4 w-4 text-[var(--primary)]" />
            Inspetor de Webhook
          </h3>

          {selectedLog ? (
            <div className="space-y-4 text-xs">
              <div>
                <p className="text-[var(--muted-foreground)] font-semibold">Event ID</p>
                <p className="font-mono text-sm text-[var(--foreground)] mt-0.5">{selectedLog.id}</p>
              </div>

              <div>
                <p className="text-[var(--muted-foreground)] font-semibold">Assinatura HMAC (Header X-LandMap-Signature)</p>
                <p className="font-mono bg-[var(--background)] p-2 rounded-lg border border-[var(--border)] truncate mt-1" title={selectedLog.signature}>
                  {selectedLog.signature}
                </p>
              </div>

              <div>
                <p className="text-[var(--muted-foreground)] font-semibold">Payload do Evento (Simulado)</p>
                <pre className="mt-1 bg-[var(--background)] p-3 rounded-lg border border-[var(--border)] overflow-x-auto font-mono text-[10px] text-[var(--foreground)] leading-relaxed">
{JSON.stringify(
  {
    event: selectedLog.event,
    timestamp: selectedLog.timestamp,
    data: {
      id: "prop_9918",
      name: "Terreno Comercial Centro",
      score: 87,
      grade: "A",
      price: 2400000,
    },
  },
  null,
  2
)}
                </pre>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[var(--muted-foreground)]">Selecione um log para inspecionar.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
