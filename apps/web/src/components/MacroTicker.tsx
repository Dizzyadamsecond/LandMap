'use client';

import { TrendingUp, TrendingDown, Activity, RefreshCw, Radio } from './lovable/icons';
import { useMacro, type MacroIndicators } from '../lib/useMacro';

function fmtPct(v: number, digits = 2): string {
  return `${v.toFixed(digits).replace('.', ',')}%`;
}

function fmtBRL(v: number): string {
  return `R$ ${v.toFixed(2).replace('.', ',')}`;
}

function Item({
  label,
  value,
  tone = 'neutral',
  icon,
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'up' | 'down';
  icon?: React.ReactNode;
}) {
  const toneCls =
    tone === 'up'
      ? 'text-[var(--success)]'
      : tone === 'down'
        ? 'text-[var(--destructive)]'
        : 'text-[var(--foreground)]';
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2">
      <span className="text-[var(--muted-foreground)]">{icon}</span>
      <div className="leading-tight">
        <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
          {label}
        </p>
        <p className={`font-display text-sm font-bold ${toneCls}`}>{value}</p>
      </div>
    </div>
  );
}

export function MacroTicker({ variant = 'bar' }: { variant?: 'bar' | 'grid' }) {
  const { loading, live, indicators, error } = useMacro();

  if (!indicators) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Carregando indicadores…' : 'Indicadores indisponíveis'}
      </div>
    );
  }

  const i = indicators;
  const hostCls =
    variant === 'grid'
      ? 'grid grid-cols-2 gap-2 sm:grid-cols-4'
      : 'flex flex-wrap items-center gap-2';

  return (
    <div className={hostCls}>
      <Item
        label="IPCA (mês)"
        value={fmtPct(i.ipca.value)}
        icon={<Activity className="h-3.5 w-3.5" />}
      />
      <Item
        label="Selic"
        value={fmtPct(i.selic.value)}
        icon={<TrendingUp className="h-3.5 w-3.5" />}
      />
      <Item
        label="CDI"
        value={fmtPct(i.cdi.value)}
        icon={<TrendingUp className="h-3.5 w-3.5" />}
      />
      <Item
        label="USD/BRL"
        value={fmtBRL(i.usd.value)}
        tone={i.usd.varPct >= 0 ? 'up' : 'down'}
        icon={
          i.usd.varPct >= 0 ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )
        }
      />
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          live
            ? 'bg-[var(--success)]/10 text-[var(--success)]'
            : 'bg-[var(--warning)]/10 text-[var(--warning)]'
        }`}
        title={live ? 'Dados ao vivo (BCB + awesomeapi)' : 'Último valor conhecido (fallback)'}
      >
        <Radio className="h-3 w-3" />
        {live ? 'AO VIVO' : 'CACHE'}
        {error ? ' · retransmitindo' : ''}
      </span>
    </div>
  );
}

export default MacroTicker;
