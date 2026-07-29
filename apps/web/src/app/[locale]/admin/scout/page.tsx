'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowRight,
  Search,
  Play,
  Pause,
  Plus,
  Trash2,
  Settings,
  Download,
  ListFilter,
  MapPin,
} from '../../../../components/lovable/icons';
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
  createdAt?: string;
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
};

const SOURCE_LABEL: Record<string, string> = {
  google: 'Google',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  facebook: 'Facebook',
  custom: 'Custom',
};

const DEFAULT_STATES = [
  'SP','RJ','MG','ES','PR','SC','RS','MS','MT','GO','DF','BA','SE','AL','PE','PB','RN','CE','PI','MA','PA','AP','RR','AM','RO','AC','TO'
];
const DEFAULT_CITIES: Record<string, string[]> = {
  SP: ['São Paulo','Campinas','São Bernardo do Campo','Santos','Ribeirão Preto','Sorocaba'],
  RJ: ['Rio de Janeiro','Niterói','Petrópolis','Nova Iguaçu','São Gonçalo'],
  MG: ['Belo Horizonte','Uberlândia','Contagem','Juiz de Fora','Betim'],
  PR: ['Curitiba','Londrina','Maringá','Ponta Grossa','Cascavel'],
  SC: ['Florianópolis','Joinville','Blumenau','Chapecó','Criciúma'],
  RS: ['Porto Alegre','Caxias do Sul','Pelotas','Santa Maria','Gravataí'],
};

export default function AdminScoutPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';
  const [jobs, setJobs] = useState<ScoutJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', source: 'google', query: '', location: '' });
  const [preset, setPreset] = useState('BR imóveis');
  const [limit, setLimit] = useState(200);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['construtora','imobiliaria','corretor','incorporadora']);
  const [selectedStates, setSelectedStates] = useState<string[]>(['SP','RJ','MG']);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/admin/scout'), { cache: 'no-store' });
      if (!res.ok) throw new Error('falha ao carregar jobs');
      const data = await res.json();
      setJobs(data.items || []);
    } catch {
      // keep previous state on transient error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const applyPreset = useCallback((key: string) => {
    setPreset(key);
    if (key === 'BR imóveis') {
      setForm((f) => ({ ...f, query: 'constutora OU imobiliária OU corretor de imóveis OU incorporadora', location: 'Brasil' }));
      setSelectedTypes(['construtora','imobiliaria','corretor','incorporadora']);
      setSelectedStates(['SP','RJ','MG','PR','SC','RS']);
      setLimit(500);
      return;
    }
    if (key === 'Construtoras + Corretores') {
      setForm((f) => ({ ...f, query: 'construtora OU corretor de imóveis', location: 'Brasil' }));
      setSelectedTypes(['construtora','corretor']);
      setSelectedStates(DEFAULT_STATES);
      setLimit(1000);
      return;
    }
    if (key === 'Alta rentabilidade') {
      setForm((f) => ({ ...f, query: 'imobiliária de luxo OU alto padrão OU lançamento', location: 'Brasil' }));
      setSelectedTypes(['imobiliaria','incorporadora']);
      setSelectedStates(['SP','RJ','MG','PR']);
      setLimit(300);
      return;
    }
  }, []);

  const create = useCallback(async () => {
    if (!form.name || !form.query) return;
    setSaving(true);
    try {
      const cities = selectedCities.length > 0 ? selectedCities : (selectedStates.flatMap((s) => DEFAULT_CITIES[s] || []));
      const res = await fetch(apiUrl('/api/admin/scout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          filters: {
            cities,
            states: selectedStates,
            niches: ['imóveis','loteamento','construção','incorporação','lançamento'],
            leadTypes: selectedTypes,
            limit,
            throttleMs: 180,
          },
        }),
      });
      if (!res.ok) throw new Error('falha ao criar job');
      setForm({ name: '', source: 'google', query: '', location: '' });
      await load();
    } finally {
      setSaving(false);
    }
  }, [form, selectedStates, selectedCities, selectedTypes, limit, load]);

  const patch = useCallback(async (id: string, patch: Partial<ScoutJob>) => {
    const res = await fetch(apiUrl('/api/admin/scout'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    });
    if (!res.ok) throw new Error('falha ao atualizar job');
    await load();
  }, [load]);

  const remove = useCallback(async (id: string) => {
    const res = await fetch(`${apiUrl('/api/admin/scout')}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('falha ao remover job');
    await load();
  }, [load]);

  const exportCsv = useCallback(async (job: ScoutJob) => {
    const res = await fetch(`${apiUrl('/api/admin/scout/export')}?jobId=${encodeURIComponent(job.id)}&format=csv`);
    if (!res.ok) throw new Error('falha ao exportar');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${job.id}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    await load();
  }, [load]);

  const rows = useMemo(() => jobs.slice(0, 60), [jobs]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Aquisição</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">Scout</h1>
              <p className="mt-1 text-[var(--muted-foreground)]">Jobs e automação de prospecção. Máxima conversão com dados reais.</p>
            </div>
          </div>
          <Link href={`/${locale}/admin`} className="inline-flex items-center rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--muted)]">
            Voltar ao dashboard
          </Link>
        </div>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Novo job de scraping</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]" placeholder="Nome do job" value={form.name} onChange={(e)=>setForm((f)=>({...f,name:e.target.value}))} />
          <select className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]" value={form.source} onChange={(e)=>setForm((f)=>({...f,source:e.target.value as ScoutSource}))}>
            {Object.keys(SOURCE_LABEL).map((s)=>(<option key={s} value={s}>{SOURCE_LABEL[s]}</option>))}
          </select>
          <input className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]" placeholder="Busca / query" value={form.query} onChange={(e)=>setForm((f)=>({...f,query:e.target.value}))} />
          <input className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]" placeholder="Localização (opcional)" value={form.location} onChange={(e)=>setForm((f)=>({...f,location:e.target.value}))} />
          <button onClick={create} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-50"><Plus className="h-4 w-4" /> {saving ? 'Salvando...' : 'Criar job'}</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {['BR imóveis','Construtoras + Corretores','Alta rentabilidade'].map((p)=> (
            <button key={p} onClick={()=>applyPreset(p)} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs hover:bg-[var(--muted)]">{p}</button>
          ))}
          <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--muted-foreground)]"><ListFilter className="h-3.5 w-3.5" /> {limit} leads/job</div>
          <input type="number" className="w-24 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs" value={limit} onChange={(e)=>setLimit(Number(e.target.value||200))} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {['SP','RJ','MG','PR','SC','RS','BA','PE','CE','PA'].map((st)=> (
            <button key={st} onClick={()=>setSelectedStates((prev)=>prev.includes(st)?prev.filter((x)=>x!==st):[...prev,st])} className={`rounded-lg border px-2 py-1 text-[10px] ${selectedStates.includes(st)?'border-[var(--primary)] text-[var(--primary)]':'border-[var(--border)] text-[var(--muted-foreground)]'}`}>{st}</button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedTypes.map((t)=> (
            <span key={t} className="rounded-full border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--muted-foreground)]">{t}</span>
          ))}
          {selectedCities.length>0 && <span className="rounded-full border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--muted-foreground)]">{selectedCities.length} cidades</span>}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Jobs</h2>
          <span className="text-[10px] text-[var(--muted-foreground)]">{rows.length} itens</span>
        </div>
        {loading && <p className="mt-3 text-xs text-[var(--muted-foreground)]">Carregando...</p>}
        {!loading && rows.length === 0 && <p className="mt-3 text-xs text-[var(--muted-foreground)]">Nenhum job criado.</p>}
        <ul className="mt-4 space-y-3">
          {rows.map((job)=> (
            <li key={job.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">{job.name}</p>
                <p className="font-mono text-[10px] text-[var(--muted-foreground)]">{SOURCE_LABEL[job.source]} · {job.query} {job.location?`· ${job.location}`:''}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]">{job.status}</span>
                  <span className="text-[10px] text-[var(--muted-foreground)]">Leads: {job.leadsFound}</span>
                  {job.stats && <span className="text-[10px] text-[var(--muted-foreground)]">Exportados: {job.stats.exported}</span>}
                  {job.lastRunAt && <span className="text-[10px] text-[var(--muted-foreground)]">Última execução: {job.lastRunAt}</span>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={()=>patch(job.id,{status: job.status==='running'?'paused':'running'})} className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-[10px] hover:border-[var(--primary)]">
                  {job.status==='running'?<Pause className="h-3.5 w-3.5" />:<Play className="h-3.5 w-3.5" />}
                  {job.status==='running'?'Pausar':'Executar'}
                </button>
                <Link href={`/${locale}/admin/scout/${job.id}`} className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-[10px] hover:border-[var(--primary)]"><Settings className="h-3.5 w-3.5" /> Configurar</Link>
                <button onClick={()=>exportCsv(job)} className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-[10px] hover:border-[var(--primary)]"><Download className="h-3.5 w-3.5" /> Exportar</button>
                <button onClick={()=>remove(job.id)} className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-[10px] hover:border-[var(--destructive)]"><Trash2 className="h-3.5 w-3.5" /> Remover</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
