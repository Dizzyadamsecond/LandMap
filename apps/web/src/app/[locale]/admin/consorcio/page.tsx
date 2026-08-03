'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, Button, Input, Badge } from '@landmap/ui';
import { LandMapWordmark } from '../../../../components/lovable/icons';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ConsorcioPage() {
  const t = useTranslations('ConsorcioPage');

  const [credit, setCredit] = useState(150000);
  const [months, setMonths] = useState(120);
  const [adminPct, setAdminPct] = useState(0.35); // % a.m. sobre o saldo
  const [bidPct, setBidPct] = useState(20); // % da cota como lance

  const sim = useMemo(() => {
    const creditV = Number.isFinite(credit) && credit > 0 ? credit : 0;
    const monthsV = Number.isFinite(months) && months > 0 ? months : 1;
    const adminV = Number.isFinite(adminPct) ? adminPct / 100 : 0;
    const bidV = Number.isFinite(bidPct) ? bidPct / 100 : 0;

    // Administração: taxa mensal sobre a parcela (modelo padrão de consórcio).
    const baseInstallment = creditV / monthsV;
    const adminMonthly = baseInstallment * adminV;
    const installment = baseInstallment + adminMonthly;
    const totalAdmin = adminMonthly * monthsV;
    // Lance antecipa a contemplação: reduz o saldo financiado da contemplação.
    const contemplation = creditV * bidV;

    return {
      credit: creditV,
      installment,
      totalAdmin,
      contemplation,
    };
  }, [credit, months, adminPct, bidPct]);

  return (
    <div className="mx-auto max-w-4xl py-16 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <LandMapWordmark className="h-8 w-auto mb-4" />
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
          {t('hero.title')}
        </h1>
        <p className="mt-4 text-xl text-[var(--muted-foreground)]">{t('hero.subtitle')}</p>
      </div>

      {/* How it works */}
      <section className="mb-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((step) => (
          <Card key={step} className="border-[var(--border)] bg-[var(--background)]">
            <div className="flex items-start space-x-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
                {step}
              </div>
              <div>
                <h3 className="font-semibold text-[var(--foreground)]">{t(`step${step}.title`)}</h3>
                <p className="mt-2 text-[var(--muted-foreground)]">{t(`step${step}.description`)}</p>
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
          {['access', 'finance', 'growth'].map((key) => (
            <Card key={key} className="border-[var(--border)] bg-[var(--background)] p-6">
              <h3 className="font-semibold text-[var(--foreground)]">{t(`benefits.${key}.title`)}</h3>
              <p className="mt-2 text-[var(--muted-foreground)]">{t(`benefits.${key}.description`)}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Simulator (replaces the old alert() stub) */}
      <section className="mb-16">
        <Card className="border-[var(--border)] bg-[var(--background)] p-6 sm:p-8">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">{t('simulator.title')}</h2>
          <p className="mt-2 text-[var(--muted-foreground)]">{t('simulator.subtitle')}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">{t('simulator.creditLabel')}</span>
              <Input
                type="number"
                min={0}
                step={5000}
                value={credit}
                onChange={(e) => setCredit(Number(e.target.value))}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">{t('simulator.monthsLabel')}</span>
              <Input
                type="number"
                min={1}
                step={1}
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">{t('simulator.adminLabel')}</span>
              <Input
                type="number"
                min={0}
                step={0.05}
                value={adminPct}
                onChange={(e) => setAdminPct(Number(e.target.value))}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">{t('simulator.entryLabel')}</span>
              <Input
                type="number"
                min={0}
                max={100}
                step={1}
                value={bidPct}
                onChange={(e) => setBidPct(Number(e.target.value))}
              />
            </label>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-xs text-[var(--muted-foreground)]">{t('simulator.credit')}</p>
              <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{BRL.format(sim.credit)}</p>
            </div>
            <div className="rounded-lg border border-[var(--ring)] bg-[var(--accent)]/40 p-4">
              <p className="text-xs text-[var(--muted-foreground)]">{t('simulator.installment')}</p>
              <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{BRL.format(sim.installment)}</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-xs text-[var(--muted-foreground)]">{t('simulator.contemplation')}</p>
              <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{BRL.format(sim.contemplation)}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <Badge variant="outline">{t('simulator.totalAdmin')}: {BRL.format(sim.totalAdmin)}</Badge>
          </div>

          <p className="mt-4 text-sm text-[var(--muted-foreground)]">{t('simulator.resultHint')}</p>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]/70">{t('simulator.disclaimer')}</p>
        </Card>
      </section>

      {/* Call to action */}
      <div className="bg-[var(--background)]/50 rounded-xl p-8 text-center">
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-[var(--foreground)]">{t('cta.title')}</h2>
        <p className="mb-6 text-[var(--muted-foreground)] max-w-2xl mx-auto">{t('cta.description')}</p>
        <div className="flex flex-col sm:flex-row sm:space-x-4">
          <Button
            variant="default"
            className="flex-1 sm:flex-none"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
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
