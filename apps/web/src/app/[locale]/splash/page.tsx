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

const FEATURES = [
  { icon: MapPinned, title: 'Panorama da região', desc: 'Visão completa de uma região: preço/m², tendências e contexto em um só lugar.' },
  { icon: LineChart, title: 'Histórico', desc: 'Evolução de 1, 3 e 5 anos vs CDI e inflação, com séries limpas e comparáveis.' },
  { icon: BarChart, title: 'Projeções', desc: 'Projeções de 1, 3 e 5 anos fundamentadas em dados locais.' },
  { icon: Building2, title: 'Motores de valorização', desc: 'Obras, metrô, shoppings e zoneamento que puxam o valor para cima.' },
  { icon: Activity, title: 'Índices próprios', desc: 'Potencial, risco e atratividade em uma escala própria de 0 a 100.' },
  { icon: GitCompare, title: 'Comparações', desc: 'Bairros lado a lado, com os mesmos indicadores para decisão justa.' },
  { icon: Layers, title: 'Oportunidades', desc: 'Áreas promissoras e subavaliadas mapeadas automaticamente.' },
  { icon: Bot, title: 'Análise LandMap AI', desc: 'A IA traduz os números para a linguagem de investimento.' },
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

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="aurora" />
          <div className="glow-primary orb-float-slow" style={{ top: '-10%', left: '-5%', width: '45vw', height: '45vw' }} />
          <div className="glow-dual orb-float" style={{ bottom: '-15%', right: '-8%', width: '40vw', height: '40vw' }} />
          <div className="grain" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-20 text-center md:py-28">
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

      {/* Seu melhor deal — social proof + CTA */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-3xl border border-[var(--primary)]/20 bg-gradient-to-r from-[var(--primary)]/5 to-transparent p-8 md:p-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
            <Star className="h-3.5 w-3.5" />
            Seu melhor deal
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-xl font-bold text-[var(--foreground)]">
                Terreno em Pinheiros, São Paulo
              </h3>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                1.200 m² | Preço: R$ 240/m² | Cap Rate: 7.2%
              </p>
              <p className="mt-3 text-base text-[var(--foreground)]">
                Região com <span className="font-semibold text-[var(--primary)]">+8% de valorização</span> em 12 meses.
                Zoneamento comercial em expansão.
              </p>
              <Link
                href={href('/map')}
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-[var(--primary-foreground)] transition hover:opacity-90"
              >
                Ver no mapa →
              </Link>
            </div>
            <div className="flex items-center justify-center rounded-2xl bg-[var(--muted)]/30 p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-[var(--primary)]">7.2%</div>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">Cap rate médio da região</p>
                <div className="mt-4 space-y-1 text-xs text-[var(--muted-foreground)]">
                  <p>📈 Tendência: Alta</p>
                  <p>🏢 Motores: Metrô + Comércio</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-6xl px-6 pb-10">
        <h2 className="mb-8 text-center text-2xl font-bold tracking-tight text-[var(--foreground)]">
          O que você passa a enxergar
        </h2>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
              }}
              className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--primary)] hover:shadow-[var(--shadow-card)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--primary)] transition group-hover:scale-110">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[var(--foreground)]">{f.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="mb-8 text-center text-2xl font-bold tracking-tight text-[var(--foreground)]">Como funciona</h2>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
              }}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 transition hover:border-[var(--primary)]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-bold text-[var(--primary-foreground)]">
                  {i + 1}
                </span>
                <s.icon className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-[var(--foreground)]">{s.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* LandMap Score */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="grid items-center gap-8 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 md:grid-cols-2"
        >
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)]">
              <Star className="h-4 w-4 text-[var(--primary)]" />
              LandMap Score
            </div>
            <h3 className="mt-3 text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Potencial de uma região em um número.
            </h3>
            <p className="mt-3 text-sm text-[var(--muted-foreground)]">
              Cada região recebe um Score de 0 a 100 que combina valorização, risco e atratividade — para você decidir com dados, não com feeling.
            </p>
          </div>
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center rounded-2xl border border-[var(--primary)] bg-[var(--background)] px-10 py-8">
              <span className="text-6xl font-bold text-[var(--primary)]">92</span>
              <span className="mt-1 text-sm font-medium text-[var(--foreground)]">Jardim Paulista, São Paulo</span>
              <div className="mt-4 flex gap-6 text-center text-sm">
                <div>
                  <div className="font-semibold text-[var(--foreground)]">+8,3%</div>
                  <div className="text-[var(--muted-foreground)]">preço/m²</div>
                </div>
                <div>
                  <div className="font-semibold text-[var(--foreground)]">−18%</div>
                  <div className="text-[var(--muted-foreground)]">tempo de venda</div>
                </div>
                <div>
                  <div className="font-semibold text-[var(--foreground)]">12</div>
                  <div className="text-[var(--muted-foreground)]">fontes</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl bg-[var(--primary)] px-8 py-12 text-center"
        >
          <h2 className="text-2xl font-bold tracking-tight text-[var(--primary-foreground)]">Experimente antes de assinar.</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--primary-foreground)]/80">
            7 dias com acesso completo ao LandMap Pro. Sem pagamento antecipado, sem fidelidade.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={href('/auth')}
              className="inline-flex items-center justify-center rounded-lg bg-[var(--card)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] shadow-sm transition hover:opacity-90"
            >
              Começar gratuitamente por 7 dias
            </Link>
            <Link
              href={href('/plans')}
              className="text-sm font-medium text-[var(--primary-foreground)] underline-offset-4 hover:underline"
            >
              Ver planos
            </Link>
          </div>
        </motion.div>
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
