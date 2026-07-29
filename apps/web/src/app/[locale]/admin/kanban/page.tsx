'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight, Mail, Link2 } from '../../../../components/lovable/icons';
import { apiUrl } from '../../../../lib/api';

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  score: number;
  stage: string;
  propertyInterest: string;
  createdAt: string;
};

const STAGES: Lead['stage'][] = ['Novo', 'Contatado', 'Agendou Visita', 'Negociação', 'Fechado', 'Perdido'];

export default function AdminKanbanPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL(apiUrl('/api/admin/leads'), 'https://landmapprod.vercel.app');
      const res = await fetch(url.toString(), { cache: 'no-store' });
      const data = await res.json();
      setLeads(data.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<string, Lead[]>();
    for (const stage of STAGES) map.set(stage, []);
    for (const lead of leads) {
      const key = STAGES.includes(lead.stage as Lead['stage']) ? (lead.stage as Lead['stage']) : 'Novo';
      map.get(key)?.push(lead);
    }
    return map;
  }, [leads]);

  const moveLead = async (lead: Lead, stage: Lead['stage']) => {
    if (stage === lead.stage) return;
    await fetch(`${apiUrl('/api/admin/leads')}/${lead.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ stage }),
    });
    setLeads((prev) => prev.map((item) => (item.id === lead.id ? { ...item, stage } : item)));
  };

  const onDragStart = (id: string) => setDraggingId(id);
  const onDragOver = (e: React.DragEvent, stage: Lead['stage']) => {
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).classList.add('bg-[var(--muted)]');
  };
  const onDragLeave = (el: HTMLDivElement) => el.classList.remove('bg-[var(--muted)]');
  const onDrop = (e: React.DragEvent, stage: Lead['stage']) => {
    (e.currentTarget as HTMLDivElement).classList.remove('bg-[var(--muted)]');
    const id = draggingId;
    setDraggingId(null);
    if (!id) return;
    const lead = leads.find((item) => item.id === id);
    if (lead) void moveLead(lead, stage);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-[var(--muted)]" />
        <div className="grid gap-4 overflow-x-auto md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (<div key={i} className="h-72 animate-pulse rounded-2xl bg-[var(--muted)]" />))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
              <ArrowRight className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Funil de vendas</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">Kanban</h1>
              <p className="mt-1 text-[var(--muted-foreground)]">{leads.length} leads · drag & drop</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/${locale}/admin`} className="rounded-full border border-[var(--border)] px-4 py-2 text-sm transition hover:bg-[var(--muted)]">Dashboard</Link>
            <Link href={`/${locale}/admin/leads`} className="rounded-full border border-[var(--border)] px-4 py-2 text-sm transition hover:bg-[var(--muted)]">Leads</Link>
          </div>
        </div>
      </header>

      <div className="grid gap-4 overflow-x-auto md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {STAGES.map((stage) => {
          const items = grouped.get(stage) || [];
          return (
            <div
              key={stage}
              className="min-h-[320px] rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3"
              onDragOver={(e) => onDragOver(e, stage)}
              onDragLeave={(e) => onDragLeave(e.currentTarget)}
              onDrop={(e) => onDrop(e, stage)}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">{stage}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{items.length}</p>
              </div>
              <div className="mt-3 space-y-2">
                {items.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => onDragStart(lead.id)}
                    className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 shadow-sm"
                  >
                    <p className="text-sm font-medium text-[var(--foreground)]">{lead.name}</p>
                    <p className="text-[11px] text-[var(--muted-foreground)]">{lead.propertyInterest || 'Sem interesse'}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-[var(--muted-foreground)]">{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</span>
                      <span className="text-xs text-[var(--primary)]">{lead.score}</span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-[11px] text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"><Mail className="h-3 w-3" />Email</a>
                      <a href={`tel:+55${lead.phone}`} className="flex items-center gap-1 text-[11px] text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">Ligar</a>
                    </div>
                  </div>
                ))}
                {!items.length && <p className="px-1 text-xs text-[var(--muted-foreground)]">Vazio</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
