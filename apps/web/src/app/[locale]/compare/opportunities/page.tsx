'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, BarChart, TrendingUp, ShieldCheck, Check, Gem, Activity } from '../../../../components/lovable/icons';
import { Card, Badge, Button, Stat, buttonVariants, cn } from '@landmap/ui';

type OpportunityItem = {
  id: string;
  name: string;
  city: string;
  price: number;
  area: number;
  capRate: number;
  noi: number;
  cashOnCash: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  payback: number;
};

const INITIAL_OPPORTUNITIES: OpportunityItem[] = [
  {
    id: 'opp-1',
    name: 'Terreno Aldeota Premium',
    city: 'Fortaleza',
    price: 3200000,
    area: 1200,
    capRate: 8.4,
    noi: 268800,
    cashOnCash: 9.1,
    grade: 'A',
    payback: 11.5,
  },
  {
    id: 'opp-2',
    name: 'Área Comercial Meireles',
    city: 'Fortaleza',
    price: 5800000,
    area: 1800,
    capRate: 7.8,
    noi: 452400,
    cashOnCash: 8.2,
    grade: 'B',
    payback: 12.8,
  },
  {
    id: 'opp-3',
    name: 'Lote Logístico Eusébio',
    city: 'Eusébio',
    price: 1950000,
    area: 2500,
    capRate: 9.2,
    noi: 179400,
    cashOnCash: 10.5,
    grade: 'A',
    payback: 10.2,
  },
];

export default function CompareOpportunitiesPage() {
  const params = useParams();
  const locale = params.locale || 'pt-BR';
  const [opps, setOpps] = useState<OpportunityItem[]>(INITIAL_OPPORTUNITIES);

  function updatePrice(id: string, newPrice: number) {
    setOpps((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const noi = o.noi;
        const cap = (noi / newPrice) * 100;
        return {
          ...o,
          price: newPrice,
          capRate: parseFloat(cap.toFixed(1)),
        };
      })
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      {/* Header */}
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
              <BarChart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Ferramenta Análise</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">Comparador de Oportunidades</h1>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Compare o Cap Rate, ROI, Payback e Grade de Risco de múltiplos ativos de investimento</p>
            </div>
          </div>
          <Link
            href={`/${locale}/compare`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full')}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Voltar
          </Link>
        </div>
      </header>

      {/* Comparison Matrix */}
      <Card className="p-6 overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="pb-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Métrica</th>
              {opps.map((opp) => (
                <th key={opp.id} className="pb-4 px-4 text-sm font-bold text-[var(--foreground)]">
                  <div>{opp.name}</div>
                  <div className="text-xs font-normal text-[var(--muted-foreground)]">{opp.city}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {/* Preço */}
            <tr>
              <td className="py-4 text-sm font-medium text-[var(--foreground)]">Preço de Aquisição</td>
              {opps.map((opp) => (
                <td key={opp.id} className="py-4 px-4">
                  <input
                    type="number"
                    value={opp.price}
                    onChange={(e) => updatePrice(opp.id, Number(e.target.value))}
                    className="w-full max-w-[150px] rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm outline-none focus:border-[var(--primary)]"
                  />
                </td>
              ))}
            </tr>

            {/* Preço por m² */}
            <tr>
              <td className="py-4 text-sm font-medium text-[var(--foreground)]">Preço / m² Terreno</td>
              {opps.map((opp) => (
                <td key={opp.id} className="py-4 px-4 text-sm">
                  R$ {(opp.price / opp.area).toLocaleString(undefined, { maximumFractionDigits: 0 })} / m²
                </td>
              ))}
            </tr>

            {/* Cap Rate */}
            <tr>
              <td className="py-4 text-sm font-medium text-[var(--foreground)]">Cap Rate Anual</td>
              {opps.map((opp) => (
                <td key={opp.id} className="py-4 px-4 text-sm font-bold text-success">
                  {opp.capRate}%
                </td>
              ))}
            </tr>

            {/* NOI */}
            <tr>
              <td className="py-4 text-sm font-medium text-[var(--foreground)]">NOI Estimado (R$/ano)</td>
              {opps.map((opp) => (
                <td key={opp.id} className="py-4 px-4 text-sm">
                  R$ {opp.noi.toLocaleString()}
                </td>
              ))}
            </tr>

            {/* Cash on Cash */}
            <tr>
              <td className="py-4 text-sm font-medium text-[var(--foreground)]">Cash-on-Cash Yield</td>
              {opps.map((opp) => (
                <td key={opp.id} className="py-4 px-4 text-sm text-[var(--primary)] font-semibold">
                  {opp.cashOnCash}%
                </td>
              ))}
            </tr>

            {/* Payback */}
            <tr>
              <td className="py-4 text-sm font-medium text-[var(--foreground)]">Tempo de Retorno (Payback)</td>
              {opps.map((opp) => (
                <td key={opp.id} className="py-4 px-4 text-sm">
                  {opp.payback} anos
                </td>
              ))}
            </tr>

            {/* Risco Grade */}
            <tr>
              <td className="py-4 text-sm font-medium text-[var(--foreground)]">Grade de Risco</td>
              {opps.map((opp) => (
                <td key={opp.id} className="py-4 px-4">
                  <Badge variant={opp.grade === 'A' ? 'success' : 'warning'}>
                    Grade {opp.grade}
                  </Badge>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}
