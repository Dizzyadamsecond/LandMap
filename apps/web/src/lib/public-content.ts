export const COMPANY = {
  legalUpdatedAt: '26 de agosto de 2026',
  methodologyVersion: '2.1',
  methodologyUpdatedAt: 'Agosto de 2026',
  emailCommercial: 'comercial@landmap.app',
  emailLegal: 'juridico@landmap.app',
  phone: '(85) 3000-0000',
  city: 'Fortaleza',
  uf: 'CE',
  country: 'Brasil',
  cnpj: '',
};

export const PRINCIPLES = [
  {
    title: 'Transparência de fontes',
    body: 'Identificamos sempre a origem do dado e se ele é observado, estimado ou modelado.',
  },
  {
    title: 'Profundidade sobre extensão',
    body: 'Mais vale cobrir uma região com densidade do que o país todo superficialmente.',
  },
  {
    title: 'Acesso descomplicado',
    body: 'Dados complexos entregues em linguagem direta e métricas acionáveis.',
  },
  {
    title: 'Atualização contínua',
    body: 'Rotinas automatizadas de monitoramento e validação periódica de dados.',
  },
];

export const COVERAGE_STATUS = {
  complete: { label: 'Cobertura completa', dot: 'bg-emerald-500' },
  active: { label: 'Cobertura ativa', dot: 'bg-sky-500' },
  processing: { label: 'Em processamento', dot: 'bg-amber-500' },
  soon: { label: 'Em breve', dot: 'bg-foreground/30' },
} as const;

export type CoverageStatusKey = keyof typeof COVERAGE_STATUS;

export const COVERAGE_ROWS = [
  {
    city: 'Fortaleza',
    uf: 'CE',
    status: 'complete' as CoverageStatusKey,
    dataTypes: ['Preço por m²', 'Zoneamento municipal', 'Indicadores demográficos', 'Transações'],
    updatedAt: '26 de agosto de 2026',
  },
  {
    city: 'Eusébio',
    uf: 'CE',
    status: 'complete' as CoverageStatusKey,
    dataTypes: ['Preço por m²', 'Indicadores demográficos', 'Loteamentos'],
    updatedAt: '20 de agosto de 2026',
  },
  {
    city: 'Aquiraz',
    uf: 'CE',
    status: 'active' as CoverageStatusKey,
    dataTypes: ['Preço por m²', 'Litoral', 'Empreendimentos'],
    updatedAt: '15 de agosto de 2026',
  },
  {
    city: 'Caucaia',
    uf: 'CE',
    status: 'active' as CoverageStatusKey,
    dataTypes: ['Preço por m²', 'Vetor Oeste', 'Industrial'],
    updatedAt: '10 de agosto de 2026',
  },
  {
    city: 'Recife',
    uf: 'PE',
    status: 'active' as CoverageStatusKey,
    dataTypes: ['Preço por m²', 'Polo Médico', 'Orla'],
    updatedAt: '05 de agosto de 2026',
  },
  {
    city: 'Natal',
    uf: 'RN',
    status: 'active' as CoverageStatusKey,
    dataTypes: ['Preço por m²', 'Ponta Negra', 'Petrópolis'],
    updatedAt: '01 de agosto de 2026',
  },
  {
    city: 'São Luís',
    uf: 'MA',
    status: 'active' as CoverageStatusKey,
    dataTypes: ['Preço por m²', 'Renascença', 'Calhau'],
    updatedAt: '28 de julho de 2026',
  },
  {
    city: 'Salvador',
    uf: 'BA',
    status: 'active' as CoverageStatusKey,
    dataTypes: ['Preço por m²', 'Vitória', 'Horto', 'Caminho das Árvores'],
    updatedAt: '25 de julho de 2026',
  },
];

export const SOURCES_ROWS = [
  {
    fonte: 'IBGE',
    categoria: 'Demografia e Território',
    regiao: 'Brasil',
    frequencia: 'Decenal / Anual',
    tipo: 'Público',
    status: 'active',
  },
  {
    fonte: 'Prefeituras Municipais',
    categoria: 'Zoneamento e IPTU/ITBI',
    regiao: 'Capitais e Regiões Metropolitanas',
    frequencia: 'Mensal / Contínua',
    tipo: 'Oficial',
    status: 'active',
  },
  {
    fonte: 'Cartórios de Registro de Imóveis',
    categoria: 'Transações e Matrículas',
    regiao: 'Praças Selecionadas',
    frequencia: 'Mensal',
    tipo: 'Registral',
    status: 'active',
  },
  {
    fonte: 'OpenStreetMap & Infraestrutura',
    categoria: 'Vias e Pontos de Interesse',
    regiao: 'Brasil',
    frequencia: 'Semanal',
    tipo: 'Colaborativo / Oficial',
    status: 'active',
  },
  {
    fonte: 'Portais Imobiliários Integrados',
    categoria: 'Ofertas e Preço Pedido',
    regiao: 'Brasil',
    frequencia: 'Diária',
    tipo: 'Mercado',
    status: 'active',
  },
  {
    fonte: 'INPE / MapBiomas',
    categoria: 'Uso do Solo e Cobertura Vegetal',
    regiao: 'Brasil',
    frequencia: 'Anual',
    tipo: 'Satélite / Público',
    status: 'active',
  },
];

export const GLOSSARY_GROUPS = [
  { id: 'preco', label: 'Preço e Valorização' },
  { id: 'zoneamento', label: 'Urbanismo e Zoneamento' },
  { id: 'mercado', label: 'Mercado e Dinâmica' },
  { id: 'risco', label: 'Risco e Viabilidade' },
];

export const GLOSSARY_ORIGIN_LABEL: Record<string, string> = {
  observed: 'Observado',
  estimated: 'Estimado',
  modeled: 'Modelado',
};

export const GLOSSARY_ORIGIN_STYLE: Record<string, string> = {
  observed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  estimated: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  modeled: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
};

export const GLOSSARY_TERMS = [
  {
    id: 'preco-m2',
    term: 'Preço médio por m²',
    group: 'preco',
    origin: 'observed',
    unit: 'R$/m²',
    short: 'Média de preço por metro quadrado anunciado na região.',
    how: 'Calculado a partir de amostras de terrenos anunciados e transacionados com remoção de outliers estatísticos.',
  },
  {
    id: 'mediana-m2',
    term: 'Preço mediano por m²',
    group: 'preco',
    origin: 'observed',
    unit: 'R$/m²',
    short: 'Ponto central da distribuição de preços por m².',
    how: 'Ordena todas as amostras válidas da região e seleciona o valor central, resistente a distorções.',
  },
  {
    id: 'valorizacao-12m',
    term: 'Valorização (12 meses)',
    group: 'preco',
    origin: 'modeled',
    unit: '% a.a.',
    short: 'Variação percentual do preço por m² nos últimos doze meses.',
    how: 'Regressão de preços históricos deflacionados comparados ao mesmo período do ano anterior.',
  },
  {
    id: 'score-landmap',
    term: 'LandMap Score',
    group: 'mercado',
    origin: 'modeled',
    unit: '0 a 100',
    short: 'Nota composta de atratividade e potencial de valorização do terreno.',
    how: 'Ponderação multi-fatorial de dinâmica de preço, densidade demográfica, zoneamento e infraestrutura.',
  },
  {
    id: 'coeficiente-aproveitamento',
    term: 'Coeficiente de Aproveitamento (CA)',
    group: 'zoneamento',
    origin: 'observed',
    unit: 'Fator',
    short: 'Multiplicador que define a área máxima construível permitida no terreno.',
    how: 'Extraído diretamente da legislação urbanística e plano diretor municipal de cada zona.',
  },
  {
    id: 'taxa-ocupacao',
    term: 'Taxa de Ocupação (TO)',
    group: 'zoneamento',
    origin: 'observed',
    unit: '%',
    short: 'Porcentagem máxima do terreno que pode ser coberta pela projeção da construção.',
    how: 'Definida pelas normas do plano diretor vigente no município.',
  },
  {
    id: 'recuo-obrigatorio',
    term: 'Recuo obrigatório',
    group: 'zoneamento',
    origin: 'observed',
    unit: 'Metros',
    short: 'Distância mínima entre a edificação e o alinhamento da rua ou divisa.',
    how: 'Parâmetro normativo municipal por tipo de via e classificação de zoneamento.',
  },
  {
    id: 'densidade-demografica',
    term: 'Densidade demográfica',
    group: 'mercado',
    origin: 'observed',
    unit: 'Hab/km²',
    short: 'Número de habitantes por quilômetro quadrado na região.',
    how: 'Dados oficiais agregados por setor censitário do IBGE atualizados com estimativas populacionais.',
  },
  {
    id: 'velocidade-venda',
    term: 'Velocidade de vendas (VSO)',
    group: 'mercado',
    origin: 'estimated',
    unit: '% ao mês',
    short: 'Ritmo com que terrenos e lançamentos são comercializados na região.',
    how: 'Estimado a partir da rotatividade de anúncios e tempo médio de permanência no mercado.',
  },
  {
    id: 'liquidez-terreno',
    term: 'Índice de Liquidez',
    group: 'mercado',
    origin: 'modeled',
    unit: '0 a 10',
    short: 'Facilidade esperada de comercialização de um terreno na localidade.',
    how: 'Calculado com base no volume de buscas, tempo médio em anúncio e proporção de absorção.',
  },
];

export const METHODOLOGY_SECTIONS = [
  {
    title: 'Coleta de dados',
    body: 'Fontes públicas, cartoriais e de mercado são coletadas continuamente por crawlers e integrações de API.',
  },
  {
    title: 'Limpeza e padronização',
    body: 'Remoção de duplicatas, normalização de endereços e geocodificação de precisão métrica.',
  },
  {
    title: 'Cálculo de Preço por m²',
    body: 'Agregação territorial em hexágonos e setores para cálculo de médias aparadas e medianas.',
  },
  {
    title: 'Média versus Mediana',
    body: 'Utilização preferencial da mediana para isolar o impacto de outliers de luxo ou erros de digitação.',
  },
  {
    title: 'Detecção de Anomalias',
    body: 'Algoritmos estatísticos (IQR e Z-score robusto) eliminam anúncios fora do padrão de mercado.',
  },
  {
    title: 'Amostragem Mínima',
    body: 'Regiões com menos de 5 amostras válidas recebem indicador de baixa confiança ou status em processamento.',
  },
  {
    title: 'Níveis de Confiança',
    body: 'Classificação em alta, média ou preliminar com base no volume e frescor das amostras.',
  },
  {
    title: 'LandMap Opportunity Score',
    body: 'Modelo matemático composto que equilibra valor presente, vetor de crescimento urbano e restrições legais.',
  },
  {
    title: 'Limitações e Avisos',
    body: 'Nenhum indicador substitui o trabalho pericial de avaliação imobiliária presencial.',
  },
  {
    title: 'Frequência de Atualização',
    body: 'Dados de mercado atualizados diariamente; zoneamento e bases cartoriais revisadas mensalmente.',
  },
];
