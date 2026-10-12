'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Check, Sparkles, LandMapWordmark } from '../../../components/lovable/icons';
import { Stagger, Reveal } from '../../../components/Motion';
import { Card, Badge, buttonVariants, cn } from '@landmap/ui';
import { PLANS, formatBRL } from '../../../lib/plans';
import { ProductPageShell } from '../../../components/ProductPageShell';
import { trackCta } from '../../../track';

export function PlansShowcase({ variant = 'mobile' }: { variant?: 'mobile' | 'desktop' }) {
  const locale = useLocale();
  const router = useRouter();
  const [selected, setSelected] = useState<string>('plus');
  const selectedPlan = PLANS.find((p) => p.id === selected) ?? PLANS[1] ?? PLANS[0];

  const handleSubscribe = (planId: string) => {
    try {
      localStorage.setItem('landmap:selected_plan', planId);
    } catch {
      // ignore
    }
    // Track CTA click
    trackCta('pricing_plan_select', 'click', { variant: planId });
    router.push(`/${locale}/auth?mode=request`);
  };

  const handleDesktopPlan = (planId: string) => {
    handleSubscribe(planId);
  };

  if (variant === 'desktop') {
    return (
      <ProductPageShell
        backHref="/dashboard"
        eyebrow={
          <>
            <Sparkles className="h-3 w-3" /> Escolha seu plano
          </>
        }
        title="Comece a analisar o mercado agora"
        description="Acesso completo aos dados de inteligência territorial do Brasil. Cancele quando quiser."
        maxWidth="5xl"
      >
        <Reveal className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.filter((p) => p.id !== 'free').map((pl) => (
            <Card
              key={pl.id}
              variant={pl.highlight ? 'highlight' : 'interactive'}
              className={cn(
                'flex min-w-0 flex-col p-5 rounded-2xl relative transition',
                pl.highlight
                  ? 'border-primary bg-primary/[0.03] shadow-lg ring-1 ring-primary/25'
                  : 'border-border/70 hover:border-primary/40',
              )}
            >
              {pl.highlight && (
                <span className="absolute -top-2.5 right-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground shadow-sm">
                  {pl.tagline}
                </span>
              )}
              <div className="flex items-center justify-between">
                <p className="font-bold text-lg">{pl.name}</p>
              </div>
              <p className="mt-2 font-display text-2xl font-bold tracking-tight">
                <span className="text-xs font-normal text-muted-foreground mr-1">R$</span>
                {formatBRL(pl.priceBRL)}
                <span className="text-xs font-normal text-muted-foreground">/mês</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">{pl.tagline}</p>
              <ul className="mt-5 flex flex-1 flex-col gap-2.5 text-xs text-foreground/80 border-t border-border/50 pt-4">
                {(pl.features ?? []).map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="min-w-0 break-words">{f}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => handleDesktopPlan(pl.id)}
                className={cn(
                  buttonVariants({ variant: pl.highlight ? 'default' : 'outline' }),
                  'mt-5 w-full font-semibold',
                )}
              >
                Assinar {pl.name.replace('LandMap ', '')}
              </button>
            </Card>
          ))}
        </Reveal>

        <section className="mt-10 rounded-2xl border border-border bg-card p-6 text-center">
          <h2 className="font-display text-xl font-bold">Precisa de uma solução para sua empresa?</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-foreground/60">
            Tem uma imobiliária, loteadora, incorporadora ou equipe comercial? Oferecemos planos
            personalizados com múltiplos usuários, painel administrativo, relatórios com a identidade
            da sua empresa e soluções sob medida.
          </p>
          <a
            href="mailto:business@landmap.com.br"
            className={cn(
              buttonVariants({ variant: 'default' }),
              'mt-4 inline-flex min-h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold',
            )}
          >
            Falar com nossa equipe
          </a>
        </section>
      </ProductPageShell>
    );
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col overflow-x-hidden bg-background pb-28 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header — 1:1 Lovable plans */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <Link
          href={`/${locale}/onboarding`}
          aria-label="Voltar"
          className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <LandMapWordmark />
        <div className="w-9" />
      </header>

      {/* Hero — 1:1 Lovable plans */}
      <div className="px-6 pt-8">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3 w-3" /> Escolha seu plano
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight">
          Comece a analisar o mercado agora
        </h1>
        <p className="mt-2 text-sm text-foreground/60">
          Cancele quando quiser. Sem fidelidade.
        </p>
      </div>

      {/* Cards de plano selecionáveis — 1:1 Lovable (Access, Plus, Pro, Business) */}
      <Stagger className="mt-6 flex flex-col gap-3 px-6" stagger={0.15} y={25}>
        {PLANS.filter((p) => p.id !== 'free').map((p) => {
          const isSelected = p.id === selected;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p.id)}
              aria-pressed={isSelected}
              className={cn(
                'relative rounded-2xl border p-5 text-left transition-all',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20'
                  : 'border-border bg-card hover:border-primary/40',
              )}
            >
              {p.highlight && (
                <span className="absolute -top-2.5 right-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground shadow-sm">
                  {p.tagline}
                </span>
              )}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold">{p.name}</h3>
                </div>
                <div
                  aria-hidden
                  className={cn(
                    'grid h-6 w-6 shrink-0 place-items-center rounded-full border-2',
                    isSelected ? 'border-primary bg-primary' : 'border-border',
                  )}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-xs text-foreground/50">R$</span>
                <span className="font-display text-2xl font-bold tracking-tight">{formatBRL(p.priceBRL)}</span>
                <span className="text-sm text-foreground/50">/mês</span>
              </div>
              {isSelected && (
                <ul className="mt-4 space-y-2 border-t border-border/60 pt-4">
                  {(p.features ?? []).map((f) => (
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

      <div className="mt-6 px-6 text-center">
        <Link href={`/${locale}/auth`} className="text-sm text-foreground/60 hover:text-foreground">
          Já tem conta? <span className="font-medium text-primary">Entrar</span>
        </Link>
      </div>

      {/* Seção enterprise */}
      <div className="mt-8 px-6">
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <h2 className="text-base font-bold tracking-tight">Precisa de uma solução sob medida?</h2>
          <p className="mt-1 text-xs text-foreground/60">
            Planos personalizados para grandes loteadoras, incorporadoras e fundos imobiliários.
          </p>
          <a
            href="mailto:business@landmap.com.br"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'mt-3 w-full',
            )}
          >
            Falar com consultor
          </a>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-border bg-background/95 px-6 py-4 backdrop-blur">
        <button
          type="button"
          onClick={() => handleSubscribe(selected)}
          className={cn(
            buttonVariants({ variant: 'default', size: 'lg' }),
            'w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold',
          )}
        >
          Assinar {selectedPlan.name} — R$ {formatBRL(selectedPlan.priceBRL)}/mês
        </button>
        <p className="mt-2 text-center text-[11px] text-foreground/40">
          Pagamento não ativado — fluxo de demonstração.
        </p>
      </div>
    </div>
  );
}

export default PlansShowcase;
