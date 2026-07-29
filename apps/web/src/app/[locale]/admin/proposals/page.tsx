'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowRight,
  Mail,
  FileText,
  Send,
  X,
  Check,
  MapPin,
} from '../../../../components/lovable/icons';
import { apiUrl } from '../../../../lib/api';

type Proposal = {
  id: string;
  leadId: string;
  leadName: string;
  propertyTitle: string;
  amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  dueAt?: string;
  body: string;
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho',
  sent: 'Enviada',
  accepted: 'Aceita',
  rejected: 'Recusada',
};

const DEFAULT_BODY = `Olá {lead},

Obrigado pelo interesse em {property}.
Segue uma proposta preliminar para dar clareza ao próximo passo.

Valor referencial: {amount}
Disponibilidade para visita/chave: {dueAt}

Se quiser, já marco a visita e envio a minuta do contrato.`;

export default function AdminProposalsPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';
  const [items, setItems] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Proposal | null>(null);
  const [amountText, setAmountText] = useState('');
  const [saving, setSaving] = useState(false);
  const [composer, setComposer] = useState({ leadId: '', leadName: '', propertyTitle: '', dueAt: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/admin/proposals'), { cache: 'no-store' });
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

  const fmtCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const generateFromLead = useCallback((lead: Proposal) => {
    const text = DEFAULT_BODY
      .replace('{lead}', lead.leadName || 'lead')
      .replace('{property}', lead.propertyTitle || 'imóvel')
      .replace('{amount}', fmtCurrency(lead.amount))
      .replace('{dueAt}', lead.dueAt || 'a combinar');
    setSelected((current) => (current && current.id === lead.id ? { ...current, body: text } : current));
  }, []);

  const create = useCallback(async () => {
    if (!composer.leadId || !composer.leadName || !composer.propertyTitle) return;
    setSaving(true);
    try {
      const res = await fetch(apiUrl('/api/admin/proposals'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...composer, amount: Number(amountText || 0) }),
      });
      if (!res.ok) throw new Error('falha ao criar proposta');
      setComposer({ leadId: '', leadName: '', propertyTitle: '', dueAt: '' });
      setAmountText('');
      await load();
    } finally {
      setSaving(false);
    }
  }, [composer, amountText, load]);

  const patch = useCallback(async (id: string, patch: Partial<Proposal>) => {
    const res = await fetch(apiUrl('/api/admin/proposals'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    });
    if (!res.ok) throw new Error('falha ao atualizar proposta');
    await load();
  }, [load]);

  const remove = useCallback(async (id: string) => {
    const res = await fetch(`${apiUrl('/api/admin/proposals')}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('falha ao remover proposta');
    await load();
  }, [load]);

  const rows = useMemo(() => items.slice(0, 50), [items]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Comercial</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">Propostas</h1>
              <p className="mt-1 text-[var(--muted-foreground)]">Crie, envie e acompanhe propostas por lead.</p>
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
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Nova proposta</h2>
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
          <input
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]"
            placeholder="Imóvel"
            value={composer.propertyTitle}
            onChange={(e) => setComposer((c) => ({ ...c, propertyTitle: e.target.value }))}
          />
          <input
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]"
            placeholder="Valor (R$)"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
          />
          <input
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]"
            placeholder="Disponibilidade"
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
          {saving ? 'Salvando...' : 'Criar proposta'}
        </button>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Propostas</h2>
          <span className="text-[10px] text-[var(--muted-foreground)]">{rows.length} itens</span>
        </div>
        {loading && <p className="mt-3 text-xs text-[var(--muted-foreground)]">Carregando...</p>}
        {!loading && rows.length === 0 && <p className="mt-3 text-xs text-[var(--muted-foreground)]">Nenhuma proposta criada.</p>}
        <ul className="mt-4 space-y-3">
          {rows.map((p) => (
            <li key={p.id} className="rounded-xl border border-[var(--border)] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">{p.propertyTitle}</p>
                  <p className="font-mono text-[10px] text-[var(--muted-foreground)]">
                    {p.leadName} · {p.leadId}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">{fmtCurrency(p.amount)}</span>
                  <button
                    onClick={() => setSelected(p)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-[10px] hover:border-[var(--primary)]"
                  >
                    <Mail className="h-3.5 w-3.5" /> Abrir
                  </button>
                </div>
              </div>
              {!!p.dueAt && <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">{p.dueAt}</p>}
            </li>
          ))}
        </ul>
      </section>

      {selected && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Proposta — {selected.propertyTitle}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => patch(selected.id, { status: 'sent' })}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-[10px] hover:border-[var(--primary)]"
              >
                <Send className="h-3.5 w-3.5" /> Marcar enviada
              </button>
              <button
                onClick={() => patch(selected.id, { status: 'accepted' })}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-[10px] hover:border-[var(--primary)]"
              >
                <Check className="h-3.5 w-3.5" /> Aceita
              </button>
              <button
                onClick={() => patch(selected.id, { status: 'rejected' })}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-[10px] hover:border-[var(--destructive)]"
              >
                <X className="h-3.5 w-3.5" /> Recusada
              </button>
              <button
                onClick={() => {
                  setSelected(null);
                }}
                className="rounded-lg border border-[var(--border)] px-2 py-1 text-[10px]"
              >
                Fechar
              </button>
            </div>
          </div>
          <textarea
            className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-xs text-[var(--foreground)]"
            rows={8}
            value={selected.body}
            onChange={(e) => setSelected({ ...selected, body: e.target.value })}
          />
        </section>
      )}
    </div>
  );
}
