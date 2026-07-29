import { NextRequest } from 'next/server';
import { apiUrl } from '../../../../lib/api';

const memory = globalThis as unknown as {
  landmapLeads?: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    score: number;
    stage: string;
    propertyInterest: string;
    source?: string;
    createdAt: string;
  }>;
};

if (!memory.landmapLeads) {
  memory.landmapLeads = [];
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const stage = url.searchParams.get('stage');
    const all = memory.landmapLeads ?? [];
    const items = stage ? all.filter((l) => l.stage === stage) : all;
    return Response.json({ items, total: all.length, stage: stage || null });
  } catch (error) {
    return Response.json({ error: 'falha ao buscar leads' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim();
    const phone = String(body?.phone || '').trim();
    const score = Number(body?.score || 0);
    const stage = String(body?.stage || 'Novo');
    const propertyInterest = String(body?.propertyInterest || '');
    const source = String(body?.source || 'admin');

    if (!name || !email || !phone) {
      return Response.json({ error: 'nome, email e telefone são obrigatórios' }, { status: 422 });
    }

    const lead = {
      id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      email,
      phone,
      score: Math.min(100, Math.max(0, score || 0)),
      stage: ['Novo', 'Contatado', 'Agendou Visita', 'Negociação', 'Fechado', 'Perdido'].includes(stage)
        ? stage
        : 'Novo',
      propertyInterest,
      source,
      createdAt: new Date().toISOString(),
    };

    memory.landmapLeads?.unshift(lead);
    return Response.json({ item: lead }, { status: 201 });
  } catch (error) {
    return Response.json({ error: 'falha ao criar lead' }, { status: 500 });
  }
}
