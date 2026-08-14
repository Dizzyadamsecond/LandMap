'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MapPinned,
  Sparkles,
  Star,
  Building2,
  MapPin,
  Search,
  GitCompare,
  LineChart,
  BarChart,
  Satellite,
  Layers,
  Activity,
  Bot,
  LandMapWordmark,
  BellRing,
} from '../../../components/lovable/icons';

/**
 * Splash = landing page 1:1 com a Lovable (landmap-insight.lovable.app/splash).
 * Página de marketing completa: hero, grid de 8 features, "Como funciona",
 * LandMap Score e CTAs. Não há auto-redirect — o fluxo de entrada é idêntico
 * ao da Lovable (entra no site e vê a landing, livre, sem parede de login).
 * Links apontam para rotas existentes do LandMap (preserva tudo que já temos).
 */

// 1:1 com a ordem do Lovable live (landmap-insight.lovable.app/splash):
// "O que você passa a enxergar" = 4 blocos na sequência exata abaixo.
const FEATURES = [
  { icon: MapPinned, title: 'Descubra regiões antes delas valorizarem', desc: 'Veja onde a valorização está começando, antes do mercado.' },
  { icon: Star, title: 'Saiba o potencial da região em um número', desc: 'O LandMap Score resume potencial, risco e atratividade de 0 a 100.' },
  { icon: GitCompare, title: 'Compare bairros e descubra qual oferece maior potencial', desc: 'Lado a lado, sem planilha: preço, tendência, histórico e risco de cada região.' },
  { icon: BellRing, title: 'Seja avisado quando a janela abrir', desc: 'Receba notificação quando uma região entrar em alta.' },
];

const STEPS = [
  { icon: Search, title: 'Escolha onde quer olhar', desc: 'Busque por cidade ou bairro direto no mapa.' },
  { icon: LineChart, title: 'Veja como a região evoluiu', desc: 'Histórico de preço, tendência de 12 meses e comparação com CDI.' },
  { icon: Bot, title: 'Decida com a explicação da IA', desc: 'A IA transforma os números em linguagem simples.' },
];

function PushNotificationToggle() {
  const [isEnabled, setIsEnabled] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
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
      className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm transition hover:border-[var(--primary)] hover:bg-[var(--card)]"
    >
      <BellRing className={`h-4 w-4 ${isEnabled ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`} />
      {isLoading ? 'Configurando...' : isEnabled ? 'Notificações ativas' : 'Ativar notificações'}
    </button>
  );
}

export default function SplashPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';
  const href = (p: string) => `/${locale}${p}`;

  return (
    <main id="main-content" className="min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href={href('/splash')} className="flex items-center gap-2">
            <LandMapWordmark className="h-7 text-[var(--foreground)]" />
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-[var(--muted-foreground)] md:flex">
            <Link href={href('/sobre')} className="transition hover:text-[var(--foreground)]">Sobre</Link>
            <Link href={href('/metodologia')} className="transition hover:text-[var(--foreground)]">Metodologia</Link>
            <Link href={href('/cobertura')} className="transition hover:text-[var(--foreground)]">Cobertura</Link>
            <Link href={href('/plans')} className="transition hover:text-[var(--foreground)]">Planos</Link>
          </nav>
          <div className="flex items-center gap-3">
            <PushNotificationToggle />
            <Link href={href('/auth')} className="text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">
              Entrar
            </Link>
            <Link
              href={href('/auth')}
              className="inline-flex items-center justify-center rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] shadow-sm transition hover:opacity-90"
            >
              Testar 7 dias grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — 100% Lovable Parity (Minimal Splash) */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="aurora" />
          <div className="glow-primary orb-float-slow" style={{ top: '-10%', left: '-5%', width: '45vw', height: '45vw' }} />
          <div className="glow-dual orb-float" style={{ bottom: '-15%', right: '-8%', width: '40vw', height: '40vw' }} />
          <div className="grain" />
        </div>
        <div className="mx-auto flex max-w-6xl min-h-[calc(100dvh-80px)] flex-col items-center justify-center px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]"
          >
            <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
            Inteligência de terrenos no Brasil
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl md:text-6xl"
          >
            Veja o futuro do mercado imobiliário{' '}
            <span className="text-aurora">antes dos outros.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-5 max-w-2xl text-base text-[var(--muted-foreground)] sm:text-lg"
          >
            Descubra regiões antes da valorização, compare bairros, acompanhe tendências e tome decisões com inteligência.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href={href('/auth')}
              className="inline-flex items-center justify-center rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--primary-foreground)] shadow-sm transition hover:opacity-90"
            >
              Começar gratuitamente por 7 dias →
            </Link>
            <span className="text-xs text-[var(--muted-foreground)]">
              Sem cartão de crédito. Acesso completo ao LandMap Pro.
            </span>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
          <div>
            <LandMapWordmark className="h-6 text-[var(--foreground)]" />
            <p className="mt-3 text-sm text-[var(--muted-foreground)]">Inteligência territorial para decisões imobiliárias.</p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Produto</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href={href('/dashboard')} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Mapa</Link></li>
              <li><Link href={href('/insights')} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Radar</Link></li>
              <li><Link href={href('/compare')} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Comparar</Link></li>
              <li><Link href={href('/regions')} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Relatórios</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Transparência</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href={href('/fontes')} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Fontes de dados</Link></li>
              <li><Link href={href('/cobertura')} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Atualizações</Link></li>
              <li><Link href={href('/aviso-legal')} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Limitações</Link></li>
              <li><Link href={href('/metodologia')} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Metodologia</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Legal</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href={href('/terms')} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Termos de uso</Link></li>
              <li><Link href={href('/privacy')} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Privacidade</Link></li>
              <li><Link href={href('/cookies')} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Cookies</Link></li>
              <li><Link href={href('/aviso-legal')} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Aviso legal</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[var(--border)]">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-sm text-[var(--muted-foreground)] md:flex-row">
            <span>© 2026 LandMap Inteligência Territorial</span>
            <a href="mailto:comercial@landmap.com.br" className="hover:text-[var(--foreground)]">comercial@landmap.com.br</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
