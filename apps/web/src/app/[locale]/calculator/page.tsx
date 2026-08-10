'use client';

import { useMemo, useState } from 'react';
import { Sparkles, Activity, AlertTriangle, Zap, CheckCircle2 } from '../../../components/lovable/icons';
import { ProductPageShell } from '../../../components/ProductPageShell';
import { Card, Stat, Badge, Button, cn } from '@landmap/ui';
import { INTELLIGENCE_REGIONS, fmtPriceSqm } from '../../../lib/mapIntelligence';

export default function CalculatorPage() {
  const [tab, setTab] = useState<'traditional' | 'firstPrinciples'>('traditional');

  // Traditional tab state
  const [regionId, setRegionId] = useState(INTELLIGENCE_REGIONS[0].id);
  const [area, setArea] = useState(400);
  const [rentYield, setRentYield] = useState(6);

  // First Principles state
  const [landPrice, setLandPrice] = useState(2500000);
  const [materialCost, setMaterialCost] = useState(800000);
  const [solarHours, setSolarHours] = useState(6);

  const region = INTELLIGENCE_REGIONS.find((r) => r.id === regionId) ?? INTELLIGENCE_REGIONS[0];

  const result = useMemo(() => {
    const price = region.priceSqm * area;
    const annualRent = price * (rentYield / 100);
    const monthly = annualRent / 12;
    const cap = rentYield;
    return { price, annualRent, monthly, cap };
  }, [region, area, rentYield]);

  const elonResult = useMemo(() => {
    const idiotIndex = Number((landPrice / Math.max(materialCost, 1)).toFixed(2));
    
    let rating = 'Excepcional (Elon Approved)';
    let colorClass = 'text-[var(--primary)]';
    if (idiotIndex >= 5.0) {
      rating = 'Nonsense / Ineficiência Crítica';
      colorClass = 'text-[var(--destructive)]';
    } else if (idiotIndex >= 2.0) {
      rating = 'Ineficiência Padrão de Mercado';
      colorClass = 'text-[var(--warning)]';
    }

    // Solar radiation efficiency & Starlink visibility
    const starlinkScore = Math.min(100, Math.round((solarHours / 8) * 60 + 40));

    return { idiotIndex, rating, colorClass, starlinkScore };
  }, [landPrice, materialCost, solarHours]);

  return (
    <ProductPageShell
      backHref="/map"
      eyebrow={
        <>
          <Sparkles className="h-3 w-3" /> Calculadora
        </>
      }
      title="Estimativa de investimento"
      description="Compare análises tradicionais baseadas em mercado com engenharia de primeiros princípios."
    >
      {/* Tab Switcher */}
      <div className="mb-6 flex gap-2 rounded-xl bg-[var(--muted)] p-1">
        <button
          type="button"
          onClick={() => setTab('traditional')}
          className={cn(
            'flex-1 rounded-lg py-2 text-center text-xs font-semibold transition',
            tab === 'traditional'
              ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          )}
        >
          Valoração Tradicional
        </button>
        <button
          type="button"
          onClick={() => setTab('firstPrinciples')}
          className={cn(
            'flex-1 rounded-lg py-2 text-center text-xs font-semibold transition',
            tab === 'firstPrinciples'
              ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          )}
        >
          Primeiros Princípios (Modo Elon)
        </button>
      </div>

      {tab === 'traditional' ? (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Preço estimado" value={fmtPriceSqm(result.price)} />
            <Stat label="Aluguel/mês" value={fmtPriceSqm(result.monthly)} />
            <Stat label="Yield a.a." value={`${result.cap}%`} />
            <Stat label="Score região" value={String(region.score)} />
          </section>

          <Card className="mt-6 space-y-4 p-4">
            <label className="block text-xs font-medium text-muted-foreground">
              Região
              <select
                value={regionId}
                onChange={(e) => setRegionId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm bg-[var(--card)] text-[var(--foreground)]"
              >
                {INTELLIGENCE_REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} · {fmtPriceSqm(r.priceSqm)}/m²
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-muted-foreground">
              Área (m²): {area}
              <input
                type="range"
                min={100}
                max={5000}
                step={50}
                value={area}
                onChange={(e) => setArea(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--primary)]"
              />
            </label>
            <label className="block text-xs font-medium text-muted-foreground">
              Yield anual %: {rentYield}
              <input
                type="range"
                min={3}
                max={12}
                step={0.5}
                value={rentYield}
                onChange={(e) => setRentYield(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--primary)]"
              />
            </label>
            <div className="pt-2">
              <Badge variant="outline">m² região: {fmtPriceSqm(region.priceSqm)}</Badge>
            </div>
          </Card>
        </>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Idiot Index" value={String(elonResult.idiotIndex)} />
            <Stat label="Starlink / Sol" value={`${elonResult.starlinkScore}%`} />
            <Stat label="Eficiência energética" value={solarHours >= 5 ? 'Excepcional' : 'Moderada'} />
            <Stat label="Avaliação" value={elonResult.rating} className={elonResult.colorClass} />
          </section>

          <Card className="mt-6 space-y-4 p-4">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-[var(--foreground)]">
              <Zap className="h-4 w-4 text-[var(--primary)]" />
              Cálculo de Ineficiência de Insumos (Idiot Index)
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              O <b>Idiot Index</b> é a razão entre o custo final do produto e o custo real dos seus materiais brutos. 
              Um valor elevado significa que a maior parte do seu investimento está sendo consumido por margens corporativas e fricção de intermediação — não por valor físico real.
            </p>

            <label className="block text-xs font-medium text-muted-foreground">
              Preço de Venda do Terreno (BRL): R$ {landPrice.toLocaleString('pt-BR')}
              <input
                type="range"
                min={100000}
                max={10000000}
                step={50000}
                value={landPrice}
                onChange={(e) => setLandPrice(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--primary)]"
              />
            </label>

            <label className="block text-xs font-medium text-muted-foreground">
              Custo dos Materiais Brutos + Mão de Obra (BRL): R$ {materialCost.toLocaleString('pt-BR')}
              <input
                type="range"
                min={50000}
                max={5000000}
                step={25000}
                value={materialCost}
                onChange={(e) => setMaterialCost(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--primary)]"
              />
            </label>

            <label className="block text-xs font-medium text-muted-foreground">
              Média de Radiação Solar Diária (Horas de Sol pleno): {solarHours}h
              <input
                type="range"
                min={2}
                max={10}
                step={0.5}
                value={solarHours}
                onChange={(e) => setSolarHours(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--primary)]"
              />
            </label>

            <div className="flex flex-col gap-2 rounded-xl bg-[var(--muted)]/50 p-3 text-[11px] text-[var(--muted-foreground)] leading-normal border border-[var(--border)]/40">
              <span className="font-semibold text-[var(--foreground)] flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--primary)]" />
                Primeiros Princípios aplicados:
              </span>
              <span>• Limite Físico de Conectividade Starlink: visibilidade livre para a constelação LEO.</span>
              <span>• Eficiência Térmica Solar: {solarHours >= 6.0 ? 'Alta densidade de fótons para painéis fotovoltaicos' : 'Necessita de bancos de baterias estáticas (Powerwall) extras'}.</span>
            </div>
          </Card>
        </>
      )}
    </ProductPageShell>
  );
}
