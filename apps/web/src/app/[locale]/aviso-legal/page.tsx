'use client';

import { AlertTriangle as TriangleAlert } from '../../../components/lovable/icons';
import { PublicPageShell } from '../../../components/PublicPageShell';

/**
 * `/aviso-legal` — paridade 1:1 com a Lovable LIVE
 * (`landmap-insight.lovable.app/aviso-legal`, chunk `aviso-legal-D355Qgyi.js`):
 * header Voltar → `/onboarding`, `article.mx-auto.max-w-3xl.px-6.py-16`,
 * eyebrow "Legal", H1 "Aviso legal", callout âmbar com o disclaimer principal,
 * 4 seções em `div.prose...space-y-6`, `<Footer />` 1:1.
 */
const SECTIONS: { title: string; body: string }[] = [
  {
    title: 'Escopo',
    body: 'A LandMap organiza dados públicos e de mercado para apresentar indicadores territoriais. Nenhum indicador exibido constitui recomendação individualizada, laudo pericial, avaliação oficial de imóvel ou parecer profissional habilitado.',
  },
  {
    title: 'Limitações',
    body: 'A profundidade dos dados varia por município e por camada. A plataforma sinaliza níveis de confiança e informa a ausência de amostra suficiente quando aplicável. Decisões tomadas com base no conteúdo são de responsabilidade exclusiva do usuário.',
  },
  {
    title: 'Projeções',
    body: 'Projeções apresentam cenários (conservador, base e otimista) e não são garantias de valorização. Cenários dependem de premissas que podem se alterar sem aviso prévio.',
  },
  {
    title: 'Consulta profissional',
    body: 'Recomendamos que decisões de investimento imobiliário sejam apoiadas por profissionais habilitados — corretores, engenheiros, advogados, contadores e consultores financeiros — considerando o perfil e a realidade específica do usuário.',
  },
];

export default function AvisoLegalPage() {
  return (
    <PublicPageShell backHref="/onboarding">
      <article className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">Legal</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Aviso legal</h1>

        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-6">
          <TriangleAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-[15px] leading-relaxed text-foreground/85">
            A LandMap é uma plataforma de inteligência territorial e organização de dados. As
            informações apresentadas possuem caráter informativo e não representam garantia de
            valorização, recomendação individual de investimento, avaliação oficial de imóvel ou
            substituição de análises jurídicas, ambientais, urbanísticas e financeiras.
          </p>
        </div>

        <div className="prose prose-neutral dark:prose-invert mt-10 max-w-none space-y-6 text-[15px] leading-relaxed text-foreground/80">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="text-xl font-semibold text-foreground">{s.title}</h2>
              <p>{s.body}</p>
            </section>
          ))}
        </div>
      </article>
    </PublicPageShell>
  );
}
