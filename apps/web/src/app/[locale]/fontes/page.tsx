'use client';

import { Link2 } from '../../../components/lovable/icons';
import { ProductPageShell } from '../../../components/ProductPageShell';
import { Card } from '@landmap/ui';

const ROWS: { fonte: string; categoria: string; regiao: string; frequencia: string; tipo: string; status: string }[] = [
  { fonte: 'Bases municipais — Nordeste', categoria: 'Dados públicos', regiao: 'CE, PE, RN', frequencia: 'Mensal', tipo: 'Zoneamento, IPTU agregado', status: 'Ativa' },
  { fonte: 'Bases geográficas abertas', categoria: 'Dados públicos', regiao: 'Brasil', frequencia: 'Trimestral', tipo: 'Geometria e uso do solo', status: 'Ativa' },
  { fonte: 'Indicadores demográficos e econômicos', categoria: 'Dados públicos', regiao: 'Brasil', frequencia: 'Anual', tipo: 'População, renda, PIB municipal', status: 'Ativa' },
  { fonte: 'Parceiros imobiliários regionais', categoria: 'Dados de mercado', regiao: 'CE', frequencia: 'Semanal', tipo: 'Anúncios, transações', status: 'Ativa' },
  { fonte: 'Rede de corretores parceiros', categoria: 'Dados de mercado', regiao: 'CE, PE', frequencia: 'Contínua', tipo: 'Preço praticado, tempo de mercado', status: 'Em integração' },
  { fonte: 'Camadas processadas LandMap', categoria: 'Dados processados', regiao: 'Cobertura ativa', frequencia: 'Diária', tipo: 'Score, liquidez, comparações', status: 'Ativa' },
];

export default function FontesPage() {
  return (
    <ProductPageShell
      backHref="/map"
      eyebrow={<><Link2 className="h-3 w-3" /> Fontes</>}
      title="Fontes de dados"
      description="Consulta pública de fontes e atualizações"
      maxWidth="5xl"
    >
      <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
        A LandMap processa, padroniza e cruza informações de diferentes fontes. A presença de uma
        fonte não significa que todos os dados estejam disponíveis para todas as regiões.
      </p>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                <th className="px-4 py-3 font-medium">Fonte</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Região</th>
                <th className="px-4 py-3 font-medium">Frequência</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.fonte} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">{r.fonte}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{r.categoria}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{r.regiao}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{r.frequencia}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{r.tipo}</td>
                  <td className={`px-4 py-3 font-medium ${r.status === 'Ativa' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-4 text-xs text-[var(--muted-foreground)]">
        O registro de fontes é mantido pelo time de dados da LandMap. Nomes de terceiros são
        apresentados apenas quando existe autorização formal. Este conteúdo é editável pelo painel
        administrativo.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
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
    </ProductPageShell>
  );
}
