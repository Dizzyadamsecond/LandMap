'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LandMapWordmark } from '../../../components/lovable/icons';

/**
 * Splash 1:1 com a Lovable: tela cheia, fundo índigo sólido, marca SVG
 * desenhando (draw-on) no centro, sem headline/barra de progresso.
 * Avança sozinho para /onboarding após ~2.3s.
 * Mantemos skip acessível (link oculto + CTA mínimo) sem poluir a paridade.
 */
export default function SplashPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';
  const t = useTranslations('splash');

  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        if (window.localStorage.getItem('guest_mode') === '1') {
          router.replace(`/${locale}/dashboard`);
          return;
        }
      } catch {
        /* ignore */
      }
      router.replace(`/${locale}/onboarding`);
    }, 2300);
    return () => window.clearTimeout(timer);
  }, [router, locale]);

  // fade-out do logo antes do redirect
  useEffect(() => {
    const timer = window.setTimeout(() => setHidden(true), 1900);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main
      className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ease-in-out"
      style={{ backgroundColor: 'var(--sidebar)' }}
    >
      {/* Skip acessível (fora da paridade visual, mantém a11y) */}
      <button
        onClick={() => router.replace(`/${locale}/map`)}
        className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-[var(--card)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--foreground)]"
      >
        {t('skip')}
      </button>

      <div
        className={`logo-mark-container splash-logo-reveal transition-opacity duration-500 ease-in-out ${
          hidden ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <LandMapWordmark className="h-10 text-[var(--sidebar-foreground)]" />
      </div>
    </main>
  );
}
