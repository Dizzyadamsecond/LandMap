'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from '../../../../components/lovable/icons';

export default function AdminTeamPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';

  const cards = [
    { title: 'Agentes', desc: 'Time e automações.', href: `/${locale}/admin/agents` },
    { title: 'Webhooks', desc: 'Integrações e eventos.', href: `/${locale}/admin/webhooks` },
    { title: 'Auditoria', desc: 'Logs e controles.', href: `/${locale}/admin/audit` },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-[var(--muted-foreground)]">Administração</p>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Time</h1>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.title} href={card.href} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--primary)]">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[var(--foreground)]">{card.title}</h2>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{card.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)]" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
