'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Award, TrendingUp, Gem, Layers } from '../../../components/lovable/icons';
import { Card, Badge, Button, Stat, buttonVariants, cn } from '@landmap/ui';

type SyndicateDeal = {
  id: string;
  assetName: string;
  targetRaise: number;
  fundedAmount: number;
  minTicket: number;
  expectedIrr: number;
  projectedYield: number;
  investorsCount: number;
  status: 'funding' | 'completed' | 'generating';
};

const MOCK_DEALS: SyndicateDeal[] = [
  {
    id: 'syn-1',
    assetName: 'Pool de Terrenos Eusébio Leste',
    targetRaise: 5000000,
    fundedAmount: 3750000,
    minTicket: 50000,
    expectedIrr: 16.5,
    projectedYield: 9.8,
    investorsCount: 42,
    status: 'funding',
  },
  {
    id: 'syn-2',
    assetName: 'Dossiê Residencial Aldeota Hub',
    targetRaise: 12000000,
    fundedAmount: 12000000,
    minTicket: 100000,
    expectedIrr: 14.8,
    projectedYield: 8.5,
    investorsCount: 89,
    status: 'generating',
  },
];

export default function SyndicatePage() {
  const params = useParams();
  const locale = params.locale || 'pt-BR';
  const [deals, setDeals] = useState<SyndicateDeal[]>(MOCK_DEALS);

  function investMock(id: string) {
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const newFunded = Math.min(d.targetRaise, d.fundedAmount + 50000);
        return {
          ...d,
          fundedAmount: newFunded,
          investorsCount: newFunded === d.fundedAmount ? d.investorsCount : d.investorsCount + 1,
          status: newFunded === d.targetRaise ? 'completed' : d.status,
        };
      })
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      {/* Header */}
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Co-Investimento LP</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">Sindicatos de Investimento</h1>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Participe de captações coletivas estruturadas para grandes ativos territoriais no Brasil</p>
            </div>
          </div>
          <Link
            href={`/${locale}`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full')}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Voltar
          </Link>
        </div>
      </header>

      {/* Highlights */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total Captado (Sindicatos)" value="R$ 15.75M" />
        <Stat label="Investidores Ativos" value="131 LPs" />
        <Stat label="Retorno Médio Esperado" value="15.6% TIR" />
      </div>

      {/* Active syndicates */}
      <div className="grid gap-6 md:grid-cols-2">
        {deals.map((deal) => {
          const pct = (deal.fundedAmount / deal.targetRaise) * 100;
          return (
            <Card key={deal.id} className="p-6 space-y-4">
              <div className="flex justify-between items-start border-b border-[var(--border)] pb-3">
                <div>
                  <h3 className="font-bold text-sm text-[var(--foreground)]">{deal.assetName}</h3>
                  <Badge className="mt-1" variant={deal.status === 'funding' ? 'warning' : 'success'}>
                    {deal.status === 'funding' && 'Captação Aberta'}
                    {deal.status === 'completed' && 'Esgotado'}
                    {deal.status === 'generating' && 'Em Operação'}
                  </Badge>
                </div>
                <Award className="h-5 w-5 text-[var(--primary)]" />
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
                  <span>Progresso: {pct.toFixed(0)}%</span>
                  <span>R$ {deal.fundedAmount.toLocaleString()} / R$ {deal.targetRaise.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full bg-[var(--border)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--primary)] transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-b border-[var(--border)] py-3">
                <div>
                  <span className="text-[var(--muted-foreground)] block">TIR Alvo</span>
                  <span className="font-bold text-[var(--foreground)] text-sm">{deal.expectedIrr}%</span>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)] block">Yield Anual</span>
                  <span className="font-bold text-[var(--foreground)] text-sm">{deal.projectedYield}%</span>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)] block">Ticket Mín.</span>
                  <span className="font-bold text-[var(--foreground)] text-xs">R$ {deal.minTicket.toLocaleString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 pt-2">
                <span className="text-xs text-[var(--muted-foreground)]">{deal.investorsCount} LPs participantes</span>
                <Button
                  onClick={() => investMock(deal.id)}
                  disabled={deal.status !== 'funding'}
                  size="sm"
                >
                  <Gem className="mr-1.5 h-4 w-4" />
                  Alocar R$ 50k
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
