'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Building2 } from '../../../components/lovable/icons';
import { PublicPageShell } from '../../../components/PublicPageShell';
import { SOURCES_ROWS } from '../../../lib/public-content';

/**
 * `/fontes` — paridade 1:1 com a Lovable LIVE
 * (`landmap-insight.lovable.app/fontes`, chunk `fontes-BjvUrJ1K.js`):
 * header Voltar → `/onboarding`, `section.mx-auto.max-w-5xl.px-6.py-16`,
 * eyebrow "Fontes", H1 "Consulta pública de fontes e atualizações", tabela
 * (Fonte/Categoria/Região/Frequência/Tipo/Status, badges de status
 * `inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium`), nota
 * administrativa, `<Footer />` 1:1.
 *
 * Dados: `lib/public-content.ts` (SOURCES_ROWS — mesmos valores da referência).
 */
export default function FontesPage() {
  const locale = useLocale();
  const lh = (p: string) => `/${locale}${p}`;

  return (
    <PublicPageShell backHref="/onboarding" maxWidth="5xl">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">Fontes</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Consulta pública de fontes e atualizações
        </h1>
        <p className="mt-4 max-w-2xl text-foreground/60">
          A LandMap processa, padroniza e cruza informações de diferentes fontes. A presença de uma
          fonte não significa que todos os dados estejam disponíveis para todas as regiões.
        </p>

        <div className="mt-10 overflow-hidden rounded-2xl border border-foreground/10">
          <table className="w-full text-sm">
            <thead className="bg-foreground/[0.03] text-left text-[11px] font-semibold uppercase tracking-widest text-foreground/50">
              <tr>
                <th className="px-4 py-3">Fonte</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Região</th>
                <th className="px-4 py-3">Frequência</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {SOURCES_ROWS.map((r) => (
                <tr key={r.fonte}>
                  <td className="px-4 py-3 font-medium">{r.fonte}</td>
                  <td className="px-4 py-3 text-foreground/70">{r.categoria}</td>
                  <td className="px-4 py-3 text-foreground/70">{r.regiao}</td>
                  <td className="px-4 py-3 text-foreground/70">{r.frequencia}</td>
                  <td className="px-4 py-3 text-foreground/70">{r.tipo}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        r.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {r.status === 'active' ? 'Ativa' : 'Em integração'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-8 text-xs leading-relaxed text-foreground/50">
          O registro de fontes é mantido pelo time de dados da LandMap. Nomes de terceiros são
          apresentados apenas quando existe autorização formal. Este conteúdo é editável pelo painel
          administrativo.
        </p>

        {/* Complemento LandMap (fora da referência — atalhos úteis, sem alterar o layout espelhado). */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={lh('/dashboard')}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--primary)] px-5 text-sm font-medium text-[var(--primary-foreground)] transition hover:bg-[var(--primary)]/90"
          >
            <Building2 className="h-4 w-4" />
            Abrir o mapa
          </Link>
          <Link
            href={lh('/cobertura')}
            className="inline-flex h-10 items-center rounded-lg border border-[var(--border)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)]"
          >
            Cobertura
          </Link>
        </div>
      </section>
    </PublicPageShell>
  );
}
