'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
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
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 cadastre-grid opacity-[0.04]" />
        <div className="mx-auto max-w-6xl px-6 py-20 text-center md:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
            <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
            Inteligência de terrenos no Brasil
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl md:text-6xl">
            Veja o futuro do mercado imobiliário antes dos outros.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-[var(--muted-foreground)] sm:text-lg">
            Descubra regiões antes da valorização, compare bairros, acompanhe tendências e tome decisões com inteligência.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={href('/auth')}
              className="inline-flex items-center justify-center rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--primary-foreground)] shadow-sm transition hover:opacity-90"
            >
              Começar gratuitamente por 7 dias →
            </Link>
            <span className="text-xs text-[var(--muted-foreground)]">
              Sem cartão de crédito. Acesso completo ao LandMap Pro.
            </span>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-6xl px-6 pb-10">
        <h2 className="mb-8 text-center text-2xl font-bold tracking-tight text-[var(--foreground)]">
          O que você passa a enxergar
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--primary)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--primary)]">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[var(--foreground)]">{f.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="mb-8 text-center text-2xl font-bold tracking-tight text-[var(--foreground)]">Como funciona</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-bold text-[var(--primary-foreground)]">
                  {i + 1}
                </span>
                <s.icon className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-[var(--foreground)]">{s.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LandMap Score */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid items-center gap-8 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 md:grid-cols-2">
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
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-3xl bg-[var(--primary)] px-8 py-12 text-center">
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
