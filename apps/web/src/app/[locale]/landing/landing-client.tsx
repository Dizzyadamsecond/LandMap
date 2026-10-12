'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Gauge,
  GitCompare,
  BellRing,
  Eye,
  LineChart,
  Bot,
  Factory,
  BarChart,
  Target,
  Check,
  ShieldCheck,
  LandMapWordmark,
} from '../../../components/lovable/icons';
import { Footer } from '../../../components/Footer';

const WHAT_YOU_SEE = [
  {
    icon: TrendingUp,
    title: 'Descubra regiões antes delas valorizarem',
    desc: 'O mapa mostra onde o preço por m² está subindo primeiro — enquanto ainda dá para entrar barato.',
  },
  {
    icon: Gauge,
    title: 'Saiba o potencial da região em um número',
    desc: 'O LandMap Score resume preço, valorização, liquidez e infraestrutura em uma nota de 0 a 100.',
  },
  {
    icon: GitCompare,
    title: 'Compare bairros e descubra qual oferece maior potencial',
    desc: 'Lado a lado, sem planilha: preço, tendência, histórico e risco de cada região.',
  },
  {
    icon: BellRing,
    title: 'Seja avisado quando a janela abrir',
    desc: 'Alertas de valorização e de queda nas áreas que você monitora, direto no seu bolso.',
  },
];

const AND_ALSO_IN_LANDMAP = [
  {
    icon: TrendingUp,
    title: 'Projeções',
    desc: 'Previsões 1/3/5 anos com o motivo por trás.',
  },
  {
    icon: Factory,
    title: 'Motores de valorização',
    desc: 'Obras, metrô, shoppings e zoneamento.',
  },
  {
    icon: BarChart,
    title: 'Índices próprios',
    desc: 'Potencial, risco e atratividade de 0 a 100.',
  },
  {
    icon: Target,
    title: 'Oportunidades',
    desc: 'Áreas promissoras, subvalorizadas e a evitar.',
  },
];

const HOW_IT_WORKS = [
  {
    n: '1',
    title: 'Escolha onde quer olhar',
    desc: 'Busque por cidade, bairro ou desenhe a área exata no mapa.',
  },
  {
    n: '2',
    title: 'Veja como a região evoluiu antes de investir',
    desc: 'Histórico de preço por m², tendência de 12 meses e comparação com CDI e inflação.',
  },
  {
    n: '3',
    title: 'Decida com a explicação da IA',
    desc: 'A LandMap traduz os números em linguagem simples e aponta o que sustenta a nota.',
  },
];

const HERO_FEATURES = [
  { icon: Eye, title: 'Panorama da região', desc: 'Score, nota e tendência em 5 segundos.' },
  { icon: LineChart, title: 'Histórico', desc: 'Evolução de 1, 3 e 5 anos vs inflação e CDI.' },
  { icon: GitCompare, title: 'Comparações', desc: 'Dois bairros lado a lado, métrica a métrica.' },
  { icon: Bot, title: 'Análise LandMap AI', desc: 'IA traduzindo dados em decisão de investimento.' },
];

function PushNotificationToggle() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          await subscription.unsubscribe();
          setIsEnabled(false);
        } else {
          const newSub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          });
          if (newSub) {
            await fetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newSub),
            });
            setIsEnabled(true);
          }
        }
      }
    } catch (e) {
      console.error('Push toggle failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      aria-label="Alternar notificações push"
      className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1.5 text-xs font-medium text-foreground/70 transition hover:border-primary/40 hover:text-foreground"
    >
      <BellRing className={`h-3.5 w-3.5 ${isEnabled ? 'text-primary' : 'text-foreground/50'}`} />
      <span>{isLoading ? 'Configurando...' : isEnabled ? 'Notificações ativas' : 'Notificações'}</span>
    </button>
  );
}

export default function LandingClient() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'pt-BR';
  const href = (p: string) => `/${locale}${p}`;

  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const onboarded = window.localStorage.getItem('landmap:onboarded') === 'true';
      setHasStarted(onboarded);
    }
  }, []);

  const handleCta = () => {
    if (hasStarted) {
      router.push(href('/plans'));
    } else {
      router.push(href('/onboarding'));
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20 selection:text-primary">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 md:px-8">
          <Link href={href('/landing')} className="flex items-center gap-2" aria-label="Página Inicial LandMap">
            <LandMapWordmark className="h-6 text-foreground" />
          </Link>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <PushNotificationToggle />
            <Link
              href={href('/auth')}
              className="rounded-full border border-border/70 px-3.5 py-1.5 text-[13.5px] font-semibold text-foreground/70 transition hover:border-primary/40 hover:text-foreground"
            >
              Entrar
            </Link>
            <button
              onClick={handleCta}
              className="rounded-full bg-primary px-4 py-1.5 text-[13.5px] font-semibold text-primary-foreground shadow-sm transition hover:opacity-95 active:scale-[0.98]"
            >
              {hasStarted ? 'Ver planos' : 'Testar 7 dias grátis'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="mx-auto max-w-6xl px-5 pb-14 pt-14 md:px-8 md:pb-24 md:pt-24">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1 text-[12px] font-medium text-foreground/60 shadow-xs">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>Inteligência de terrenos no Brasil</span>
          </div>

          <h1 className="mt-5 max-w-3xl font-display text-[34px] font-bold leading-[1.06] tracking-[-0.035em] text-foreground md:text-[62px]">
            Veja o futuro do mercado imobiliário antes dos outros.
          </h1>

          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-foreground/60 md:text-[19px]">
            Descubra regiões antes da valorização, compare bairros, acompanhe tendências e tome decisões com inteligência.
          </p>

          <p className="mt-3 text-[13px] text-foreground/45">
            Para investidores, corretores, incorporadoras e proprietários de terreno
          </p>

          <p className="text-[13px] text-foreground/45">
            Cobertura ativa em Fortaleza e Eusébio (CE).{' '}
            <Link
              href={href('/cobertura')}
              className="underline decoration-foreground/30 underline-offset-2 hover:text-foreground/70"
            >
              Novas praças em processamento.
            </Link>
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={handleCta}
              className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-[15px] font-semibold text-primary-foreground shadow-sm transition hover:opacity-95 active:scale-[0.98]"
            >
              <span>{hasStarted ? 'Ver planos LandMap' : 'Começar gratuitamente por 7 dias'}</span>
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </button>
            <span className="text-[13px] text-foreground/45">
              {hasStarted
                ? 'Acesso completo à inteligência LandMap. Planos a partir de R$ 39,90/mês.'
                : 'Sem cartão de crédito. Acesso completo ao LandMap Pro. Planos a partir de R$ 39,90/mês.'}
            </span>
          </div>

          {/* 4 Feature Badges in Hero */}
          <div className="mt-12 grid grid-cols-2 gap-3 border-t border-border/60 pt-8 md:grid-cols-4">
            {HERO_FEATURES.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-xl border border-border/60 bg-card/50 p-3.5 transition hover:border-border">
                  <Icon className="h-4 w-4 text-primary" strokeWidth={1.8} />
                  <p className="mt-2 font-display text-[13.5px] font-bold leading-tight tracking-[-0.015em] text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-foreground/50">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* What You See Section */}
        <section className="border-t border-border/60 bg-card/40">
          <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
            <h2 className="max-w-2xl font-display text-[26px] font-bold leading-tight tracking-[-0.03em] text-foreground md:text-[38px]">
              O que você passa a enxergar
            </h2>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {WHAT_YOU_SEE.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-border/60 bg-background p-6 shadow-card transition hover:border-border"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
                      <Icon className="h-[18px] w-[18px] text-primary" strokeWidth={1.9} />
                    </div>
                    <h3 className="mt-4 font-display text-[17.5px] font-bold leading-snug tracking-[-0.02em] text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-[14.5px] leading-relaxed text-foreground/55">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Also in LandMap Section */}
        <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
          <h2 className="font-display text-[26px] font-bold leading-tight tracking-[-0.03em] text-foreground md:text-[38px]">
            E também no LandMap
          </h2>

          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
            {AND_ALSO_IN_LANDMAP.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-xl border border-border/60 bg-card/50 p-3.5 transition hover:border-border"
                >
                  <Icon className="h-4 w-4 text-primary" strokeWidth={1.8} />
                  <p className="mt-2 font-display text-[13.5px] font-bold leading-tight tracking-[-0.015em] text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-foreground/50">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-[12px] leading-snug text-foreground/45">
            Estimativas baseadas em dados históricos e indicadores urbanos. Não constituem recomendação de investimento nem garantia de retorno.
          </p>
        </section>

        {/* How It Works Section */}
        <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24 border-t border-border/60">
          <h2 className="font-display text-[26px] font-bold leading-tight tracking-[-0.03em] text-foreground md:text-[38px]">
            Como funciona
          </h2>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.n} className="flex flex-col items-start">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-[13px] font-bold text-primary-foreground shadow-xs">
                  {item.n}
                </span>
                <h3 className="mt-4 font-display text-[17.5px] font-bold leading-snug tracking-[-0.02em] text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-foreground/55">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* LandMap Score Section */}
        <section className="border-t border-border/60 bg-card/40">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2 md:px-8 md:py-24">
            <div>
              <h2 className="font-display text-[26px] font-bold leading-tight tracking-[-0.03em] text-foreground md:text-[34px]">
                LandMap Score
              </h2>
              <p className="mt-4 text-[15.5px] leading-relaxed text-foreground/60">
                Uma nota de 0 a 100 que traduz o potencial de investimento da região. Considera preço por m², ritmo de valorização, liquidez, densidade, capacidade financeira e infraestrutura urbana.
              </p>
              <ul className="mt-6 space-y-2.5">
                {[
                  'Quanto maior a nota, maior o potencial',
                  'Comparável entre bairros e cidades diferentes',
                  'Recalculado a cada atualização de dados',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2 text-[14.5px] text-foreground/70">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background p-6 shadow-elegant">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 font-display text-[18px] font-bold tabular-nums text-primary">
                  92
                </div>
                <div className="min-w-0">
                  <p className="font-display text-[16px] font-bold tracking-[-0.02em] text-foreground">
                    Análise fundamentada em dados
                  </p>
                  <p className="text-[12.5px] text-foreground/50">
                    Clareza sobre o que sustenta a nota
                  </p>
                </div>
              </div>

              <p className="mt-5 text-[15px] leading-relaxed text-foreground/70">
                “O Jardim Paulista, em São Paulo, atingiu nota 92 porque o preço do m² subiu 8,3% em 12 meses, o tempo de venda de imóveis caiu 18% e houve entrada de novos empreendimentos de médio porte na região. A liquidez melhorou sem que o preço médio estourasse, o que indica janela de entrada ainda interessante.”
              </p>

              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border/60 pt-4">
                {[
                  ['+8,3%', 'preço/m²'],
                  ['-18%', 'tempo de venda'],
                  ['12', 'fontes cruzadas'],
                ].map(([val, lbl]) => (
                  <div key={lbl}>
                    <p className="font-display text-[15px] font-bold tabular-nums text-primary">{val}</p>
                    <p className="text-[11.5px] text-foreground/50">{lbl}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2 text-[12.5px] text-foreground/45">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                <span>Dados de fontes oficiais e privadas, atualizados diariamente.</span>
              </div>

              <p className="mt-3 text-[12px] leading-snug text-foreground/45">
                Estimativas baseadas em dados históricos e indicadores urbanos. Não constituem recomendação de investimento nem garantia de retorno.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
          <div className="rounded-3xl bg-primary px-6 py-12 text-primary-foreground shadow-elegant md:px-14 md:py-16">
            <h2 className="max-w-2xl font-display text-[26px] font-bold leading-tight tracking-[-0.03em] md:text-[38px]">
              {hasStarted ? 'Continue investindo com inteligência.' : 'Experimente antes de assinar.'}
            </h2>
            <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed opacity-80">
              {hasStarted
                ? 'Escolha um plano e mantenha o acesso completo aos dados oficiais da LandMap.'
                : '7 dias com acesso completo ao LandMap Pro. Sem pagamento antecipado, sem fidelidade.'}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={handleCta}
                className="inline-flex items-center justify-center rounded-full bg-background px-7 py-3 text-[15px] font-semibold text-foreground shadow-sm transition hover:bg-background/90 active:scale-[0.98]"
              >
                <span>{hasStarted ? 'Escolher meu plano' : 'Começar gratuitamente por 7 dias'}</span>
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </button>
              <Link
                href={href('/plans')}
                className="text-[14px] font-semibold underline decoration-primary-foreground/30 underline-offset-4 opacity-80 hover:opacity-100"
              >
                Ver planos
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Global Site Footer */}
      <Footer />
    </div>
  );
}
