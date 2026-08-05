'use client';

import { ShieldCheck, Check } from '../../../components/lovable/icons';
import { ProductPageShell } from '../../../components/ProductPageShell';
import { Reveal } from '../../../components/Motion';
import { Card } from '@landmap/ui';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: 'Aviso legal',
    body: 'A LandMap é uma plataforma de inteligência territorial e organização de dados. As informações apresentadas possuem caráter informativo e não representam garantia de valorização, recomendação individual de investimento, avaliação oficial de imóvel ou substituição de análises jurídicas, ambientais, urbanísticas e financeiras.',
  },
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
    <ProductPageShell
      backHref="/map"
      eyebrow={<><ShieldCheck className="h-3 w-3" /> Aviso legal</>}
      title="Aviso Legal"
      description="Termos de uso da plataforma LandMap e limitações de responsabilidade."
    >
      <section className="space-y-3">
        {SECTIONS.map((s) => (
          <Reveal key={s.title}>
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                  <Check className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-[var(--foreground)]">{s.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--muted-foreground)]">{s.body}</p>
                </div>
              </div>
            </Card>
          </Reveal>
        ))}
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href="./terms"
          className="inline-flex h-10 items-center rounded-lg border border-[var(--border)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)]"
        >
          Termos de uso
        </a>
        <a
          href="./privacy"
          className="inline-flex h-10 items-center rounded-lg border border-[var(--border)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)]"
        >
          Privacidade
        </a>
      </div>
    </ProductPageShell>
  );
}
