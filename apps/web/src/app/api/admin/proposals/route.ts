import { NextRequest } from 'next/server';
import { apiUrl } from '../../../../lib/api';

const memory = globalThis as unknown as {
  landmapProposals?: Array<{
    id: string;
    leadId: string;
    leadName: string;
    propertyTitle: string;
    amount: number;
    status: 'draft' | 'sent' | 'accepted' | 'rejected';
    dueAt?: string;
    body: string;
  }>;
};

if (!memory.landmapProposals) {
  memory.landmapProposals = [];
}

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({ items: memory.landmapProposals ?? [] });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const leadId = String(body?.leadId || '').trim();
    const leadName = String(body?.leadName || '').trim();
    const propertyTitle = String(body?.propertyTitle || '').trim();
    const amount = Number(body?.amount || 0);
    const status = String(body?.status || 'draft');
    const dueAt = String(body?.dueAt || '').trim();
    const text = String(body?.body || body?.text || '').trim();

    if (!leadId || !leadName || !propertyTitle || !text) {
      return Response.json({ error: 'leadId, leadName, propertyTitle e body são obrigatórios' }, { status: 422 });
    }

    const proposal = {
      id: `proposal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      leadId,
      leadName,
      propertyTitle,
      amount: Number.isFinite(amount) ? amount : 0,
      status: ['sent', 'draft', 'accepted', 'rejected'].includes(status) ? (status as 'sent' | 'draft' | 'accepted' | 'rejected') : 'draft',
      dueAt: dueAt || undefined,
      body: text,
    };

    memory.landmapProposals?.unshift(proposal);
    return Response.json({ item: proposal }, { status: 201 });
  } catch (error) {
    return Response.json({ error: 'falha ao criar proposta' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const id = String(body?.id || '').trim();
    const items = memory.landmapProposals || [];
    const idx = items.findIndex((p) => p.id === id);
    if (idx === -1) return Response.json({ error: 'proposta não encontrada' }, { status: 404 });

    const allowed = ['status', 'amount', 'dueAt', 'body', 'leadName', 'propertyTitle'] as const;
    const updated = { ...items[idx] };
    const patchBody = body as Record<string, unknown>;
    for (const key of allowed) {
      if (key in patchBody) (updated as Record<string, unknown>)[key] = patchBody[key];
    }
    if (updated.status && !['draft', 'sent', 'accepted', 'rejected'].includes(updated.status)) {
      updated.status = items[idx].status;
    }

    items[idx] = updated;
    return Response.json({ item: updated });
  } catch (error) {
    return Response.json({ error: 'falha ao atualizar proposta' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = String(searchParams.get('id') || '').trim();
    const items = memory.landmapProposals || [];
    const idx = items.findIndex((p) => p.id === id);
    if (idx === -1) return Response.json({ error: 'proposta não encontrada' }, { status: 404 });
    const removed = items.splice(idx, 1)[0];
    return Response.json({ item: removed });
  } catch (error) {
    return Response.json({ error: 'falha ao remover proposta' }, { status: 500 });
  }
}
