'use client';

import { PublicPageShell } from '../../../components/PublicPageShell';
import { COMPANY } from '../../../lib/public-content';

/**
 * `/terms` — paridade 1:1 com a Lovable LIVE
 * (`landmap-insight.lovable.app/terms`, chunk `terms-QBu_znNr.js`):
 * header Voltar → `/onboarding`, `article.mx-auto.max-w-3xl.px-6.py-16`,
 * eyebrow "Legal", H1 "Termos de Uso", data de atualização, 10 seções em
 * `div.prose...space-y-8` com H2 `text-xl font-semibold`, mailto jurídico,
 * `<Footer />` 1:1.
 */
const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: '1. Aceitação',
    body: 'Ao acessar ou utilizar a plataforma LandMap, você concorda integralmente com estes Termos de Uso e com nossa Política de Privacidade. Caso não concorde, não utilize o serviço.',
  },
  {
    title: '2. Descrição do serviço',
    body: 'A LandMap é uma plataforma de inteligência de dados territoriais que agrega, cruza e apresenta informações públicas e de mercado sobre regiões e imóveis no Brasil, produzindo indicadores como o LandMap Score e séries históricas de preço.',
  },
  {
    title: '3. Natureza informativa — não é recomendação de investimento',
    body: (
      <>
        <strong>
          O conteúdo disponibilizado pela LandMap tem caráter exclusivamente informativo e
          analítico. Nada na plataforma constitui recomendação de investimento, oferta de compra
          ou venda de imóveis, aconselhamento financeiro, jurídico, tributário ou imobiliário.
        </strong>{' '}
        Decisões tomadas com base em conteúdo da LandMap são de responsabilidade exclusiva do
        usuário, que deve buscar assessoria profissional adequada.
      </>
    ),
  },
  {
    title: '4. Conta do usuário',
    body: 'Você é responsável pela veracidade das informações fornecidas e pela guarda de suas credenciais. Uso indevido da conta pode resultar em suspensão sem aviso prévio.',
  },
  {
    title: '5. Uso permitido',
    body: 'É permitido o uso do conteúdo para finalidades internas de análise e decisão. É vedado: (i) revender ou redistribuir os dados; (ii) fazer scraping automatizado; (iii) tentar quebrar mecanismos de segurança; (iv) utilizar o serviço para atividades ilícitas.',
  },
  {
    title: '6. Propriedade intelectual',
    body: 'Marca, layout, código, textos e a metodologia LandMap são propriedade da LandMap Inteligência Territorial Ltda. Dados de terceiros permanecem de titularidade de suas respectivas fontes.',
  },
  {
    title: '7. Limitação de responsabilidade',
    body: 'Embora empreguemos esforços razoáveis para manter dados atualizados e precisos, o serviço é fornecido "no estado em que se encontra". A LandMap não se responsabiliza por prejuízos decorrentes de decisões tomadas com base nas informações apresentadas, nem por indisponibilidade temporária da plataforma.',
  },
  {
    title: '8. Alterações',
    body: 'Podemos atualizar estes Termos periodicamente. Alterações relevantes serão comunicadas por e-mail ou aviso na plataforma. O uso continuado após a alteração indica aceitação da nova versão.',
  },
  {
    title: '9. Foro',
    body: 'Estes Termos são regidos pela legislação brasileira. Fica eleito o foro da comarca de Fortaleza/CE para dirimir controvérsias.',
  },
  {
    title: '10. Contato',
    body: (
      <>
        Dúvidas sobre estes Termos:{' '}
        <a href={`mailto:${COMPANY.emailLegal}`} className="text-primary hover:underline">
          {COMPANY.emailLegal}
        </a>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <PublicPageShell backHref="/onboarding">
      <article className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">Legal</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Termos de Uso</h1>
        <p className="mt-3 text-sm text-foreground/50">
          Última atualização: {COMPANY.legalUpdatedAt}
        </p>
        <div className="mt-10 max-w-none space-y-8 text-[15px] leading-relaxed text-foreground/80">
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
