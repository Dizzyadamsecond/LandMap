'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Layers, Search, ShieldCheck, AlertTriangle } from '../../../components/lovable/icons';
import { Card, Badge, Button, Stat, buttonVariants, cn } from '@landmap/ui';

type ZoningRule = {
  code: string;
  name: string;
  coefficient: number; // C.A. Básico
  maxCoefficient: number; // C.A. Máximo
  heightLimit: string;
  recuo: string;
  description: string;
};

const ZONING_DB: ZoningRule[] = [
  {
    code: 'ZEU',
    name: 'Zona Eixo de Estruturação Urbana',
    coefficient: 1.0,
    maxCoefficient: 4.0,
    heightLimit: 'Sem limite de gabarito',
    recuo: '5 metros de testada',
    description: 'Áreas próximas a corredores de transporte de massa. Ideal para edifícios residenciais de alta densidade sem limites rígidos de altura.',
  },
  {
    code: 'ZER',
    name: 'Zona Exclusivamente Residencial',
    coefficient: 1.0,
    maxCoefficient: 1.0,
    heightLimit: 'Até 10 metros (térreo + 2 pav.)',
    recuo: '3 metros de recuo lateral',
    description: 'Bairros residenciais consolidados. Altamente restritiva, focada em casas isoladas ou sobrados de baixo gabarito.',
  },
  {
    code: 'ZEIS',
    name: 'Zona Especial de Interesse Social',
    coefficient: 1.0,
    maxCoefficient: 3.0,
    heightLimit: 'Até 28 metros',
    recuo: 'Parâmetros flexibilizados',
    description: 'Destinada a habitação de interesse social (HIS) ou regularização fundiária. Beneficia-se de incentivos tributários e facilidades de aproveitamento.',
  },
  {
    code: 'ZCOR',
    name: 'Zona Corredor Comercial',
    coefficient: 1.5,
    maxCoefficient: 2.5,
    heightLimit: 'Até 15 metros',
    recuo: '4 metros de testada',
    description: 'Eixos comerciais ao longo de avenidas arteriais. Focado em galerias de serviços, escritórios e pequenas lojas.',
  },
];

export default function ZoningPage() {
  const params = useParams();
  const locale = params.locale || 'pt-BR';
  const [query, setQuery] = useState('');

  const filtered = ZONING_DB.filter(
    (rule) =>
      rule.code.toLowerCase().includes(query.toLowerCase()) ||
      rule.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      {/* Header */}
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Regulamento Urbano</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">Zoneamento & Uso do Solo</h1>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Consulte restrições, coeficientes máximos e regras de gabarito para terrenos urbanos no Brasil</p>
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

      {/* Search Input */}
      <div className="flex items-center gap-2 border border-[var(--border)] bg-[var(--card)] rounded-2xl px-4 py-3 w-full max-w-lg shadow-sm">
        <Search className="h-5 w-5 text-[var(--muted-foreground)]" />
        <input
          type="text"
          placeholder="Busque por código (ex: ZEU, ZER) ou tipo de uso..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-transparent border-none outline-none text-sm w-full text-[var(--foreground)] placeholder-[var(--muted-foreground)]"
        />
      </div>

      {/* Rules Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {filtered.map((rule) => (
          <Card key={rule.code} className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Código Municipal</span>
                <h3 className="text-xl font-bold text-[var(--foreground)] mt-0.5">{rule.code}</h3>
              </div>
              <Badge variant="outline" className="border-[var(--primary)]/30 text-[var(--primary)] font-semibold">
                C.A. Máximo: {rule.maxCoefficient.toFixed(1)}x
              </Badge>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-semibold text-sm text-[var(--foreground)]">{rule.name}</p>
              <p className="text-[var(--muted-foreground)] leading-relaxed">{rule.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--border)] text-[11px] text-[var(--muted-foreground)]">
              <div>
                <span className="font-bold block uppercase text-[10px]">Limite Gabarito</span>
                <span className="text-[var(--foreground)] mt-0.5 block">{rule.heightLimit}</span>
              </div>
              <div>
                <span className="font-bold block uppercase text-[10px]">Recuo Obrigatório</span>
                <span className="text-[var(--foreground)] mt-0.5 block">{rule.recuo}</span>
              </div>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-8 text-center text-sm text-[var(--muted-foreground)] flex flex-col items-center justify-center gap-2">
            <AlertTriangle className="h-8 w-8 text-warning" />
            Nenhuma zona correspondente encontrada para a busca atual.
          </div>
        )}
      </div>
    </div>
  );
}
