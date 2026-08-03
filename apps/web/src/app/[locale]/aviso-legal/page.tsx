'use client';

import { ShieldCheck, Check } from '../../../components/lovable/icons';
import { ProductPageShell } from '../../../components/ProductPageShell';
import { Reveal } from '../../../components/Motion';
import { Card } from '@landmap/ui';

const SECTIONS: { title: string; body: string }[] = [
  { title: 'Objeto', body: 'A LandMap oferece inteligência territorial baseada em dados para apoio à decisão de aquisição de terrenos e imóveis no Brasil. As informações são indicativas.' },
  { title: 'Fontes', body: 'Os dados provêm de fontes públicas (IBGE, INEP, prefeituras), parceiros e modelos próprios. Não garantimos exatidão absoluta ou atualização em tempo real.' },
  { title: 'Responsabilidade', body: 'Decisões de investimento são de responsabilidade do usuário. Recomendamos due diligence jurídica e técnica independente antes de qualquer negócio.' },
  { title: 'Propriedade', body: 'A marca, o código e os modelos de IA são propriedade da LandMap. É vedada a reprodução sem autorização.' },
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
