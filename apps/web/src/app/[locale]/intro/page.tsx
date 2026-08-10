'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPinned,
  TrendingUp,
  BellRing,
  ShieldCheck,
  ArrowRight,
  Check,
  Sparkles,
  LandMapWordmark,
} from '../../../components/lovable/icons';
import { PLANS, formatBRL } from '../../../lib/plans';

const SLIDES = [
  {
    icon: MapPinned,
    title: 'Todo o Brasil no mapa',
    desc: 'Explore terrenos e regiões nas principais cidades com preço por m², filtros e camadas de calor.',
  },
  {
    icon: TrendingUp,
    title: 'Valorização em tempo real',
    desc: 'Veja tendências de subida, estabilidade ou queda por bairro e o histórico de preço da região.',
  },
  {
    icon: BellRing,
    title: 'Radar de oportunidades',
    desc: 'Alertas inteligentes de valorização e queda de preço direto no seu bolso — não perca janelas.',
  },
  {
    icon: ShieldCheck,
    title: 'Decisão com confiança',
    desc: 'Dados cruzados de fontes verificadas, com nível de confiança em cada registro.',
  },
];

// Transição lenta e suave, no ritmo do onboarding Lovable (não um flash).
const CHECKOUT_FADE = { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const };
const SLIDE_DWELL_MS = 4200; // tempo em cada slide antes do auto-avanço

export default function IntroPage() {
  const locale = useLocale();
  const lh = (p: string) => `/${locale}${p}`;
  const [step, setStep] = useState(0);
  // Slide extra de planos no final do carrossel.
  const isPlansSlide = step === SLIDES.length;
  const slide = isPlansSlide ? null : SLIDES[step];
  const Icon = slide?.icon;

  // Auto-avanço tipo Lovable: passa pelos slides e para no de planos (último),
  // onde o usuário decide (Pular / Ver planos).
  useEffect(() => {
    if (step >= SLIDES.length) return; // parado no slide de planos
    const t = setTimeout(() => setStep((s) => Math.min(SLIDES.length, s + 1)), SLIDE_DWELL_MS);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[var(--background)] px-6 py-10 text-[var(--foreground)]">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 cadastre-grid opacity-[0.05]" />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-[var(--primary)]/15 blur-3xl" />

      <div className="flex w-full max-w-xl flex-col items-center text-center">
        <LandMapWordmark className="h-9" />

        <AnimatePresence mode="wait" initial={false}>
          {!isPlansSlide ? (
            <motion.div
              key={`slide-${step}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={CHECKOUT_FADE}
              className="flex w-full flex-col items-center"
            >
              <div className="mt-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--primary)]">
                {Icon && <Icon className="h-7 w-7" />}
              </div>

              <h1 className="mt-6 text-2xl font-semibold tracking-tight">{slide?.title}</h1>
              <p className="mt-3 max-w-md text-[var(--muted-foreground)]">{slide?.desc}</p>
            </motion.div>
          ) : (
            <motion.div
              key="plans-slide"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={CHECKOUT_FADE}
              className="mt-8 w-full"
            >
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-medium text-[var(--primary)]">
                <Sparkles className="h-3 w-3" /> Escolha seu plano
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                Comece de graça, evolua quando quiser
              </h2>
              <p className="mt-2 max-w-md text-sm text-[var(--muted-foreground)]">
                Sem fidelidade. Cancele quando quiser.
              </p>

              <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                {PLANS.map((pl) => (
                  <div
                    key={pl.id}
                    className={`flex flex-col rounded-2xl border p-4 text-left transition ${
                      pl.highlight
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-[var(--shadow-card)]'
                        : 'border-[var(--border)] bg-[var(--card)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{pl.name}</p>
                      {pl.highlight && (
                        <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--primary-foreground)]">
                          {pl.tagline}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="font-display text-xl font-bold">
                        R$ {formatBRL(pl.priceBRL)}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">/mês</span>
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {(pl.features ?? []).slice(0, 3).map((f) => (
                        <li key={f} className="flex items-start gap-1.5 text-xs text-[var(--muted-foreground)]">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />
                          <span className="text-left">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 flex items-center gap-2">
          {[...SLIDES, 'plans'].map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-[var(--primary)]' : 'w-1.5 bg-[var(--border)]'
              }`}
            />
          ))}
        </div>

        <div className="mt-8 flex w-full items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex h-10 items-center rounded-lg border border-[var(--border)] px-5 text-sm font-medium transition hover:border-[var(--primary)] disabled:opacity-40"
          >
            Voltar
          </button>

          {step < SLIDES.length ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(SLIDES.length, s + 1))}
              className="inline-flex h-10 items-center gap-1 rounded-lg bg-[var(--primary)] px-5 text-sm font-medium text-[var(--primary-foreground)] transition hover:bg-[var(--primary)]/90"
            >
              Próximo <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <Link
              href={lh('/plans')}
              className="inline-flex h-10 items-center gap-1 rounded-lg bg-[var(--primary)] px-5 text-sm font-medium text-[var(--primary-foreground)] transition hover:bg-[var(--primary)]/90"
            >
              Ver planos <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        <Link
          href={lh('/map')}
          className="mt-4 text-xs text-[var(--muted-foreground)] underline-offset-4 hover:underline"
        >
          Pular introdução
        </Link>
      </div>
    </main>
  );
}
