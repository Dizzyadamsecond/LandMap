'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, Layers, Map, Activity } from '../../../components/lovable/icons';
import { Card, Badge, Button, Stat, buttonVariants, cn } from '@landmap/ui';

type RiskFactor = {
  name: string;
  category: 'geology' | 'flood' | 'zoning';
  score: number; // 0 to 100
  status: 'safe' | 'warning' | 'danger';
  description: string;
};

const MOCK_RISKS: RiskFactor[] = [
  {
    name: 'Risco de Inundação (Bacia Pluvial)',
    category: 'flood',
    score: 12,
    status: 'safe',
    description: 'Localizado em cota topográfica elevada, fora da bacia de acumulação pluvial da macrodrenagem municipal.',
  },
  {
    name: 'Declividade do Solo (Estabilidade)',
    category: 'geology',
    score: 45,
    status: 'warning',
    description: 'Declividade média de 14°. Exige muro de arrimo simples e compactação de fundação, sem risco iminente de deslizamento.',
  },
  {
    name: 'Proximidade de Zona de Conservação Ambiental',
    category: 'zoning',
    score: 85,
    status: 'danger',
    description: 'Distância inferior a 50m de área de proteção permanente. Potencial barreira de zoneamento e embargo judicial para recuo de testada.',
  },
];

export default function RiskRadarPage() {
  const params = useParams();
  const locale = params.locale || 'pt-BR';
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'geology' | 'flood' | 'zoning'>('all');

  const filteredRisks = MOCK_RISKS.filter(
    (r) => selectedCategory === 'all' || r.category === selectedCategory
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      {/* Header */}
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Análise Ambiental</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">Radar de Risco Ambiental</h1>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Monitore riscos geológicos, pluviais e restrições de zoneamento para novos empreendimentos</p>
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

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'geology', 'flood', 'zoning'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              'rounded-full border border-[var(--border)] px-4 py-1.5 text-xs transition',
              selectedCategory === cat
                ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'hover:border-[var(--primary)] bg-[var(--card)]'
            )}
          >
            {cat === 'all' && 'Todos os Riscos'}
            {cat === 'geology' && 'Geologia'}
            {cat === 'flood' && 'Alagamento / Pluvial'}
            {cat === 'zoning' && 'Zoneamento / APP'}
          </button>
        ))}
      </div>

      {/* Grid Risks */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Risks list */}
        <div className="space-y-4">
          {filteredRisks.map((risk) => (
            <Card key={risk.name} className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-[var(--foreground)]">{risk.name}</h3>
                  <Badge className="mt-1" variant={risk.status === 'safe' ? 'success' : risk.status === 'warning' ? 'warning' : 'destructive'}>
                    {risk.status === 'safe' && 'Risco Baixo'}
                    {risk.status === 'warning' && 'Atenção Exigida'}
                    {risk.status === 'danger' && 'Alerta Crítico'}
                  </Badge>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[var(--muted-foreground)]">Índice</span>
                  <p className={cn(
                    'text-xl font-bold',
                    risk.status === 'safe' && 'text-success',
                    risk.status === 'warning' && 'text-warning',
                    risk.status === 'danger' && 'text-destructive'
                  )}>
                    {risk.score}/100
                  </p>
                </div>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{risk.description}</p>
            </Card>
          ))}
        </div>

        {/* Risk map simulation card */}
        <Card className="p-6 flex flex-col justify-between border-[var(--border)] min-h-[300px]">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5">
              <Map className="h-4 w-4 text-[var(--primary)]" />
              Simulação de Mapa de Topografia
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Curvas de nível e declive plotadas em tempo real com dados da Overpass e grades do INPE.
            </p>
          </div>

          <div className="my-6 aspect-video rounded-2xl bg-[var(--background)] border border-[var(--border)] grid place-items-center relative overflow-hidden">
            {/* Topographic mock lines */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/50 via-emerald-500 to-transparent" />
            <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full border border-[var(--primary)]/20 animate-ping" />
            <div className="absolute top-1/3 left-1/3 w-16 h-16 rounded-full border border-warning/30" />
            <div className="absolute top-1/2 left-1/2 w-8 h-8 rounded-full border border-destructive/40" />

            <div className="z-10 text-center space-y-1">
              <AlertTriangle className="h-8 w-8 text-warning mx-auto" />
              <p className="text-[11px] font-semibold">APP Detectada no Raio do Ativo</p>
              <p className="text-[9px] text-[var(--muted-foreground)]">32m de recuo obrigatório da margem fluvial</p>
            </div>
          </div>

          <div className="text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Solo predominante:</span>
              <span className="font-semibold">Argiloso / Latossolo Vermelho</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Cota altimétrica:</span>
              <span className="font-semibold">24m acima do nível do mar</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
