'use client';

import { useTranslations } from 'next-intl';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { AlertTriangle } from './lovable/icons';

/**
 * OfflineBanner — aviso quando o navegador fica offline (skill pwa-expert).
 * Aparece no topo, fixo, e some automaticamente ao voltar a conexão.
 */
export function OfflineBanner() {
  const t = useTranslations('pwa');
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[95] flex items-center justify-center gap-2 bg-[var(--warning)] px-4 py-2 text-center text-xs font-medium text-[var(--warning-foreground)]"
    >
      <AlertTriangle size={14} />
      <span>{t('offline.banner')}</span>
    </div>
  );
}
