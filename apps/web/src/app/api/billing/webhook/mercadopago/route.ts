import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.text();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const res = await fetch(`${API_BASE}/billing/webhook/mercadopago`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...Object.fromEntries(request.headers.entries()),
    },
    body,
  });

  return new Response(await res.text(), { status: res.status });
}
