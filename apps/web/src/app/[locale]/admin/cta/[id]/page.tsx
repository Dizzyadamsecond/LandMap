'use client';

import { RequireAuth } from '../../../../../components/RequireAuth';
import { ArrowLeft } from '../../../../../components/lovable/icons';
import Link from 'next/link';
import { useParams } from 'next/navigation';

function AdminCtaDrilldownPageInner() {
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';
  const ctaId = (params.id as string) || 'unknown';

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href={`/${locale}/admin/cta`} className="text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{ctaId}</h1>
          </div>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Análise detalhada de impressões e cliques</p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">Impressões</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">1.234</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">Cliques</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">145</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">CTR</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">11.7%</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Por Variante</h3>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="pb-2 text-left text-[var(--muted-foreground)]">Variante</th>
              <th className="pb-2 text-center text-[var(--muted-foreground)]">Impressões</th>
              <th className="pb-2 text-center text-[var(--muted-foreground)]">CTR</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[var(--border)]">
              <td className="py-3 text-[var(--foreground)]">control</td>
              <td className="py-3 text-center text-[var(--foreground)]">617</td>
              <td className="py-3 text-center text-[var(--foreground)]">9.2%</td>
            </tr>
            <tr>
              <td className="py-3 text-[var(--foreground)]">treatment_a</td>
              <td className="py-3 text-center text-[var(--foreground)]">617</td>
              <td className="py-3 text-center text-success font-semibold">14.2%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminCtaDrilldownPage() {
  return (
    <RequireAuth>
      <AdminCtaDrilldownPageInner />
    </RequireAuth>
  );
}
