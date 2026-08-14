'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Phone, Plus, Trash2, Wand2, Send, CheckCircle2, Sparkles } from '../../../../components/lovable/icons';
import { Button } from '@landmap/ui';

interface VoiceAgent {
  id: string;
  name: string;
  voiceMode: 'hosted' | 'webhook';
  systemPrompt: string;
  beginMessage: string;
  voice: string;
  phoneNumbers: string[];
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

interface PhoneNumber {
  id: string;
  phoneNumber: string;
  country: string;
  status: 'active' | 'inactive';
  agentId: string;
  createdAt: string;
}

interface CallRecord {
  id: string;
  agentId: string;
  phoneNumber: string;
  fromNumber: string;
  toNumber: string;
  direction: 'inbound' | 'outbound';
  status: 'completed' | 'in-progress' | 'failed';
  durationSeconds: number;
  transcript: string;
  startedAt: string;
  endedAt: string;
}

interface VoiceOption {
  voiceId: string;
  name: string;
  provider: string;
  gender: 'male' | 'female' | 'neutral';
}

export default function AgentPhonePage() {
  const [agents, setAgents] = useState<VoiceAgent[]>([]);
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals
  const [showNewAgent, setShowNewAgent] = useState(false);
  const [showBuyNumber, setShowBuyNumber] = useState(false);
  const [showMakeCall, setShowMakeCall] = useState(false);
  const [editingAgent, setEditingAgent] = useState<VoiceAgent | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [callToNumber, setCallToNumber] = useState('');

  const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [agentsRes, numbersRes, callsRes, voicesRes] = await Promise.all([
        fetch(`${apiBase}/agentphone/agents`),
        fetch(`${apiBase}/agentphone/numbers`),
        fetch(`${apiBase}/agentphone/calls?limit=100`),
        fetch(`${apiBase}/agentphone/voices`),
      ]);

      const agentsData = await agentsRes.json();
      const numbersData = await numbersRes.json();
      const callsData = await callsRes.json();
      const voicesData = await voicesRes.json();

      setAgents(agentsData.data || []);
      setNumbers(numbersData.data || []);
      setCalls(callsData.data || []);
      setVoices(voicesData.data || []);
    } catch (error) {
      console.error('Error refreshing:', error);
      setMsg({ type: 'error', text: 'Erro ao carregar dados' });
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createAgent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    try {
      const formData = new FormData(e.currentTarget);
      const response = await fetch(`${apiBase}/agentphone/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          voiceMode: formData.get('voiceMode'),
          systemPrompt: formData.get('systemPrompt'),
          beginMessage: formData.get('beginMessage'),
          voice: formData.get('voice'),
        }),
      });

      if (!response.ok) throw new Error('Failed to create agent');

      setMsg({ type: 'success', text: 'Agente criado com sucesso' });
      setShowNewAgent(false);
      await refresh();
    } catch (error) {
      setMsg({ type: 'error', text: error instanceof Error ? error.message : 'Erro ao criar agente' });
    } finally {
      setBusy(false);
    }
  };

  const deleteAgent = async (id: string) => {
    if (!confirm('Tem certeza que quer deletar este agente?')) return;
    setBusy(true);
    try {
      const response = await fetch(`${apiBase}/agentphone/agents/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete agent');

      setMsg({ type: 'success', text: 'Agente deletado' });
      await refresh();
    } catch (error) {
      setMsg({ type: 'error', text: error instanceof Error ? error.message : 'Erro ao deletar' });
    } finally {
      setBusy(false);
    }
  };

  const buyNumber = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    try {
      const formData = new FormData(e.currentTarget);
      const response = await fetch(`${apiBase}/agentphone/numbers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: formData.get('agentId'),
          country: formData.get('country') || 'US',
          areaCode: formData.get('areaCode'),
        }),
      });

      if (!response.ok) throw new Error('Failed to buy number');

      setMsg({ type: 'success', text: 'Número comprado com sucesso' });
      setShowBuyNumber(false);
      await refresh();
    } catch (error) {
      setMsg({ type: 'error', text: error instanceof Error ? error.message : 'Erro ao comprar número' });
    } finally {
      setBusy(false);
    }
  };

  const releaseNumber = async (id: string) => {
    if (!confirm('Liberar este número? Não pode ser recuperado.')) return;
    setBusy(true);
    try {
      const response = await fetch(`${apiBase}/agentphone/numbers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to release number');

      setMsg({ type: 'success', text: 'Número liberado' });
      await refresh();
    } catch (error) {
      setMsg({ type: 'error', text: error instanceof Error ? error.message : 'Erro ao liberar número' });
    } finally {
      setBusy(false);
    }
  };

  const makeCall = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    try {
      const formData = new FormData(e.currentTarget);
      const response = await fetch(`${apiBase}/agentphone/calls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: formData.get('agentId'),
          toNumber: formData.get('toNumber'),
          initialGreeting: formData.get('initialGreeting'),
        }),
      });

      if (!response.ok) throw new Error('Failed to make call');

      setMsg({ type: 'success', text: 'Chamada iniciada' });
      setShowMakeCall(false);
      setCallToNumber('');
      await refresh();
    } catch (error) {
      setMsg({ type: 'error', text: error instanceof Error ? error.message : 'Erro ao fazer chamada' });
    } finally {
      setBusy(false);
    }
  };

  const agentStats = useMemo(() => {
    return {
      totalAgents: agents.length,
      activeAgents: agents.filter((a) => a.status === 'active').length,
      totalNumbers: numbers.length,
      totalCalls: calls.length,
      completedCalls: calls.filter((c) => c.status === 'completed').length,
      totalMinutes: Math.round(calls.reduce((sum, c) => sum + c.durationSeconds, 0) / 60),
    };
  }, [agents, numbers, calls]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--primary)]">
            <Phone className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--primary)]">Admin · AgentPhone</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">
              Agentes de voz com telefone real
            </h1>
            <p className="mt-1 text-[var(--muted-foreground)]">
              {agentStats.totalAgents} agentes · {agentStats.totalNumbers} números · {agentStats.totalCalls} chamadas
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowNewAgent(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-medium text-[var(--primary-foreground)]"
          >
            <Plus className="h-3.5 w-3.5" /> Novo agente
          </button>
          <button
            onClick={() => setShowBuyNumber(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium hover:border-[var(--primary)]"
          >
            <Phone className="h-3.5 w-3.5" /> Comprar número
          </button>
          <button
            onClick={() => void refresh()}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs text-[var(--muted-foreground)]"
          >
            Atualizar
          </button>
        </div>
      </header>

      {/* Stats */}
      <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Agentes', value: agentStats.totalAgents },
          { label: 'Ativos', value: agentStats.activeAgents },
          { label: 'Números', value: agentStats.totalNumbers },
          { label: 'Chamadas', value: agentStats.totalCalls },
          { label: 'Completas', value: agentStats.completedCalls },
          { label: 'Minutos', value: agentStats.totalMinutes },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3"
          >
            <p className="text-[11px] text-[var(--muted-foreground)]">{c.label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--foreground)]">{c.value}</p>
          </div>
        ))}
      </section>

      {/* Messages */}
      {msg && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            msg.type === 'success'
              ? 'border-[var(--primary)]/30 bg-[var(--primary)]/5 text-[var(--primary)]'
              : 'border-[var(--destructive)]/30 bg-[var(--destructive)]/5 text-[var(--destructive)]'
          }`}
        >
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="text-center text-[var(--muted-foreground)]">Carregando...</div>
      ) : (
        <>
          {/* Agents List */}
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h2 className="text-sm font-semibold">Agentes de voz ({agents.length})</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
                    <th className="py-2 px-3 text-left text-xs font-medium">Nome</th>
                    <th className="py-2 px-3 text-left text-xs font-medium">Voz</th>
                    <th className="py-2 px-3 text-left text-xs font-medium">Modo</th>
                    <th className="py-2 px-3 text-left text-xs font-medium">Números</th>
                    <th className="py-2 px-3 text-left text-xs font-medium">Status</th>
                    <th className="py-2 px-3 text-right text-xs font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {agents.map((agent) => (
                    <tr key={agent.id}>
                      <td className="py-3 px-3">
                        <p className="font-medium text-[var(--foreground)]">{agent.name}</p>
                        <p className="text-[11px] text-[var(--muted-foreground)] line-clamp-1">
                          {agent.systemPrompt}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-[var(--primary)]" />
                          <span className="text-[11px]">{agent.voice}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="rounded-full bg-[var(--accent)]/20 px-2 py-0.5 text-[10px]">
                          {agent.voiceMode}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-[11px]">{agent.phoneNumbers.length} número(s)</div>
                        {agent.phoneNumbers.map((pn) => (
                          <div key={pn} className="font-mono text-[10px] text-[var(--muted-foreground)]">
                            {pn}
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            agent.status === 'active'
                              ? 'bg-[var(--primary)]/15 text-[var(--primary)]'
                              : 'bg-[var(--muted-foreground)]/20 text-[var(--muted-foreground)]'
                          }`}
                        >
                          {agent.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedAgentId(agent.id);
                              setShowMakeCall(true);
                            }}
                            className="p-1.5 text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded"
                            title="Fazer chamada"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingAgent(agent)}
                            className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                            title="Editar"
                          >
                            <Wand2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => void deleteAgent(agent.id)}
                            className="p-1.5 text-[var(--destructive)]/60 hover:text-[var(--destructive)]"
                            title="Deletar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Calls History */}
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h2 className="text-sm font-semibold">Histórico de chamadas ({calls.length})</h2>
            <div className="mt-4 max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {calls.slice(0, 20).map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--muted)] p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {call.direction === 'outbound' ? (
                          <Send className="h-4 w-4 text-[var(--primary)]" />
                        ) : (
                          <Phone className="h-4 w-4 text-[var(--accent)]" />
                        )}
                        <p className="font-mono text-xs font-medium">{call.toNumber}</p>
                      </div>
                      <p className="mt-1 text-[10px] text-[var(--muted-foreground)] line-clamp-1">
                        {call.transcript || '(sem transcrição)'}
                      </p>
                      <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                        {call.durationSeconds}s · {new Date(call.startedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium ${
                        call.status === 'completed'
                          ? 'bg-[var(--primary)]/15 text-[var(--primary)]'
                          : call.status === 'in-progress'
                            ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                            : 'bg-[var(--destructive)]/15 text-[var(--destructive)]'
                      }`}
                    >
                      {call.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                      {call.status === 'in-progress' && <Sparkles className="h-3 w-3 animate-spin" />}
                      {call.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Numbers List */}
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h2 className="text-sm font-semibold">Números telefônicos ({numbers.length})</h2>
            <div className="mt-4 grid gap-2">
              {numbers.map((number) => {
                const agent = agents.find((a) => a.id === number.agentId);
                return (
                  <div
                    key={number.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--muted)] p-3"
                  >
                    <div>
                      <p className="font-mono text-sm font-medium">{number.phoneNumber}</p>
                      <p className="text-[10px] text-[var(--muted-foreground)]">
                        {agent?.name || 'Sem agente'} · {number.country}
                      </p>
                    </div>
                    <button
                      onClick={() => void releaseNumber(number.id)}
                      className="rounded-lg border border-[var(--destructive)]/30 px-2 py-1 text-[10px] text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
                    >
                      Liberar
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* Modal: New Agent */}
      {showNewAgent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--foreground)]/40 p-4"
          onClick={() => setShowNewAgent(false)}
        >
          <form
            onSubmit={createAgent}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">Criar novo agente</h3>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-[var(--foreground)]">Nome</span>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ex: Agente de vendas"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)]"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-[var(--foreground)]">Modo de voz</span>
                <select
                  name="voiceMode"
                  defaultValue="hosted"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)]"
                >
                  <option value="hosted">Hosted (IA automática)</option>
                  <option value="webhook">Webhook (controle customizado)</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-[var(--foreground)]">Voz</span>
                <select
                  name="voice"
                  defaultValue="11labs-Brian"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)]"
                >
                  {voices.map((v) => (
                    <option key={v.voiceId} value={v.voiceId}>
                      {v.name} ({v.provider}) · {v.gender}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-[var(--foreground)]">Prompt do sistema</span>
                <textarea
                  name="systemPrompt"
                  placeholder="Instruções para o agente..."
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)]"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-[var(--foreground)]">Mensagem inicial</span>
                <input
                  type="text"
                  name="beginMessage"
                  placeholder="Ex: Olá, como posso ajudar?"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)]"
                />
              </label>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setShowNewAgent(false)}
                className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-50"
              >
                {busy ? 'Criando...' : 'Criar agente'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Buy Number */}
      {showBuyNumber && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--foreground)]/40 p-4"
          onClick={() => setShowBuyNumber(false)}
        >
          <form
            onSubmit={buyNumber}
            className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">Comprar número telefônico</h3>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-[var(--foreground)]">Agente</span>
                <select
                  name="agentId"
                  required
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)]"
                >
                  <option value="">Selecione um agente</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-[var(--foreground)]">País</span>
                <select
                  name="country"
                  defaultValue="US"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)]"
                >
                  <option value="US">Estados Unidos</option>
                  <option value="CA">Canadá</option>
                  <option value="BR">Brasil (futuro)</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-[var(--foreground)]">Código de área (opcional)</span>
                <input
                  type="text"
                  name="areaCode"
                  placeholder="Ex: 415"
                  maxLength={3}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)]"
                />
              </label>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setShowBuyNumber(false)}
                className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-50"
              >
                {busy ? 'Comprando...' : 'Comprar número'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Make Call */}
      {showMakeCall && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--foreground)]/40 p-4"
          onClick={() => setShowMakeCall(false)}
        >
          <form
            onSubmit={makeCall}
            className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">Fazer chamada</h3>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-[var(--foreground)]">Agente</span>
                <select
                  name="agentId"
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)]"
                >
                  <option value="">Selecione um agente</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-[var(--foreground)]">Número para ligar</span>
                <input
                  type="tel"
                  name="toNumber"
                  value={callToNumber}
                  onChange={(e) => setCallToNumber(e.target.value)}
                  placeholder="+55 11 99999-9999"
                  required
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)]"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-[var(--foreground)]">Mensagem inicial (opcional)</span>
                <input
                  type="text"
                  name="initialGreeting"
                  placeholder="Ex: Olá, estou ligando sobre sua propriedade"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)]"
                />
              </label>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowMakeCall(false);
                  setCallToNumber('');
                }}
                className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-50"
              >
                {busy ? 'Ligando...' : 'Fazer chamada'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
