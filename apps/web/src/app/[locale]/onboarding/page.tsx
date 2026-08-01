'use client';

import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BellRing,
  MapPinned,
  ShieldCheck,
  TrendingUp,
} from '../../../components/lovable/icons';

const SLIDES = [
  {
    icon: MapPinned,
    title: 'Conheça o LandMap',
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
] as const;

export default function OnboardingPage() {
  const locale = useLocale();
  const router = useRouter();
  const lh = (p: string) => `/${locale}${p}`;
  const [slide, setSlide] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [display, setDisplay] = useState(0);
  const [phase, setPhase] = useState<'in' | 'out'>('in');

  const current = SLIDES[display];
  const Icon = current.icon;
  const last = display === SLIDES.length - 1;

  useEffect(() => {
    if (phase === 'out') {
      const t = setTimeout(() => {
        setDisplay(slide);
        setPhase('in');
      }, 220);
      return () => clearTimeout(t);
    }
  }, [phase, slide]);

  const continueOnboarding = () => {
    if (last) {
      router.replace(lh('/plans'));
      return;
    }
    setDirection('next');
    setPhase('out');
    setSlide((value) => value + 1);
  };

  const goTo = (index: number) => {
    if (index === display) return;
    setDirection(index > display ? 'next' : 'prev');
    setPhase('out');
    setSlide(index);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background px-6 py-6">
      <header className="flex items-center justify-between">
        <Link href={lh('/')} className="text-sm text-foreground/60 hover:text-foreground">
          Pular
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center text-center">
        <div
          className={`flex flex-col items-center ${
            phase === 'in'
              ? 'animate-in fade-in slide-in-from-bottom-4 duration-500'
              : 'animate-out fade-out slide-out-to-bottom-4 duration-200'
          }`}
        >
          <div className="mb-8 grid h-24 w-24 place-items-center rounded-3xl bg-primary/10">
            <Icon className="h-11 w-11 text-primary" strokeWidth={1.8} aria-hidden />
          </div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight">{current.title}</h1>
          <p className="mt-4 max-w-sm text-base text-foreground/60">{current.desc}</p>
        </div>
      </main>

      <div className="mb-6 flex justify-center gap-2">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => goTo(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === display ? 'w-8 bg-primary' : 'w-1.5 bg-foreground/15'
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={continueOnboarding}
          className="inline-flex h-12 w-full items-center justify-center gap-1 rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          {last ? 'Ver planos' : 'Continuar'}
          <ArrowRight className="ml-1 h-4 w-4" />
        </button>
        <Link href={lh('/auth')} className="inline-flex h-12 w-full items-center justify-center text-sm text-foreground/70 hover:text-foreground">
          Já tenho conta
        </Link>
      </div>
    </div>
  );
}
