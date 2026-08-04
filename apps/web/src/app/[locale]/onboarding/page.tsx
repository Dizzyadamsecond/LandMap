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
  {
    icon: Briefcase,
    title: 'Ecossistema Completo de Soluções',
    desc: 'Acesse instantaneamente Comparadores, Viabilidade de Terrenos, Zoneamento Municipal, Sindicatos de LPs e OCR de Matrículas.',
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
      // 1:1 Lovable: último slide segue para /plans (o fluxo free termina em /map lá).
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

      {/* PAGINAÇÃO 1:1 LOVABLE — carrossel de slides com dots, prev/next e contador */}
      <section className="mx-auto flex min-h-[80vh] max-w-md flex-col px-6 py-10 md:max-w-2xl">
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
            <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">{current.title}</h1>
            <p className="mt-4 max-w-sm text-base text-foreground/60">{current.desc}</p>
          </div>
        </main>

        {/* Seletor de perfil — exibido junto do último slide (1:1 Lovable) */}
        {last && (
          <div className="mb-6 w-full text-left">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-foreground/50">Eu sou</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {USER_TYPES.map((t) => {
                const active = userType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setUserType(t.id)}
                    className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition ${
                      active ? 'border-primary bg-primary/10' : 'border-foreground/10 bg-card hover:border-primary'
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
        )}

        {/* Barra de progresso da etapa */}
        <div className="mb-5 h-1 w-full overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((display + 1) / SLIDES.length) * 100}%` }}
          />
        </div>

        <div className="mb-6 flex items-center justify-between">
          <span className="text-xs font-medium text-foreground/50">
            {display + 1} / {SLIDES.length}
          </span>
          <div className="flex justify-center gap-2">
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
          <button
            type="button"
            onClick={() => goTo(Math.max(0, display - 1))}
            disabled={display === 0}
            className="text-xs font-medium text-foreground/50 transition hover:text-foreground disabled:opacity-30"
            aria-label="Slide anterior"
          >
            Voltar
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={continueOnboarding}
            className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {last ? 'Ver planos' : 'Continuar'}
            <ArrowRight className="ml-1 h-4 w-4" />
          </button>
          {last ? (
            <Link
              href={lh('/auth')}
              className="inline-flex h-10 w-full items-center justify-center rounded-md px-8 text-sm font-medium text-foreground/70 transition hover:text-foreground"
            >
              Já tenho conta
            </Link>
          ) : (
            <Link
              href={lh('/auth')}
              className="inline-flex h-10 w-full items-center justify-center rounded-md px-8 text-sm font-medium text-foreground/70 transition hover:text-foreground"
            >
              Pular introdução
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
