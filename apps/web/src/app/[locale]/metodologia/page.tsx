'use client';

import { BookA, LandMapWordmark } from '../../../components/lovable/icons';
import { ProductPageShell } from '../../../components/ProductPageShell';
import { Stagger } from '../../../components/Motion';
import { Card } from '@landmap/ui';

type Section = {
  title: string;
  body: string;
};

const SECTIONS: Section[] = [
  {
    title: 'Como os dados são coletados',
    body: 'Recebemos dados de bases públicas municipais, informações demográficas e econômicas, bases geográficas abertas e parceiros do mercado imobiliário. Cada fonte é registrada com região atendida, frequência e status na página de fontes de dados.',
  },
  {
    title: 'Como os dados são limpos',
    body: 'Registros passam por padronização de endereço, deduplicação e classificação por tipo de imóvel. Anúncios sem localização confiável ou sem preço/área declarados são descartados.',
  },
  {
    title: 'Como o preço por m² é calculado',
    body: 'O preço por m² é obtido a partir do preço total dividido pela área declarada, agrupado por região, tipo de imóvel e janela temporal. Registros sem área ou com área implausível são excluídos.',
  },
  {
    title: 'Diferença entre média e mediana',
    body: 'Utilizamos preferencialmente a mediana para reduzir o efeito de valores extremos. A média é reportada como referência auxiliar quando a amostra é suficiente.',
  },
  {
    title: 'Como registros anormais são tratados',
    body: 'Aplicamos filtros por intervalo interquartil e por regras específicas por região. Registros identificados como fora de padrão são sinalizados e não entram no cálculo de indicadores principais.',
  },
  {
    title: 'Critérios mínimos para exibir um indicador',
    body: 'Um indicador só é exibido quando existe amostra mínima, período coberto e atualização recente. Quando esses critérios não são atendidos, apresentamos a mensagem de dados insuficientes em vez de estimativas frágeis.',
  },
  {
    title: 'Como funciona o nível de confiança',
    body: 'Cada indicador recebe um nível de confiança calculado a partir da quantidade de registros válidos, dispersão, atualização e qualidade das fontes envolvidas. Os níveis são: Alta, Média, Baixa e Insuficiente.',
  },
  {
    title: 'LandMap Opportunity Score',
    body: 'O score combina camadas objetivas (preço, valorização histórica, indicadores urbanos e demográficos) em um valor de 0 a 100 por região. Os pesos exatos passam por revisão periódica e ainda não são apresentados como definitivos.',
  },
  {
    title: 'Limitações da plataforma',
    body: 'A profundidade dos dados varia por município. Nem todas as camadas estão disponíveis em todas as regiões. A LandMap não substitui análise jurídica, ambiental, urbanística ou de investimento.',
  },
  {
    title: 'Frequência de atualização',
    body: 'Bases públicas são reingeridas periodicamente conforme o ciclo de publicação de cada órgão. Dados de mercado são atualizados semanalmente ou de forma contínua, conforme a fonte.',
  },
];

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground/50">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

export default function MetodologiaPage() {
  return (
    <ProductPageShell
      backHref="/"
      maxWidth="3xl"
      eyebrow={
        <>
          <BookA className="h-3 w-3" /> Metodologia
        </>
      }
      title="Metodologia LandMap"
      description="Este documento descreve como a LandMap organiza dados territoriais e constrói indicadores. A metodologia é revisada periodicamente e evolui conforme novas fontes são integradas."
    >
      <div className="mt-8 grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:grid-cols-2">
        <MetaRow label="Versão da metodologia" value="1.0" />
        <MetaRow label="Última atualização" value="14 de julho de 2026" />
      </div>

      <Stagger className="mt-12 space-y-4">
        {SECTIONS.map((s) => (
          <Card key={s.title} className="rounded-2xl border border-foreground/10 bg-background p-6">
            <h2 className="font-display text-lg font-semibold">{s.title}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-foreground/75">{s.body}</p>
          </Card>
        ))}
      </Stagger>

      <div className="mt-12 rounded-2xl border border-warning/20 bg-warning/[0.04] p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-warning">
          Observação
        </p>
        <p className="mt-3 text-sm leading-relaxed text-foreground/80">
          Os fatores e critérios descritos acima constituem a estrutura da metodologia.
          Pesos, fórmulas e limites específicos são revisados trimestralmente e não são
          apresentados como definitivos até validação. Este documento pode ser atualizado
          pelo painel administrativo da LandMap.
        </p>
      </div>
    </ProductPageShell>
  );
}
