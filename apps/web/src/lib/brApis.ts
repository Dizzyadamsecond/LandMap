// Catálogo de 40 APIs públicas e gratuitas do Brasil (sem chave / open-data).
// Cada entrada aponta para uma URL de exemplo REAL e verificável. O proxy em
// /api/br/[id] faz o fetch server-side (evita CORS e exposição de tokens).
export interface BrApi {
  id: string;
  name: string;
  category:
    | 'Geografia'
    | 'Clima'
    | 'Economia'
    | 'Governo'
    | 'Telecom'
    | 'Imobiliário'
    | 'Utilidades';
  description: string;
  url: string; // URL de exemplo (sample) usada pelo proxy /api/br/[id]
  headers?: Record<string, string>;
  docs: string;
}

// Amostras reaproveitáveis
const SAMPLE_CEP = '01001000';
const SAMPLE_DDD = '11';
const SAMPLE_CNPJ = '19131243000197';
const SP = '-23.55,-46.63';

export const BR_APIS: BrApi[] = [
  // ── Geografia ──────────────────────────────────────────────
  {
    id: 'ibge-estados',
    name: 'IBGE · Estados do Brasil',
    category: 'Geografia',
    description: 'Lista de todas as Unidades da Federação com id, sigla, região e nome.',
    url: 'https://servicodados.ibge.gov.br/api/v1/localidades/estados',
    docs: 'https://servicodados.ibge.gov.br/api/docs/localidades',
  },
  {
    id: 'ibge-municipios',
    name: 'IBGE · Municípios',
    category: 'Geografia',
    description: 'Catálogo completo de municípios brasileiros (nome, microrregião, UF).',
    url: 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios',
    docs: 'https://servicodados.ibge.gov.br/api/docs/localidades',
  },
  {
    id: 'nominatim-search',
    name: 'OpenStreetMap · Busca de endereço',
    category: 'Geografia',
    description: 'Geocodificação livre (Nominatim) — encontra coordenadas a partir de um endereço.',
    url: 'https://nominatim.openstreetmap.org/search?q=Av+Paulista+Sao+Paulo&format=json&limit=3&countrycodes=br',
    headers: { 'User-Agent': 'LandMap/1.0' },
    docs: 'https://nominatim.org/release-docs/latest/api/Search/',
  },
  {
    id: 'nominatim-reverse',
    name: 'OpenStreetMap · Reverse geocoding',
    category: 'Geografia',
    description: 'Converte coordenadas (lat/lon) em um endereço legível.',
    url: 'https://nominatim.openstreetmap.org/reverse?lat=-23.55&lon=-46.63&format=json&zoom=10',
    headers: { 'User-Agent': 'LandMap/1.0' },
    docs: 'https://nominatim.org/release-docs/latest/api/Reverse/',
  },
  {
    id: 'overpass-br',
    name: 'Overpass API · OSM Brasil',
    category: 'Geografia',
    description: 'Consulta bruta ao OpenStreetMap via Overpass QL (ex.: escolas em São Paulo).',
    url:
      'https://overpass-api.de/api/interpreter?data=[out:json];area["name"="São Paulo"]["admin_level"="6"]->.a;(node["amenity"="school"](area.a););out count;',
    headers: { 'User-Agent': 'LandMap/1.0' },
    docs: 'https://overpass-api.de/',
  },
  {
    id: 'wikidata-sp',
    name: 'Wikidata · São Paulo',
    category: 'Geografia',
    description: 'Dados estruturados da Wikidata sobre a cidade de São Paulo.',
    url: 'https://www.wikidata.org/wiki/Special:EntityData/Q174.json',
    docs: 'https://www.wikidata.org/wiki/Wikidata:Data_access',
  },
  {
    id: 'ibge-pib-mun',
    name: 'IBGE · PIB dos municípios',
    category: 'Geografia',
    description: 'Séries de PIB municipal por ano e UF.',
    url: 'https://servicodados.ibge.gov.br/api/v1/pib/municipios/SP/2021',
    docs: 'https://servicodados.ibge.gov.br/api/docs/pib',
  },
  {
    id: 'sidra-pib',
    name: 'SIDRA · PIB municipal (tabela 5938)',
    category: 'Geografia',
    description: 'Valores do PIB de uma cidade via API SIDRA do IBGE.',
    url: 'https://apisidra.ibge.gov.br/values/t/5938/n6/3550308/v/37/p/2021',
    docs: 'https://apisidra.ibge.gov.br/',
  },

  // ── Clima ───────────────────────────────────────────────────
  {
    id: 'open-meteo',
    name: 'Open-Meteo · Previsão',
    category: 'Clima',
    description: 'Previsão do tempo gratuita e sem chave por coordenadas.',
    url: `https://api.open-meteo.com/v1/forecast?latitude=-23.55&longitude=-46.63&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=America/Sao_Paulo`,
    docs: 'https://open-meteo.com/en/docs',
  },
  {
    id: 'wttr',
    name: 'wttr.in · Clima em São Paulo',
    category: 'Clima',
    description: 'Previsão em formato JSON (j1) para qualquer cidade do Brasil.',
    url: 'https://wttr.in/Sao+Paulo?format=j1',
    headers: { 'User-Agent': 'LandMap/1.0' },
    docs: 'https://github.com/chubin/wttr.in',
  },
  {
    id: 'inmet-aviso',
    name: 'INMET · Avisos de risco',
    category: 'Clima',
    description: 'Avisos meteorológicos de risco do Instituto Nacional de Meteorologia.',
    url: 'https://apiprevmet3.inmet.gov.br/avisos/risco/20260808',
    docs: 'https://portal.inmet.gov.br/',
  },
  {
    id: 'cptec-previsao',
    name: 'CPTEC/INPE · Previsão 7 dias',
    category: 'Clima',
    description: 'Previsão de 7 dias para uma cidade (código 2441 = São Paulo) do CPTEC.',
    url: 'https://api.cptec.inpe.br/v1/cidade/2441/previsao.json',
    docs: 'https://portal.cptec.inpe.br/',
  },
  {
    id: 'inpe-queimadas',
    name: 'INPE · Queimadas (focos)',
    category: 'Clima',
    description: 'Focos de calor dos últimos dias via Programa Queimadas do INPE.',
    url: 'https://queimadas.dgi.inpe.br/queimadas/portal/focos/json/dias/1',
    docs: 'https://queimadas.dgi.inpe.br/queimadas/portal',
  },

  // ── Economia / Financeiro ───────────────────────────────────
  {
    id: 'brasilapi-taxas',
    name: 'BrasilAPI · Taxas (Selic/CDI/IPCA)',
    category: 'Economia',
    description: 'Taxas básicas do Brasil: Selic, CDI, IPCA, entre outras.',
    url: 'https://brasilapi.com.br/api/taxas/v1',
    docs: 'https://brasilapi.com.br/docs',
  },
  {
    id: 'bcb-selic',
    name: 'Banco Central · Selic (SGS 11)',
    category: 'Economia',
    description: 'Série histórica da taxa Selic via SGS do Bacen.',
    url: 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados/ultimos/12?formato=json',
    headers: { Accept: 'application/json' },
    docs: 'https://dados.gov.br/dataset/serie-historica-da-taxa-selic',
  },
  {
    id: 'bcb-ipca',
    name: 'Banco Central · IPCA (SGS 433)',
    category: 'Economia',
    description: 'Série do IPCA (índice oficial de inflação) via SGS.',
    url: 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/12?formato=json',
    headers: { Accept: 'application/json' },
    docs: 'https://dados.gov.br/dataset/bacen-sgs',
  },
  {
    id: 'bcb-cambio',
    name: 'Banco Central · Câmbio (SGS 1)',
    category: 'Economia',
    description: 'Cotação histórica do dólar (Compra) via SGS.',
    url: 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados/ultimos/5?formato=json',
    headers: { Accept: 'application/json' },
    docs: 'https://dados.gov.br/dataset/bacen-sgs',
  },
  {
    id: 'bcb-ptax',
    name: 'Banco Central · PTAX (OData)',
    category: 'Economia',
    description: 'Cotações PTAX via serviço OData Olinda do Bacen.',
    url: 'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacoesMoedas?$top=5&$format=json',
    docs: 'https://olinda.bcb.gov.br/olinda',
  },
  {
    id: 'bcb-estabilidade',
    name: 'Banco Central · Estabilidade de preços',
    category: 'Economia',
    description: 'Série de estatísticas de inflação/estabilidade (SGS 4189).',
    url: 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.4189/dados/ultimos/12?formato=json',
    headers: { Accept: 'application/json' },
    docs: 'https://dados.gov.br/dataset/bacen-sgs',
  },
  {
    id: 'sidra-ipca',
    name: 'SIDRA · IPCA (tabela 1736)',
    category: 'Economia',
    description: 'IPCA nacional por mês via API SIDRA.',
    url: 'https://apisidra.ibge.gov.br/values/t/1736/n1/1/v/63/p/last/12/c315/7169',
    docs: 'https://apisidra.ibge.gov.br/',
  },
  {
    id: 'ipea-indicadores',
    name: 'IpeaData · Indicadores',
    category: 'Economia',
    description: 'Catálogo de indicadores macroeconômicos do Ipea.',
    url: 'https://ipeadata.gov.br/api/odata4/Indicadores?$top=5',
    docs: 'https://ipeadata.gov.br/',
  },
  {
    id: 'transparencia-despesas',
    name: 'Portal da Transparência · Despesas',
    category: 'Economia',
    description: 'Despesas públicas federais por ano (demo; algumas rotas pedem token opcional).',
    url: 'https://api.portaldatransparencia.gov.br/api-de-dados/despesas/2026?pagina=1',
    docs: 'https://api.portaldatransparencia.gov.br/',
  },

  // ── Governo ─────────────────────────────────────────────────
  {
    id: 'camara-deputados',
    name: 'Câmara · Deputados',
    category: 'Governo',
    description: 'Lista de deputados federais via dados abertos da Câmara.',
    url: 'https://dadosabertos.camara.leg.br/api/v2/deputados?itens=5&ordenarPor=nome',
    headers: { Accept: 'application/json' },
    docs: 'https://dadosabertos.camara.leg.br/swagger/api.html',
  },
  {
    id: 'senado-senadores',
    name: 'Senado · Senadores',
    category: 'Governo',
    description: 'Lista de senadores em exercício via dados abertos do Senado.',
    url: 'https://legis.senado.leg.br/dadosabertos/senador/lista/atual.json',
    docs: 'https://www12.senado.leg.br/dados-abertos',
  },
  {
    id: 'ibge-projecao-pop',
    name: 'IBGE · Projeção populacional',
    category: 'Governo',
    description: 'Projeções de população por UF (Séries 2010-2060).',
    url: 'https://servicodados.ibge.gov.br/api/v1/projecoes/populacao/estados/SP',
    docs: 'https://servicodados.ibge.gov.br/api/docs/projecoes',
  },
  {
    id: 'tse-resultados',
    name: 'TSE · Localizações eleitorais',
    category: 'Governo',
    description: 'Metadados de localização das eleições do TSE.',
    url: 'https://resultados.tse.jus.br/eleicoes/eleicoes/2022/2022/obter-localizacoes.json',
    docs: 'https://resultados.tse.jus.br/',
  },
  {
    id: 'dadosgov',
    name: 'Dados.gov.br · Conjuntos',
    category: 'Governo',
    description: 'Catálogo nacional de dados abertos do governo federal.',
    url: 'https://dados.gov.br/api/publico/conjuntos-dados?pagina=1',
    docs: 'https://dados.gov.br/',
  },
  {
    id: 'planalto-lex',
    name: 'Presidência · Legislação',
    category: 'Governo',
    description: 'Busca de normas e atos na LEGI Informação da Presidência.',
    url: 'https://www.planalto.gov.br/legislacao/legislacao.nsf/VietLex?OpenView',
    docs: 'https://www.planalto.gov.br/',
  },

  // ── Telecom ─────────────────────────────────────────────────
  {
    id: 'brasilapi-ddd',
    name: 'BrasilAPI · DDD',
    category: 'Telecom',
    description: 'Mapeia um DDD ao seu estado e cidades atendidas.',
    url: `https://brasilapi.com.br/api/ddd/v1/${SAMPLE_DDD}`,
    docs: 'https://brasilapi.com.br/docs',
  },
  {
    id: 'anatel-faixas',
    name: 'Anatel · Faixas de frequência',
    category: 'Telecom',
    description: 'Consulta pública de faixas de radiofrequência da Anatel.',
    url: 'https://sistemas.anatel.gov.br/SIEnc/consulta/publico/json/consultaFiltrada',
    docs: 'https://www.anatel.gov.br/',
  },
  {
    id: 'ip-api',
    name: 'ip-api · Geo por IP',
    category: 'Telecom',
    description: 'Localização geográfica aproximada a partir de um endereço IP.',
    url: 'http://ip-api.com/json/',
    docs: 'https://ip-api.com/docs',
  },
  {
    id: 'ipinfo',
    name: 'ipinfo · Dados de IP',
    category: 'Telecom',
    description: 'Informações de rede (ASN, cidade, org) a partir do IP de origem.',
    url: 'https://ipinfo.io/json',
    docs: 'https://ipinfo.io/developers',
  },

  // ── Imobiliário ─────────────────────────────────────────────
  {
    id: 'brasilapi-cep',
    name: 'BrasilAPI · CEP',
    category: 'Imobiliário',
    description: 'Busca de endereço por CEP (sem chave) via BrasilAPI.',
    url: `https://brasilapi.com.br/api/cep/v1/${SAMPLE_CEP}`,
    docs: 'https://brasilapi.com.br/docs',
  },
  {
    id: 'viacep',
    name: 'ViaCEP',
    category: 'Imobiliário',
    description: 'Busca de endereço por CEP (ViaCEP, open-source).',
    url: `https://viacep.com.br/ws/${SAMPLE_CEP}/json/`,
    docs: 'https://viacep.com.br/',
  },
  {
    id: 'brasilapi-cnpj',
    name: 'BrasilAPI · CNPJ',
    category: 'Imobiliário',
    description: 'Dados cadastrais de empresas por CNPJ.',
    url: `https://brasilapi.com.br/api/cnpj/v1/${SAMPLE_CNPJ}`,
    docs: 'https://brasilapi.com.br/docs',
  },
  {
    id: 'receitaws-cnpj',
    name: 'ReceitaWS · CNPJ',
    category: 'Imobiliário',
    description: 'Consulta alternativa de CNPJ (limite de requisições por dia).',
    url: `https://www.receitaws.com.br/v1/cnpj/${SAMPLE_CNPJ}`,
    docs: 'https://receitaws.com.br/',
  },

  // ── Utilidades ──────────────────────────────────────────────
  {
    id: 'brasilapi-bancos',
    name: 'BrasilAPI · Bancos',
    category: 'Utilidades',
    description: 'Lista de instituições bancárias do Brasil (ISP, código, nome).',
    url: 'https://brasilapi.com.br/api/banks/v1',
    docs: 'https://brasilapi.com.br/docs',
  },
  {
    id: 'brasilapi-feriados',
    name: 'BrasilAPI · Feriados',
    category: 'Utilidades',
    description: 'Feriados nacionais de um ano (útil para fechamento de negócios).',
    url: 'https://brasilapi.com.br/api/feriados/v1/2026',
    docs: 'https://brasilapi.com.br/docs',
  },
  {
    id: 'brasilapi-fipe',
    name: 'BrasilAPI · Tabelas FIPE',
    category: 'Utilidades',
    description: 'Tabelas de referência de preços de veículos (FIPE).',
    url: 'https://brasilapi.com.br/api/fipe/tabelas/v1',
    docs: 'https://brasilapi.com.br/docs',
  },
  {
    id: 'wikipedia-sp',
    name: 'Wikipedia REST · São Paulo',
    category: 'Utilidades',
    description: 'Resumo de artigo da Wikipedia em PT-BR (REST API).',
    url: 'https://pt.wikipedia.org/api/rest_v1/page/summary/S%C3%A3o_Paulo',
    docs: 'https://www.mediawiki.org/wiki/Wikimedia_REST_API',
  },
  {
    id: 'geonames-br',
    name: 'GeoNames · Busca BR',
    category: 'Utilidades',
    description: 'Busca geográfica global (conta demo; limite diário de créditos).',
    url: 'http://api.geonames.org/searchJSON?q=Sao+Paulo&country=BR&maxRows=3&username=demo',
    docs: 'https://www.geonames.org/export/web-services.html',
  },
  {
    id: 'open-charge',
    name: 'Open Charge Map · BR',
    category: 'Utilidades',
    description: 'Pontos de recarga de veículos elétricos no Brasil (sem chave na query pública).',
    url: 'https://api.openchargemap.io/v3/poi/?countrycode=BR&maxresults=5&compact=true',
    docs: 'https://openchargemap.org/site/develop/api',
  },
  {
    id: 'covid-brasil',
    name: 'COVID-19 · Brasil (opendatasus)',
    category: 'Utilidades',
    description: 'Séries históricas de COVID-19 do OpenDataSUS.',
    url: 'https://covid19-download.herokuapp.com/api/download/cases?format=json&dates=2022-01-01&place_name=Brazil',
    docs: 'https://opendatasus.saude.gov.br/',
  },
  {
    id: 'bcb-sgs-igpm',
    name: 'Banco Central · IGP-M (SGS 189)',
    category: 'Utilidades',
    description: 'Série do índice IGP-M via SGS do Bacen.',
    url: 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.189/dados/ultimos/12?formato=json',
    headers: { Accept: 'application/json' },
    docs: 'https://dados.gov.br/dataset/bacen-sgs',
  },
  {
    id: 'anatel-cadastro',
    name: 'Anatel · Cadastro de estações',
    category: 'Utilidades',
    description: 'Consulta pública de cadastro de estações da Anatel.',
    url: 'https://sistemas.anatel.gov.br/SIEnc/consulta/publico/json/consultaFiltrada',
    docs: 'https://www.anatel.gov.br/',
  },
];

export const BR_API_CATEGORIES = [
  'Geografia',
  'Clima',
  'Economia',
  'Governo',
  'Telecom',
  'Imobiliário',
  'Utilidades',
] as const;

export function getBrApi(id: string): BrApi | undefined {
  return BR_APIS.find((a) => a.id === id);
}
