'use client';

/**
 * Leilões — surface de navegação das oportunidades de leilão (judiciais,
 * extrajudiciais e de banco) já semeadas em `data/auctions.json` e expostas
 * por `GET /api/auctions`. Fecha o loop do dataset estruturado: o mapa pinta
 * os pontos A–F, esta página permite filtrar, ordenar e inspecionar cada lote.
 *
 * Paridade Lovable: chrome flutuante indigo, grid denso, badges de grade.
 */

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Layers,
  FileText,
  Filter,
  TrendingDown,
  Award,
  ExternalLink,
  Search,
  Building2,
} from '../../../components/lovable/icons';
import { Reveal } from '../../../components/Motion';
import { Card, Badge, Stat, buttonVariants, cn } from '@landmap/ui';
import { getAuctionOpportunities, type AuctionOpportunity } from '../../../lib/api';

const GRADE_COLORS: Record<string, string> = {
  A: '#34d399',
  B: '#22d3ee',
  C: '#fbbf24',
  D: '#fb923c',
  E: '#f87171',
  F: '#ef4444',
};

const CATEGORY_LABEL: Record<string, string> = {
  terreno: 'Terreno',
  casa: 'Casa',
  apartamento: 'Apartamento',
  comercial: 'Comercial',
  rural: 'Rural',
  outro: 'Outro',
};

const AUCTION_TYPE_LABEL: Record<string, string> = {
  judicial: 'Judicial',
  extrajudicial: 'Extrajudicial',
  bank: 'Banco',
  public: 'Público',
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Aberto',
  scheduled: 'Agendado',
  closed: 'Encerrado',
  unknown: '—',
};

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export default function LeiloesPage() {
  const locale = useLocale();
  const lh = (p: string) => `/${locale}${p}`;

  const [lots, setLots] = useState<AuctionOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [auctionType, setAuctionType] = useState<string>('');
  const [grade, setGrade] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAuctionOpportunities({ limit: 500 })
      .then((data) => {
        if (active) setLots(data.items);
      })
      .catch(() => {
        if (active) setLots([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = lots.length;
    const withDiscount = lots.filter((l) => typeof l.discountPct === 'number');
    const avgDiscount = withDiscount.length
      ? withDiscount.reduce((s, l) => s + (l.discountPct ?? 0), 0) / withDiscount.length
      : 0;
    const topGrades = lots.filter((l) => l.grade === 'A' || l.grade === 'B').length;
    const open = lots.filter((l) => l.status === 'open' || l.status === 'scheduled').length;
    return { total, avgDiscount, topGrades, open };
  }, [lots]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lots
      .filter((l) => !state || l.state === state)
      .filter((l) => !category || l.category === category || l.type === category)
      .filter((l) => !auctionType || l.auctionType === auctionType)
      .filter((l) => !grade || l.grade === grade)
      .filter((l) => !status || l.status === status)
      .filter((l) => {
        if (!q) return true;
        return (
          l.title.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          (l.neighborhood?.toLowerCase().includes(q) ?? false) ||
          (l.source.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => (b.discountPct ?? 0) - (a.discountPct ?? 0));
  }, [lots, state, category, auctionType, grade, status, query]);

  const resetFilters = () => {
    setState('');
    setCategory('');
    setAuctionType('');
    setGrade('');
    setStatus('');
    setQuery('');
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 xl:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="space-y-3 self-start">
        <div className="rounded-3xl border border-border/50 bg-card p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <Link
              href={lh('/map')}
              aria-label="Voltar"
              className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="text-xs font-semibold text-foreground/80">Leilões</span>
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <FileText className="h-3 w-3" />
            Oportunidades
          </div>
          <h1 className="mt-3 font-display text-2xl font-semibold">Leilões LandMap</h1>
          <p className="mt-2 text-xs text-foreground/60">
            Imóveis em leilão judicial, extrajudicial e de banco em todo o Brasil — com
            desconto vs. avaliação e nota de oportunidade A–F.
          </p>
        </div>

        <div className="rounded-3xl border border-border/50 bg-card p-3 shadow-sm backdrop-blur sm:p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/50">Hub</p>
          <div className="mt-3 space-y-2">
            {[
              { href: lh('/map'), icon: Layers, label: 'Mapa' },
              { href: lh('/cities'), icon: MapPin, label: 'Cidades' },
              { href: lh('/neighborhoods'), icon: Building2, label: 'Bairros' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-2xl border border-border/50 bg-background/70 px-3 py-2.5 text-sm transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-border/50 bg-card p-3 shadow-sm backdrop-blur sm:p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/50">Filtros</p>
            <button
              type="button"
              onClick={resetFilters}
              className="text-[10px] font-medium text-primary hover:underline"
            >
              Limpar
            </button>
          </div>
          <div className="mt-3 space-y-2.5">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar cidade, bairro, fonte…"
              className="w-full rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-sm outline-none focus:border-primary/40"
            />
            <FilterSelect label="UF" value={state} onChange={setState} options={UF_LIST} />
            <FilterSelect
              label="Categoria"
              value={category}
              onChange={setCategory}
              options={Object.keys(CATEGORY_LABEL)}
              labels={CATEGORY_LABEL}
            />
            <FilterSelect
              label="Origem"
              value={auctionType}
              onChange={setAuctionType}
              options={Object.keys(AUCTION_TYPE_LABEL)}
              labels={AUCTION_TYPE_LABEL}
            />
            <FilterSelect
              label="Nota"
              value={grade}
              onChange={setGrade}
              options={['A', 'B', 'C', 'D', 'E', 'F']}
            />
            <FilterSelect
              label="Status"
              value={status}
              onChange={setStatus}
              options={Object.keys(STATUS_LABEL)}
              labels={STATUS_LABEL}
            />
          </div>
        </div>
      </aside>

      <section className="space-y-6">
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Lotes" value={String(stats.total)} />
          <Stat label="Desconto médio" value={`${stats.avgDiscount.toFixed(0)}%`} trend={stats.avgDiscount} />
          <Stat label="Nota A/B" value={String(stats.topGrades)} />
          <Stat label="Abertos/Agend." value={String(stats.open)} />
        </section>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-foreground/60">
            {filtered.length} de {lots.length} lotes
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href={lh('/map')} className={cn(buttonVariants({ size: 'sm' }))}>
              <Layers className="mr-1 h-3.5 w-3.5" /> Ver no mapa
            </Link>
            <Link href={lh('/map')} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
              Mapa Free
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid place-items-center rounded-3xl border border-border/50 bg-card py-20 text-sm text-foreground/50">
            Carregando leilões…
          </div>
        ) : filtered.length === 0 ? (
          <div className="grid place-items-center rounded-3xl border border-border/50 bg-card py-20 text-center text-sm text-foreground/50">
            Nenhum lote encontrado com os filtros atuais.
            <button onClick={resetFilters} className="mt-2 text-primary hover:underline">
              Limpar filtros
            </button>
          </div>
        ) : (
          <Reveal className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((lot) => {
              const gradeColor = lot.grade ? GRADE_COLORS[lot.grade] : '#94a3b8';
              return (
                <Card key={lot.id} variant="interactive" className="relative overflow-hidden">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{lot.title}</p> </div>
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold text-neutral-900"
                      style={{ backgroundColor: gradeColor }}
                      title={`Nota de oportunidade ${lot.grade ?? '—'}`}
                    >
                      {lot.grade ?? '—'}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Badge variant="outline">{CATEGORY_LABEL[lot.category ?? 'outro'] ?? lot.category}</Badge>
                    <Badge variant="secondary">{AUCTION_TYPE_LABEL[lot.auctionType ?? 'bank'] ?? lot.auctionType}</Badge>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {lot.city}/{lot.state}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-foreground/40">Lance inicial</p>
                      <p className="font-medium">{lot.price != null ? BRL.format(lot.price) : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-foreground/40">Avaliação</p>
                      <p className="font-medium text-foreground/70">
                        {lot.marketPrice != null ? BRL.format(lot.marketPrice) : '—'}
                      </p>
                    </div>
                  </div>

                  {lot.discountPct != null && (
                    <div className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-primary">
                      <TrendingDown className="h-3.5 w-3.5" />
                      {lot.discountPct}% abaixo da avaliação
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <Badge variant={lot.status === 'open' ? 'success' : lot.status === 'scheduled' ? 'warning' : 'outline'}>
                      {STATUS_LABEL[lot.status] ?? lot.status}
                    </Badge>
                    {lot.areaM2 != null && <span className="text-foreground/50">{lot.areaM2} m²</span>}
                    {lot.bedrooms != null && <span className="text-foreground/50">· {lot.bedrooms} dorm.</span>}
                  </div>

                  {(lot.risks?.length || lot.drivers?.length) && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {lot.risks?.slice(0, 2).map((r) => (
                        <span key={`r-${r}`} className="rounded-full bg-[var(--danger)]/10 px-2 py-0.5 text-[10px] text-[var(--danger)]">
                          {r}
                        </span>
                      ))}
                      {lot.drivers?.slice(0, 2).map((d) => (
                        <span key={`d-${d}`} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                          {d}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[11px]">
                    <span className="truncate text-foreground/50">{lot.source}</span>
                    {lot.editalUrl && (
                      <a
                        href={lot.editalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                      >
                        Edital <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  {lot.neighborhood && (
                    <p className="mt-1 truncate text-[10px] text-foreground/40">
                      {lot.neighborhood}
                      {lot.street ? ` · ${lot.street}` : ''}
                    </p>
                  )}
                </Card>
              );
            })}
          </Reveal>
        )}
      </section>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  labels,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-medium uppercase tracking-wide text-foreground/40">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border/60 bg-background/70 px-2 py-1.5 text-sm outline-none focus:border-primary/40"
      >
        <option value="">Todos</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {labels?.[o] ?? o}
          </option>
        ))}
      </select>
    </label>
  );
}
