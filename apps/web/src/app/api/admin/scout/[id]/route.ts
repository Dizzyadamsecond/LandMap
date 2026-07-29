import { NextRequest } from 'next/server';
import { apiUrl } from '../../../../../lib/api';

const memory = globalThis as unknown as {
  landmapScoutJobs?: Array<any>;
};

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const id = String(new URL(request.url).pathname.split('/').filter(Boolean).pop() || '').trim();
    const items = memory.landmapScoutJobs || [];
    const job = items.find((j) => j.id === id);
    if (!job) return Response.json({ error: 'job não encontrado' }, { status: 404 });
    return Response.json({ item: job });
  } catch {
    return Response.json({ error: 'falha ao carregar job' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const id = String(new URL(request.url).pathname.split('/').filter(Boolean).pop() || '').trim();
    const body = await request.json();
    const items = memory.landmapScoutJobs || [];
    const idx = items.findIndex((j) => j.id === id);
    if (idx === -1) return Response.json({ error: 'job não encontrado' }, { status: 404 });

    const allowed = ['status', 'leadsFound', 'lastRunAt', 'filters', 'query', 'location', 'name', 'stats', 'logs', 'createdAt'] as const;
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
    const id = String(new URL(request.url).pathname.split('/').filter(Boolean).pop() || '').trim();
    const items = memory.landmapScoutJobs || [];
    const idx = items.findIndex((j) => j.id === id);
    if (idx === -1) return Response.json({ error: 'job não encontrado' }, { status: 404 });
    const removed = items.splice(idx, 1)[0];
    return Response.json({ item: removed });
  } catch {
    return Response.json({ error: 'falha ao remover job' }, { status: 500 });
  }
}
