import { NextRequest } from 'next/server';
import { apiUrl } from '../../../../lib/api';

const memory = globalThis as unknown as {
  landmapScoutJobs?: Array<{
    id: string;
    name: string;
    source: 'google' | 'linkedin' | 'instagram' | 'facebook' | 'custom';
    query: string;
    location?: string;
    status: 'idle' | 'running' | 'paused' | 'done' | 'failed';
    leadsFound: number;
    lastRunAt?: string;
    createdAt?: string;
    filters?: {
      cities?: string[];
      states?: string[];
      niches?: string[];
      leadTypes?: string[];
      limit?: number;
      throttleMs?: number;
    };
    stats?: {
      processed: number;
      found: number;
      duplicates: number;
      enriched: number;
      exported: number;
    };
    logs?: Array<{ time: string; message: string }>;
  }>;
  landmapScoutLeads?: Array<{
    id: string;
    jobId: string;
    source: string;
    name: string;
    type: 'construtora' | 'imobiliaria' | 'corretor' | 'incorporadora';
    cnpj?: string;
    phone?: string;
    email?: string;
    site?: string;
    address?: string;
    city?: string;
    state?: string;
    responsible?: string;
    social?: { instagram?: string; facebook?: string; linkedin?: string };
    score: number;
    status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
    raw: any;
  }>;
};

if (!memory.landmapScoutJobs) memory.landmapScoutJobs = [];
if (!memory.landmapScoutLeads) memory.landmapScoutLeads = [];

export const dynamic = 'force-dynamic';

function nowISO() {
  return new Date().toISOString();
}

function log(jobId: string, message: string) {
  const jobs = memory.landmapScoutJobs || [];
  const job = jobs.find((j) => j.id === jobId);
  if (!job) return;
  job.logs = job.logs || [];
  job.logs.unshift({ time: nowISO(), message });
  if (job.logs.length > 200) job.logs.length = 200;
}

export async function GET() {
  const items = (memory.landmapScoutJobs || []).map(({ logs, ...rest }) => rest);
  return Response.json({ items, total: items.length });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body?.name || '').trim();
    const source = String(body?.source || 'google');
    const query = String(body?.query || '').trim();
    const location = String(body?.location || '').trim();
    const filters = body?.filters || {};

    if (!name || !query) {
      return Response.json({ error: 'name e query são obrigatórios' }, { status: 422 });
    }

    const job = {
      id: `scout-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      source: ['google', 'linkedin', 'instagram', 'facebook', 'custom'].includes(source)
        ? (source as typeof source)
        : 'google',
      query,
      location: location || undefined,
      status: 'idle' as const,
      leadsFound: 0,
      createdAt: nowISO(),
      filters: {
        cities: Array.isArray(filters?.cities) ? filters.cities.slice(0, 200) : [],
        states: Array.isArray(filters?.states) ? filters.states.slice(0, 60) : [],
        niches: Array.isArray(filters?.niches) ? filters.niches.slice(0, 50) : [],
        leadTypes: Array.isArray(filters?.leadTypes) ? filters.leadTypes.slice(0, 20) : [],
        limit: Number(filters?.limit || 200),
        throttleMs: Number(filters?.throttleMs || 250),
      },
      stats: {
        processed: 0,
        found: 0,
        duplicates: 0,
        enriched: 0,
        exported: 0,
      },
      logs: [{ time: nowISO(), message: 'Job criado' }],
    };

    memory.landmapScoutJobs?.unshift(job);
    return Response.json({ item: job }, { status: 201 });
  } catch {
    return Response.json({ error: 'falha ao criar job' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const id = String(body?.id || '').trim();
    const items = memory.landmapScoutJobs || [];
    const idx = items.findIndex((j) => j.id === id);
    if (idx === -1) return Response.json({ error: 'job não encontrado' }, { status: 404 });

    const allowed = ['status', 'leadsFound', 'lastRunAt', 'filters', 'query', 'location', 'name', 'stats', 'logs'] as const;
    const updated = { ...items[idx] };
    const patchBody = body as Record<string, unknown>;
    for (const key of allowed) {
      if (key in patchBody) (updated as Record<string, unknown>)[key] = patchBody[key];
    }

    items[idx] = updated;
    return Response.json({ item: updated });
  } catch {
    return Response.json({ error: 'falha ao atualizar job' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = String(searchParams.get('id') || '').trim();
    const items = memory.landmapScoutJobs || [];
    const idx = items.findIndex((j) => j.id === id);
    if (idx === -1) return Response.json({ error: 'job não encontrado' }, { status: 404 });
    const removed = items.splice(idx, 1)[0];
    return Response.json({ item: removed });
  } catch {
    return Response.json({ error: 'falha ao remover job' }, { status: 500 });
  }
}
