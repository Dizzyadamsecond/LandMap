'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Button } from '@landmap/ui';
import { X } from './lovable/icons';

/**
 * InstallPrompt — UI customizada de instalação (skill pwa-expert).
 *
 * Aparece quando o beforeinstallprompt dispara (Chrome/Edge/Android) e o
 * usuário ainda não dispensou. Respeita dismiss via localStorage; no iOS
 * (sem beforeinstallprompt) não aparece — o iOS tem instruções próprias.
 */
export function InstallPrompt() {
  const t = useTranslations('pwa');
  const { isInstallable, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (localStorage.getItem('landmap-pwa-install-dismissed')) setDismissed(true);
    } catch {
      /* noop */
    }
  }, []);

  if (!isInstallable || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem('landmap-pwa-install-dismissed', '1');
    } catch {
      /* noop */
    }
  };

  return (
    <div
      role="dialog"
      aria-label={t('install.title')}
      className="fixed bottom-20 left-4 right-4 z-[90] md:left-auto md:right-6 md:bottom-6 md:w-80 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-lg backdrop-blur-md"
    >
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" className="h-12 w-12 rounded-lg" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">{t('install.title')}</h3>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">{t('install.subtitle')}</p>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-md p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          aria-label={t('install.dismiss')}
        >
          <X size={16} />
        </button>
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="ghost" size="sm" className="flex-1" onClick={dismiss}>
          {t('install.later')}
        </Button>
        <Button size="sm" className="flex-1" onClick={() => install()}>
          {t('install.cta')}
        </Button>
      </div>
    </div>
  );
}
