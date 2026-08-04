'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, SlidersHorizontal, Activity, ShieldCheck, AlertTriangle, TrendingDown } from '../../../components/lovable/icons';
import { Card, Badge, Button, Stat, buttonVariants, cn } from '@landmap/ui';

export default function UnderwritingPage() {
  const params = useParams();
  const locale = params.locale || 'pt-BR';

  // Stress sliders state
  const [vacancy, setVacancy] = useState(10); // vacância (%)
  const [capex, setCapex] = useState(5); // capex/manutenção (%)
  const [rateStrap, setRateStrap] = useState(11.5); // taxa básica de juros (%)
  const [rentDeficit, setRentDeficit] = useState(0); // queda real de aluguel (%)

  // Financial baseline
  const acquisitionPrice = 3000000;
  const baselineNoi = 280000;

  // Stress calculations
  const adjustedNoi = Math.max(0, baselineNoi * (1 - vacancy / 100) * (1 - capex / 100) * (1 - rentDeficit / 100));
  const stressedCapRate = (adjustedNoi / acquisitionPrice) * 100;
  
  // Stressed IRR estimate
  const stressedIrr = Math.max(0, stressedCapRate + 3.0 - (rateStrap - 10.75) * 0.5);

  const riskStatus = stressedIrr > 12 ? 'safe' : stressedIrr > 8 ? 'warning' : 'danger';

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      {/* Header */}
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Modelagem Financeira</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">Underwriting & Estresse Financeiro</h1>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Simule cenários macroeconômicos adversos para testar a resiliência do cap rate e TIR de portfólios imobiliários</p>
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

      {/* Main Sandbox Grid */}
      <div className="grid gap-6 md:grid-cols-[1fr_20rem]">
        {/* Sliders Form */}
        <Card className="p-6 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-[var(--primary)]" />
            Cenários de Estresse Macroeconômico
          </h2>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Vacancy */}
            <div className="space-y-2">
              <label className="flex justify-between text-sm font-medium">
                <span>Taxa de Vacância Estressada</span>
                <span className="text-destructive font-semibold">{vacancy}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="40"
                step="1"
                value={vacancy}
                onChange={(e) => setVacancy(Number(e.target.value))}
                className="w-full h-1.5 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
              />
            </div>

            {/* Capex */}
            <div className="space-y-2">
              <label className="flex justify-between text-sm font-medium">
                <span>Provisão de CAPEX / Manutenção</span>
                <span className="text-destructive font-semibold">{capex}%</span>
              </label>
              <input
                type="range"
                min="2"
                max="20"
                step="1"
                value={capex}
                onChange={(e) => setCapex(Number(e.target.value))}
                className="w-full h-1.5 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
              />
            </div>

            {/* Selic/Interest */}
            <div className="space-y-2">
              <label className="flex justify-between text-sm font-medium">
                <span>Taxa Básica de Juros (Selic)</span>
                <span className="text-[var(--primary)] font-semibold">{rateStrap}%</span>
              </label>
              <input
                type="range"
                min="8.00"
                max="16.00"
                step="0.25"
                value={rateStrap}
                onChange={(e) => setRateStrap(Number(e.target.value))}
                className="w-full h-1.5 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
              />
            </div>

            {/* Rent deficit */}
            <div className="space-y-2">
              <label className="flex justify-between text-sm font-medium">
                <span>Queda Real do Aluguel da Região</span>
                <span className="text-destructive font-semibold">{rentDeficit}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={rentDeficit}
                onChange={(e) => setRentDeficit(Number(e.target.value))}
                className="w-full h-1.5 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
              />
            </div>
          </div>
        </Card>

        {/* Telemetry output */}
        <div className="space-y-4">
          <Card className={cn(
            'p-5 border',
            riskStatus === 'safe' && 'border-success/30 bg-success/5',
            riskStatus === 'warning' && 'border-warning/30 bg-warning/5',
            riskStatus === 'danger' && 'border-destructive/30 bg-destructive/5'
          )}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">TIR Estressada do Portfólio</h3>
            <p className="mt-2 text-3xl font-bold text-[var(--foreground)]">{stressedIrr.toFixed(1)}% TIR</p>
            <div className="mt-2 flex items-center gap-1.5">
              {riskStatus === 'safe' && (
                <>
                  <ShieldCheck className="h-4 w-4 text-success" />
                  <span className="text-xs font-semibold text-success">Ativo Resiliente</span>
                </>
              )}
              {riskStatus === 'warning' && (
                <>
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="text-xs font-semibold text-warning">Alerta de Margem Estreita</span>
                </>
              )}
              {riskStatus === 'danger' && (
                <>
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  <span className="text-xs font-semibold text-destructive">Risco de Yield Negativo</span>
                </>
              )}
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Valores em Cenário Stress</h4>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">NOI Ajustado:</span>
              <span className="font-semibold">R$ {adjustedNoi.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Cap Rate Estressado:</span>
              <span className="font-semibold">{stressedCapRate.toFixed(1)}%</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
