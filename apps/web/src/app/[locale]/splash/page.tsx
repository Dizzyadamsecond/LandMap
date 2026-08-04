'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import { LandMapWordmark } from '../../../components/lovable/icons';

/* Circular progress geometry */
const RADIUS = 54;
const CIRC = 2 * Math.PI * RADIUS;

export default function SplashPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';
  const reduceMotion = useReducedMotion();
  const t = useTranslations('splash');
  const statuses = (t.raw('loading') as string[]) ?? [];

  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  // Auto-advance to the funnel once the intro completes.
  useEffect(() => {
    const duration = 2600;
    const intervalTime = 30;
    const increment = 100 / (duration / intervalTime);
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setDone(true);
          window.setTimeout(() => router.replace(`/${locale}/onboarding`), 360);
          return 100;
        }
        return next;
      });
    }, intervalTime);
    return () => clearInterval(timer);
  }, [router, locale]);

  const statusIndex = Math.min(
    statuses.length - 1,
    Math.floor((progress / 100) * statuses.length)
  );
  const statusText = statuses[statusIndex] ?? '';
  const dashOffset = CIRC * (1 - progress / 100);

  const to = (path: string) => () => router.replace(`/${locale}${path}`);

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[var(--background)] px-6 text-[var(--foreground)]">
      {/* Aurora background layers (Lovable indigo, token-driven) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[var(--background)]" />
        <div className="absolute inset-0 cadastre-grid opacity-[0.04]" />
        <div className="absolute left-1/2 top-1/3 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--primary)]/10 blur-3xl" />
        <div className="absolute -left-32 top-10 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,var(--primary-glow),transparent_70%)] opacity-20 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,var(--accent),transparent_70%)] opacity-15 blur-3xl" />
      </div>

      {/* Top-right actions (Lovable splash: skip + primary CTA) */}
      <div className="absolute top-6 right-6 z-10 flex items-center gap-3">
        <button
          onClick={to('/map')}
          className="inline-flex h-9 items-center rounded-lg border border-[var(--border)] px-3 text-xs font-semibold text-[var(--muted-foreground)] transition-colors hover:border-[var(--ring)] hover:text-[var(--foreground)]"
        >
          {t('skip')}
        </button>
        <button
          onClick={to('/onboarding')}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 text-xs font-semibold text-[var(--primary-foreground)] shadow-[var(--shadow-card)] transition-colors hover:bg-[var(--primary-glow)]"
        >
          {t('ctaStart')}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex w-full max-w-md flex-col items-center text-center"
      >
        {/* Animated radar logo mark */}
        <div className="relative mb-9 grid h-40 w-40 place-items-center">
          {/* Outer rotating dashed ring */}
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-full border border-dashed border-[var(--ring)]/40"
            animate={reduceMotion ? undefined : { rotate: 360 }}
            transition={{ duration: 14, ease: 'linear', repeat: Infinity }}
          />
          {/* Sweeping conic radar */}
          <div
            aria-hidden
            className={`absolute inset-3 rounded-full radar-sweep ${reduceMotion ? '' : 'radar-spin'}`}
          />
          {/* Inner glow */}
          <div
            aria-hidden
            className="absolute inset-9 rounded-full"
            style={{
              background:
                'radial-gradient(circle, color-mix(in srgb, var(--primary) 22%, transparent) 0%, transparent 70%)',
            }}
          />
          {/* Center logo + circular progress */}
          <div className="relative grid h-28 w-28 place-items-center">
            <svg viewBox="0 0 128 128" className="absolute inset-0 h-full w-full -rotate-90">
              <circle
                cx="64"
                cy="64"
                r={RADIUS}
                fill="none"
                stroke="var(--border)"
                strokeWidth="5"
              />
              <circle
                cx="64"
                cy="64"
                r={RADIUS}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 160ms linear' }}
              />
            </svg>
            <div className="flex flex-col items-center">
              <LandMapWordmark className="h-9 scale-90" />
              <span className="mt-1 font-mono text-[11px] font-semibold tabular-nums text-[var(--muted-foreground)]">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>

        <h1 className="text-balance text-2xl font-bold leading-tight tracking-tight text-[var(--foreground)] md:text-3xl">
          {t('title')}
        </h1>
        <p className="mt-3 max-w-sm text-sm text-[var(--muted-foreground)]">
          {t('subtitle')}
        </p>

        {/* Status line */}
        <div className="mt-6 flex h-5 items-center justify-center">
          <span
            className={`text-xs font-medium ${done ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'} animate-pulse`}
          >
            {statusText}
          </span>
        </div>

        {/* Primary CTA -> map */}
        <button
          onClick={to('/map')}
          className="cta-glow mt-7 inline-flex h-12 w-full max-w-xs items-center justify-center rounded-xl bg-[var(--primary)] px-8 text-sm font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          {t('ctaMap')}
        </button>
      </motion.div>

      <p className="absolute bottom-6 text-[10px] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
        {t('footnote')}
      </p>
    </main>
  );
}
