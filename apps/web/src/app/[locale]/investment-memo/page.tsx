'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Send, TrendingUp, SlidersHorizontal, Gem, ShieldCheck } from '../../../components/lovable/icons';
import { Card, Badge, Button, Stat, buttonVariants, cn } from '@landmap/ui';

export default function InvestmentMemoPage() {
  const params = useParams();
  const locale = params.locale || 'pt-BR';

  // State parameters
  const [targetAsset, setTargetAsset] = useState('Terreno Comercial Meireles');
  const [purchasePrice, setPurchasePrice] = useState(4500000);
  const [equity, setEquity] = useState(2000000);
  const [inflationRate, setInflationRate] = useState(4.5);
  const [estimatedNoi, setEstimatedNoi] = useState(380000);

  // Derived financial ratios
  const capRate = (estimatedNoi / purchasePrice) * 100;
  const loanAmount = purchasePrice - equity;
  const ltv = (loanAmount / purchasePrice) * 100;
  const irrBase = capRate + 2.5; // simple model
  const paybackYears = purchasePrice / estimatedNoi;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 print:p-0 print:max-w-full">
      {/* Header */}
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Análise de Portfólio</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">Investment Memo Creator</h1>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Estruture e exporte dossiês analíticos detalhados de ativos imobiliários para comitês de crédito</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/${locale}`}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full')}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Painel Geral
            </Link>
            <Button onClick={() => window.print()} size="sm" className="rounded-full">
              <Send className="mr-1.5 h-4 w-4 rotate-90" />
              Imprimir / PDF
            </Button>
          </div>
        </div>
      </header>

      {/* Grid Specs */}
      <div className="grid gap-6 md:grid-cols-[1fr_20rem]">
        {/* Memo details */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-[var(--primary)]" />
              Parâmetros de Viabilidade do Ativo
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[11px] text-[var(--muted-foreground)] font-semibold uppercase">Ativo Alvo</span>
                <input
                  type="text"
                  value={targetAsset}
                  onChange={(e) => setTargetAsset(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] text-[var(--muted-foreground)] font-semibold uppercase">Preço de Compra (R$)</span>
                <input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(Number(e.target.value))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] text-[var(--muted-foreground)] font-semibold uppercase">Capital Próprio / Equity (R$)</span>
                <input
                  type="number"
                  value={equity}
                  onChange={(e) => setEquity(Number(e.target.value))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] text-[var(--muted-foreground)] font-semibold uppercase">NOI Estimado Anual (R$)</span>
                <input
                  type="number"
                  value={estimatedNoi}
                  onChange={(e) => setEstimatedNoi(Number(e.target.value))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                />
              </label>
            </div>
          </Card>

          {/* Investment Memo Document layout */}
          <Card className="p-8 space-y-6 border border-[var(--border)] bg-white text-neutral-900 shadow-md rounded-3xl print:shadow-none print:border-none">
            <div className="border-b border-neutral-200 pb-4">
              <Badge variant="outline" className="border-neutral-300 text-neutral-600">COMITÊ DE INVESTIMENTOS</Badge>
              <h3 className="mt-2 text-2xl font-bold text-neutral-900">{targetAsset}</h3>
              <p className="text-xs text-neutral-500 mt-1">Data do Memo: {new Date().toLocaleDateString('pt-BR')} · Elaborado por LandMap Engine</p>
            </div>

            <div className="space-y-4 text-sm leading-relaxed text-neutral-700">
              <section className="space-y-2">
                <h4 className="font-bold text-neutral-900 uppercase text-xs tracking-wider">1. Resumo Executivo</h4>
                <p>
                  O presente documento detalha a viabilidade de aquisição do ativo localizado na região de interesse, com preço negociado de R$ {purchasePrice.toLocaleString()}. O projeto requer R$ {equity.toLocaleString()} de capital próprio, com alavancagem estruturada de R$ {loanAmount.toLocaleString()} (LTV de {ltv.toFixed(1)}%).
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-neutral-900 uppercase text-xs tracking-wider">2. Premissas Financeiras Alvo</h4>
                <p>
                  Com um NOI (Receita Operacional Líquida) anual de R$ {estimatedNoi.toLocaleString()}, o ativo apresenta um Cap Rate inicial de {capRate.toFixed(1)}%. A taxa de retorno estimada (IRR) no cenário base é de {irrBase.toFixed(1)}% ao ano, com retorno de capital total estimado em {paybackYears.toFixed(1)} anos.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-neutral-900 uppercase text-xs tracking-wider">3. Cenários de Retorno e Sensibilidade</h4>
                <div className="grid gap-3 sm:grid-cols-3 mt-2">
                  <div className="border border-neutral-200 p-3 rounded-xl bg-neutral-50">
                    <p className="text-[10px] uppercase font-bold text-neutral-500">Pessimista</p>
                    <p className="text-lg font-bold text-neutral-800">{(irrBase - 2.5).toFixed(1)}% TIR</p>
                    <p className="text-[9px] text-neutral-500 mt-1">Vacância e juros em alta</p>
                  </div>
                  <div className="border border-neutral-300 p-3 rounded-xl bg-neutral-100">
                    <p className="text-[10px] uppercase font-bold text-neutral-600">Base</p>
                    <p className="text-lg font-bold text-neutral-900">{irrBase.toFixed(1)}% TIR</p>
                    <p className="text-[9px] text-neutral-500 mt-1">Previsão do plano diretor</p>
                  </div>
                  <div className="border border-neutral-200 p-3 rounded-xl bg-neutral-50">
                    <p className="text-[10px] uppercase font-bold text-neutral-500">Otimista</p>
                    <p className="text-lg font-bold text-success">{(irrBase + 3).toFixed(1)}% TIR</p>
                    <p className="text-[9px] text-neutral-500 mt-1">Rápida locação e valorização</p>
                  </div>
                </div>
              </section>
            </div>
          </Card>
        </div>

        {/* Sidebar indicators summary */}
        <div className="space-y-4 print:hidden">
          <Card className="p-5 border-success/30 bg-success/5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Cap Rate Estimado</h3>
            <p className="mt-2 text-3xl font-bold text-success">{capRate.toFixed(1)}%</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">Relação direta de rendimento operacional</p>
          </Card>

          <Card className="p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Parâmetros Rápidos</h4>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Financiamento LTV:</span>
              <span className="font-semibold">{ltv.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Payback (Retorno):</span>
              <span className="font-semibold">{paybackYears.toFixed(1)} anos</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Premissa Inflação:</span>
              <span className="font-semibold">{inflationRate}%</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
