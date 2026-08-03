'use client';

import { useTranslations } from 'next-intl';
import { ProductPageShell } from '../../../components/ProductPageShell';
import { Card } from '@landmap/ui';

/**
 * /[locale]/sobre — página "Sobre", 1:1 com o padrão Lovable.
 * Hero (ProductPageShell) + 3 pilares reais + CTA para o mapa.
 */
export default function SobrePage() {
  const t = useTranslations('sobre');
  const cards = [t('f1'), t('f2'), t('f3')];

  return (
    <ProductPageShell eyebrow={t('eyebrow')} title={t('title')} description={t('description')}>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map((c, i) => (
          <Card key={i} className="h-full p-5">
            <p className="text-sm leading-relaxed text-[var(--foreground)]">{c}</p>
          </Card>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="font-display text-lg font-semibold">Nossa missão</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
          Levantar o território imobiliário brasileiro como dado aberto: preço por m²
          transparente, mapas de calor e IA para decisão — sem paywall e sem login.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="./map"
            className="inline-flex h-10 items-center rounded-lg bg-[var(--primary)] px-5 text-sm font-medium text-[var(--primary-foreground)] transition hover:bg-[var(--primary)]/90"
          >
            Abrir o mapa
          </a>
          <a
            href="./onboarding"
            className="inline-flex h-10 items-center rounded-lg border border-[var(--border)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)]"
          >
            Começar
          </a>
        </div>
      </div>
    </ProductPageShell>
  );
}
