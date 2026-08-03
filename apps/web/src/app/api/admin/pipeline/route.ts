import { NextRequest } from 'next/server';

type PipelineStage = {
  key: 'Novo' | 'Contatado' | 'Agendou Visita' | 'Negociação' | 'Fechado' | 'Perdido';
  label: string;
  count: number;
  value: number;
  conversionPct: number;
};

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const minScore = Number(url.searchParams.get('minScore') || 0);

    // Leads vivem em memória compartilhada (globalThis) — sem self-fetch para evitar URL dupla.
    const memory = globalThis as unknown as {
      landmapLeads?: Array<Record<string, any>>;
    };
    const items = (memory.landmapLeads || []).filter(
      (l) => (Number(l.score) || 0) >= minScore,
    );

    const stages: PipelineStage[] = [
      { key: 'Novo', label: 'Novo', count: 0, value: 0, conversionPct: 0 },
      { key: 'Contatado', label: 'Contatado', count: 0, value: 0, conversionPct: 0 },
      { key: 'Agendou Visita', label: 'Visita', count: 0, value: 0, conversionPct: 0 },
      { key: 'Negociação', label: 'Negociação', count: 0, value: 0, conversionPct: 0 },
      { key: 'Fechado', label: 'Fechado', count: 0, value: 0, conversionPct: 0 },
      { key: 'Perdido', label: 'Perdido', count: 0, value: 0, conversionPct: 0 },
    ];

    const stageIndex = new Map<string, number>();
    stages.forEach((s, i) => stageIndex.set(s.key, i));

    const totalLeads = items.length;
    let closedValue = 0;
    for (const item of items) {
      const stageKey = String(item.stage || 'Novo');
      const idx = stageIndex.get(stageKey);
      if (idx == null) continue;
      stages[idx].count += 1;
      const price = Number(item?.propertyInterest ? 350000 : 220000);
      stages[idx].value += price;
      if (stageKey === 'Fechado') closedValue += price;
    }

    for (const stage of stages) {
      stage.conversionPct =
        totalLeads > 0 ? Number(((stage.count / totalLeads) * 100).toFixed(1)) : 0;
    }

    return Response.json({
      stages,
      summary: {
        totalLeads,
        closedValue,
        avgLeadValue: totalLeads > 0 ? Number((closedValue / totalLeads).toFixed(0)) : 0,
      },
      filters: { minScore },
    });
  } catch (error) {
    return Response.json({ error: 'falha ao montar pipeline' }, { status: 500 });
  }
}
