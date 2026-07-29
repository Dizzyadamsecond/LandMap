'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowRight,
  Check,
  X,
  Activity,
  Bell,
  Send,
} from '../../../../components/lovable/icons';
import { apiUrl } from '../../../../lib/api';

type Followup = {
  id: string;
  leadId: string;
  leadName: string;
  channel: 'whatsapp' | 'email' | 'sms';
  template: string;
  status: 'pending' | 'sent' | 'failed';
  dueAt: string;
  result?: string;
};

const CHANNEL_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp',
  email: 'Email',
  sms: 'SMS',
};

export default function AdminFollowupsPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';
  const [items, setItems] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);
  const [composer, setComposer] = useState({
    leadId: '',
    leadName: '',
    channel: 'whatsapp',
    template: '',
    dueAt: '',
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/admin/followups'), { cache: 'no-store' });
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      // keep previous state on transient error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = useCallback(async () => {
    if (!composer.leadId || !composer.leadName || !composer.template || !composer.dueAt) return;
    setSaving(true);
    try {
      const res = await fetch(apiUrl('/api/admin/followups'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(composer),
      });
      if (!res.ok) throw new Error('falha ao criar follow-up');
      setComposer({ leadId: '', leadName: '', channel: 'whatsapp', template: '', dueAt: '' });
      await load();
    } finally {
      setSaving(false);
    }
  }, [composer, load]);

  const patch = useCallback(async (id: string, patch: Partial<Followup>) => {
    const res = await fetch(apiUrl('/api/admin/followups'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    });
    if (!res.ok) throw new Error('falha ao atualizar follow-up');
    await load();
  }, [load]);

  const remove = useCallback(async (id: string) => {
    const res = await fetch(`${apiUrl('/api/admin/followups')}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('falha ao remover follow-up');
    await load();
  }, [load]);

  const rows = useMemo(() => items.slice(0, 60), [items]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Comercial</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">Follow-ups</h1>
              <p className="mt-1 text-[var(--muted-foreground)]">WhatsApp, email e SMS por lead.</p>
            </div>
          </div>
          <Link
            href={`/${locale}/admin`}
            className="inline-flex items-center rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--muted)]"
          >
            Voltar ao dashboard
          </Link>
        </div>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Novo follow-up</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]"
            placeholder="Lead ID"
            value={composer.leadId}
            onChange={(e) => setComposer((c) => ({ ...c, leadId: e.target.value }))}
          />
          <input
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]"
            placeholder="Nome do lead"
            value={composer.leadName}
            onChange={(e) => setComposer((c) => ({ ...c, leadName: e.target.value }))}
          />
          <select
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]"
            value={composer.channel}
            onChange={(e) => setComposer((c) => ({ ...c, channel: e.target.value }))}
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
          <input
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]"
            placeholder="Template/mensagem"
            value={composer.template}
            onChange={(e) => setComposer((c) => ({ ...c, template: e.target.value }))}
          />
          <input
            type="datetime-local"
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]"
            value={composer.dueAt}
            onChange={(e) => setComposer((c) => ({ ...c, dueAt: e.target.value }))}
          />
        </div>
        <button
          onClick={create}
          disabled={saving}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {saving ? 'Salvando...' : 'Criar follow-up'}
        </button>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Fila de follow-ups</h2>
          <span className="text-[10px] text-[var(--muted-foreground)]">{rows.length} itens</span>
        </div>
        {loading && <p className="mt-3 text-xs text-[var(--muted-foreground)]">Carregando...</p>}
        {!loading && rows.length === 0 && <p className="mt-3 text-xs text-[var(--muted-foreground)]">Nenhum follow-up criado.</p>}
        <ul className="mt-4 space-y-3">
          {rows.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">{f.leadName}</p>
                <p className="font-mono text-[10px] text-[var(--muted-foreground)]">
                  {f.leadId} · {CHANNEL_LABEL[f.channel]} · {f.dueAt}
                </p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{f.template}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                  {f.status}
                </span>
                <button
                  onClick={() => patch(f.id, { status: f.status === 'pending' ? 'sent' : 'pending', result: f.status === 'pending' ? 'enviado' : undefined })}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-[10px] hover:border-[var(--primary)]"
                >
                  <Send className="h-3.5 w-3.5" /> {f.status === 'pending' ? 'Enviar' : 'Reabrir'}
                </button>
                <button
                  onClick={() => patch(f.id, { status: 'failed', result: 'falha' })}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-[10px] hover:border-[var(--destructive)]"
                >
                  <X className="h-3.5 w-3.5" /> Falha
                </button>
                <button
                  onClick={() => remove(f.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-[10px] hover:border-[var(--destructive)]"
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
