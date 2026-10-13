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
        .then(async (reg) => {
          window.__landmapPwaRegistered = true;
          console.log('[PWA] ✅ Service Worker registered:', reg.scope);
          // SW novo esperando → ativa na hora (app sempre atualizado)
          if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });

          // Web Push: pede permissão e inscreve no pushManager (VAPID do app).
          if ('Notification' in window && 'pushManager' in reg) {
            try {
              const perm = await Notification.requestPermission();
              if (perm === 'granted') {
                const vapidRes = await fetch('/api/push/vapid').then((r) => (r.ok ? r.json() : null));
                const publicKey = vapidRes?.publicKey as string | undefined;
                if (!publicKey) return;
                const existing = await reg.pushManager.getSubscription();
                const sub =
                  existing ||
                  (await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: publicKey,
                  }));
                await fetch('/api/push/subscribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.getKey?.('p256dh') ? btoa(String.fromCharCode(...new Uint8Array(await sub.getKey('p256dh')!))) : '', auth: sub.getKey?.('auth') ? btoa(String.fromCharCode(...new Uint8Array(await sub.getKey('auth')!))) : '' },
                  }),
                }).catch(() => {});
                console.log('[PWA] ✅ Push subscription enviada.');
              }
            } catch (e) {
              console.warn('[PWA] Push subscribe falhou:', (e as Error)?.message);
            }
          }
        })
        .catch((err) => {
          console.error('[PWA] ❌ Service Worker registration failed:', err.message || String(err));
          // Fallback: PWA não é crítico, app funciona sem SW
        });
    };

    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });

    // SW novo assumiu o controle → recarrega para servir o build fresco.
    //
    // EXCEÇÃO (parity 1:1 com a Lovable): só recarrega se a página JÁ estava
    // controlada por um SW anterior (update real). Na primeira visita o SW é
    // instalado sem controller e o `clients.claim()` dispara `controllerchange`
    // — recarregar aqui reiniciaria o splash no meio da animação de entrada
    // (medido em produção: reload aos ~2,2s, splash recomeçava do zero).
    const hadController = !!navigator.serviceWorker.controller;
    let reloading = false;
    const onControllerChange = () => {
      if (!hadController || reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  return null;
}
