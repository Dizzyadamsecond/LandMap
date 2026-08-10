'use client';

import { useEffect } from 'react';

/**
 * Registra o service worker (PWA) e pede permissão de notificação.
 * Roda uma vez no client. Em produção o SW habilita push (Web Push / VAPID).
 * Captura o prompt de instalação (Android/Chrome) para disparador customizado.
 */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      window.dispatchEvent(new CustomEvent('pwa-install-prompt-available'));
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    if (!('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('[PWA] ✅ Service Worker registered:', reg.scope);
          if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {
              console.log('[PWA] Notification permission denied by user');
            });
          }
        })
        .catch((err) => {
          console.error('[PWA] ❌ Service Worker registration failed:', err.message || String(err));
          // Fallback: PWA não é crítico, app funciona sem SW
        });
    };

    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  return null;
}
