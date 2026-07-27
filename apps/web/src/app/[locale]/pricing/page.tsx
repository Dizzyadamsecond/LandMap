'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Sparkles, Check } from '../../../components/lovable/icons';
import { ProductPageShell } from '../../../components/ProductPageShell';
import { Reveal } from '../../../components/Motion';
import { Card, Badge, Stat, buttonVariants, cn } from '@landmap/ui';
import { PLANS as PLAN_META, formatBRL } from '../../../lib/plans';

// Features 1:1 com Lovable `/plans` (chunk plans-DaZ4cK95.js).
const FEATURES: Record<string, string[]> = {
  access: [
    'Acesso a todas as cidades do Brasil',
    'Mapa de valorização e desvalorização',
    'Mapa de calor básico',
    'Ranking das regiões mais valorizadas',
    'Ranking das regiões em queda',
    'Histórico de preço por m²',
    'Busca por bairro, cidade e região',
    'Salvar até 10 áreas favoritas',
    'Tendência: subindo, estável ou caindo',
  ],
  plus: [
    'Tudo do Access',
    'Radar de oportunidades LandMap',
    'Alertas inteligentes de valorização',
    'Alertas de queda de preço',
    'Ranking de oportunidades por cidade',
    'Comparação entre regiões',
    'Notas automáticas sobre potencial da área',
    'Salvar até 25 áreas favoritas',
  ],
  pro: [
    'Tudo do Plus',
    'Acompanhar áreas monitoradas (salvas)',
    'Salvar até 50 regiões favoritas',
    'Histórico completo da área',
    'Relatório mensal geral',
    'Avaliação do seu terreno',
  ],
  business: [
    'Tudo do Pro',
    'Até 5 usuários',
    'Painel de equipe',
    'Relatório com marca da empresa',
    'Histórico de análise da equipe',
  ],
};
const HIGHLIGHT: Record<string, boolean> = { plus: true };

const PLANS = PLAN_META.map((m) => ({
  id: m.id,
  name: m.name,
  tag: m.tagline,
  price: m.priceBRL,
  feats: FEATURES[m.id] ?? [],
  hl: HIGHLIGHT[m.id] ?? false,
}));

export default function PricingPage() {
  const locale = useLocale();
  const lh = (p: string) => `/${locale}${p}`;

  return (
    <ProductPageShell
      backHref="/plans"
      eyebrow={
        <>
          <Sparkles className="h-3 w-3" /> Planos
        </>
      }
      title="Escolha seu plano"
      description="Comece a analisar o mercado agora. Cancele quando quiser. Sem fidelidade."
      maxWidth="5xl"
    >
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Planos" value="5" />
        <Stat label="Mais popular" value="Plus" />
        <Stat label="Mapa" value="incluído" />
        <Stat label="Fidelidade" value="0 dias" />
      </section>

      <Reveal className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((pl) => (
          <Card
            key={pl.id}
            variant={pl.hl ? 'highlight' : 'interactive'}
            className={cn(
              'flex flex-col p-4',
              pl.hl && 'shadow-[var(--shadow-card)]',
            )}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold">{pl.name}</p>
              {pl.hl && <Badge variant="default">{pl.tag}</Badge>}
            </div>
            <p className="mt-2 font-display text-2xl font-bold">
              {pl.id === 'free' ? 'R$ 0,00' : `R$ ${formatBRL(pl.price)}`}
              <span className="text-sm font-normal text-muted-foreground">/mês</span>
            </p>
            <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm">
              {pl.feats.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={lh('/plans')}
              className={cn(
                buttonVariants({ variant: pl.hl ? 'default' : 'outline' }),
                'mt-4 w-full',
              )}
            >
              {pl.id === 'free' ? 'Começar grátis' : `Assinar ${pl.name.replace('LandMap ', '')}`}
            </Link>
          </Card>
        ))}
      </Reveal>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Pagamento não ativado — fluxo de demonstração.{' '}
        <Link href={lh('/auth')} className="text-primary hover:underline">
          Já tem conta? Entrar
        </Link>
      </p>
    </ProductPageShell>
  );
}
