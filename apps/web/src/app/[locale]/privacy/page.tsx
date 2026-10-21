'use client';

import { PublicPageShell } from '../../../components/PublicPageShell';
import { COMPANY } from '../../../lib/public-content';

/**
 * `/privacy` — paridade 1:1 com a Lovable LIVE
 * (`landmap-insight.lovable.app/privacy`, chunk `privacy-ciZ5XSih.js`):
 * header Voltar → `/onboarding`, `article.mx-auto.max-w-3xl.px-6.py-16`,
 * eyebrow "Legal", H1 "Política de Privacidade", data de atualização, 8 seções
 * em `div.prose...space-y-8` (lista de dados em `ul.ml-5.list-disc`, mailtos
 * privacidade@ e dpo@), `<Footer />` 1:1.
 */
export default function PrivacyPage() {
  return (
    <PublicPageShell backHref="/onboarding">
      <article className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">Legal</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Política de Privacidade</h1>
        <p className="mt-3 text-sm text-foreground/50">
          Última atualização: {COMPANY.legalUpdatedAt}
        </p>
        <div className="prose prose-neutral dark:prose-invert mt-10 max-w-none space-y-8 text-[15px] leading-relaxed text-foreground/80">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Quem somos</h2>
            <p>
              Esta plataforma é operada pela LandMap Inteligência Territorial Ltda., com sede em
              Fortaleza/CE, Brasil (&ldquo;LandMap&rdquo;, &ldquo;nós&rdquo;). Esta Política descreve
              como tratamos dados pessoais em conformidade com a Lei Geral de Proteção de Dados
              (Lei 13.709/2018 — LGPD).
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Dados que coletamos</h2>
            <p>Coletamos, quando aplicável:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Dados de cadastro: nome, e-mail, telefone, empresa.</li>
              <li>Dados de uso: páginas visitadas, buscas, filtros aplicados, regiões consultadas.</li>
              <li>Dados técnicos: endereço IP, tipo de dispositivo, navegador, sistema operacional.</li>
              <li>Dados de pagamento processados por provedores certificados (não armazenamos números de cartão).</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Base legal e finalidade</h2>
            <p>
              Tratamos dados com base em execução de contrato, cumprimento de obrigação legal,
              legítimo interesse e consentimento — sempre para prestar o serviço, melhorá-lo,
              prevenir fraudes e comunicar novidades relevantes.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Compartilhamento</h2>
            <p>
              Não vendemos dados pessoais. Compartilhamos com processadores necessários
              (hospedagem, analytics, pagamentos) sob contratos de confidencialidade e apenas na
              medida indispensável à operação.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Seus direitos</h2>
            <p>
              Você pode solicitar a qualquer tempo: confirmação de tratamento, acesso, correção,
              anonimização, portabilidade, eliminação e revogação de consentimento. Envie sua
              solicitação para{' '}
              <a href={`mailto:${COMPANY.emailPrivacy}`} className="text-primary hover:underline">
                {COMPANY.emailPrivacy}
              </a>
              .
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Segurança</h2>
            <p>
              Adotamos medidas técnicas e organizacionais razoáveis para proteger dados
              (criptografia em trânsito, controle de acesso, monitoramento). Nenhum sistema é
              infalível, e nos comprometemos a comunicar incidentes relevantes na forma da lei.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Retenção</h2>
            <p>
              Retemos dados pelo tempo necessário às finalidades declaradas ou por obrigações
              legais. Encerrada a conta, dados podem ser anonimizados e mantidos apenas em bases
              agregadas para fins analíticos.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Contato do Encarregado (DPO)</h2>
            <p>
              E-mail:{' '}
              <a href={`mailto:${COMPANY.emailDpo}`} className="text-primary hover:underline">
                {COMPANY.emailDpo}
              </a>
            </p>
          </section>
        </div>
      </article>
    </PublicPageShell>
  );
}
