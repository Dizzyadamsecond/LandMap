'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { PublicPageShell } from '../../../components/PublicPageShell';
import { COMPANY, PRINCIPLES } from '../../../lib/public-content';

/**
 * `/sobre` — paridade 1:1 com a Lovable LIVE
 * (`landmap-insight.lovable.app/sobre`, chunk `sobre-DPI1vM3T.js`):
 *
 *  - header Voltar → `/onboarding` + wordmark (via `PublicPageShell`)
 *  - `article.mx-auto.max-w-3xl.px-6.py-16`
 *  - eyebrow "Sobre" + H1 "Sobre a LandMap"
 *  - 3 parágrafos institucionais (`prose ... space-y-6`)
 *  - seção "Princípios" (`mt-14`, grid `sm:grid-cols-2`, cards
 *    `rounded-2xl border border-foreground/10 bg-background p-5`)
 *  - seção "Contato e dados da empresa" (`mt-14 rounded-2xl border
 *    border-foreground/10 bg-foreground/[0.02] p-6`, dl em `sm:grid-cols-2`:
 *    E-mail comercial / Telefone / Sede / CNPJ)
 *  - `<Footer />` site-footer 1:1
 *
 * Conteúdo de contato: `lib/public-content.ts` (COMPANY — mesmos valores da
 * referência). CNPJ renderiza condicionalmente (referência só exibe quando
 * preenchido).
 */
export default function SobrePage() {
  const locale = useLocale();
  const lh = (p: string) => `/${locale}${p}`;

  return (
    <PublicPageShell backHref="/onboarding">
      <article className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">Sobre</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Sobre a LandMap</h1>

        <div className="prose prose-neutral dark:prose-invert mt-8 max-w-none space-y-6 text-[15px] leading-relaxed text-foreground/80">
          <p>
            A LandMap é uma plataforma de inteligência territorial. Cruzamos dados públicos,
            informações demográficas, indicadores urbanos e dados de mercado imobiliário para
            mostrar o que efetivamente acontece em cada região.
          </p>
          <p>
            Existimos porque decisões de terreno, incorporação e investimento imobiliário no
            Brasil ainda são tomadas com base em informação fragmentada. A LandMap organiza esses
            dados, aplica critérios claros de qualidade e apresenta o resultado com o nível de
            confiança adequado.
          </p>
          <p>
            A plataforma foi criada para construtoras, loteadoras, fundos imobiliários,
            imobiliárias e profissionais que precisam de uma base sólida antes de tomar decisões.
          </p>
        </div>

        <section className="mt-14">
          <h2 className="mb-6 font-display text-2xl font-semibold">Princípios</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="rounded-2xl border border-foreground/10 bg-background p-5">
                <p className="font-display font-semibold">{p.title}</p>
                <p className="mt-2 text-sm text-foreground/70">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
          <h2 className="font-display text-lg font-semibold">Contato e dados da empresa</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-widest text-foreground/50">
                E-mail comercial
              </dt>
              <dd className="mt-1">
                <a
                  href={`mailto:${COMPANY.emailCommercial}`}
                  className="text-primary hover:underline"
                >
                  {COMPANY.emailCommercial}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-widest text-foreground/50">
                Telefone
              </dt>
              <dd className="mt-1">{COMPANY.phone}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-widest text-foreground/50">
                Sede
              </dt>
              <dd className="mt-1">
                {COMPANY.city} — {COMPANY.uf}, {COMPANY.country}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-widest text-foreground/50">
                CNPJ
              </dt>
              <dd className="mt-1">{COMPANY.cnpj || '—'}</dd>
            </div>
          </dl>

          {/* Complemento LandMap (fora da referência, mantido sem alterar o layout espelhado):
              atalhos para o mapa e a cobertura. */}
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={lh('/dashboard')}
              className="inline-flex h-10 items-center rounded-lg bg-[var(--primary)] px-5 text-sm font-medium text-[var(--primary-foreground)] transition hover:bg-[var(--primary)]/90"
            >
              Abrir o mapa
            </Link>
            <Link
              href={lh('/cobertura')}
              className="inline-flex h-10 items-center rounded-lg border border-[var(--border)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)]"
            >
              Cobertura
            </Link>
          </div>
        </section>
      </article>
    </PublicPageShell>
  );
}

