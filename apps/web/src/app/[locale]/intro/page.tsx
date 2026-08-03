'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useState } from 'react';
import {
  MapPinned,
  TrendingUp,
  BellRing,
  ShieldCheck,
  ArrowRight,
  LandMapWordmark,
} from '../../../components/lovable/icons';

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

export default function IntroPage() {
  const locale = useLocale();
  const lh = (p: string) => `/${locale}${p}`;
  const [step, setStep] = useState(0);
  const slide = SLIDES[step];
  const Icon = slide.icon;

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[var(--background)] px-6 text-[var(--foreground)]">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 cadastre-grid opacity-[0.05]" />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-[var(--primary)]/15 blur-3xl" />

      <div className="flex w-full max-w-xl flex-col items-center text-center">
        <LandMapWordmark className="h-9" />

        <div className="mt-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--primary)]">
          <Icon className="h-7 w-7" />
        </div>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight">{slide.title}</h1>
        <p className="mt-3 max-w-md text-[var(--muted-foreground)]">{slide.desc}</p>

        <div className="mt-6 flex items-center gap-2">
          {SLIDES.map((_, i) => (
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

          {step < SLIDES.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(SLIDES.length - 1, s + 1))}
              className="inline-flex h-10 items-center gap-1 rounded-lg bg-[var(--primary)] px-5 text-sm font-medium text-[var(--primary-foreground)] transition hover:bg-[var(--primary)]/90"
            >
              Próximo <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <Link
              href={lh('/map')}
              className="inline-flex h-10 items-center gap-1 rounded-lg bg-[var(--primary)] px-5 text-sm font-medium text-[var(--primary-foreground)] transition hover:bg-[var(--primary)]/90"
            >
              Abrir o mapa <ArrowRight className="h-4 w-4" />
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
