'use client';

import { ShieldCheck, Check } from '../../../components/lovable/icons';
import { ProductPageShell } from '../../../components/ProductPageShell';
import { Reveal } from '../../../components/Motion';
import { Card } from '@landmap/ui';

const SECTIONS: { title: string; body: string }[] = [
  { title: 'Dados', body: 'Coletamos apenas os dados necessários para operar a plataforma e personalizar sua experiência.' },
  { title: 'Comunicações', body: 'Você pode optar por receber alertas de oportunidade e novidades por e-mail ou WhatsApp.' },
  { title: 'Revogação', body: 'O consentimento pode ser revogado a qualquer momento em Configurações ou entrando em contato.' },
  { title: 'Base legal', body: 'Tratamos os dados conforme a LGPD, com finalidade e transparência.' },
];

export default function ConsentPage() {
  return (
    <ProductPageShell
      backHref="/map"
      eyebrow={<><ShieldCheck className="h-3 w-3" /> Consentimento</>}
      title="Central de Consentimento"
      description="Gerencie suas preferências de privacidade e comunicação com a LandMap."
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
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">{s.body}</p>
                </div>
              </div>
            </Card>
          </Reveal>
        ))}
      </section>
    </ProductPageShell>
  );
}
