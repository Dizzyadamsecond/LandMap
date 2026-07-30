'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Check, Sparkles, LandMapWordmark } from '../../../components/lovable/icons';
import { Stagger, Reveal } from '../../../components/Motion';
import { Card, Badge, Stat, buttonVariants, cn } from '@landmap/ui';
import { PLANS as PLAN_META, formatBRL } from '../../../lib/plans';
import { ProductPageShell } from '../../../components/ProductPageShell';

type Plan = {
  id: string;
  name: string;
  tag?: string;
  price: number;
  features: string[];
  highlight?: boolean;
};

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

const PLANS: Plan[] = PLAN_META.map((m) => ({
  id: m.id,
  name: m.name,
  tag: m.tagline,
  price: m.priceBRL,
  features: FEATURES[m.id] ?? [],
  highlight: HIGHLIGHT[m.id] ?? false,
}));

export function PlansShowcase({ variant = 'desktop' }: { variant?: 'mobile' | 'desktop' }) {
  const locale = useLocale();
  const router = useRouter();
  const lh = (p: string) => `/${locale}${p}`;
  const [selected, setSelected] = useState<string>('free');
  const selectedPlan = PLANS.find((p) => p.id === selected) ?? PLANS[1];

  const handleSubscribe = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('landmap:selected_plan', selected);
      } catch {
        /* ignore */
      }
    }
    if (selected === 'free') {
      router.push(`${lh('/dashboard')}`);
    } else {
      router.push(`${lh('/auth')}?mode=request`);
    }
  };

  const handleDesktopPlan = (planId: string) => {
    try {
      localStorage.setItem('landmap:selected_plan', planId);
    } catch {
      /* ignore */
    }
    if (planId === 'free') {
      router.push(`${lh('/dashboard')}`);
    } else {
      router.push(`${lh('/auth')}?mode=request`);
    }
  };

  if (variant === 'desktop') {
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
              variant={pl.highlight ? 'highlight' : 'interactive'}
              className={cn('flex min-w-0 flex-col p-4', pl.highlight && 'shadow-[var(--shadow-card)]')}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">{pl.name}</p>
                {pl.highlight && <Badge variant="default">{pl.tag}</Badge>}
              </div>
              <p className="mt-2 font-display text-2xl font-bold">
                {pl.id === 'free' ? 'R$ 0,00' : `R$ ${formatBRL(pl.price)}`}
                <span className="text-sm font-normal text-muted-foreground">/mês</span>
              </p>
              <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm">
                {pl.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 break-words">{f}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => handleDesktopPlan(pl.id)}
                className={cn(
                  buttonVariants({ variant: pl.highlight ? 'default' : 'outline' }),
                  'mt-4 w-full',
                )}
              >
                {pl.id === 'free' ? 'Começar no mapa' : `Assinar ${pl.name.replace('LandMap ', '')}`}
              </button>
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

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col overflow-x-hidden bg-background pb-32">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <Link
          href={lh('/onboarding')}
          aria-label="Voltar"
          className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <LandMapWordmark />
        <div className="w-9" />
      </header>

      <div className="px-4 pt-8 sm:px-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3 w-3" />
          Escolha seu plano
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight">
          Comece a analisar o mercado agora
        </h1>
        <p className="mt-2 text-sm text-foreground/60">
          Cancele quando quiser. Sem fidelidade.
        </p>
      </div>

      <Stagger className="mt-6 flex flex-col gap-3 px-4 sm:px-6" stagger={0.08} y={20}>
        {PLANS.map((p) => {
          const isSel = p.id === selected;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p.id)}
              className={
                isSel
                  ? 'relative w-full rounded-2xl border-2 border-primary bg-primary/5 p-5 text-left shadow-[var(--shadow-card)] transition-all'
                  : 'relative w-full rounded-2xl border border-border bg-card p-5 text-left transition-all hover:border-primary/40'
              }
            >
              {p.highlight && (
                <span className="absolute -top-2 right-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-primary-foreground">
                  {p.tag}
                </span>
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold">{p.name}</h3>
                </div>
                <div
                  className={
                    isSel
                      ? 'grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary'
                      : 'grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border'
                  }
                >
                  {isSel && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                </div>
              </div>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-xs text-foreground/50">R$</span>
                <span className="font-display text-2xl font-bold tracking-tight">{formatBRL(p.price)}</span>
                <span className="text-sm text-foreground/50">/mês</span>
              </div>

              {isSel && p.features.length > 0 && (
                <ul className="mt-4 max-h-[40vh] space-y-2 overflow-y-auto border-t border-border/60 pt-4">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground/75">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}
            </button>
          );
        })}
      </Stagger>

      <div className="mt-6 px-4 text-center sm:px-6">
        <Link href={lh('/auth')} className="text-sm text-foreground/60 hover:text-foreground">
          Já tem conta? <span className="font-medium text-primary">Entrar</span>
        </Link>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md border-t border-border bg-background/95 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur sm:px-6">
        <button
          type="button"
          onClick={handleSubscribe}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 whitespace-normal break-words rounded-xl bg-primary px-3 py-2 text-center text-sm font-semibold leading-tight text-primary-foreground shadow-[var(--shadow-card)] transition hover:bg-primary/90"
        >
          {`Assinar ${selectedPlan.name} — R$ ${formatBRL(selectedPlan.price)}/mês`}
        </button>
        <p className="mt-2 text-center text-[11px] text-foreground/40">
          Pagamento não ativado — fluxo de demonstração.
        </p>
      </div>
    </div>
  );
}
