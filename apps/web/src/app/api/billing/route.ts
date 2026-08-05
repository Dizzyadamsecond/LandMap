import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(request: Request) {
  const path = new URL(request.url).pathname.replace('/api/billing', '');
  const res = await fetch(`${API_BASE}/billing${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', 'x-user-id': request.headers.get('x-user-id') || 'guest' },
  });
  return new Response(res.body, { status: res.status, headers: res.headers });
}

export async function POST(request: Request) {
  const path = new URL(request.url).pathname.replace('/api/billing', '');
  const body = await request.text();
  const res = await fetch(`${API_BASE}/billing${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': request.headers.get('x-user-id') || 'guest' },
    body,
  });
  return new Response(res.body, { status: res.status, headers: res.headers });
}
