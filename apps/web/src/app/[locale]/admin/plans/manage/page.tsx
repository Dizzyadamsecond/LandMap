'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from '../../../../../components/lovable/icons';

export default function AdminPlansManagePage() {
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-[var(--muted-foreground)]">Administração</p>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Gerenciar planos</h1>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link href={`/${locale}/plans/manage`} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--primary)]">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Planos públicos</h2>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">Abrir página de planos.</p>
            </div>
            <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)]" />
          </div>
        </Link>
      </div>
    </div>
  );
}
