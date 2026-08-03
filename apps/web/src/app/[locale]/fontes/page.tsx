'use client';

import { useTranslations } from 'next-intl';
import { ProductPageShell } from '../../../components/ProductPageShell';
import { Card } from '@landmap/ui';

/**
 * /[locale]/fontes — Fontes de Dados, 1:1 com o padrão Lovable.
 * Hero + 3 origens reais + CTA para o mapa.
 */
export default function FontesPage() {
  const t = useTranslations('fontes');
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
        <h2 className="font-display text-lg font-semibold">Explore os dados</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
          Todo o catálogo alimenta o mapa de inteligência e os indicadores por
          região, recalculados periodicamente.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="./map"
            className="inline-flex h-10 items-center rounded-lg bg-[var(--primary)] px-5 text-sm font-medium text-[var(--primary-foreground)] transition hover:bg-[var(--primary)]/90"
          >
            Abrir o mapa
          </a>
          <a
            href="./regions"
            className="inline-flex h-10 items-center rounded-lg border border-[var(--border)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)]"
          >
            Ver regiões
          </a>
        </div>
      </div>
    </ProductPageShell>
  );
}
