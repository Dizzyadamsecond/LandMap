'use client';

import { MapPin, Check } from '../../../components/lovable/icons';
import { ProductPageShell } from '../../../components/ProductPageShell';
import { Reveal } from '../../../components/Motion';
import { Card } from '@landmap/ui';

const SECTIONS: { title: string; body: string }[] = [
  { title: 'Cidades', body: 'Cobertura inicial em capitais e regiões metropolitanas, em expansão contínua para o interior e cidades médias.' },
  { title: 'Indicadores', body: 'Preço por m², valorização histórica, score de região, infraestrutura, mobilidade, risco e camadas de calor de demanda.' },
  { title: 'Atualização', body: 'O pipeline ingere dados públicos e sinais de mercado periodicamente; a confiança por região reflete a densidade de amostras.' },
  { title: 'Solicitar', body: 'Cidades ausentes podem ser priorizadas via nosso canal de contato e parcerias de dados.' },
];

export default function CoberturaPage() {
  return (
    <ProductPageShell
      backHref="/map"
      eyebrow={<><MapPin className="h-3 w-3" /> Cobertura</>}
      title="Cobertura de Dados"
      description="Entenda o escopo nacional do dataset LandMap e o nível de detalhe por região."
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
