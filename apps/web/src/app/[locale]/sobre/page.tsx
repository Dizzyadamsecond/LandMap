'use client';

import { FileText } from '../../../components/lovable/icons';
import { ProductPageShell } from '../../../components/ProductPageShell';
import { Reveal } from '../../../components/Motion';
import { Card } from '@landmap/ui';

const PRINCIPLES: { title: string; body: string }[] = [
  {
    title: 'Realidade antes de estética',
    body: 'Preferimos apresentar a ausência de um dado a apresentar uma estimativa frágil apenas para preencher a tela.',
  },
  {
    title: 'Metodologia transparente',
    body: 'Explicamos como cada indicador é construído, quais dados o alimentam e qual o seu nível de confiança.',
  },
  {
    title: 'Fontes verificáveis',
    body: 'Cada camada tem origem rastreável. Não inventamos parcerias e não usamos selos que não representem controles reais.',
  },
  {
    title: 'Nada de recomendação de investimento',
    body: 'A LandMap organiza informação. Decisão de investimento é do usuário, apoiada por profissionais habilitados.',
  },
];

const CONTACT = [
  { label: 'E-mail comercial', value: 'comercial@landmap.com.br' },
  { label: 'Telefone', value: '+55 (85) 4042-1234' },
  { label: 'Sede', value: 'Fortaleza — CE, Brasil' },
];

export default function SobrePage() {
  return (
    <ProductPageShell
      backHref="/map"
      eyebrow={<><FileText className="h-3 w-3" /> Sobre</>}
      title="Sobre a LandMap"
      description="Plataforma de inteligência territorial: dados públicos, demográficos e de mercado cruzados por região."
      maxWidth="5xl"
    >
      <Reveal>
        <Card className="p-5">
          <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
            A LandMap é uma plataforma de inteligência territorial. Cruzamos dados públicos,
            informações demográficas, indicadores urbanos e dados de mercado imobiliário para
            mostrar o que efetivamente acontece em cada região. Existimos porque decisões de
            terreno, incorporação e investimento imobiliário no Brasil ainda são tomadas com base
            em informação fragmentada. A LandMap organiza esses dados, aplica critérios claros de
            qualidade e apresenta o resultado com o nível de confiança adequado. A plataforma foi
            criada para construtoras, loteadoras, fundos imobiliários, imobiliárias e profissionais
            que precisam de uma base sólida antes de tomar decisões.
          </p>
        </Card>
      </Reveal>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {PRINCIPLES.map((p) => (
          <Reveal key={p.title}>
            <Card className="h-full p-5">
              <h2 className="text-base font-semibold text-[var(--foreground)]">{p.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-[var(--muted-foreground)]">{p.body}</p>
            </Card>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-display text-lg font-semibold">Contato e dados da empresa</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {CONTACT.map((c) => (
              <div key={c.label}>
                <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">{c.label}</p>
                <p className="mt-0.5 text-sm text-[var(--foreground)]">{c.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="./map"
              className="inline-flex h-10 items-center rounded-lg bg-[var(--primary)] px-5 text-sm font-medium text-[var(--primary-foreground)] transition hover:bg-[var(--primary)]/90"
            >
              Abrir o mapa
            </a>
            <a
              href="./cobertura"
              className="inline-flex h-10 items-center rounded-lg border border-[var(--border)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)]"
            >
              Cobertura
            </a>
          </div>
        </div>
      </Reveal>
    </ProductPageShell>
  );
}
