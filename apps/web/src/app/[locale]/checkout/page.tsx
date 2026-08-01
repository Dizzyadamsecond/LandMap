'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft, Check, Copy, LandMapWordmark, QrCode, CreditCard } from '../../../components/lovable/icons';
import { Card, Badge, buttonVariants, cn, Input } from '@landmap/ui';
import { PLANS, formatBRL, type PlanId } from '../../../lib/plans';

type CheckoutMethod = 'pix' | 'card';

export default function CheckoutPage() {
  const t = useTranslations('checkout');
  const locale = useLocale();
  const lh = (p: string) => `/${locale}${p}`;

  const [planId, setPlanId] = useState<PlanId>('free');
  const [method, setMethod] = useState<CheckoutMethod>('pix');
  const [copyLabel, setCopyLabel] = useState('Copiar');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const qp = params.get('plan') as PlanId | null;
    if (qp && ['free', 'access', 'plus', 'pro', 'business'].includes(qp)) {
      setPlanId(qp);
    }
    try {
      const saved = window.localStorage.getItem('landmap:selected_plan') as PlanId | null;
      if (saved) setPlanId(saved);
    } catch {
      // ignore
    }
  }, []);

  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0];
  const pixCode = `00020126360014BR.GOV.BCB.PIX0114${plan.id.toUpperCase()}520400005303986540${plan.priceBRL.toFixed(2)}5802BR5925LandMap Inteligencia6009SAO PAULO62070503***63041D3D`;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (plan.id === 'free') {
      try {
        window.localStorage.setItem('landmap:selected_plan', 'free');
      } catch {
        // ignore
      }
      window.location.href = '/map';
      return;
    }
    setSubmitted(true);
  };

  return (
    <main className="mx-auto flex min-h-screen flex-col bg-background px-4 pb-10 pt-6">
      <header className="flex items-center justify-between">
        <Link href={lh('/plans')} aria-label="Voltar" className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <LandMapWordmark />
        <div className="w-9" />
      </header>

      <div className="mt-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          Checkout
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">Finalize sua assinatura</h1>
        <p className="mt-2 text-sm text-foreground/60">
          {plan.id === 'free' ? 'Plano grátis sem cobrança.' : 'Pagamento seguro. Cancele quando quiser.'}
        </p>
      </div>

      <section className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{plan.name}</p>
                <p className="text-xs text-foreground/50">{plan.tagline} · {plan.priceBRL ? 'R$ ' + formatBRL(plan.priceBRL) : 'R$ 0,00'}/mês</p>
              </div>
              <Badge variant={plan.id === 'free' ? 'default' : 'outline'}>
                {plan.id === 'free' ? 'Grátis' : 'Assinatura'}
              </Badge>
            </div>
          </Card>

          {plan.id !== 'free' && (
            <Card className="p-4">
              <p className="text-sm font-semibold">Método de pagamento</p>
              <div className="mt-3 flex gap-2">
                {(['pix', 'card'] as CheckoutMethod[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={cn(
                      'flex-1 rounded-2xl border px-3 py-2 text-sm transition',
                      method === m ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
                    )}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {m === 'pix' ? <QrCode className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                      {m === 'pix' ? 'PIX' : 'Cartão'}
                    </span>
                  </button>
                ))}
              </div>

              {method === 'pix' && (
                <div className="mt-4 rounded-2xl border border-dashed border-border p-4">
                  <p className="text-xs text-foreground/60">QR Code / código copia e cola</p>
                  <div className="mt-3 flex items-center gap-3">
                    <code className="flex-1 break-all rounded-xl bg-muted/40 px-3 py-2 text-xs">
                      {pixCode}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          navigator.clipboard.writeText(pixCode).catch(() => {});
                        }
                        setCopyLabel('Copiado');
                        setTimeout(() => setCopyLabel('Copiar'), 1500);
                      }}
                      className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'shrink-0')}
                    >
                      <Copy className="mr-1.5 h-3.5 w-3.5" /> {copyLabel}
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-foreground/50">
                    Após o pagamento, o plano é ativado automaticamente.
                  </p>
                </div>
              )}

              {method === 'card' && (
                <form onSubmit={onSubmit} className="mt-4 space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground/70">Nome no cartão</label>
                    <Input placeholder="Ex.: João da Silva" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground/70">Número</label>
                    <Input inputMode="numeric" placeholder="0000 0000 0000 0000" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-foreground/70">Validade</label>
                      <Input placeholder="MM/AA" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-foreground/70">CVC</label>
                      <Input inputMode="numeric" placeholder="123" required />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className={cn(buttonVariants({ size: 'md' }), 'w-full')}
                  >
                    Pagar R$ {formatBRL(plan.priceBRL)}/mês
                  </button>
                  <p className="text-center text-[11px] text-foreground/40">
                    Pré-checkout sem gateway. A integração será adicionada em breve.
                  </p>
                </form>
              )}

              {method === 'pix' && (
                <form onSubmit={onSubmit} className="mt-4">
                  <button type="submit" className={cn(buttonVariants({ size: 'md' }), 'w-full')}>
                    Já paguei o PIX
                  </button>
                </form>
              )}

              {submitted && (
                <div className="mt-4 rounded-2xl border border-border bg-muted/30 p-4">
                  <p className="text-sm font-medium">Pagamento registrado (simulação)</p>
                  <p className="mt-1 text-xs text-foreground/60">
                    Seu plano <strong>{plan.name}</strong> foi selecionado.
                  </p>
                  <div className="mt-3">
                    <Link href={lh('/map')} className={cn(buttonVariants({ size: 'sm' }))}>
                      Ir para o dashboard
                    </Link>
                  </div>
                </div>
              )}
            </Card>
          )}

          {plan.id === 'free' && (
            <form onSubmit={onSubmit}>
              <button type="submit" className={cn(buttonVariants({ size: 'md' }), 'w-full')}>
                Começar grátis
              </button>
            </form>
          )}
        </div>

        <aside className="space-y-3">
          <Card className="p-4">
            <p className="text-sm font-semibold">Resumo</p>
            <ul className="mt-3 space-y-2 text-sm text-foreground/70">
              {(plan.features ?? []).map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Link href={lh('/plans/manage')} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full')}>
            Gerenciar planos
          </Link>
        </aside>
      </section>
    </main>
  );
}
