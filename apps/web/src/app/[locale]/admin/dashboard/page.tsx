'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight } from '../../../../components/lovable/icons';

export default function AdminDashboardPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-[var(--muted-foreground)]">Carregando dashboard...</div>;
  if (error) return <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-destructive">{error}</div>;

  const cards = [
    { title: 'Terrenos', desc: 'Catálogo e validação de imóveis.', href: `/${locale}/admin/properties` },
    { title: 'Leads', desc: 'Pipeline e pontuação.', href: `/${locale}/admin/leads` },
    { title: 'Visitas', desc: 'Agendamentos e confirmações.', href: `/${locale}/admin/visits` },
    { title: 'Propostas', desc: 'Propostas e follow-ups.', href: `/${locale}/admin/proposals` },
    { title: 'Agentes', desc: 'Time e automações.', href: `/${locale}/admin/agents` },
    { title: 'Analytics', desc: 'Tráfego e conversões.', href: `/${locale}/admin/analytics` },
    { title: 'CTAs', desc: 'Impressões, cliques, variantes.', href: `/${locale}/admin/cta` },
    { title: 'Webhooks', desc: 'Integrações e eventos.', href: `/${locale}/admin/webhooks` },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-[var(--muted-foreground)]">Administração</p>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Dashboard</h1>
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
