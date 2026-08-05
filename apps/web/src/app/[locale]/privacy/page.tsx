'use client';

import { Lock } from '../../../components/lovable/icons';
import { ProductPageShell } from '../../../components/ProductPageShell';
import { Reveal } from '../../../components/Motion';
import { Card } from '@landmap/ui';

const SECTIONS: { n: number; title: string; body: string }[] = [
  {
    n: 1,
    title: 'Quem somos',
    body: 'Esta plataforma é operada pela LandMap Inteligência Territorial Ltda., com sede em Fortaleza/CE, Brasil (LandMap, nós). Esta Política descreve como tratamos dados pessoais em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018 — LGPD).',
  },
  {
    n: 2,
    title: 'Dados que coletamos',
    body: 'Coletamos, quando aplicável: Dados de cadastro: nome, e-mail, telefone, empresa. Dados de uso: páginas visitadas, buscas, filtros aplicados, regiões consultadas. Dados técnicos: endereço IP, tipo de dispositivo, navegador, sistema operacional. Dados de pagamento processados por provedores certificados (não armazenamos números de cartão).',
  },
  {
    n: 3,
    title: 'Base legal e finalidade',
    body: 'Tratamos dados com base em execução de contrato, cumprimento de obrigação legal, legítimo interesse e consentimento — sempre para prestar o serviço, melhorá-lo, prevenir fraudes e comunicar novidades relevantes.',
  },
  {
    n: 4,
    title: 'Compartilhamento',
    body: 'Não vendemos dados pessoais. Compartilhamos com processadores necessários (hospedagem, analytics, pagamentos) sob contratos de confidencialidade e apenas na medida indispensável à operação.',
  },
  {
    n: 5,
    title: 'Seus direitos',
    body: 'Você pode solicitar a qualquer tempo: confirmação de tratamento, acesso, correção, anonimização, portabilidade, eliminação e revogação de consentimento. Envie sua solicitação para privacidade@landmap.com.br.',
  },
  {
    n: 6,
    title: 'Segurança',
    body: 'Adotamos medidas técnicas e organizacionais razoáveis para proteger dados (criptografia em trânsito, controle de acesso, monitoramento). Nenhum sistema é infalível, e nos comprometemos a comunicar incidentes relevantes na forma da lei.',
  },
  {
    n: 7,
    title: 'Retenção',
    body: 'Retemos dados pelo tempo necessário às finalidades declaradas ou por obrigações legais. Encerrada a conta, dados podem ser anonimizados e mantidos apenas em bases agregadas para fins analíticos.',
  },
  {
    n: 8,
    title: 'Contato do Encarregado (DPO)',
    body: 'E-mail: dpo@landmap.com.br',
  },
];

export default function PrivacyPage() {
  return (
    <ProductPageShell
      backHref="/map"
      eyebrow={<><Lock className="h-3 w-3" /> Privacidade</>}
      title="Política de Privacidade"
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
          href="./terms"
          className="inline-flex h-10 items-center rounded-lg border border-[var(--border)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)]"
        >
          Termos de uso
        </a>
        <a
          href="./cookies"
          className="inline-flex h-10 items-center rounded-lg border border-[var(--border)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)]"
        >
          Política de cookies
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
