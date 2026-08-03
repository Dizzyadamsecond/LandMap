'use client';

import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BellRing,
  Briefcase,
  Building2,
  Gem,
  MapPinned,
  ShieldCheck,
  TrendingUp,
  User,
} from '../../../components/lovable/icons';
import { storeUserType, type UserType } from '../../../lib/mockAuth';

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

/** Segmentos do mercado imobiliário — escolha de perfil (1:1 Lovable, inclui Comprador). */
const USER_TYPES: { id: UserType; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: 'comprador', label: 'Comprador', icon: <User size={18} />, hint: 'Busca direta de terreno' },
  { id: 'corretor', label: 'Corretor', icon: <Briefcase size={18} />, hint: 'Comissão e carteira' },
  { id: 'investidor', label: 'Investidor', icon: <TrendingUp size={18} />, hint: 'Valorização e ROI' },
  { id: 'fundo', label: 'Fundo', icon: <Gem size={18} />, hint: 'Portfólio institucional' },
  { id: 'incorporadora', label: 'Incorporadora', icon: <Building2 size={18} />, hint: 'Aquisição e desenvolvimento' },
];

export default function OnboardingPage() {
  const locale = useLocale();
  const router = useRouter();
  const lh = (p: string) => `/${locale}${p}`;
  const [slide, setSlide] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [display, setDisplay] = useState(0);
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const [userType, setUserType] = useState<UserType | ''>('');

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
      router.replace(lh('/map'));
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

  const explore = () => {
    try {
      localStorage.setItem('landmap:selected_plan', 'free');
      if (userType) storeUserType(userType);
    } catch {
      /* ignore */
    }
    router.replace(lh('/map'));
  };

  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-300">
      <header className="border-b border-foreground/5">
        <div className="mx-auto flex max-w-md items-center justify-between px-6 py-4 md:max-w-5xl">
          <div className="flex items-center">
            <img src="/landmap-logo-transparent.png" alt="LandMap" className="w-auto object-contain h-12" />
          </div>
          <Link href={lh('/auth')} className="text-sm text-foreground/70 hover:text-foreground">
            Entrar
          </Link>
        </div>
      </header>

      {/* DESKTOP: hero estático + CTA direto (mais simples e prático) */}
      <section className="mx-auto hidden min-h-[78vh] max-w-5xl flex-col items-center justify-center px-6 py-16 text-center md:flex">
        <div className="mb-8 grid h-24 w-24 place-items-center rounded-3xl bg-primary/10">
          <MapPinned className="h-11 w-11 text-primary" strokeWidth={1.8} aria-hidden />
        </div>
        <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight md:text-5xl">
          Mapa de valorização de terrenos em todo o Brasil
        </h1>
        <p className="mt-4 max-w-xl text-lg text-foreground/60">
          Preço por m², ranking de regiões e alertas de oportunidade — grátis e sem complicação.
        </p>

        {/* Seletor de perfil (1:1 Lovable): corretor/investidor/fundo/incorporadora/comprador */}
        <div className="mt-8 w-full max-w-xl text-left">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-foreground/50">
            Eu sou
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {USER_TYPES.map((t) => {
              const active = userType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setUserType(t.id)}
                  className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition ${
                    active
                      ? 'border-primary bg-primary/10'
                      : 'border-foreground/10 bg-card hover:border-primary'
                  }`}
                >
                  <span className="text-primary">{t.icon}</span>
                  <span className="text-sm font-medium text-foreground">{t.label}</span>
                  <span className="text-xs text-foreground/60">{t.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={explore}
            className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Explorar o mapa grátis
            <ArrowRight className="ml-1 h-4 w-4" />
          </button>
          <Link
            href={lh('/plans')}
            className="inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-medium text-foreground/70 transition hover:text-foreground"
          >
            Ver planos
          </Link>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {SLIDES.map((s) => {
            const SIcon = s.icon;
            return (
              <div key={s.title} className="rounded-2xl border border-foreground/10 bg-card p-5 text-left">
                <SIcon className="h-6 w-6 text-primary" strokeWidth={1.8} aria-hidden />
                <p className="mt-3 text-sm font-semibold">{s.title}</p>
                <p className="mt-1 text-xs text-foreground/60">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* MOBILE: carrossel de slides */}
      <section className="mx-auto flex min-h-[80vh] max-w-md flex-col px-6 py-10 md:hidden">
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
            className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {last ? 'Explorar o mapa grátis' : 'Continuar'}
            <ArrowRight className="ml-1 h-4 w-4" />
          </button>
          <Link
            href={lh('/auth')}
            className="inline-flex h-10 w-full items-center justify-center rounded-md px-8 text-sm font-medium text-foreground/70 transition hover:text-foreground"
          >
            Já tenho conta
          </Link>
        </div>
      </section>
    </div>
  );
}
