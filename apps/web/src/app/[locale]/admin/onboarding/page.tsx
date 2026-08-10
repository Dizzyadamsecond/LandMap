'use client';

import { RequireAuth } from '../../../../components/RequireAuth';
import { Zap, ArrowRight } from '../../../../components/lovable/icons';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface FunnelStep {
  name: string;
  users: number;
  conversionRate: number;
  dropoff: number;
}

function AdminOnboardingPageInner() {
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';

  const funnelSteps: FunnelStep[] = [
    { name: 'Signup', users: 1000, conversionRate: 100, dropoff: 0 },
    { name: 'Email Verified', users: 780, conversionRate: 78, dropoff: 22 },
    { name: 'Profile Completed', users: 620, conversionRate: 62, dropoff: 16 },
    { name: 'First Property View', users: 510, conversionRate: 51, dropoff: 11 },
    { name: 'First Favorite', users: 380, conversionRate: 38, dropoff: 13 },
    { name: 'App Active', users: 250, conversionRate: 25, dropoff: 13 },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Onboarding</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">Funnel</h1>
              <p className="mt-1 text-[var(--muted-foreground)]">Drops na jornada de onboarding</p>
            </div>
          </div>
          <Link
            href={`/${locale}/admin`}
            className="inline-flex items-center rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--muted)]"
          >
            Voltar
          </Link>
        </div>
      </header>

      <div className="space-y-3">
        {funnelSteps.map((step, idx) => (
          <div key={step.name}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[var(--foreground)]">{step.name}</span>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-[var(--foreground)] font-semibold">{step.users.toLocaleString('pt-BR')}</span>
                <span className="text-[var(--foreground)] font-semibold">{step.conversionRate}%</span>
                {step.dropoff > 0 && <span className="text-destructive">-{step.dropoff}%</span>}
              </div>
            </div>
            <div className="h-12 rounded-lg bg-[var(--muted)] overflow-hidden flex items-center">
              <div
                className="h-full bg-[var(--primary)] transition-all duration-300 flex items-center justify-center text-xs font-semibold text-[var(--primary-foreground)]"
                style={{ width: `${step.conversionRate}%` }}
              >
                {step.conversionRate > 15 && `${step.conversionRate}%`}
              </div>
            </div>
            {idx < funnelSteps.length - 1 && (
              <div className="mt-2 text-center">
                <ArrowRight className="h-4 w-4 inline text-[var(--muted-foreground)] rotate-90" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Análise de Drops</h3>
        <div className="mt-4 space-y-3">
          {funnelSteps.slice(1).map((step) => (
            <div key={step.name} className="flex items-center justify-between border-b border-[var(--border)] pb-2 last:border-0 last:pb-0">
              <span className="text-sm text-[var(--foreground)]">{step.name}</span>
              <span className="text-sm font-medium text-destructive">{step.dropoff}% dropoff</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Problemas Detectados</h3>
        <div className="mt-4 space-y-2 text-sm">
          <p className="text-[var(--muted-foreground)]">• Email verification tem 22% de drop — considere enviar reminder em 1h</p>
          <p className="text-[var(--muted-foreground)]">• Profile completion tem 16% de drop — UX pode ser simplificada</p>
          <p className="text-[var(--muted-foreground)]">• Activation (first favorite) tem 13% de drop — adicionar tutorial visual?</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminOnboardingPage() {
  return (
    <RequireAuth>
      <AdminOnboardingPageInner />
    </RequireAuth>
  );
}
