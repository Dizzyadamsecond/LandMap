import { NextRequest } from 'next/server';
import { apiUrl } from '../../../../../lib/api';

const memory = globalThis as unknown as {
  landmapLeads?: Array<{ id: string } & Record<string, any>>;
};

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lead = memory.landmapLeads?.find((l) => l.id === id);
    if (!lead) return Response.json({ error: 'lead não encontrado' }, { status: 404 });
    return Response.json({ item: lead });
  } catch (error) {
    return Response.json({ error: 'falha ao buscar lead' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const leads = memory.landmapLeads || [];
    const idx = leads.findIndex((l) => l.id === id);
    if (idx === -1) return Response.json({ error: 'lead não encontrado' }, { status: 404 });

    const allowedFields = ['name', 'email', 'phone', 'score', 'stage', 'propertyInterest', 'source'] as const;
    const updated = { ...leads[idx] };
    for (const key of allowedFields) {
      if (key in body) updated[key] = body[key];
    }
    if (updated.stage && !['Novo', 'Contatado', 'Agendou Visita', 'Negociação', 'Fechado', 'Perdido'].includes(updated.stage)) {
      updated.stage = leads[idx].stage;
    }

    leads[idx] = updated;
    return Response.json({ item: updated });
  } catch (error) {
    return Response.json({ error: 'falha ao atualizar lead' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leads = memory.landmapLeads || [];
    const idx = leads.findIndex((l) => l.id === id);
    if (idx === -1) return Response.json({ error: 'lead não encontrado' }, { status: 404 });
    const removed = leads.splice(idx, 1)[0];
    return Response.json({ item: removed });
  } catch (error) {
    return Response.json({ error: 'falha ao remover lead' }, { status: 500 });
  }
}
