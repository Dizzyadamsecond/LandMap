'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    __landmapPwaRegistered?: boolean;
  }
}

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
    // Guard anti-dupla-registro (StrictMode/HMR) — mesma prática do padrão PWA
    if (window.__landmapPwaRegistered) return;

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          window.__landmapPwaRegistered = true;
          console.log('[PWA] ✅ Service Worker registered:', reg.scope);
          // SW novo esperando → ativa na hora (app sempre atualizado)
          if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
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
    else window.addEventListener('load', register, { once: true });

    // SW novo assumiu o controle → recarrega para servir o build fresco
    const onControllerChange = () => window.location.reload();
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  return null;
}
