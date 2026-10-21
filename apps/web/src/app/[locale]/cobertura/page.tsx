'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Building2, MapPin } from '../../../components/lovable/icons';
import { PublicPageShell } from '../../../components/PublicPageShell';
import { COVERAGE_ROWS, COVERAGE_STATUS } from '../../../lib/public-content';

/**
 * `/cobertura` — paridade 1:1 com a Lovable LIVE
 * (`landmap-insight.lovable.app/cobertura`, chunk `cobertura-D1TMNJ3t.js`):
 * header Voltar → `/onboarding`, `section.mx-auto.max-w-5xl.px-6.py-16`,
 * eyebrow "Cobertura", H1 "Onde a LandMap possui dados disponíveis",
 * legenda de status (dots `h-2 w-2 rounded-full`: emerald/amber/sky/foreground),
 * tabela (Cidade/UF/Status/Tipos/Última atualização, thead uppercase,
 * `tbody.divide-y`, cidade com ícone `h-4 w-4 text-foreground/40`, status com
 * dot + label, tipos com `·`, atualização com `—` quando ausente), nota
 * administrativa, `<Footer />` 1:1.
 *
 * Dados: `lib/public-content.ts` (COVERAGE_ROWS/COVERAGE_STATUS — mesmos
 * valores da referência).
 */
export default function CoberturaPage() {
  const locale = useLocale();
  const lh = (p: string) => `/${locale}${p}`;

  return (
    <PublicPageShell backHref="/onboarding" maxWidth="5xl">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">Cobertura</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Onde a LandMap possui dados disponíveis
        </h1>
        <p className="mt-4 max-w-2xl text-foreground/60">
          A cobertura varia conforme a disponibilidade, atualização e qualidade das fontes de cada
          município. Priorizamos profundidade sobre extensão — cada praça entra progressivamente,
          camada por camada.
        </p>

        <div className="mt-8 flex flex-wrap gap-4 text-xs text-foreground/60">
          {Object.values(COVERAGE_STATUS).map((s) => (
            <span key={s.label} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${s.dot}`} />
              {s.label}
            </span>
          ))}
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-foreground/10">
          <table className="w-full text-sm">
            <thead className="bg-foreground/[0.03] text-left text-[11px] font-semibold uppercase tracking-widest text-foreground/50">
              <tr>
                <th className="px-4 py-3">Cidade</th>
                <th className="px-4 py-3">UF</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tipos de dado disponíveis</th>
                <th className="px-4 py-3">Última atualização</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {COVERAGE_ROWS.map((r) => {
                const st = COVERAGE_STATUS[r.status];
                return (
                  <tr key={`${r.city}-${r.uf}`} className="bg-background">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-medium">
                        <MapPin className="h-4 w-4 text-foreground/40" />
                        {r.city}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground/60">{r.uf}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${st.dot}`} />
                        <span className="text-foreground/80">{st.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground/70">
                      {r.dataTypes.length > 0 ? r.dataTypes.join(' · ') : '—'}
                    </td>
                    <td className="px-4 py-3 text-foreground/60">{r.updatedAt ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-8 text-xs leading-relaxed text-foreground/50">
          A tabela é mantida pelo time de dados da LandMap e pode ser atualizada pelo painel
          administrativo. Municípios listados como &ldquo;Em breve&rdquo; ainda não possuem dados
          exibidos na plataforma.
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
            href={lh('/fontes')}
            className="inline-flex h-10 items-center rounded-lg border border-[var(--border)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)]"
          >
            Fontes de dados
          </Link>
        </div>
      </section>
    </PublicPageShell>
  );
}
