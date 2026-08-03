import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Shared on-brand layout for the LandMap-unique feature screens
 * (/world, /insights, /sales, /terrenos, /chat, /calculator, /studio,
 * /live, /status, /property). Keeps every screen 1:1 with the Lovable
 * design system: indigo tokens only (var(--*)), DM Sans, cadastre backdrop.
 * See DESIGN.md §1/§3/§7.
 */
type FeaturePageProps = {
  locale: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
  children?: ReactNode;
};

export function FeaturePage({
  locale,
  eyebrow,
  title,
  description,
  ctaHref,
  ctaLabel,
  children,
}: FeaturePageProps) {
  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[var(--background)]" />
        <div className="absolute inset-0 cadastre-grid opacity-[0.03]" />
      </div>
      <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10 md:py-16">
        <header className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
            {eyebrow}
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
          <p className="max-w-2xl text-[var(--muted-foreground)]">{description}</p>
          {ctaHref && ctaLabel && (
            <Link
              href={`/${locale}${ctaHref}`}
              className="inline-flex h-9 items-center rounded-xl bg-[var(--primary)] px-3.5 text-sm font-medium text-[var(--primary-foreground)] shadow-[var(--shadow-card)] transition hover:bg-[var(--primary)]/90"
            >
              {ctaLabel}
            </Link>
          )}
        </header>
        {children}
      </div>
    </div>
  );
}
