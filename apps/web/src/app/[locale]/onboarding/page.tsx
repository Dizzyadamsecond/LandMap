'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { MapPinned, ArrowRight } from '../../../components/lovable/icons';

export default function OnboardingPage() {
  const locale = useLocale();
  const router = useRouter();
  const lh = (p: string) => `/${locale}${p}`;
  const [started, setStarted] = useState(false);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background px-6 py-6">
      <div className="flex items-center">
        <img
          src="/landmap-logo-transparent.png"
          alt="LandMap"
          className="h-10 w-auto object-contain"
        />
      </div>

      <main className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-8 grid h-28 w-28 place-items-center rounded-3xl bg-primary/10">
          <MapPinned className="h-14 w-14 text-primary" aria-hidden />
        </div>
        <h1 className="text-3xl font-bold leading-tight tracking-tight">Todo o Brasil no mapa</h1>
        <p className="mt-4 max-w-sm text-base text-foreground/60">
          Abra o mapa para ver camadas, score e heatmap ao vivo por bairro.
        </p>
      </main>

      <div className="mb-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => router.replace(lh('/map'))}
          className="inline-flex h-12 w-full items-center justify-center gap-1 rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          Começar no mapa
          <ArrowRight className="ml-1 h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
