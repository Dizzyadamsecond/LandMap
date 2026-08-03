'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { LandMapWordmark } from '../../../components/lovable/icons';

/**
 * /[locale]/splash — tela de entrada animada, 1:1 com o padrão Lovable.
 * Hero central com wordmark, headline, subhead e CTAs idênticos:
 *  - "Abrir o mapa"  -> /map  (primary)
 *  - "Começar"       -> /onboarding (secondary)
 * Animação de entrada suave + respeita prefers-reduced-motion.
 */

export default function SplashPage() {
  const t = useTranslations('splash');

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[var(--background)] px-6 text-[var(--foreground)]">
      {/* cadastre grid sutil de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 cadastre-grid opacity-[0.05]"
      />
      {/* glow indigo Lovable */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-[var(--primary)]/15 blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center text-center"
      >
        <LandMapWordmark className="h-10" />

        <h1 className="mt-8 max-w-xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          {t('title')}
        </h1>

        <p className="mt-3 max-w-md text-[var(--muted-foreground)]">{t('subtitle')}</p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="./map"
            className="inline-flex h-10 items-center rounded-lg bg-[var(--primary)] px-5 text-sm font-medium text-[var(--primary-foreground)] transition hover:bg-[var(--primary)]/90"
          >
            {t('ctaMap')}
          </Link>
          <Link
            href="./onboarding"
            className="inline-flex h-10 items-center rounded-lg border border-[var(--border)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)]"
          >
            {t('ctaStart')}
          </Link>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="absolute bottom-6 text-xs text-[var(--muted-foreground)]"
      >
        {t('footnote')}
      </motion.p>
    </main>
  );
}
