'use client';

import Link from 'next/link';
import { Logo } from './Logo';
import { localeHref, useActiveLocale } from '../lib/locale';

export function Footer() {
  const year = new Date().getFullYear();
  const locale = useActiveLocale();

  const lh = (p: string) => localeHref(p, locale);

  return (
    <footer aria-label="Rodapé do LandMap" className="mx-auto w-full max-w-6xl px-6 py-12 text-xs text-[var(--muted-foreground)]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--primary)]/40 to-transparent" />
      <div className="pt-12">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-[var(--foreground)]">
              <Logo className="h-5 w-5" />
              <span>LandMap</span>
            </div>
            <p className="mt-3 leading-relaxed">
              Mapa de valorização, ranking de regiões e histórico de preço por m² para decisões de terreno no Brasil.
            </p>
          </div>

          <nav aria-label="Produto" className="grid grid-cols-2 gap-x-10 gap-y-2 sm:grid-cols-3">
            <Link href={lh('/')} className="transition hover:text-[var(--foreground)]">Início</Link>
            <Link href={lh('/map')} className="transition hover:text-[var(--foreground)]">Mapa</Link>
            <Link href={lh('/compare')} className="transition hover:text-[var(--foreground)]">Comparar</Link>
            <Link href={lh('/favorites')} className="transition hover:text-[var(--foreground)]">Favoritos</Link>
            <Link href={lh('/regions')} className="transition hover:text-[var(--foreground)]">Regiões</Link>
            <Link href={lh('/insights')} className="transition hover:text-[var(--foreground)]">Insights</Link>
            <Link href={lh('/calculator')} className="transition hover:text-[var(--foreground)]">Calculadora</Link>
            <Link href={lh('/chat')} className="transition hover:text-[var(--foreground)]">Chat IA</Link>
            <Link href={lh('/plans')} className="transition hover:text-[var(--primary)]">Planos</Link>
          </nav>

          <nav aria-label="Recursos" className="grid grid-cols-2 gap-x-10 gap-y-2 sm:grid-cols-3">
            <Link href={lh('/world')} className="transition hover:text-[var(--foreground)]">Mundo 3D</Link>
            <Link href={lh('/world-3d')} className="transition hover:text-[var(--foreground)]">Atlas vivo</Link>
            <Link href={lh('/v2')} className="transition hover:text-[var(--foreground)]">Atlas</Link>
            <Link href={lh('/terrenos')} className="transition hover:text-[var(--foreground)]">Terrenos</Link>
            <Link href={lh('/metodologia')} className="transition hover:text-[var(--foreground)]">Metodologia</Link>
            <Link href={lh('/glossary')} className="transition hover:text-[var(--foreground)]">Glossário</Link>
            <Link href={lh('/sobre')} className="transition hover:text-[var(--foreground)]">Sobre</Link>
            <Link href={lh('/fontes')} className="transition hover:text-[var(--foreground)]">Fontes</Link>
            <Link href={lh('/knowledge')} className="transition hover:text-[var(--foreground)]">Conhecimento</Link>
          </nav>

          <nav aria-label="Admin" className="grid grid-cols-2 gap-x-10 gap-y-2 sm:grid-cols-3">
            <Link href={lh('/admin')} className="transition hover:text-[var(--foreground)]">Painel Admin</Link>
          </nav>

          <nav aria-label="Legal" className="grid grid-cols-2 gap-x-10 gap-y-2 sm:grid-cols-3">
            <Link href={lh('/aviso-legal')} className="transition hover:text-[var(--foreground)]">Aviso legal</Link>
            <Link href={lh('/privacy')} className="transition hover:text-[var(--foreground)]">Privacidade</Link>
            <Link href={lh('/terms')} className="transition hover:text-[var(--foreground)]">Termos</Link>
            <Link href={lh('/cobertura')} className="transition hover:text-[var(--foreground)]">Cobertura</Link>
            <Link href={lh('/cookies')} className="transition hover:text-[var(--foreground)]">Cookies</Link>
            <Link href={lh('/consent')} className="transition hover:text-[var(--foreground)]">Consentimento</Link>
          </nav>
        </div>

        <div className="mt-10 flex items-center justify-between border-t hairline pt-6">
          <p>© {year} LandMap — Inteligência de terrenos.</p>
          <p className="text-[var(--muted-foreground)]">Dados territoriais · decisões com confiança</p>
        </div>
      </div>
    </footer>
  );
}
