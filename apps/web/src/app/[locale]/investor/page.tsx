'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Card, Button, buttonVariants } from '@landmap/ui';
import { LandMapWordmark } from '../../../components/lovable/icons';

export default function InvestorPage() {
  const t = useTranslations('InvestorPage');
  const locale = useLocale();
  const lh = (p: string) => `/${locale}${p}`;

  return (
    <main className="space-y-12">
      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <LandMapWordmark className="mb-6 h-8 w-auto" />
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            {t('hero.title')}
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            {t('hero.description')}
          </p>
          <div className="mt-6 flex flex-wrap gap-4 justify-center">
            <Link href={lh('/plans')} className={buttonVariants({ variant: 'outline' })}>
              {t('hero.plansButton')}
            </Link>
            <a href="mailto:invest@landmap.com.br" className={buttonVariants()}>
              {t('hero.contactButton')}
            </a>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                {t('about.title')}
              </h2>
              <p className="text-muted-foreground">
                {t('about.description')}
              </p>
              <p className="text-muted-foreground">
                {t('about.mission')}
              </p>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                {t('about.vision')}
              </h2>
              <p className="text-muted-foreground">
                {t('about.visionDescription')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-12 bg-muted">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-foreground mb-8 text-center">
            {t('metrics.title')}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Metric 1 */}
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <span className="text-primary font-bold text-2xl">3M+</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">
                    {t('metrics.properties')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('metrics.propertiesDesc')}
                  </p>
                </div>
              </div>
            </Card>
            {/* Metric 2 */}
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <span className="text-primary font-bold text-2xl">20+</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">
                    {t('metrics.cities')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('metrics.citiesDesc')}
                  </p>
                </div>
              </div>
            </Card>
            {/* Metric 3 */}
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <span className="text-primary font-bold text-2xl">95%</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">
                    {t('metrics.accuracy')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('metrics.accuracyDesc')}
                  </p>
                </div>
              </div>
            </Card>
            {/* Metric 4 */}
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <span className="text-primary font-bold text-2xl">10K+</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">
                    {t('metrics.users')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('metrics.usersDesc')}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Investment Highlights */}
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-foreground mb-8 text-center">
            {t('highlights.title')}
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-3">
                {t('highlights.traction')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('highlights.tractionDesc')}
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-3">
                {t('highlights.technology')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('highlights.technologyDesc')}
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-3">
                {t('highlights.team')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('highlights.teamDesc')}
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-3">
                {t('highlights.model')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('highlights.modelDesc')}
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-3">
                {t('highlights.impact')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('highlights.impactDesc')}
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-3">
                {t('highlights.exit')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('highlights.exitDesc')}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-foreground mb-8 text-center">
            {t('documents.title')}
          </h2>
          <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
            {t('documents.description')}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Document 1 */}
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <span className="text-primary">📊</span>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">
                    {t('documents.financialReport')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('documents.financialReportDesc')}
                  </p>
                  <Link href="#" className="text-primary hover:underline">
                    {t('documents.download')}
                  </Link>
                </div>
              </div>
            </Card>
            {/* Document 2 */}
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <span className="text-primary">📄</span>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">
                    {t('documents.presentation')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('documents.presentationDesc')}
                  </p>
                  <Link href="#" className="text-primary hover:underline">
                    {t('documents.download')}
                  </Link>
                </div>
              </div>
            </Card>
            {/* Document 3 */}
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <span className="text-primary">📑</span>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">
                    {t('documents.legal')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('documents.legalDesc')}
                  </p>
                  <Link href="#" className="text-primary hover:underline">
                    {t('documents.download')}
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 bg-primary/5">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            {t('cta.title')}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            {t('cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={lh('/plans')} className={buttonVariants()}>
              {t('cta.seePlans')}
            </Link>
            <a href="mailto:invest@landmap.com.br" className={buttonVariants({ variant: 'outline' })}>
              {t('cta.contact')}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}