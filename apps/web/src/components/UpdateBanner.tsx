'use client';

import { useTranslations } from 'next-intl';
import { usePWAUpdate } from '../hooks/usePWAUpdate';
import { Button } from '@landmap/ui';
import { RefreshCw } from './lovable/icons';

/**
 * UpdateBanner — nova versão disponível (skill pwa-expert, user-prompted).
 * Só aparece quando um SW novo foi instalado em background; o usuário decide
 * recarregar. Não interrompe a sessão.
 */
export function UpdateBanner() {
  const t = useTranslations('pwa');
  const { updateAvailable, applyUpdate } = usePWAUpdate();

  if (!updateAvailable) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 left-4 right-4 z-[90] md:left-auto md:right-6 md:bottom-6 md:w-80 rounded-xl border border-[var(--primary)]/30 bg-[var(--card)] p-4 shadow-lg"
    >
      <p className="text-sm font-semibold text-[var(--foreground)]">{t('update.title')}</p>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">{t('update.subtitle')}</p>
      <Button size="sm" className="mt-3 w-full" onClick={applyUpdate}>
        <RefreshCw size={14} className="mr-1.5" />
        {t('update.cta')}
      </Button>
    </div>
  );
}
