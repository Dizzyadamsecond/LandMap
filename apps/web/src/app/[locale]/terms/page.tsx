'use client';

import { FileText } from '../../../components/lovable/icons';
import { ProductPageShell } from '../../../components/ProductPageShell';
import { Reveal } from '../../../components/Motion';
import { Card } from '@landmap/ui';

const SECTIONS: { n: number; title: string; body: string }[] = [
  {
    n: 1,
    title: 'Aceitação',
    body: 'Ao acessar ou utilizar a plataforma LandMap, você concorda integralmente com estes Termos de Uso e com nossa Política de Privacidade. Caso não concorde, não utilize o serviço.',
  },
  {
    n: 2,
    title: 'Descrição do serviço',
    body: 'A LandMap é uma plataforma de inteligência de dados territoriais que agrega, cruza e apresenta informações públicas e de mercado sobre regiões e imóveis no Brasil, produzindo indicadores como o LandMap Score e séries históricas de preço.',
  },
  {
    n: 3,
    title: 'Natureza informativa — não é recomendação de investimento',
    body: 'O conteúdo disponibilizado pela LandMap tem caráter exclusivamente informativo e analítico. Nada na plataforma constitui recomendação de investimento, oferta de compra ou venda de imóveis, aconselhamento financeiro, jurídico, tributário ou imobiliário. Decisões tomadas com base em conteúdo da LandMap são de responsabilidade exclusiva do usuário, que deve buscar assessoria profissional adequada.',
  },
  {
    n: 4,
    title: 'Conta do usuário',
    body: 'Você é responsável pela veracidade das informações fornecidas e pela guarda de suas credenciais. Uso indevido da conta pode resultar em suspensão sem aviso prévio.',
  },
  {
    n: 5,
    title: 'Uso permitido',
    body: 'É permitido o uso do conteúdo para finalidades internas de análise e decisão. É vedado: (i) revender ou redistribuir os dados; (ii) fazer scraping automatizado; (iii) tentar quebrar mecanismos de segurança; (iv) utilizar o serviço para atividades ilícitas.',
  },
  {
    n: 6,
    title: 'Propriedade intelectual',
    body: 'Marca, layout, código, textos e a metodologia LandMap são propriedade da LandMap Inteligência Territorial Ltda. Dados de terceiros permanecem de titularidade de suas respectivas fontes.',
  },
  {
    n: 7,
    title: 'Limitação de responsabilidade',
    body: 'Embora empreguemos esforços razoáveis para manter dados atualizados e precisos, o serviço é fornecido no estado em que se encontra. A LandMap não se responsabiliza por prejuízos decorrentes de decisões tomadas com base nas informações apresentadas, nem por indisponibilidade temporária da plataforma.',
  },
  {
    n: 8,
    title: 'Alterações',
    body: 'Podemos atualizar estes Termos periodicamente. Alterações relevantes serão comunicadas por e-mail ou aviso na plataforma. O uso continuado após a alteração indica aceitação da nova versão.',
  },
  {
    n: 9,
    title: 'Foro',
    body: 'Estes Termos são regidos pela legislação brasileira. Fica eleito o foro da comarca de Fortaleza/CE para dirimir controvérsias.',
  },
  {
    n: 10,
    title: 'Contato',
    body: 'Dúvidas sobre estes Termos: juridico@landmap.com.br',
  },
];

export default function TermsPage() {
  return (
    <ProductPageShell
      backHref="/map"
      eyebrow={<><FileText className="h-3 w-3" /> Termos</>}
      title="Termos de Uso"
      description="Última atualização: 16 de julho de 2026"
    >
      <section className="space-y-3">
        {SECTIONS.map((s) => (
          <Reveal key={s.n}>
            <Card className="p-5">
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                {s.n}. {s.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-[var(--muted-foreground)]">
                {s.body}
              </p>
            </Card>
          </Reveal>
        ))}
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href="./privacy"
          className="inline-flex h-10 items-center rounded-lg border border-[var(--border)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)]"
        >
          Privacidade
        </a>
        <a
          href="./map"
          className="inline-flex h-10 items-center rounded-lg bg-[var(--primary)] px-5 text-sm font-medium text-[var(--primary-foreground)] transition hover:bg-[var(--primary)]/90"
        >
          Abrir o mapa
        </a>
      </div>
    </ProductPageShell>
  );
}
