'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Phone } from './lovable/icons';

/**
 * InstallButton — botão de instalação SEMPRE visível quando o app é
 * instalável e ainda não foi instalado (descoberta natural do PWA).
 *
 * - Android/Chrome/Edge: chama install() do beforeinstallprompt
 * - iOS Safari (sem beforeinstallprompt): abre um mini-dialog com o passo
 *   a passo de "Adicionar à Tela de Início"
 */
export function InstallButton() {
  const t = useTranslations('pwa');
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [iosHint, setIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (localStorage.getItem('landmap-pwa-install-dismissed')) setDismissed(true);
    } catch {
      /* noop */
    }
    // Card do InstallPrompt visível → pill fica oculto (evita sobreposição)
    const open = () => setCardOpen(true);
    const close = () => setCardOpen(false);
    window.addEventListener('landmap-install-prompt-open', open);
    window.addEventListener('landmap-install-prompt-close', close);
    return () => {
      window.removeEventListener('landmap-install-prompt-open', open);
      window.removeEventListener('landmap-install-prompt-close', close);
    };
  }, []);

  const isIOS =
    typeof window !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as any).MSStream;

  const pathname = usePathname();
  if (pathname?.includes('/auth') || pathname?.includes('/splash')) return null;
  if (dismissed || isInstalled || cardOpen) return null;

  const handleClick = async () => {
    // iOS Safari primeiro: beforeinstallprompt NÃO existe lá — instruções de
    // "Adicionar à Tela de Início". (Headless Chromium com UA iPhone ainda
    // dispara o evento; a ordem importa para o fluxo real de Safari.)
    if (isIOS) {
      setIosHint((v) => !v);
      return;
    }
    if (isInstallable) {
      const ok = await install();
      if (!ok) {
        // usuário dispensou o prompt nativo — não força de novo
        try {
          localStorage.setItem('landmap-pwa-install-dismissed', '1');
        } catch {
          /* noop */
        }
        setDismissed(true);
      }
      return;
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 rounded-full border border-[var(--primary)]/40 bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--primary)] transition hover:bg-[var(--primary)]/20"
        aria-label={t('install.cta')}
      >
        <Phone size={13} />
        {t('install.cta')}
      </button>

      {iosHint && (
        <div
          role="dialog"
          aria-label={t('ios.title')}
          className="fixed bottom-20 left-4 right-4 z-[95] rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-lg md:left-auto md:right-6 md:w-80"
        >
          <h3 className="text-sm font-semibold text-[var(--foreground)]">{t('ios.title')}</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-[var(--muted-foreground)]">
            <li>{t('ios.step1')}</li>
            <li>{t('ios.step2')}</li>
            <li>{t('ios.step3')}</li>
          </ol>
          <button
            onClick={() => setIosHint(false)}
            className="mt-3 w-full rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
          >
            {t('ios.done')}
          </button>
        </div>
      )}
    </>
  );
}
