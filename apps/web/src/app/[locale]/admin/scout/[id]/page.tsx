'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight, Play, Pause, Trash2, Settings, Download, ListFilter } from '../../../../../../components/lovable/icons';
import { apiUrl } from '../../../../lib/api';

type ScoutSource = 'google' | 'linkedin' | 'instagram' | 'facebook' | 'custom';

type ScoutJob = {
  id: string;
  name: string;
  source: ScoutSource;
  query: string;
  location?: string;
  status: 'idle' | 'running' | 'paused' | 'done' | 'failed';
  leadsFound: number;
  lastRunAt?: string;
  filters?: {
    cities?: string[];
    states?: string[];
    niches?: string[];
    leadTypes?: string[];
    limit?: number;
    throttleMs?: number;
  };
  stats?: {
    processed: number;
    found: number;
    duplicates: number;
    enriched: number;
    exported: number;
  };
  logs?: Array<{ time: string; message: string }>;
};

const SOURCE_LABEL: Record<string, string> = {
  google: 'Google',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  facebook: 'Facebook',
  custom: 'Custom',
};

export default function AdminScoutConfigPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';
  const id = (params.id as string) || '';
  const [job, setJob] = useState<ScoutJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name:'', source:'google', query:'', location:'' });
  const [filtersText, setFiltersText] = useState('');
  const [logTail, setLogTail] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/scout/${encodeURIComponent(id)}`), { cache: 'no-store' });
      if (!res.ok) throw new Error('job not found');
      const data = await res.json();
      setJob(data.item || null);
      setForm({ name: (data.item?.name)||'', source: (data.item?.source)||'google', query: (data.item?.query)||'', location: (data.item?.location)||'' });
      setFiltersText(JSON.stringify(data.item?.filters || {}, null, 2));
      const logs = (data.item?.logs || []).slice(0,30).reverse().map((l:any)=>`${l.time} ${l.message}`);
      setLogTail(logs);
    } catch {
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveGeneral = useCallback(async () => {
    if (!job) return;
    setSaving(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/scout/${encodeURIComponent(id)}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: job.id, ...form }),
      });
      if (!res.ok) throw new Error('falha ao salvar');
      await load();
    } finally {
      setSaving(false);
    }
  }, [form, job, load, id]);

  const saveFilters = useCallback(async () => {
    if (!job) return;
    setSaving(true);
    try {
      let parsed: ScoutJob['filters'] = {};
      try { parsed = JSON.parse(filtersText || '{}'); } catch { /* keep invalid */ }
      const res = await fetch(apiUrl(`/api/admin/scout/${encodeURIComponent(id)}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: job.id, filters: parsed }),
      });
      if (!res.ok) throw new Error('falha ao salvar filtros');
      await load();
    } finally {
      setSaving(false);
    }
  }, [filtersText, job, load, id]);

  const runJob = useCallback(async () => {
    if (!job) return;
    setSaving(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/scout/${encodeURIComponent(id)}/run`), { method: 'POST' });
      if (!res.ok) throw new Error('falha ao executar job');
      await load();
    } finally {
      setSaving(false);
    }
  }, [job, load, id]);

  const removeJob = useCallback(async () => {
    if (!job) return;
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl(`/api/admin/scout/${encodeURIComponent(id)}`)}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('falha ao remover job');
      window.location.href = `/${locale}/admin/scout`;
    } finally {
      setSaving(false);
    }
  }, [job, locale, id]);

  const presetFilters = useCallback((key: string) => {
    if (key === 'BR imóveis') {
      setFiltersText(JSON.stringify({ cities: ['São Paulo','Rio de Janeiro','Curitiba','Belo Horizonte','Porto Alegre','Florianópolis'], states: ['SP','RJ','MG','PR','SC','RS'], niches: ['imóveis','loteamento','construção','incorporação','lançamento'], leadTypes: ['construtora','imobiliaria','corretor','incorporadora'], limit: 500, throttleMs: 180 }, null, 2));
      return;
    }
    if (key === 'SP/RJ high intent') {
      setFiltersText(JSON.stringify({ cities: ['São Paulo','Rio de Janeiro','Niterói','Campinas','São Bernardo do Campo'], states: ['SP','RJ'], niches: ['imobiliária de luxo','alto padrão','lançamento'], leadTypes: ['imobiliaria','incorporadora'], limit: 300, throttleMs: 220 }, null, 2));
      return;
    }
    if (key === 'Outdoor/infra') {
      setFiltersText(JSON.stringify({ cities: [], states: DEFAULT_STATES, niches: ['construção','infraestrutura','loteamento'], leadTypes: ['construtora','incorporadora'], limit: 1000, throttleMs: 160 }, null, 2));
      return;
    }
  }, []);

  if (loading) return <div className="mx-auto max-w-7xl text-sm text-[var(--muted-foreground)]">Carregando job...</div>;
  if (!job) return <div className="mx-auto max-w-7xl text-sm text-[var(--muted-foreground)]">Job não encontrado.</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Scout</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">{job.name}</h1>
              <p className="mt-1 text-[var(--muted-foreground)]">{SOURCE_LABEL[job.source]} · {job.query} {job.location ? `· ${job.location}` : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/${locale}/admin/scout`} className="inline-flex items-center rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--muted)]"><ArrowRight className="mr-2 h-4 w-4" /> Voltar</Link>
            <button onClick={runJob} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-50"><Play className="h-4 w-4" /> {saving ? 'Processando...' : 'Executar scraping'}</button>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Configurações do job</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]" value={form.name} onChange={(e)=>setForm((f)=>({...f,name:e.target.value}))} />
          <select className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]" value={form.source} onChange={(e)=>setForm((f)=>({...f,source:e.target.value as ScoutSource}))}>
            {Object.keys(SOURCE_LABEL).map((s)=>(<option key={s} value={s}>{SOURCE_LABEL[s]}</option>))}
          </select>
          <input className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]" value={form.query} onChange={(e)=>setForm((f)=>({...f,query:e.target.value}))} />
          <input className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]" value={form.location} onChange={(e)=>setForm((f)=>({...f,location:e.target.value}))} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={saveGeneral} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-medium text-[var(--primary-foreground)] disabled:opacity-50">Salvar configurações</button>
          <button onClick={removeJob} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--destructive)] px-4 py-2 text-xs text-[var(--destructive)]"><Trash2 className="h-4 w-4" /> Remover job</button>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Filtros de prospecção</h2>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">Defina cidades, estados, nichos e tipos de lead para maximizar conversão.</p>
        <textarea className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 font-mono text-xs text-[var(--foreground)]" rows={8} value={filtersText} onChange={(e)=>setFiltersText(e.target.value)} />
        <div className="mt-3 flex flex-wrap gap-2">
          {['BR imóveis','SP/RJ high intent','Outdoor/infra'].map((k)=>(
            <button key={k} onClick={()=>presetFilters(k)} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs hover:bg-[var(--muted)]">{k}</button>
          ))}
          <button onClick={saveFilters} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-medium text-[var(--primary-foreground)] disabled:opacity-50">Salvar filtros</button>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Status</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[var(--border)] p-4"><p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Status</p><p className="mt-2 text-sm font-medium text-[var(--foreground)]">{job.status}</p></div>
          <div className="rounded-xl border border-[var(--border)] p-4"><p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Leads encontrados</p><p className="mt-2 text-sm font-medium text-[var(--foreground)]">{job.leadsFound}</p></div>
          <div className="rounded-xl border border-[var(--border)] p-4"><p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Exportados</p><p className="mt-2 text-sm font-medium text-[var(--foreground)]">{job.stats?.exported ?? 0}</p></div>
          <div className="rounded-xl border border-[var(--border)] p-4"><p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Última execução</p><p className="mt-2 text-sm font-medium text-[var(--foreground)]">{job.lastRunAt || '—'}</p></div>
        </div>
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Log</p>
          <ul className="mt-2 max-h-48 space-y-1 overflow-auto font-mono text-[11px] text-[var(--foreground)]">
            {logTail.map((line)=> <li key={line}>{line}</li>)}
            {logTail.length===0 && <li>Sem logs.</li>}
          </ul>
        </div>
      </section>
    </div>
  );
}
