import { NextRequest } from 'next/server';
import { apiUrl } from '../../../../lib/api';

const memory = (globalThis as any).__landmapScoutMemory ?? ((globalThis as any).__landmapScoutMemory = {
  landmapScoutJobs: [],
  landmapScoutLeads: [],
});

function nowISO() {
  return new Date().toISOString();
}

function log(jobId: string, message: string) {
  const jobs = memory.landmapScoutJobs || [];
  const job = jobs.find((j: any) => j.id === jobId);
  if (!job) return;
  job.logs = job.logs || [];
  job.logs.unshift({ time: nowISO(), message });
  if (job.logs.length > 200) job.logs.length = 200;
}

export const dynamic = 'force-dynamic';

export async function GET() {
  const items = (memory.landmapScoutJobs || []).map(({ logs, ...rest }: any) => rest);
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
        ? (source as 'google' | 'linkedin' | 'instagram' | 'facebook' | 'custom')
        : 'google',
      query,
      location: location || undefined,
      status: 'idle' as const,
      leadsFound: 0,
      createdAt: nowISO(),
      filters: {
        cities: Array.isArray(filters?.cities) ? filters?.cities.slice(0, 200) : [],
        states: Array.isArray(filters?.states) ? filters?.states.slice(0, 60) : [],
        niches: Array.isArray(filters?.niches) ? filters?.niches.slice(0, 50) : [],
        leadTypes: Array.isArray(filters?.leadTypes) ? filters?.leadTypes.slice(0, 20) : [],
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
    const index = items.findIndex((j: any) => j.id === id);
    if (index === -1) return Response.json({ error: 'job não encontrado' }, { status: 404 });

    const current = items[index];
    const next = {
      ...current,
      ...body,
      id: current.id,
      filters: { ...current.filters, ...(body?.filters || {}) },
      stats: { ...current.stats, ...(body?.stats || {}) },
    };

    items[index] = next;
    return Response.json({ item: next });
  } catch {
    return Response.json({ error: 'falha ao atualizar job' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = String(request.nextUrl.searchParams.get('id') || '').trim();
    if (!id) return Response.json({ error: 'id obrigatório' }, { status: 422 });
    const items = memory.landmapScoutJobs || [];
    const index = items.findIndex((j: any) => j.id === id);
    if (index === -1) return Response.json({ error: 'job não encontrado' }, { status: 404 });
    items.splice(index, 1);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'falha ao remover job' }, { status: 500 });
  }
}
