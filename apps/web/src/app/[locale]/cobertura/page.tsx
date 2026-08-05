'use client';

import { MapPin } from '../../../components/lovable/icons';
import { ProductPageShell } from '../../../components/ProductPageShell';
import { Card } from '@landmap/ui';

const STATUS_STYLE: Record<string, string> = {
  'Cobertura parcial': 'text-[var(--primary)]',
  'Em processamento': 'text-[var(--muted-foreground)]',
  'Em breve': 'text-[var(--muted-foreground)]',
};

const ROWS: { cidade: string; uf: string; status: string; tipos: string; atualizacao: string }[] = [
  { cidade: 'Fortaleza', uf: 'CE', status: 'Cobertura parcial', tipos: 'Preço por m² · Zoneamento municipal · Indicadores demográficos', atualizacao: '14 de julho de 2026' },
  { cidade: 'Eusébio', uf: 'CE', status: 'Cobertura parcial', tipos: 'Preço por m² · Indicadores demográficos', atualizacao: '10 de julho de 2026' },
  { cidade: 'Aquiraz', uf: 'CE', status: 'Em processamento', tipos: 'Preço por m²', atualizacao: '05 de julho de 2026' },
  { cidade: 'Caucaia', uf: 'CE', status: 'Em processamento', tipos: 'Preço por m²', atualizacao: '—' },
  { cidade: 'Recife', uf: 'PE', status: 'Em breve', tipos: '—', atualizacao: '—' },
  { cidade: 'Natal', uf: 'RN', status: 'Em breve', tipos: '—', atualizacao: '—' },
  { cidade: 'São Luís', uf: 'MA', status: 'Em breve', tipos: '—', atualizacao: '—' },
  { cidade: 'Salvador', uf: 'BA', status: 'Em breve', tipos: '—', atualizacao: '—' },
];

export default function CoberturaPage() {
  return (
    <ProductPageShell
      backHref="/map"
      eyebrow={<><MapPin className="h-3 w-3" /> Cobertura</>}
      title="Cobertura"
      description="Onde a LandMap possui dados disponíveis"
      maxWidth="5xl"
    >
      <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
        A cobertura varia conforme a disponibilidade, atualização e qualidade das fontes de cada
        município. Priorizamos profundidade sobre extensão — cada praça entra progressivamente,
        camada por camada.
      </p>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                <th className="px-4 py-3 font-medium">Cidade</th>
                <th className="px-4 py-3 font-medium">UF</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Tipos de dado disponíveis</th>
                <th className="px-4 py-3 font-medium">Última atualização</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={`${r.cidade}-${r.uf}`} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">{r.cidade}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{r.uf}</td>
                  <td className={`px-4 py-3 font-medium ${STATUS_STYLE[r.status] ?? 'text-[var(--foreground)]'}`}>{r.status}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{r.tipos}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{r.atualizacao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-4 text-xs text-[var(--muted-foreground)]">
        A tabela é mantida pelo time de dados da LandMap e pode ser atualizada pelo painel
        administrativo. Municípios listados como Em breve ainda não possuem dados exibidos na
        plataforma.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href="./map"
          className="inline-flex h-10 items-center rounded-lg bg-[var(--primary)] px-5 text-sm font-medium text-[var(--primary-foreground)] transition hover:bg-[var(--primary)]/90"
        >
          Abrir o mapa
        </a>
        <a
          href="./fontes"
          className="inline-flex h-10 items-center rounded-lg border border-[var(--border)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)]"
        >
          Fontes de dados
        </a>
      </div>
    </ProductPageShell>
  );
}
