import { NextRequest } from 'next/server';
import { apiUrl } from '../../../../lib/api';

const memory = globalThis as unknown as {
  landmapVisits?: Array<{
    id: string;
    leadId: string;
    leadName: string;
    propertyTitle: string;
    scheduledAt: string;
    status: 'scheduled' | 'done' | 'canceled';
    note?: string;
  }>;
};

if (!memory.landmapVisits) {
  memory.landmapVisits = [];
}

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({ items: memory.landmapVisits ?? [] });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const leadId = String(body?.leadId || '').trim();
    const leadName = String(body?.leadName || '').trim();
    const propertyTitle = String(body?.propertyTitle || '').trim();
    const scheduledAt = String(body?.scheduledAt || '').trim();
    const status = String(body?.status || 'scheduled');
    const note = String(body?.note || '').trim();

    if (!leadId || !leadName || !propertyTitle || !scheduledAt) {
      return Response.json({ error: 'leadId, leadName, propertyTitle e scheduledAt são obrigatórios' }, { status: 422 });
    }

    const item = {
      id: `visit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      leadId,
      leadName,
      propertyTitle,
      scheduledAt,
      status: ['scheduled', 'done', 'canceled'].includes(status) ? (status as 'scheduled' | 'done' | 'canceled') : 'scheduled',
      note,
    };

    memory.landmapVisits?.unshift(item);
    return Response.json({ item }, { status: 201 });
  } catch (error) {
    return Response.json({ error: 'falha ao criar visita' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const id = String(body?.id || '').trim();
    const visits = memory.landmapVisits || [];
    const idx = visits.findIndex((v) => v.id === id);
    if (idx === -1) return Response.json({ error: 'visita não encontrada' }, { status: 404 });

    const allowed = ['status', 'note', 'scheduledAt', 'propertyTitle'] as const;
    const updated = { ...visits[idx] };
    const patchBody = body as Record<string, unknown>;
    for (const key of allowed) {
      if (key in patchBody) (updated as Record<string, unknown>)[key] = patchBody[key];
    }
    if (updated.status && !['scheduled', 'done', 'canceled'].includes(updated.status)) {
      updated.status = visits[idx].status;
    }

    visits[idx] = updated;
    return Response.json({ item: updated });
  } catch (error) {
    return Response.json({ error: 'falha ao atualizar visita' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = String(searchParams.get('id') || '').trim();
    const visits = memory.landmapVisits || [];
    const idx = visits.findIndex((v) => v.id === id);
    if (idx === -1) return Response.json({ error: 'visita não encontrada' }, { status: 404 });
    const removed = visits.splice(idx, 1)[0];
    return Response.json({ item: removed });
  } catch (error) {
    return Response.json({ error: 'falha ao remover visita' }, { status: 500 });
  }
}
