'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { listPendingActions, type SyncAction } from '../lib/pwaSync';
import { RefreshCw, ListChecks } from './lovable/icons';

/**
 * SyncStatus — estado offline-first (skill pwa-expert).
 * Mostra quantas ações estão na fila local aguardando reconexão e permite
 * disparar o sync manualmente (útil em navegadores sem Background Sync).
 */
export function SyncStatus() {
  const t = useTranslations('pwa');
  const isOnline = useOnlineStatus();
  const [pending, setPending] = useState<SyncAction[]>([]);

  const refresh = useCallback(() => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) return;
    listPendingActions()
      .then((a) => setPending(a))
      .catch(() => setPending([]));
  }, []);

  useEffect(() => {
    refresh();
    // Re-checa quando volta online (fila pode ter sido drenada pelo SW)
    const onOnline = () => setTimeout(refresh, 1500);
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [refresh]);

  // Após o SW flushear, a fila some — o OnlineStatus re-renderiza ao voltar online
  if (pending.length === 0 || isOnline) return null;

  const runSync = async () => {
    try {
      if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        const reg = await navigator.serviceWorker.ready;
        await (reg as any).sync.register('landmap-sync');
      } else {
        // Sem Background Sync: força update do SW (o activate flusha a fila)
        const reg = await navigator.serviceWorker.ready;
        await reg.update();
      }
      setTimeout(refresh, 2000);
    } catch {
      /* noop */
    }
  };

  return (
    <div
      role="status"
      className="fixed bottom-20 right-4 z-[90] flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs text-[var(--muted-foreground)] shadow-md"
    >
      <ListChecks size={13} className="text-[var(--primary)]" />
      <span>
        {t('sync.pending', { count: String(pending.length) })}
      </span>
      <button
        onClick={runSync}
        className="ml-1 flex items-center gap-1 font-medium text-[var(--primary)] hover:text-[var(--primary)]/80"
      >
        <RefreshCw size={12} />
        {t('sync.cta')}
      </button>
    </div>
  );
}
