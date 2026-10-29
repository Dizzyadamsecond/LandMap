'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import React from 'react';
import { ArrowLeft } from './lovable/icons';
import { Footer } from './Footer';

interface PublicPageShellProps {
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  maxWidth?: string;
}

export function PublicPageShell({
  children,
  backHref = '/onboarding',
  backLabel = 'Voltar',
  maxWidth,
}: PublicPageShellProps) {
  const locale = useLocale();
  const href = backHref.startsWith('/') ? `/${locale}${backHref}` : backHref;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-40">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <Link
              href={href}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{backLabel}</span>
            </Link>
            <div className="flex items-center">
              <img
                src="/landmap-logo-transparent.png"
                alt="LandMap"
                className="w-auto object-contain h-8"
              />
            </div>
            <div className="w-16" />
          </div>
        </header>
        <main className={maxWidth ? `mx-auto max-w-${maxWidth}` : ''}>
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default PublicPageShell;
