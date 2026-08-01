'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPinned, ArrowRight } from '../../../components/lovable/icons';

export default function OnboardingPage() {
  const locale = useLocale();
  const router = useRouter();
  const lh = (p: string) => `/${locale}${p}`;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background px-6 py-6">
      <div className="flex items-center justify-between">
        <img
          src="/landmap-logo-transparent.png"
          alt="LandMap"
          className="h-10 w-auto object-contain"
        />
        <button
          type="button"
          onClick={() => router.replace(lh('/map'))}
          className="text-sm text-foreground/60 transition hover:text-foreground"
        >
          Pular
        </button>
      </div>

      <main className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-8 grid h-28 w-28 place-items-center rounded-3xl bg-primary/10">
          <MapPinned className="h-14 w-14 text-primary" aria-hidden />
        </div>
        <h1 className="text-3xl font-bold leading-tight tracking-tight">Conheça o LandMap</h1>
        <div className="mt-6 max-w-sm text-left">
          <h2 className="text-lg font-semibold">Todo o Brasil no mapa</h2>
          <p className="mt-2 text-sm text-foreground/60">
            Explore terrenos e regiões nas principais cidades com preço por m², filtros e camadas de calor.
          </p>
        </div>
      </main>

      <div className="mb-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => router.replace(lh('/map'))}
          className="inline-flex h-12 w-full items-center justify-center gap-1 rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          Continuar
          <ArrowRight className="ml-1 h-4 w-4" />
        </button>
        <Link href={lh('/auth')} className="text-center text-sm text-foreground/60 hover:text-foreground">
          Já tenho conta
        </Link>
      </div>
    </div>
  );
}
