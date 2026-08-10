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
  const selectedPlan = PLANS.find((p) => p.id === selected) ?? PLANS[0];

  const handleSubscribe = (planId: string) => {
    try {
      localStorage.setItem('landmap:selected_plan', planId);
    } catch {
      // ignore
    }
    // Track CTA click
    trackCta('pricing_plan_select', 'click', { variant: planId });
    // Free plan = no-paywall path → entra direto no mapa (CLAUDE.md regra 6).
    // Planos pagos mantêm o checkout como vitrine de produto.
    if (planId === 'free') {
      router.push(`/${locale}/map`);
      return;
    }
    router.push(`/${locale}/checkout?plan=${planId}`);
  };

  const handleDesktopPlan = (planId: string) => {
    handleSubscribe(planId);
  };

  const mobileSubscribe = () => {
    handleSubscribe(selected);
  };

  if (variant === 'desktop') {
    return (
      <ProductPageShell
        backHref="/map"
        eyebrow={
          <>
            <Sparkles className="h-3 w-3" /> Escolha seu plano
          </>
        }
        title="Comece a analisar o mercado agora"
        description="Cancele quando quiser. Sem fidelidade."
        maxWidth="5xl"
      >
        <Reveal className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((pl) => (
            <Card
              key={pl.id}
              variant={pl.highlight ? 'highlight' : 'interactive'}
              className={cn(
                'flex min-w-0 flex-col p-4',
                pl.highlight && 'shadow-[var(--shadow-card)]',
                'ring-1 ring-transparent transition hover:ring-[var(--primary)]/30',
              )}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">{pl.name}</p>
                {pl.highlight && <Badge variant="default">{pl.tagline}</Badge>}
              </div>
              <p className="mt-2 font-display text-2xl font-bold">
                R$ {formatBRL(pl.priceBRL)}
                <span className="text-sm font-normal text-muted-foreground">/mês</span>
              </p>
              <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm">
                {(pl.features ?? []).map((f) => (
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
                {pl.id === 'free' ? 'Assinar LandMap Free' : `Assinar ${pl.name.replace('LandMap ', '')}`}
              </button>
            </Card>
          ))}
        </Reveal>
      </ProductPageShell>
    );
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col overflow-x-hidden bg-background pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                  {p.tagline}
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
                <span className="font-display text-2xl font-bold tracking-tight">{formatBRL(p.priceBRL)}</span>
                <span className="text-sm text-foreground/50">/mês</span>
              </div>

              <div
                className={cn(
                  'grid transition-all duration-300 ease-in-out',
                  isSel ? 'grid-rows-[1fr] opacity-100 mt-4 border-t border-border/60 pt-4' : 'grid-rows-[0fr] opacity-0'
                )}
              >
                <div className="overflow-hidden">
                  <ul className="space-y-2 max-h-[40vh] overflow-y-auto">
                    {(p.features ?? []).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground/75">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </button>
          );
        })}
      </Stagger>

      <div className="mt-6 px-4 text-center sm:px-6">
        <Link href={`/${locale}/auth`} className="text-sm text-foreground/60 hover:text-foreground">
          Já tem conta? <span className="font-medium text-primary">Entrar</span>
        </Link>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md border-t border-border bg-background/95 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur sm:px-6">
        <button
          type="button"
          onClick={mobileSubscribe}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 whitespace-normal break-words rounded-xl bg-primary px-3 py-2 text-center text-sm font-semibold leading-tight text-primary-foreground shadow-[var(--shadow-card)] transition hover:bg-primary/90"
        >
          {`Assinar ${selectedPlan.name} — R$ ${formatBRL(selectedPlan.priceBRL)}/mês`}
        </button>
        <p className="mt-2 text-center text-[11px] text-foreground/40">
          Pagamento não ativado — fluxo de demonstração.
        </p>
      </div>
    </div>
  );
}

export default PlansShowcase;
