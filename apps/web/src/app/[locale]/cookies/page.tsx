'use client';

import { BellRing, Check } from '../../../components/lovable/icons';
import { ProductPageShell } from '../../../components/ProductPageShell';
import { Reveal } from '../../../components/Motion';
import { Card } from '@landmap/ui';

const SECTIONS: { title: string; body: string }[] = [
  { title: 'Essenciais', body: 'Necessários para autenticação, segurança e navegação básica. Não podem ser desativados.' },
  { title: 'Analíticos', body: 'Ajudam a entender o uso do produto e a priorizar melhorias. São anonimizados.' },
  { title: 'Preferências', body: 'Lembram configurações como idioma, cidade e filtros do mapa.' },
  { title: 'Gerenciar', body: 'Você pode controlar cookies nas configurações do navegador a qualquer momento.' },
];

export default function CookiesPage() {
  return (
    <ProductPageShell
      backHref="/map"
      eyebrow={<><BellRing className="h-3 w-3" /> Cookies</>}
      title="Política de Cookies"
      description="Como usamos cookies e tecnologias semelhantes para melhorar sua experiência."
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
