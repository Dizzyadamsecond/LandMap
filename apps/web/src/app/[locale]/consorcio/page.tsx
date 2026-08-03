'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, Button, buttonVariants } from '@landmap/ui';
import { LandMapWordmark } from '../../../components/lovable/icons';

export default function ConsorcioPage() {
  const t = useTranslations('ConsorcioPage');

  return (
    <div className="mx-auto max-w-4xl py-16 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <LandMapWordmark className="h-8 w-auto mb-4" />
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
          {t('hero.title')}
        </h1>
        <p className="mt-4 text-xl text-[var(--muted-foreground)]">
          {t('hero.subtitle')}
        </p>
      </div>

      {/* How it works */}
      <section className="mb-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((step) => (
          <Card
            key={step}
            className="border-[var(--border)] bg-[var(--background)]"
          >
            <div className="flex items-start space-x-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
                {step}
              </div>
              <div>
                <h3 className="font-semibold text-[var(--foreground)]">
                  {t(`step${step}.title`)}
                </h3>
                <p className="mt-2 text-[var(--muted-foreground)]">
                  {t(`step${step}.description`)}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </section>

      {/* Benefits */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-[var(--foreground)]">
          {t('benefits.title')}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: '🏡',
              title: t('benefits.access.title'),
              description: t('benefits.access.description'),
            },
            {
              icon: '💰',
              title: t('benefits.finance.title'),
              description: t('benefits.finance.description'),
            },
            {
              icon: '📈',
              title: t('benefits.growth.title'),
              description: t('benefits.growth.description'),
            },
          ].map((benefit) => (
            <Card
              key={benefit.title}
              className="border-[var(--border)] bg-[var(--background)] p-6"
            >
              <div className="flex items-start space-x-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--accent)]/10 text-[var(--accent)] shrink-0">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--foreground)]">{benefit.title}</h3>
                  <p className="mt-2 text-[var(--muted-foreground)]">{benefit.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Call to action */}
      <div className="bg-[var(--background)]/50 rounded-xl p-8 text-center">
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-[var(--foreground)]">
          {t('cta.title')}
        </h2>
        <p className="mb-6 text-[var(--muted-foreground)] max-w-2xl mx-auto">
          {t('cta.description')}
        </p>
        <div className="flex flex-col sm:flex-row sm:space-x-4">
          <Button
            variant="default"
            className="flex-1 sm:flex-none"
            onClick={() => alert(t('cta.button1'))}
          >
            {t('cta.button1')}
          </Button>
          <Button
            variant="ghost"
            className="flex-1 sm:flex-none"
            onClick={() => alert(t('cta.button2'))}
          >
            {t('cta.button2')}
          </Button>
        </div>
      </div>
    </div>
  );
}
