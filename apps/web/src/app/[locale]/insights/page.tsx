'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Zap,
  Target,
  BarChart3,
} from 'lucide-react';
import { Card, Badge, Stat, Sparkline, Progress, Button, buttonVariants, cn } from '@landmap/ui';

// Mock data types
interface InsightCard {
  id: string;
  city: string;
  state: string;
  trend: 'up' | 'down' | 'stable';
  appreciation: number;
  pricePerM2: number;
  changePercentage: number;
  properties: number;
  riskLevel: 'low' | 'medium' | 'high';
  highlights: string[];
  sparklineData: number[];
}

interface MarketIndicator {
  label: string;
  value: string;
  change: number;
  status: 'positive' | 'negative' | 'neutral';
}

interface Opportunity {
  id: string;
  title: string;
  description: string;
  severity: 'baixa' | 'media' | 'alta';
  affectedCities: number;
  impact: string;
}

// Mock data generators
const generateSparkline = (): number[] => {
  const months = 12;
  const data: number[] = [];
  let value = 50;
  for (let i = 0; i < months; i++) {
    value += (Math.random() - 0.4) * 20;
    data.push(Math.max(10, Math.min(100, value)));
  }
  return data;
};

const insightCards: InsightCard[] = [
  {
    id: '1',
    city: 'São Paulo',
    state: 'SP',
    trend: 'up',
    appreciation: 12.5,
    pricePerM2: 8400,
    changePercentage: 8.3,
    properties: 450,
    riskLevel: 'low',
    highlights: [
      'Forte demanda de investidores institucionais',
      'Expansão de infraestrutura de transporte',
    ],
    sparklineData: generateSparkline(),
  },
  {
    id: '2',
    city: 'Rio de Janeiro',
    state: 'RJ',
    trend: 'up',
    appreciation: 9.2,
    pricePerM2: 6800,
    changePercentage: 5.6,
    properties: 320,
    riskLevel: 'medium',
    highlights: [
      'Recuperação do mercado pós-pandemia',
      'Investimento em turismo e lazer',
    ],
    sparklineData: generateSparkline(),
  },
  {
    id: '3',
    city: 'Belo Horizonte',
    state: 'MG',
    trend: 'stable',
    appreciation: 5.8,
    pricePerM2: 4200,
    changePercentage: 2.1,
    properties: 210,
    riskLevel: 'low',
    highlights: [
      'Mercado consolidado e previsível',
      'Crescimento moderado e sustentável',
    ],
    sparklineData: generateSparkline(),
  },
  {
    id: '4',
    city: 'Curitiba',
    state: 'PR',
    trend: 'down',
    appreciation: -3.1,
    pricePerM2: 5100,
    changePercentage: -1.8,
    properties: 180,
    riskLevel: 'high',
    highlights: [
      'Correção de mercado em andamento',
      'Demanda enfraquecida no segmento residential',
    ],
    sparklineData: generateSparkline(),
  },
  {
    id: '5',
    city: 'Brasília',
    state: 'DF',
    trend: 'up',
    appreciation: 7.4,
    pricePerM2: 5900,
    changePercentage: 4.2,
    properties: 145,
    riskLevel: 'medium',
    highlights: [
      'Crescimento da demanda governamental',
      'Novos empreendimentos comerciais',
    ],
    sparklineData: generateSparkline(),
  },
];

const marketIndicators: MarketIndicator[] = [
  { label: 'IPCA', value: '4.20%', change: 0.15, status: 'neutral' },
  { label: 'Selic', value: '10.50%', change: -0.25, status: 'positive' },
  { label: 'CDI', value: '10.25%', change: -0.20, status: 'positive' },
  { label: 'Dólar', value: '5.12', change: 1.2, status: 'negative' },
];

const opportunities: Opportunity[] = [
  {
    id: '1',
    title: 'Oportunidade de Arbitragem em SP',
    description:
      'Diferencial de preço/m² identifica potencial de 15-20% entre zonas similares. Recomenda-se investigação de fundamentos.',
    severity: 'media',
    affectedCities: 1,
    impact: 'Alto potencial',
  },
  {
    id: '2',
    title: 'Pressão de Oferta em Curitiba',
    description:
      'Novo inventário supera absorção de mercado. Aguarde consolidação antes de investir.',
    severity: 'alta',
    affectedCities: 1,
    impact: 'Risco de queda',
  },
  {
    id: '3',
    title: 'Recuperação em RJ Confirmada',
    description:
      'Indicadores macros e de demanda convergem para valorização. Janela de oportunidade aberta.',
    severity: 'baixa',
    affectedCities: 1,
    impact: 'Tendência positiva',
  },
];

const getTrendColor = (trend: 'up' | 'down' | 'stable'): string => {
  if (trend === 'up') return 'text-[var(--success)]';
  if (trend === 'down') return 'text-[var(--destructive)]';
  return 'text-[var(--muted-foreground)]';
};

const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
  if (trend === 'up') return <TrendingUp className="h-4 w-4" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4" />;
  return <BarChart3 className="h-4 w-4" />;
};

const getRiskBadgeColor = (
  risk: 'low' | 'medium' | 'high',
): 'default' | 'success' | 'warning' | 'destructive' => {
  if (risk === 'low') return 'success';
  if (risk === 'medium') return 'warning';
  return 'destructive';
};

const getSeverityBadge = (severity: 'baixa' | 'media' | 'alta') => {
  if (severity === 'baixa')
    return <Badge className="bg-[var(--success)]/10 text-[var(--success)]">Baixa</Badge>;
  if (severity === 'media')
    return <Badge className="bg-[var(--warning)]/10 text-[var(--warning)]">Média</Badge>;
  return <Badge className="bg-[var(--destructive)]/10 text-[var(--destructive)]">Alta</Badge>;
};

export default function InsightsPage() {
  const locale = useLocale();
  const t = useTranslations('insights');
  const tCommon = useTranslations('common');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const lh = (p: string) => `/${locale}${p}`;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero Section */}
      <section className="border-b border-[var(--border)] bg-gradient-to-br from-[var(--card)] to-[var(--background)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16 lg:py-20">
          <div className="mb-8 flex items-center gap-2">
            <span className="eyebrow">{t('eyebrow')}</span>
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl">
            {t('title')}
          </h1>
          <p className="mt-4 text-lg text-[var(--muted-foreground)] max-w-3xl">
            {t('description')}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href={lh('/map')} className={buttonVariants({ size: 'lg' })}>
              {t('cta')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href={lh('/compare')}
              className={buttonVariants({ size: 'lg', variant: 'outline' })}
            >
              {tCommon('viewMore')}
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* Key Stats Grid */}
        <section className="mb-12">
          <div className="mb-6 flex items-center gap-2">
            <Zap className="h-5 w-5 text-[var(--primary)]" />
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Indicadores Macroeconômicos
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {marketIndicators.map((indicator) => (
              <Stat
                key={indicator.label}
                label={indicator.label}
                value={indicator.value}
                trend={
                  indicator.status === 'positive'
                    ? Math.round(indicator.change * 100)
                    : indicator.status === 'negative'
                      ? -Math.round(Math.abs(indicator.change) * 100)
                      : 0
                }
              />
            ))}
          </div>
        </section>

        {/* Regional Insights Grid */}
        <section className="mb-12">
          <div className="mb-6 flex items-center gap-2">
            <Target className="h-5 w-5 text-[var(--primary)]" />
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Ranking Regional (Top 5)
            </h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {insightCards.map((insight, idx) => (
              <Card
                key={insight.id}
                variant={selectedCity === insight.id ? 'highlight' : 'interactive'}
                onClick={() => setSelectedCity(selectedCity === insight.id ? null : insight.id)}
                className="cursor-pointer"
              >
                {/* Header */}
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">#{idx + 1}</Badge>
                      <h3 className="font-semibold text-[var(--foreground)]">
                        {insight.city}, {insight.state}
                      </h3>
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {insight.properties} imóveis catalogados
                    </p>
                  </div>
                  <div className={cn('flex items-center gap-1', getTrendColor(insight.trend))}>
                    {getTrendIcon(insight.trend)}
                    <span className="text-lg font-bold">
                      {insight.appreciation > 0 ? '+' : ''}
                      {insight.appreciation.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Metrics Row */}
                <div className="mb-4 grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-[var(--background)] p-2.5">
                    <p className="text-xs text-[var(--muted-foreground)]">Preço/m²</p>
                    <p className="mt-1 font-semibold text-[var(--foreground)]">
                      R$ {(insight.pricePerM2 / 1000).toFixed(1)}k
                    </p>
                  </div>
                  <div className="rounded-lg bg-[var(--background)] p-2.5">
                    <p className="text-xs text-[var(--muted-foreground)]">Mudança 12m</p>
                    <p
                      className={cn(
                        'mt-1 font-semibold',
                        insight.changePercentage > 0
                          ? 'text-[var(--success)]'
                          : 'text-[var(--destructive)]',
                      )}
                    >
                      {insight.changePercentage > 0 ? '+' : ''}
                      {insight.changePercentage.toFixed(1)}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-[var(--background)] p-2.5">
                    <p className="text-xs text-[var(--muted-foreground)]">Risco</p>
                    <Badge className="mt-1" variant="outline">
                      {insight.riskLevel === 'low'
                        ? 'Baixo'
                        : insight.riskLevel === 'medium'
                          ? 'Médio'
                          : 'Alto'}
                    </Badge>
                  </div>
                </div>

                {/* Sparkline Chart */}
                <div className="mb-4 rounded-lg bg-[var(--background)] p-3">
                  <p className="mb-2 text-xs text-[var(--muted-foreground)]">
                    Dispersão 12 meses
                  </p>
                  <Sparkline
                    data={insight.sparklineData}
                    width={280}
                    height={36}
                    color="var(--primary)"
                  />
                </div>

                {/* Highlights */}
                {selectedCity === insight.id && (
                  <div className="mb-3 space-y-2 border-t border-[var(--border)] pt-3">
                    {insight.highlights.map((highlight, i) => (
                      <div key={i} className="flex gap-2">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[var(--success)]" />
                        <p className="text-sm text-[var(--foreground)]">{highlight}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer CTA */}
                <Link
                  href={lh(`/map?city=${insight.city}`)}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-foreground)] transition-colors"
                >
                  Explorar no mapa
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Card>
            ))}
          </div>
        </section>

        {/* Opportunities Section */}
        <section className="mb-12">
          <div className="mb-6 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-[var(--primary)]" />
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Alertas de Oportunidade
            </h2>
          </div>

          <div className="space-y-3">
            {opportunities.map((opp) => (
              <Card key={opp.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[var(--foreground)]">{opp.title}</h3>
                      {getSeverityBadge(opp.severity)}
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {opp.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4">
                      <div>
                        <p className="text-xs text-[var(--muted-foreground)]">Cidades afetadas</p>
                        <p className="font-semibold text-[var(--foreground)]">
                          {opp.affectedCities}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--muted-foreground)]">Impacto</p>
                        <p className="font-medium text-[var(--primary)]">{opp.impact}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="rounded-xl border border-[var(--border)] bg-gradient-to-br from-[var(--accent)] to-[var(--background)] p-8">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
            O que você pode fazer com Insights
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <BarChart3 className="h-8 w-8 text-[var(--primary)] mb-3" />
              <h3 className="font-semibold text-[var(--foreground)] mb-2">{t('f1')}</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Identifique as regiões com maior potencial de valorização em 12 meses.
              </p>
            </div>
            <div>
              <AlertCircle className="h-8 w-8 text-[var(--primary)] mb-3" />
              <h3 className="font-semibold text-[var(--foreground)] mb-2">{t('f2')}</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Receba alertas automáticos quando o preço por m² sofrer mudanças significativas.
              </p>
            </div>
            <div>
              <Zap className="h-8 w-8 text-[var(--primary)] mb-3" />
              <h3 className="font-semibold text-[var(--foreground)] mb-2">{t('f3')}</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Receba síntese narrativa gerada por IA sobre o potencial de cada área.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Footer */}
        <section className="mt-12 rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">
            Pronto para explorar oportunidades?
          </h2>
          <p className="mt-3 text-[var(--muted-foreground)]">
            Acesse o mapa interativo para investigar em detalhe cada região e seus fundamentos.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link href={lh('/map')} className={buttonVariants({ size: 'lg' })}>
              Abrir o mapa
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href={lh('/chat')}
              className={buttonVariants({ size: 'lg', variant: 'outline' })}
            >
              Perguntar à IA
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
