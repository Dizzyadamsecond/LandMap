'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SlidersHorizontal, ArrowLeft, Layers, TrendingUp, Briefcase, Gem } from '../../../components/lovable/icons';
import { Card, Badge, Button, Stat, buttonVariants, cn } from '@landmap/ui';

export default function ViabilidadePage() {
  const params = useParams();
  const locale = params.locale || 'pt-BR';

  // State for calculation parameters
  const [area, setArea] = useState(1000);
  const [ca, setCa] = useState(3.0); // Coeficiente de Aproveitamento
  const [salePrice, setSalePrice] = useState(8500); // Venda m² construído
  const [buildCost, setBuildCost] = useState(3200); // Custo m² de obra (CUB)
  const [swapRate, setSwapRate] = useState(15); // Taxa de permuta (%)
  const [margin, setMargin] = useState(20); // Margem de lucro desejada (%)

  // Calculate metrics
  const potencialConstrutivo = area * ca;
  const vgv = potencialConstrutivo * salePrice;
  const custoObra = potencialConstrutivo * buildCost;
  const valorPermuta = vgv * (swapRate / 100);
  
  // Residual Land Value (VGV - Custos de Obra - Margem Incorporador - Outras despesas aproximadas de 10%)
  const lucroDesejado = vgv * (margin / 100);
  const outrosCustos = vgv * 0.10;
  const valorResidualTerreno = Math.max(0, vgv - custoObra - lucroDesejado - outrosCustos);
  const residualPerM2 = valorResidualTerreno / area;

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
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Ferramenta Incorporação</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">Viabilidade Construtiva</h1>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Calcule o potencial construtivo e o Valor Residual do Terreno (Zonings & Feasibility)</p>
            </div>
          </div>
          <Link
            href={`/${locale}/calculator`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full')}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Calculadoras
          </Link>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-[1fr_20rem]">
        {/* Parameters Form */}
        <Card className="p-6 space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5 text-[var(--primary)]" />
            Parâmetros do Terreno e Obra
          </h2>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Area */}
            <div className="space-y-2">
              <label className="flex justify-between text-sm font-medium">
                <span>Área do Terreno (m²)</span>
                <span className="text-[var(--primary)] font-semibold">{area.toLocaleString()} m²</span>
              </label>
              <input
                type="range"
                min="100"
                max="10000"
                step="50"
                value={area}
                onChange={(e) => setArea(Number(e.target.value))}
                className="w-full h-1.5 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
              />
              <input
                type="number"
                value={area}
                onChange={(e) => setArea(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
              />
            </div>

            {/* C.A. */}
            <div className="space-y-2">
              <label className="flex justify-between text-sm font-medium">
                <span>Coeficiente de Aproveitamento (C.A.)</span>
                <span className="text-[var(--primary)] font-semibold">{ca.toFixed(1)}x</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="8.0"
                step="0.1"
                value={ca}
                onChange={(e) => setCa(Number(e.target.value))}
                className="w-full h-1.5 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
              />
              <input
                type="number"
                step="0.1"
                value={ca}
                onChange={(e) => setCa(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
              />
            </div>

            {/* Sale Price */}
            <div className="space-y-2">
              <label className="flex justify-between text-sm font-medium">
                <span>Venda m² Privativo (R$)</span>
                <span className="text-[var(--primary)] font-semibold">R$ {salePrice.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min="2000"
                max="25000"
                step="100"
                value={salePrice}
                onChange={(e) => setSalePrice(Number(e.target.value))}
                className="w-full h-1.5 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
              />
              <input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
              />
            </div>

            {/* Build Cost */}
            <div className="space-y-2">
              <label className="flex justify-between text-sm font-medium">
                <span>Custo de Construção m² (R$)</span>
                <span className="text-[var(--primary)] font-semibold">R$ {buildCost.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min="1000"
                max="10000"
                step="50"
                value={buildCost}
                onChange={(e) => setBuildCost(Number(e.target.value))}
                className="w-full h-1.5 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
              />
              <input
                type="number"
                value={buildCost}
                onChange={(e) => setBuildCost(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
              />
            </div>

            {/* Swap Rate */}
            <div className="space-y-2">
              <label className="flex justify-between text-sm font-medium">
                <span>Taxa de Permuta Física (%)</span>
                <span className="text-[var(--primary)] font-semibold">{swapRate}%</span>
              </label>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={swapRate}
                onChange={(e) => setSwapRate(Number(e.target.value))}
                className="w-full h-1.5 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
              />
            </div>

            {/* Target Margin */}
            <div className="space-y-2">
              <label className="flex justify-between text-sm font-medium">
                <span>Margem de Lucro Alvo (%)</span>
                <span className="text-[var(--primary)] font-semibold">{margin}%</span>
              </label>
              <input
                type="range"
                min="10"
                max="40"
                step="1"
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="w-full h-1.5 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
              />
            </div>
          </div>
        </Card>

        {/* Results Sidebar */}
        <div className="space-y-4">
          <Card className="p-5 border-[var(--primary)]/30 bg-[var(--primary)]/5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Valor Residual Máximo</h3>
            <p className="mt-2 text-3xl font-bold text-[var(--foreground)]">
              R$ {valorResidualTerreno.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Equivale a R$ {residualPerM2.toLocaleString(undefined, { maximumFractionDigits: 0 })} / m² do terreno
            </p>
          </Card>

          <Card className="p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Detalhes do Projeto</h4>
            
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Potencial Construtivo:</span>
              <span className="font-medium">{potencialConstrutivo.toLocaleString()} m²</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">VGV Estimado:</span>
              <span className="font-medium text-success">R$ {vgv.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Custo de Obra:</span>
              <span className="font-medium text-destructive">R$ {custoObra.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Valor da Permuta:</span>
              <span className="font-medium text-primary">R$ {valorPermuta.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Lucro Incorporador:</span>
              <span className="font-medium">R$ {lucroDesejado.toLocaleString()}</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
