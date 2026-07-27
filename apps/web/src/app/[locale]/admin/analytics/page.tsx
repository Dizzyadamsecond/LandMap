'use client';

import { useEffect, useMemo, useState } from 'react';
import { RequireAuth } from '../../../../components/RequireAuth';
import { LineChart, Search, Activity, TrendingUp, MapPin } from '../../../../components/lovable/icons';

type PlausibleRow = { dimensions?: string[]; metrics?: number[] };
type AnalyticsPayload = {
  configured: boolean;
  summary?: { results?: PlausibleRow[] } | null;
  topPages?: { results?: PlausibleRow[] } | null;
  referrers?: { results?: PlausibleRow[] } | null;
  entryPages?: { results?: PlausibleRow[] } | null;
  funnel?: {
    totals?: { signup?: number; activation?: number; checkout?: number; churn?: number };
    conversion?: {
      signupToActivation?: number | null;
      activationToCheckout?: number | null;
      signupToCheckout?: number | null;
    };
  } | null;
};

function fmtInt(value: number | undefined) {
  return new Intl.NumberFormat('pt-BR').format(value ?? 0);
}

function fmtPct(value: number | null | undefined) {
  if (value == null) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <p className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">{hint}</p>}
    </div>
  );
}

function ListCard({
  title,
  items,
  empty,
}: {
  title: string;
  items: Array<{ label: string; value: string }>;
  empty: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-2 last:border-0 last:pb-0"
            >
              <span className="min-w-0 truncate text-sm text-[var(--foreground)]">{item.label}</span>
              <span className="shrink-0 text-sm text-[var(--muted-foreground)]">{item.value}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">{empty}</p>
        )}
      </div>
    </div>
  );
}

function AdminAnalyticsPageInner() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/analytics', { cache: 'no-store' })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const summary = data?.summary?.results?.[0]?.metrics ?? [];
  const topPages = useMemo(
    () =>
      (data?.topPages?.results ?? []).slice(0, 6).map((row, idx) => ({
        label:
          row.dimensions?.[0] ??
          [`/`, `/map`, `/plans`, `/auth`, `/pricing`, `/dashboard`][idx] ??
          `Page ${idx + 1}`,
        value: fmtInt(row.metrics?.[0]),
      })),
    [data],
  );
  const referrers = useMemo(
    () =>
      (data?.referrers?.results ?? []).slice(0, 6).map((row, idx) => ({
        label: row.dimensions?.[0] ?? `Referrer ${idx + 1}`,
        value: fmtInt(row.metrics?.[0]),
      })),
    [data],
  );
  const entryPages = useMemo(
    () =>
      (data?.entryPages?.results ?? []).slice(0, 6).map((row, idx) => ({
        label:
          row.dimensions?.[0] ??
          [`/`, `/map`, `/auth`, `/pricing`, `/plans`, `/dashboard`][idx] ??
          `Entrada ${idx + 1}`,
        value: fmtInt(row.metrics?.[0]),
      })),
    [data],
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-8 w-56 animate-pulse rounded bg-[var(--muted)]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--muted)]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--primary)]">
          <LineChart className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--primary)]">Admin Intelligence</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">Analytics + SEO</h1>
          <p className="mt-1 text-[var(--muted-foreground)]">
            Plausible, funil e páginas que trazem tráfego e conversão.
          </p>
        </div>
      </header>

      {!data?.configured && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Plausible ainda não está configurado. Defina `PLAUSIBLE_STATS_API_KEY` e `PLAUSIBLE_SITE_ID` ou `PLAUSIBLE_DOMAIN`.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Visitantes 30d" value={fmtInt(summary[0])} hint="Plausible visitors" />
        <StatCard label="Pageviews 30d" value={fmtInt(summary[1])} hint="Plausible pageviews" />
        <StatCard label="Bounce rate" value={fmtPct(summary[2])} hint="Plausible bounce_rate" />
        <StatCard label="Duração média" value={summary[3] ? `${Math.round(summary[3] / 60)} min` : '—'} hint="Plausible visit_duration" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ListCard title="Top pages" items={topPages} empty="Sem tráfego suficiente." />
        <ListCard title="Top referrers" items={referrers} empty="Sem referrers no período." />
        <ListCard title="Entry pages" items={entryPages} empty="Sem entradas no período." />
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Funil</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <StatCard label="Signups" value={fmtInt(data?.funnel?.totals?.signup)} />
            <StatCard label="Activation" value={fmtInt(data?.funnel?.totals?.activation)} />
            <StatCard label="Checkout" value={fmtInt(data?.funnel?.totals?.checkout)} />
            <StatCard label="Churn" value={fmtInt(data?.funnel?.totals?.churn)} />
          </div>
          <div className="mt-4 space-y-2 text-sm text-[var(--muted-foreground)]">
            <p>Signup → Activation: {fmtPct(data?.funnel?.conversion?.signupToActivation)}</p>
            <p>Activation → Checkout: {fmtPct(data?.funnel?.conversion?.activationToCheckout)}</p>
            <p>Signup → Checkout: {fmtPct(data?.funnel?.conversion?.signupToCheckout)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">SEO do site</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-4">
              <p className="text-[11px] text-[var(--muted-foreground)]">Landing principal</p>
              <p className="mt-1 font-medium">/pt-BR</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-4">
              <p className="text-[11px] text-[var(--muted-foreground)]">Fluxo de entrada</p>
              <p className="mt-1 font-medium">/map · /plans · /auth</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-4">
              <p className="text-[11px] text-[var(--muted-foreground)]">Sinal de conversão</p>
              <p className="mt-1 font-medium">CTA, mapa e cadastro</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-4">
              <p className="text-[11px] text-[var(--muted-foreground)]">Próximo passo</p>
              <p className="mt-1 font-medium">Conectar Search Console</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Eventos-chave</h3>
          <div className="mt-4 space-y-3 text-sm">
            {[
              ['Mapa aberto', 'map_view', MapPin],
              ['Plano escolhido', 'plan_selected', TrendingUp],
              ['Intenção de compra', 'purchase_intent', Activity],
              ['Lead criado', 'lead_created', Search],
              ['Cadastro concluído', 'signup', LineChart],
            ].map(([label, evt, Icon]) => (
              <div
                key={evt as string}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--muted)] px-4 py-3"
              >
                <span className="flex items-center gap-2">
                  {Icon && <Icon className="h-4 w-4 text-[var(--primary)]" />}
                  {label as string}
                </span>
                <code className="text-[11px] text-[var(--muted-foreground)]">{evt as string}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <RequireAuth>
      <AdminAnalyticsPageInner />
    </RequireAuth>
  );
}
