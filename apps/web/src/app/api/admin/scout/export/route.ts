import { NextRequest } from 'next/server';
import { apiUrl } from '../../../../../lib/api';
const memory = globalThis as unknown as {
  landmapScoutLeads?: Array<any>;
};

export const dynamic = 'force-dynamic';

function toCsvRow(obj: any) {
  const values = [
    obj.id,
    obj.jobId,
    obj.source,
    obj.name,
    obj.type,
    obj.cnpj || '',
    obj.phone || '',
    obj.email || '',
    obj.site || '',
    obj.address || '',
    obj.city || '',
    obj.state || '',
    obj.responsible || '',
    obj.score || 0,
    obj.status,
    obj.raw?.generatedAt || ''
  ];
  return values.map((v) => {
    const s = String(v ?? '');
    if (s.includes('"') || s.includes(',') || s.includes('\n')) return `"${s.replace(/"/g,'""')}"`;
    return s;
  }).join(',');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = String(searchParams.get('jobId') || '').trim();
    const format = String(searchParams.get('format') || 'csv').toLowerCase();
    const leads = (memory.landmapScoutLeads || []).filter((l) => !jobId || l.jobId === jobId);

    if (format !== 'csv') return Response.json({ items: leads, total: leads.length });

    const header = 'id,jobId,source,name,type,cnpj,phone,email,site,address,city,state,responsible,score,status,generatedAt';
    const rows = leads.map(toCsvRow);
    const csv = [header, ...rows].join('\n');
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=scout-leads-${jobId || 'all'}.csv`,
      },
    });
  } catch {
    return Response.json({ error: 'falha ao exportar' }, { status: 500 });
  }
}
