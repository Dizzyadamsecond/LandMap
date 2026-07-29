'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowRight,
  Mail,
  Filter,
  Phone,
} from '../../../../components/lovable/icons';
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

const STAGES = ['Novo', 'Contatado', 'Agendou Visita', 'Negociação', 'Fechado', 'Perdido'] as const;

const PROPOSAL_TEMPLATE = `Olá {name}, obrigado pelo interesse em {interest}. Preparo uma proposta personalizada em até 24h.`;

export default function AdminLeadsPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStage, setFilterStage] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [composer, setComposer] = useState<{ leadId: string; text: string } | null>(null);
  const [composerLoading, setComposerLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL(apiUrl('/api/admin/leads'), 'https://landmapprod.vercel.app');
      if (filterStage) url.searchParams.set('stage', filterStage);
      const res = await fetch(url.toString(), { cache: 'no-store' });
      const data = await res.json();
      const items = data.items || [];
      setLeads(items.filter((l: Lead) => (Number(l.score) || 0) >= minScore));
    } catch {
      // keep previous state on transient error
    } finally {
      setLoading(false);
    }
  }, [filterStage, minScore]);

  useEffect(() => {
    void load();
  }, [load]);

  const scoreColor = (score: number) => (score >= 85 ? 'text-[var(--primary)]' : score >= 70 ? 'text-[var(--accent)]' : 'text-[var(--muted-foreground)]');

  const stageColor = (stage: string) => {
    const map: Record<string, string> = {
      'Novo': 'border-[var(--border)]',
      'Contatado': 'border-[var(--primary)]',
      'Agendou Visita': 'border-[var(--accent)]',
      'Negociação': 'border-[var(--primary)]',
      'Fechado': 'border-[var(--primary)]',
      'Perdido': 'border-[var(--destructive)]',
    };
    return map[stage] || 'border-[var(--border)]';
  };

  const generateProposal = async (lead: Lead) => {
    setComposerLoading(true);
    setComposer({ leadId: lead.id, text: '' });
    try {
      const text = PROPOSAL_TEMPLATE.replace('{name}', lead.name).replace('{interest}', lead.propertyInterest || 'imóvel');
      setComposer((prev) => (prev && prev.leadId === lead.id ? { ...prev, text } : prev));
    } finally {
      setComposerLoading(false);
    }
  };

  const sendProposal = async (lead: Lead) => {
    if (!composer?.text) return;
    setComposerLoading(true);
    try {
      const res = await fetch(apiUrl('/api/admin/leads'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          score: Math.min(100, lead.score + 2),
          stage: 'Agendou Visita',
          propertyInterest: lead.propertyInterest,
          source: lead.propertyInterest || 'proposta',
        }),
      });
      if (res.ok) {
        await load();
        setComposer(null);
      }
    } finally {
      setComposerLoading(false);
    }
  };

  const updateStage = async (lead: Lead, stage: Lead['stage']) => {
    await fetch(`${apiUrl('/api/admin/leads')}/${lead.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ stage }),
    });
    await load();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
              <Filter className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Pipeline de contatos</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">Leads</h1>
              <p className="mt-1 text-[var(--muted-foreground)]">{leads.length} leads</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/${locale}/admin`} className="rounded-full border border-[var(--border)] px-4 py-2 text-sm transition hover:bg-[var(--muted)]">Dashboard</Link>
            <Link href={`/${locale}/admin/kanban`} className="rounded-full border border-[var(--border)] px-4 py-2 text-sm transition hover:bg-[var(--muted)]">Kanban</Link>
          </div>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"><p className="text-xs text-[var(--muted-foreground)]">Leads</p><p className="mt-1 text-2xl font-semibold">{leads.length}</p></div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"><p className="text-xs text-[var(--muted-foreground)]">Score médio</p><p className="mt-1 text-2xl font-semibold">{leads.length ? Math.round(leads.reduce((s, l) => s + (Number(l.score) || 0), 0) / leads.length) : 0}</p></div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"><p className="text-xs text-[var(--muted-foreground)]">Quentes</p><p className="mt-1 text-2xl font-semibold">{leads.filter((l) => (Number(l.score) || 0) >= 80).length}</p></div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-[11px] text-[var(--muted-foreground)]">Estágio:</label>
        <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--card)] py-1.5 pl-3 pr-3 text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)]">
          <option value="">Todos</option>
          {STAGES.map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>

        <label className="text-[11px] text-[var(--muted-foreground)]">Score mínimo:</label>
        <input type="number" value={minScore} onChange={(e) => setMinScore(Number(e.target.value || 0))} className="w-20 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-1.5 text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)]" />

        <button onClick={load} className="rounded-full border border-[var(--border)] px-4 py-2 text-xs text-[var(--muted-foreground)] transition hover:bg-[var(--muted)]">Atualizar</button>
      </div>

      <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => (<div key={i} className="h-14 animate-pulse rounded-lg bg-[var(--muted)]" />))}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--muted)]">
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Score</th>
                  <th>Estágio</th>
                  <th>Interesse</th>
                  <th>Data</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className={`border-b ${stageColor(lead.stage)}`}>
                    <td className="px-4 py-3 text-[var(--foreground)]">{lead.name}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)] text-[13px]">{lead.email}</td>
                    <td className={`px-4 py-3 ${scoreColor(Number(lead.score) || 0)}`}>{Number(lead.score) || 0}</td>
                    <td className="px-4 py-3">
                      <select value={lead.stage} onChange={(e) => updateStage(lead, e.target.value as Lead['stage'])} className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)]">
                        {STAGES.map((s) => (<option key={s} value={s}>{s}</option>))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)] text-[13px]">{lead.propertyInterest || '—'}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)] text-[13px]">{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => generateProposal(lead)} className="rounded-lg border border-[var(--border)] px-2 py-1 text-[11px] text-[var(--primary)] transition hover:bg-[var(--muted)]">Proposta</button>
                        <Link href={`/${locale}/map?q=${encodeURIComponent(lead.propertyInterest || '')}`} className="rounded-lg border border-[var(--border)] px-2 py-1 text-[11px] text-[var(--muted-foreground)] transition hover:bg-[var(--muted)]">Imóveis</Link>
                      </div>
                      {composer?.leadId === lead.id && (
                        <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
                          <textarea value={composer.text} onChange={(e) => setComposer((prev) => prev && prev.leadId === lead.id ? { ...prev, text: e.target.value } : prev)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)]" rows={4} />
                          <div className="mt-2 flex justify-end gap-2">
                            <button onClick={() => setComposer(null)} className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted-foreground)] transition hover:bg-[var(--muted)]">Cancelar</button>
                            <button onClick={() => sendProposal(lead)} disabled={composerLoading} className="rounded-full border border-[var(--primary)] bg-[var(--primary)] px-3 py-1.5 text-xs text-[var(--primary-foreground)] transition hover:brightness-110 disabled:opacity-50">Enviar proposta</button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {!leads.length && (<tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-[var(--muted-foreground)]">Nenhum lead encontrado.</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
