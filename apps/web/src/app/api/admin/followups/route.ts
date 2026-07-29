import { NextRequest } from 'next/server';
import { apiUrl } from '../../../../lib/api';

const memory = globalThis as unknown as {
  landmapFollowups?: Array<{
    id: string;
    leadId: string;
    leadName: string;
    channel: 'whatsapp' | 'email' | 'sms';
    template: string;
    status: 'pending' | 'sent' | 'failed';
    dueAt: string;
    result?: string;
  }>;
};

if (!memory.landmapFollowups) {
  memory.landmapFollowups = [];
}

export const dynamic = 'force-dynamic';

export async function GET() {
  const { searchParams } = new URL('http://x');
  const leadId = searchParams.get('leadId');
  const status = searchParams.get('status');
  let items = memory.landmapFollowups ?? [];
  if (leadId) items = items.filter((f) => f.leadId === leadId);
  if (status) items = items.filter((f) => f.status === status);
  return Response.json({ items, total: items.length });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const leadId = String(body?.leadId || '').trim();
    const leadName = String(body?.leadName || '').trim();
    const channel = String(body?.channel || 'whatsapp');
    const template = String(body?.template || '').trim();
    const dueAt = String(body?.dueAt || '').trim();

    if (!leadId || !leadName || !template || !dueAt) {
      return Response.json({ error: 'leadId, leadName, channel, template e dueAt são obrigatórios' }, { status: 422 });
    }

    const item = {
      id: `fu-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      leadId,
      leadName,
      channel: ['whatsapp', 'email', 'sms'].includes(channel) ? (channel as 'whatsapp' | 'email' | 'sms') : 'whatsapp',
      template,
      status: 'pending' as const,
      dueAt,
    };

    memory.landmapFollowups?.unshift(item);
    return Response.json({ item }, { status: 201 });
  } catch (error) {
    return Response.json({ error: 'falha ao criar follow-up' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const id = String(body?.id || '').trim();
    const items = memory.landmapFollowups || [];
    const idx = items.findIndex((f) => f.id === id);
    if (idx === -1) return Response.json({ error: 'follow-up não encontrado' }, { status: 404 });

    const allowed = ['status', 'result', 'template', 'dueAt'] as const;
    const updated = { ...items[idx] };
    for (const key of allowed) {
      if (key in body) updated[key] = body[key];
    }
    if (updated.status && !['pending', 'sent', 'failed'].includes(updated.status)) {
      updated.status = items[idx].status;
    }

    items[idx] = updated;
    return Response.json({ item: updated });
  } catch (error) {
    return Response.json({ error: 'falha ao atualizar follow-up' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = String(searchParams.get('id') || '').trim();
    const items = memory.landmapFollowups || [];
    const idx = items.findIndex((f) => f.id === id);
    if (idx === -1) return Response.json({ error: 'follow-up não encontrado' }, { status: 404 });
    const removed = items.splice(idx, 1)[0];
    return Response.json({ item: removed });
  } catch (error) {
    return Response.json({ error: 'falha ao remover follow-up' }, { status: 500 });
  }
}
