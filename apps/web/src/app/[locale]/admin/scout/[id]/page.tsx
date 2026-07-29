'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowRight,
  Search,
  SlidersHorizontal,
  Plus,
  Trash2,
  Filter,
  FileText,
  Send,
  Minus,
  MapPin,
} from '../../../../../components/lovable/icons';
import { apiUrl } from '../../../../../lib/api';

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
    cities: string[];
    states: string[];
    niches: string[];
    leadTypes: string[];
    limit: number;
    throttleMs: number;
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

const SOURCE_OPTIONS: { value: ScoutSource; label: string }[] = [
  { value: 'google', label: 'Google Maps / Places' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'custom', label: 'Custom / Outros' },
];

const DEFAULT_CITIES = [
  'São Paulo','Rio de Janeiro','Curitiba','Belo Horizonte','Porto Alegre',
  'Florianópolis','Campinas','Santos','Londrina','Salvador','Recife','Fortaleza',
];

const DEFAULT_NICHES = [
  'construtora','imobiliária','corretores','incorporadora','lotes',
  'locação','comercial','residencial','alto padrão','investimentos',
];

export default function AdminScoutJobPage() {
  const { id } = useParams<{ id: string }>();
  const locale = useParams<{ locale: string }>();
  const localeStr = typeof locale === 'object' && locale ? (locale.locale || 'pt-BR') : 'pt-BR';

  const [job, setJob] = useState<ScoutJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [source, setSource] = useState<ScoutSource>('google');
  const [query, setQuery] = useState('construtora');
  const [location, setLocation] = useState('Brasil');
  const [limit, setLimit] = useState(200);
  const [throttleMs, setThrottleMs] = useState(250);
  const [cities, setCities] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [niches, setNiches] = useState<string[]>([]);
  const [leadTypes, setLeadTypes] = useState<string[]>([]);
  const [logs, setLogs] = useState<ScoutJob['logs']>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl(`/api/admin/scout/${encodeURIComponent(id)}`));
      if (!res.ok) throw new Error(`falha ao carregar job: ${res.status}`);
      const data = await res.json();
      const item: ScoutJob = data.item;
      setJob(item);
      setName(item.name);
      setSource(item.source);
      setQuery(item.query);
      setLocation(item.location || 'Brasil');
      setLimit(item.filters?.limit || 200);
      setThrottleMs(item.filters?.throttleMs || 250);
      setCities(item.filters?.cities || []);
      setStates(item.filters?.states || []);
      setNiches(item.filters?.niches || []);
      setLeadTypes(item.filters?.leadTypes || []);
      setLogs(item.logs || []);
    } catch (e: any) {
      setError(e.message || 'erro');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { if (id) load(); }, [id, load]);

  const patch = useCallback(async (patchObj: any) => {
    setSaving(true);
    try {
      const res = await fetch(apiUrl('/api/admin/scout'), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...patchObj }) });
      if (!res.ok) throw new Error(`falha ao salvar: ${res.status}`);
      const data = await res.json();
      setJob(data.item);
      setLogs(data.item.logs || []);
    } catch (e: any) {
      setError(e.message || 'erro');
    } finally {
      setSaving(false);
    }
  }, [id]);

  const runJob = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(apiUrl(`/api/admin/scout/${encodeURIComponent(id)}/run`), { method: 'POST' });
      if (!res.ok) throw new Error(`falha ao executar job: ${res.status}`);
      const data = await res.json();
      setJob((prev) => prev ? { ...prev, status: 'done', leadsFound: (prev.leadsFound || 0) + (data.generated || 0), lastRunAt: new Date().toISOString(), stats: { processed: (prev.stats?.processed || 0) + (data.generated || 0), found: (prev.stats?.found || 0) + (data.generated || 0), duplicates: 0, enriched: data.generated || 0, exported: 0 }, logs: [{ time: new Date().toISOString(), message: `Executado: ${data.generated || 0} leads` }, ...(prev.logs || [])].slice(0, 200) } : prev);
    } catch (e: any) {
      setError(e.message || 'erro');
    } finally {
      setSaving(false);
    }
  }, [id]);

  const exportCsv = useCallback(() => {
    const url = apiUrl(`/api/admin/scout/export?jobId=${encodeURIComponent(id)}&format=csv`);
    window.open(url, '_blank');
  }, [id]);

  const saveFilters = useCallback(() => patch({ filters: { cities, states, niches, leadTypes, limit, throttleMs } }), [patch, cities, states, niches, leadTypes, limit, throttleMs]);
  const saveMeta = useCallback(() => patch({ name, source, query, location }), [patch, name, source, query, location]);

  const stats = useMemo(() => job?.stats || { processed: 0, found: 0, duplicates: 0, enriched: 0, exported: 0 }, [job]);

  if (!id) return <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-red-400">Job não informado.</div>;
  if (loading) return <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-[var(--muted-foreground)]">Carregando job...</div>;
  if (error && !job) return <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-red-400">{error}</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-[var(--muted-foreground)]">Scout · Job</p>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">{job?.name || 'Detalhe do job'}</h1>
          <p className="font-mono text-[10px] text-[var(--muted-foreground)]">{SOURCE_OPTIONS.find((s) => s.value === job?.source)?.label || job?.source} · {job?.query} {job?.location ? `· ${job.location}` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/${localeStr}/admin/scout`} className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-2 text-xs hover:bg-[var(--muted)]">
            <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Voltar
          </Link>
          <button onClick={runJob} disabled={saving || job?.status === 'running'} className="inline-flex items-center gap-1 rounded-lg bg-[var(--primary)] px-3 py-2 text-xs text-black hover:brightness-110 disabled:opacity-60">
            <Play className="h-3.5 w-3.5" /> {job?.status === 'running' ? 'Executando...' : 'Executar job'}
          </button>
          <button onClick={exportCsv} className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-2 text-xs hover:bg-[var(--muted)]">
            <Download className="h-3.5 w-3.5" /> Exportar CSV
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { label: 'Leads gerados', value: String(job?.leadsFound || 0) },
          { label: 'Encontrados', value: String(stats.found) },
          { label: 'Duplicatas', value: String(stats.duplicates) },
          { label: 'Enriquecidos', value: String(stats.enriched) },
          { label: 'Exportados', value: String(stats.exported) },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
            <p className="text-[10px] text-[var(--muted-foreground)]">{item.label}</p>
            <p className="text-lg font-semibold text-[var(--foreground)]">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Configuração do job</h2>
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-xs text-[var(--muted-foreground)]">Nome</label>
              <input className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/20 px-3 py-2 text-xs" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-[var(--muted-foreground)]">Fonte</label>
              <select className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/20 px-3 py-2 text-xs" value={source} onChange={(e) => setSource(e.target.value as ScoutSource)}>
                {SOURCE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--muted-foreground)]">Query</label>
              <input className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/20 px-3 py-2 text-xs" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-[var(--muted-foreground)]">Localização</label>
              <input className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/20 px-3 py-2 text-xs" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[var(--muted-foreground)]">Limite / job</label>
                <input type="number" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/20 px-3 py-2 text-xs" value={limit} onChange={(e) => setLimit(Number(e.target.value || 200))} />
              </div>
              <div>
                <label className="text-xs text-[var(--muted-foreground)]">Intervalo (ms)</label>
                <input type="number" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/20 px-3 py-2 text-xs" value={throttleMs} onChange={(e) => setThrottleMs(Number(e.target.value || 250))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={saveMeta} disabled={saving} className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-2 text-xs hover:bg-[var(--muted)] disabled:opacity-60"><Filter className="h-3.5 w-3.5" /> Salvar</button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Filtros avançados</h2>
          <p className="text-xs text-[var(--muted-foreground)]">Cities, estados, nichos e tipos.</p>
          <div className="mt-3 space-y-3">
            <ChipField label="Cidades" options={DEFAULT_CITIES} value={cities} onChange={setCities} />
            <ChipField label="Estados" options={['SP','RJ','PR','MG','RS','SC','BA','PE','CE','PA']} value={states} onChange={setStates} />
            <ChipField label="Nichos" options={DEFAULT_NICHES} value={niches} onChange={setNiches} />
            <ChipField label="Tipos" options={['construtora','imobiliaria','corretor','incorporadora']} value={leadTypes} onChange={setLeadTypes} />
            <button onClick={saveFilters} disabled={saving} className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-2 text-xs hover:bg-[var(--muted)] disabled:opacity-60"><Filter className="h-3.5 w-3.5" /> Salvar filtros</button>
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Logs</h2>
          <span className="text-[10px] text-[var(--muted-foreground)]">{logs.length} entradas</span>
        </div>
        <ul className="mt-4 space-y-2">
          {logs?.map((log) => (
            <li key={log.time + log.message} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2">
              <span className="text-xs text-[var(--foreground)]">{log.message}</span>
              <span className="font-mono text-[10px] text-[var(--muted-foreground)]">{new Date(log.time).toLocaleString('pt-BR')}</span>
            </li>
          ))}
          {!logs?.length && <li className="text-xs text-[var(--muted-foreground)]">Sem logs.</li>}
        </ul>
      </section>
    </div>
  );
}

function ChipField({ label, options, value, onChange }: { label: string; options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (opt: string) => {
    const exists = value.includes(opt);
    onChange(exists ? value.filter((item) => item !== opt) : [...value, opt]);
  };
  return (
    <div>
      <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value.includes(opt);
          return (
            <button key={opt} onClick={() => toggle(opt)} className={`rounded-lg border px-2 py-1 text-[11px] ${active ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' : 'border-[var(--border)] text-[var(--muted-foreground)]'}`}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
