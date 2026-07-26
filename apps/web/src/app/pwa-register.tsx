'use client';

import { useEffect } from 'react';

/**
 * Registra o service worker (PWA) e pede permissão de notificação.
 * Roda uma vez no client. Em produção o SW habilita push (Web Push / VAPID).
 */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => {
          if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
          }
        })
        .catch(() => {});
    };

    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register);
  }, []);

  return null;
}
