'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowRight,
  BellRing,
  MapPinned,
  ShieldCheck,
  TrendingUp,
  LandMapWordmark,
} from '../../../components/lovable/icons';
import { cn } from '@landmap/ui';

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
] as const;

export default function OnboardingPage() {
  const locale = useLocale();
  const router = useRouter();
  const lh = (p: string) => `/${locale}${p}`;
  const [index, setIndex] = useState(0);
  const current = SLIDES[index];
  const Icon = current.icon;
  const last = index === SLIDES.length - 1;

  const advance = () => {
    if (last) {
      router.push(lh('/plans'));
      return;
    }
    setIndex((value) => value + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <header>
        <div className="mx-auto flex max-w-md items-center justify-between px-6 py-4">
          <LandMapWordmark />
          <Link href={lh('/plans')} className="text-sm text-foreground/70 hover:text-foreground">
            Ver planos
          </Link>
        </div>
      </header>

      <section className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-6">
        <main className="flex flex-1 flex-col items-center justify-center text-center">
          <div key={index} className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
            <div className="mb-8 grid h-24 w-24 place-items-center rounded-3xl bg-primary/10">
              <Icon className="h-11 w-11 text-primary" strokeWidth={1.8} aria-hidden />
            </div>
            <h1 className="text-3xl font-bold leading-tight tracking-tight">{current.title}</h1>
            <p className="mt-4 max-w-sm text-base text-foreground/60">{current.desc}</p>
          </div>
        </main>

        <div className="mb-6 flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === index ? 'w-8 bg-primary' : 'w-1.5 bg-foreground/15'
              )}
              aria-label={`Ir para slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={advance}
            className="inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)]"
          >
            {last ? 'Ver planos' : 'Continuar'}
            <ArrowRight className="ml-1 h-4 w-4" />
          </button>
          <Link
            href={lh('/auth')}
            className="inline-flex h-10 w-full items-center justify-center whitespace-nowrap rounded-md bg-transparent text-sm font-medium text-foreground/70 transition hover:bg-[var(--muted)] hover:text-foreground"
          >
            Já tenho conta
          </Link>
        </div>
      </section>
    </div>
  );
}
