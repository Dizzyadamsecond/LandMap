'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, Layers, Search, MapPin, Activity } from '../../../components/lovable/icons';
import { Card, Badge, Button, Stat, buttonVariants, cn } from '@landmap/ui';

type MarketIndexItem = {
  city: string;
  state: string;
  avgPriceM2: number;
  monthlyChange: number;
  yearlyChange: number;
  volume: number;
  momentum: 'high' | 'stable' | 'low';
};

const INITIAL_DATA: MarketIndexItem[] = [
  { city: 'São Paulo', state: 'SP', avgPriceM2: 10450, monthlyChange: 0.8, yearlyChange: 6.2, volume: 1420, momentum: 'high' },
  { city: 'Rio de Janeiro', state: 'RJ', avgPriceM2: 9800, monthlyChange: -0.2, yearlyChange: 2.1, volume: 850, momentum: 'stable' },
  { city: 'Fortaleza', state: 'CE', avgPriceM2: 7200, monthlyChange: 1.4, yearlyChange: 9.8, volume: 620, momentum: 'high' },
  { city: 'Curitiba', state: 'PR', avgPriceM2: 8300, monthlyChange: 0.5, yearlyChange: 5.4, volume: 490, momentum: 'stable' },
  { city: 'Belo Horizonte', state: 'MG', avgPriceM2: 7900, monthlyChange: 0.3, yearlyChange: 4.1, volume: 540, momentum: 'stable' },
  { city: 'Eusébio', state: 'CE', avgPriceM2: 5100, monthlyChange: 2.1, yearlyChange: 14.5, volume: 310, momentum: 'high' },
];

export default function MarketIndexPage() {
  const params = useParams();
  const locale = params.locale || 'pt-BR';
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState('ALL');

  const filtered = INITIAL_DATA.filter((item) => {
    const matchesSearch = item.city.toLowerCase().includes(search.toLowerCase());
    const matchesState = filterState === 'ALL' || item.state === filterState;
    return matchesSearch && matchesState;
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      {/* Header */}
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Telemetria de Mercado</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">Índice de Preços Regional</h1>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Métricas reais de transações agregadas e evolução por m² em todo o território nacional</p>
            </div>
          </div>
          <Link
            href={`/${locale}`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full')}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Painel Geral
          </Link>
        </div>
      </header>

      {/* Analytics Highlights */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-[var(--muted-foreground)]">Crescimento Médio Brasil</p>
          <div className="flex items-center gap-2 mt-1">
            <TrendingUp className="h-5 w-5 text-success" />
            <span className="text-2xl font-bold">+5.3%</span>
          </div>
          <p className="text-[10px] text-[var(--muted-foreground)] mt-1">Acumulado dos últimos 12 meses</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--muted-foreground)]">Maior Alta Mensal</p>
          <div className="flex items-center gap-2 mt-1">
            <TrendingUp className="h-5 w-5 text-success" />
            <span className="text-2xl font-bold">Eusébio (+2.1%)</span>
          </div>
          <p className="text-[10px] text-[var(--muted-foreground)] mt-1">Expansão de lotes residenciais</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--muted-foreground)]">Volume total analisado</p>
          <div className="flex items-center gap-2 mt-1">
            <Layers className="h-5 w-5 text-[var(--primary)]" />
            <span className="text-2xl font-bold">4.230 transações</span>
          </div>
          <p className="text-[10px] text-[var(--muted-foreground)] mt-1">Média mensal deduplicada</p>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-2 border border-[var(--border)] bg-[var(--background)] rounded-xl px-3 py-1.5 w-full max-w-sm">
            <Search className="h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Buscar cidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full"
            />
          </div>

          <div className="flex gap-2">
            {(['ALL', 'SP', 'RJ', 'CE', 'PR', 'MG'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterState(st)}
                className={cn(
                  'rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs transition',
                  filterState === st ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'bg-[var(--card)] hover:border-[var(--primary)]'
                )}
              >
                {st === 'ALL' ? 'Todos os Estados' : st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs text-[var(--muted-foreground)] uppercase">
                <th className="pb-3">Região</th>
                <th className="pb-3">Preço Médio / m²</th>
                <th className="pb-3">Variação Mensal</th>
                <th className="pb-3">Variação Anual</th>
                <th className="pb-3">Volume de Vendas</th>
                <th className="pb-3">Momento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-sm">
              {filtered.map((item) => (
                <tr key={item.city} className="hover:bg-[var(--primary)]/5 transition">
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[var(--primary)]" />
                      <div>
                        <span className="font-semibold">{item.city}</span>
                        <span className="ml-1 text-xs text-[var(--muted-foreground)]">({item.state})</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 font-mono font-semibold">
                    R$ {item.avgPriceM2.toLocaleString()}
                  </td>
                  <td className={cn('py-4 font-semibold', item.monthlyChange >= 0 ? 'text-success' : 'text-destructive')}>
                    {item.monthlyChange >= 0 ? '+' : ''}{item.monthlyChange}%
                  </td>
                  <td className={cn('py-4 font-semibold', item.yearlyChange >= 0 ? 'text-success' : 'text-destructive')}>
                    {item.yearlyChange >= 0 ? '+' : ''}{item.yearlyChange}%
                  </td>
                  <td className="py-4 text-[var(--muted-foreground)]">
                    {item.volume} transações
                  </td>
                  <td className="py-4">
                    <Badge variant={item.momentum === 'high' ? 'success' : 'outline'}>
                      {item.momentum === 'high' ? 'Em Alta' : 'Estável'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
