'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowRight,
  CalendarClock,
  Check,
  X,
  Plus,
  Phone,
  MapPin,
} from '../../../../components/lovable/icons';
import { apiUrl } from '../../../../lib/api';

type Visit = {
  id: string;
  leadId: string;
  leadName: string;
  propertyTitle: string;
  scheduledAt: string;
  status: 'scheduled' | 'done' | 'canceled';
  note?: string;
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Agendada',
  done: 'Realizada',
  canceled: 'Cancelada',
};

export default function AdminVisitsPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';
  const [items, setItems] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ leadId: '', leadName: '', propertyTitle: '', scheduledAt: '', note: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/admin/visits'), { cache: 'no-store' });
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
    if (!form.leadId || !form.leadName || !form.propertyTitle || !form.scheduledAt) return;
    setSaving(true);
    try {
      const res = await fetch(apiUrl('/api/admin/visits'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('falha ao criar visita');
      setForm({ leadId: '', leadName: '', propertyTitle: '', scheduledAt: '', note: '' });
      await load();
    } finally {
      setSaving(false);
    }
  }, [form, load]);

  const update = useCallback(async (id: string, patch: Partial<Visit>) => {
    const res = await fetch(apiUrl('/api/admin/visits'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    });
    if (!res.ok) throw new Error('falha ao atualizar visita');
    await load();
  }, [load]);

  const remove = useCallback(async (id: string) => {
    const res = await fetch(`${apiUrl('/api/admin/visits')}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('falha ao remover visita');
    await load();
  }, [load]);

  const rows = useMemo(() => items.slice(0, 40), [items]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Comercial</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">Visitas</h1>
              <p className="mt-1 text-[var(--muted-foreground)]">Agende, confirme e acompanhe visitas.</p>
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
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Nova visita</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]"
            placeholder="Lead ID"
            value={form.leadId}
            onChange={(e) => setForm((f) => ({ ...f, leadId: e.target.value }))}
          />
          <input
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]"
            placeholder="Nome do lead"
            value={form.leadName}
            onChange={(e) => setForm((f) => ({ ...f, leadName: e.target.value }))}
          />
          <input
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]"
            placeholder="Imóvel"
            value={form.propertyTitle}
            onChange={(e) => setForm((f) => ({ ...f, propertyTitle: e.target.value }))}
          />
          <input
            type="datetime-local"
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]"
            value={form.scheduledAt}
            onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
          />
          <input
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]"
            placeholder="Nota"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          />
        </div>
        <button
          onClick={create}
          disabled={saving}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {saving ? 'Salvando...' : 'Agendar'}
        </button>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Próximas visitas</h2>
        {loading && <p className="mt-3 text-xs text-[var(--muted-foreground)]">Carregando...</p>}
        {!loading && rows.length === 0 && <p className="mt-3 text-xs text-[var(--muted-foreground)]">Nenhuma visita cadastrada.</p>}
        <ul className="mt-4 space-y-3">
          {rows.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">{v.propertyTitle}</p>
                <p className="font-mono text-[10px] text-[var(--muted-foreground)]">
                  {v.leadName} · {v.leadId} · {v.scheduledAt}
                </p>
                {v.note && <p className="mt-1 text-xs text-[var(--muted-foreground)]">{v.note}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                  {STATUS_LABEL[v.status] ?? v.status}
                </span>
                <button
                  onClick={() => update(v.id, { status: v.status === 'scheduled' ? 'done' : 'scheduled' })}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-[10px] hover:border-[var(--primary)]"
                >
                  {v.status === 'done' ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                  {v.status === 'done' ? 'Reabrir' : 'Concluir'}
                </button>
                <button
                  onClick={() => update(v.id, { status: 'canceled' })}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-[10px] hover:border-[var(--destructive)]"
                >
                  <X className="h-3.5 w-3.5" /> Cancelar
                </button>
                <button
                  onClick={() => remove(v.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-[10px] hover:border-[var(--destructive)]"
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Acesso rápido</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Link
            href={`/${locale}/admin/properties`}
            className="inline-flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3 text-sm hover:bg-[var(--muted)]"
          >
            <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[var(--primary)]" /> Ver terrenos</span>
            <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)]" />
          </Link>
          <Link
            href={`/${locale}/admin/leads`}
            className="inline-flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3 text-sm hover:bg-[var(--muted)]"
          >
            <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-[var(--primary)]" /> Leads</span>
            <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)]" />
          </Link>
          <Link
            href={`/${locale}/admin/kanban`}
            className="inline-flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3 text-sm hover:bg-[var(--muted)]"
          >
            <span className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-[var(--primary)]" /> Pipeline</span>
            <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)]" />
          </Link>
        </div>
      </section>
    </div>
  );
}
