'use client';

import {
  AlertTriangle as TriangleAlert,
  Database,
  Funnel,
  Gauge,
  Layers,
  RefreshCw,
  Ruler,
  Scale,
  Sparkles,
} from '../../../components/lovable/icons';
import { PublicPageShell } from '../../../components/PublicPageShell';
import { COMPANY, METHODOLOGY_SECTIONS } from '../../../lib/public-content';

/**
 * `/metodologia` — paridade 1:1 com a Lovable LIVE
 * (`landmap-insight.lovable.app/metodologia`, chunk `metodologia-CvnfjrHg.js`):
 * header Voltar → `/onboarding`, `article.mx-auto.max-w-3xl.px-6.py-16`,
 * eyebrow "Metodologia", H1 "Metodologia LandMap", box versão/atualização
 * (`sm:grid-cols-2`), 10 seções com ícone (`grid h-9 w-9 ... bg-primary/10`),
 * box Observação âmbar, `<Footer />` 1:1.
 *
 * Copy das seções: `lib/public-content.ts` (METHODOLOGY_SECTIONS — mesmos
 * textos da referência). Ícones pareados por posição: coletados=database,
 * limpos=funnel, preço-m²=ruler, média-mediana=scale, anormais=triangle-alert,
 * mínimos=gauge, confiança=sparkles, opportunity=layers,
 * limitações=triangle-alert, frequência=refresh-cw.
 */
const ICONS = [Database, Funnel, Ruler, Scale, TriangleAlert, Gauge, Sparkles, Layers, TriangleAlert, RefreshCw];

export default function MetodologiaPage() {
  return (
    <PublicPageShell backHref="/onboarding">
      <article className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">Metodologia</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Metodologia LandMap</h1>
        <p className="mt-4 text-foreground/60">
          Este documento descreve como a LandMap organiza dados territoriais e constrói
          indicadores. A metodologia é revisada periodicamente e evolui conforme novas fontes são
          integradas.
        </p>

        <div className="mt-8 grid gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground/50">
              Versão da metodologia
            </p>
            <p className="mt-1 text-lg font-semibold">{COMPANY.methodologyVersion}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground/50">
              Última atualização
            </p>
            <p className="mt-1 text-lg font-semibold">{COMPANY.methodologyUpdatedAt}</p>
          </div>
        </div>

        <div className="mt-12 space-y-8">
          {METHODOLOGY_SECTIONS.map((s, i) => {
            const Icon = ICONS[i] ?? Database;
            return (
              <section
                key={s.title}
                className="rounded-2xl border border-foreground/10 bg-background p-6"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="font-display text-lg font-semibold">{s.title}</h2>
                </div>
                <p className="text-[15px] leading-relaxed text-foreground/75">{s.body}</p>
              </section>
            );
          })}
        </div>

        <div className="mt-12 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            Observação
          </p>
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">
            Os fatores e critérios descritos acima constituem a estrutura da metodologia. Pesos,
            fórmulas e limites específicos são revisados trimestralmente e não são apresentados
            como definitivos até validação. Este documento pode ser atualizado pelo painel
            administrativo da LandMap.
          </p>
        </div>
      </article>
    </PublicPageShell>
  );
}
