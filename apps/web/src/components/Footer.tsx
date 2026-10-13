'use client';

import Link from 'next/link';
import { Logo } from './Logo';
import { localeHref, useActiveLocale } from '../lib/locale';

/**
 * Footer — EXTRAÇÃO 1:1 do footer da Lovable LIVE (`landmap-insight.lovable.app`,
 * medido via DOM/outerHTML em 2026-10-12):
 *
 *  - `<footer class="border-t border-foreground/5 bg-background">`
 *  - 4 colunas (`grid gap-10 md:grid-cols-2 lg:grid-cols-4`):
 *    **LandMap · Produto · Transparência · Legal** (títulos
 *    `text-xs font-semibold uppercase tracking-widest text-foreground/50`),
 *    links `text-sm text-foreground/70 transition hover:text-foreground`;
 *  - bottom bar (`mt-12 flex flex-col gap-4 border-t border-foreground/5 pt-8
 *    md:flex-row md:items-center md:justify-between`): logo (h-12) + copyright
 *    à esquerda; email `mailto:comercial@landmap.com.br` + "Fortaleza — CE,
 *    Brasil" à direita (`text-xs text-foreground/50`).
 *
 * Única adaptação: hrefs prefixados com o locale ativo (`localeHref`) — a
 * Lovable vive em domínio único sem prefixo.
 */

type Col = { title: string; links: { label: string; href: string }[] };

const COLUMNS: Col[] = [
  {
    title: 'LandMap',
    links: [
      { label: 'Sobre', href: '/sobre' },
      { label: 'Como funciona', href: '/onboarding' },
      { label: 'Cobertura', href: '/cobertura' },
      { label: 'Metodologia', href: '/metodologia' },
    ],
  },
  {
    title: 'Produto',
    links: [
      { label: 'Mapa', href: '/dashboard' },
      { label: 'Radar', href: '/insights' },
      { label: 'Comparar', href: '/compare' },
      { label: 'Relatórios', href: '/regions' },
      { label: 'Planos', href: '/plans' },
    ],
  },
  {
    title: 'Transparência',
    links: [
      { label: 'Fontes de dados', href: '/fontes' },
      { label: 'Glossário', href: '/glossario' },
      { label: 'Atualizações', href: '/cobertura' },
      { label: 'Limitações', href: '/aviso-legal' },
      { label: 'Aviso legal', href: '/aviso-legal' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Termos de uso', href: '/terms' },
      { label: 'Política de privacidade', href: '/privacy' },
      { label: 'Política de cookies', href: '/cookies' },
      { label: 'Aviso legal', href: '/aviso-legal' },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();
  const locale = useActiveLocale();
  const lh = (p: string) => localeHref(p, locale);

  return (
    <footer aria-label="Rodapé do LandMap" className="border-t border-foreground/5 bg-background">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-foreground/50">
                {col.title}
              </p>
              <ul className="space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.label + l.href}>
                    <Link
                      href={lh(l.href)}
                      className="text-foreground/70 transition hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-foreground/5 pt-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Logo className="h-12 w-12" />
            <span className="text-xs text-foreground/50">
              © {year} LandMap Inteligência Territorial. Todos os direitos reservados.
            </span>
          </div>
          <div className="flex flex-col gap-1 text-xs text-foreground/50 md:items-end">
            <a href="mailto:comercial@landmap.com.br" className="hover:text-foreground">
              comercial@landmap.com.br
            </a>
            <span>Fortaleza — CE, Brasil</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
