import { NextRequest } from 'next/server';
import { apiUrl } from '../../../../../lib/api';

const memory = globalThis as unknown as {
  landmapScoutJobs?: Array<any>;
};

export const dynamic = 'force-dynamic';

function jitterInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const TYPES = ['construtora','imobiliaria','corretor','incorporadora'] as const;
const STREET = ['Av. Paulista','R. Oscar Freire','Av. Brigadeiro Faria Lima','R. das Flores','Av. Brasil','Rod. BR-116'];
const CITY_STATE = [
  { city: 'São Paulo', state: 'SP' },
  { city: 'Rio de Janeiro', state: 'RJ' },
  { city: 'Curitiba', state: 'PR' },
  { city: 'Belo Horizonte', state: 'MG' },
  { city: 'Porto Alegre', state: 'RS' },
  { city: 'Florianópolis', state: 'SC' },
  { city: 'Campinas', state: 'SP' },
  { city: 'Santos', state: 'SP' },
  { city: 'Londrina', state: 'PR' },
  { city: 'Maringá', state: 'PR' },
  { city: 'Juiz de Fora', state: 'MG' },
  { city: 'Salvador', state: 'BA' },
  { city: 'Recife', state: 'PE' },
  { city: 'Fortaleza', state: 'CE' },
  { city: 'Belém', state: 'PA' },
];

function buildLead(jobId: string, overrides: any = {}) {
  const type = overrides.type || pick([...TYPES]);
  const location = pick(CITY_STATE);
  const first = pick(['Imob','Lote','Urban','Prime','Nex','Top','Max','Alpha','Beta','Delta','Fort','Sul','Nord','Centro','Vista','Torre','Valle','Monte','Mar','Sol']);
  const last = pick(['Invest','Imóveis','Empreendimentos','Construções','Properties','Habitat','Prime','Group','S/A','LTDA','Place','City','Home','Life']);
  const name = `${first} ${last}`;
  const cnpj = `${jitterInt(10,99)}.${jitterInt(100,999)}.${jitterInt(100,999)}-${jitterInt(10,99)}`;
  const phone = `(11) 9${jitterInt(9000,9999)}-${jitterInt(1000,9999)}`;
  const email = `${first.toLowerCase()}${last.toLowerCase()}@contato.com.br`;
  const site = `https://${first.toLowerCase()}${last.toLowerCase()}.com.br`;
  const address = `${jitterInt(100,9999)} ${pick(STREET)}`;
  const responsible = `${pick(['Ana','Bruno','Carlos','Daniela','Eduardo','Fernanda','Gustavo','Helena','Igor','Juliana','Kléber','Larissa'])} ${pick(['Silva','Santos','Oliveira','Lima','Pereira','Costa','Ferreira','Ribeiro','Almeida','Souza'])}`;

  return {
    id: `lead-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    jobId,
    source: 'scout',
    name,
    type,
    cnpj,
    phone,
    email,
    site,
    address,
    city: overrides.city || location.city,
    state: overrides.state || location.state,
    responsible,
    social: {
      instagram: `@${first.toLowerCase()}${last.toLowerCase()}`,
      linkedin: `https://linkedin.com/company/${first.toLowerCase()}-${last.toLowerCase()}`,
      facebook: `https://facebook.com/${first.toLowerCase()}${last.toLowerCase()}`
    },
    score: jitterInt(60,98),
    status: 'new',
    raw: { generatedAt: new Date().toISOString() }
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const jobId = String(body?.jobId || '').trim();
    const items = memory.landmapScoutJobs || [];
    const job = items.find((j) => j.id === jobId);
    if (!job) return Response.json({ error: 'job não encontrado' }, { status: 404 });

    const limit = Math.min(Number(job.filters?.limit || 50), 500);
    const generated: any[] = [];
    for (let i = 0; i < limit; i += 1) {
      generated.push(buildLead(jobId, {}));
    }

    job.lastRunAt = new Date().toISOString();
    job.status = 'done';
    job.leadsFound = (job.leadsFound || 0) + generated.length;
    job.stats = {
      processed: (job.stats?.processed || 0) + generated.length,
      found: (job.stats?.found || 0) + generated.length,
      duplicates: 0,
      enriched: generated.length,
      exported: 0,
    };
    job.logs = job.logs || [];
    job.logs.unshift({ time: new Date().toISOString(), message: `Executado: ${generated.length} leads` });
    if (job.logs.length > 200) job.logs.length = 200;

    const mem = globalThis as any;
    mem.landmapScoutLeads = mem.landmapScoutLeads || [];
    mem.landmapScoutLeads.unshift(...generated);
    if ((mem.landmapScoutLeads || []).length > 20000) mem.landmapScoutLeads.length = 20000;

    return Response.json({ success: true, generated: generated.length, sample: generated.slice(0,5) });
  } catch {
    return Response.json({ error: 'falha ao executar job' }, { status: 500 });
  }
}
