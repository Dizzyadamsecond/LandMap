'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  Zap,
  Check,
  Sparkles,
  Star,
  Building2,
  BarChart,
  Activity,
  Bot,
  ArrowUpDown,
} from '../../../components/lovable/icons';
import {
  Card,
  Badge,
  Stat,
  Sparkline,
  buttonVariants,
  cn,
} from '@landmap/ui';

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
  { label: 'CDI', value: '10.25%', change: -0.2, status: 'positive' },
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
  return <Activity className="h-4 w-4" />;
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
    return (
      <Badge className="bg-[var(--success)]/10 text-[var(--success)]">Baixa</Badge>
    );
  if (severity === 'media')
    return (
      <Badge className="bg-[var(--warning)]/10 text-[var(--warning)]">Média</Badge>
    );
  return (
    <Badge className="bg-[var(--destructive)]/10 text-[var(--destructive)]">
      Alta
    </Badge>
  );
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

export default function InsightsPage() {
  const locale = useLocale();
  const t = useTranslations('insights');
  const tCommon = useTranslations('common');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const lh = (p: string) => `/${locale}${p}`;

  return (
    <div className="min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="aurora" />
          <div
            className="glow-primary orb-float-slow"
            style={{ top: '-12%', left: '-6%', width: '42vw', height: '42vw' }}
          />
          <div
            className="glow-dual orb-float"
            style={{ bottom: '-18%', right: '-8%', width: '38vw', height: '38vw' }}
          />
          <div className="grain" />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20 lg:py-24">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="eyebrow inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]"
          >
            <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
            {t('eyebrow')}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-3xl font-display text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl"
          >
            {t('title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 max-w-3xl text-base text-[var(--muted-foreground)] sm:text-lg"
          >
            {t('description')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link
              href={lh('/map')}
              className={buttonVariants({ size: 'lg' })}
            >
              {t('cta')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href={lh('/compare')}
              className={buttonVariants({ size: 'lg', variant: 'outline' })}
            >
              {tCommon('viewMore')}
            </Link>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
        {/* Key Stats Grid */}
        <section className="mb-14">
          <div className="mb-6 flex items-center gap-2">
            <Zap className="h-5 w-5 text-[var(--primary)]" />
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Indicadores Macroeconômicos
            </h2>
          </div>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerParent}
            className="grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {marketIndicators.map((indicator) => (
              <motion.div key={indicator.label} variants={fadeUp}>
                <Stat
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
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Regional Insights Grid */}
        <section className="mb-14">
          <div className="mb-6 flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-[var(--primary)]" />
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Ranking Regional (Top 5)
            </h2>
          </div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerParent}
            className="grid gap-4 lg:grid-cols-2"
          >
            {insightCards.map((insight, idx) => (
              <motion.div key={insight.id} variants={fadeUp}>
                <Card
                  variant={selectedCity === insight.id ? 'highlight' : 'interactive'}
                  onClick={() =>
                    setSelectedCity(
                      selectedCity === insight.id ? null : insight.id,
                    )
                  }
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
                    <div
                      className={cn(
                        'flex items-center gap-1',
                        getTrendColor(insight.trend),
                      )}
                    >
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
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Preço/m²
                      </p>
                      <p className="mt-1 font-semibold text-[var(--foreground)]">
                        R$ {(insight.pricePerM2 / 1000).toFixed(1)}k
                      </p>
                    </div>
                    <div className="rounded-lg bg-[var(--background)] p-2.5">
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Mudança 12m
                      </p>
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
                          <Check className="h-4 w-4 flex-shrink-0 text-[var(--success)]" />
                          <p className="text-sm text-[var(--foreground)]">
                            {highlight}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer CTA */}
                  <Link
                    href={lh(`/map?city=${insight.city}`)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] transition-colors hover:text-[var(--primary-foreground)]"
                  >
                    Explorar no mapa
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Opportunities Section */}
        <section className="mb-14">
          <div className="mb-6 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[var(--primary)]" />
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Alertas de Oportunidade
            </h2>
          </div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerParent}
            className="space-y-3"
          >
            {opportunities.map((opp) => (
              <motion.div key={opp.id} variants={fadeUp}>
                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[var(--foreground)]">
                          {opp.title}
                        </h3>
                        {getSeverityBadge(opp.severity)}
                      </div>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {opp.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-4">
                        <div>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            Cidades afetadas
                          </p>
                          <p className="font-semibold text-[var(--foreground)]">
                            {opp.affectedCities}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            Impacto
                          </p>
                          <p className="font-medium text-[var(--primary)]">
                            {opp.impact}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8">
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-[var(--foreground)]">
            O que você pode fazer com Insights
          </h2>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerParent}
            className="grid gap-6 sm:grid-cols-3"
          >
            <motion.div variants={fadeUp}>
              <BarChart className="mb-3 h-8 w-8 text-[var(--primary)]" />
              <h3 className="mb-2 font-semibold text-[var(--foreground)]">
                {t('f1')}
              </h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Identifique as regiões com maior potencial de valorização em 12 meses.
              </p>
            </motion.div>
            <motion.div variants={fadeUp}>
              <AlertTriangle className="mb-3 h-8 w-8 text-[var(--primary)]" />
              <h3 className="mb-2 font-semibold text-[var(--foreground)]">
                {t('f2')}
              </h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Receba alertas automáticos quando o preço por m² sofrer mudanças
                significativas.
              </p>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Bot className="mb-3 h-8 w-8 text-[var(--primary)]" />
              <h3 className="mb-2 font-semibold text-[var(--foreground)]">
                {t('f3')}
              </h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Receba síntese narrativa gerada por IA sobre o potencial de cada
                área.
              </p>
            </motion.div>
          </motion.div>
        </section>

        {/* CTA Footer */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 rounded-3xl bg-[var(--primary)] px-8 py-12 text-center"
        >
          <h2 className="text-2xl font-bold tracking-tight text-[var(--primary-foreground)]">
            Pronto para explorar oportunidades?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--primary-foreground)]/80">
            Acesse o mapa interativo para investigar em detalhe cada região e seus
            fundamentos.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={lh('/map')}
              className="inline-flex items-center justify-center rounded-lg bg-[var(--card)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] shadow-sm transition hover:opacity-90"
            >
              Abrir o mapa
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href={lh('/chat')}
              className="text-sm font-medium text-[var(--primary-foreground)] underline-offset-4 hover:underline"
            >
              Perguntar à IA
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
