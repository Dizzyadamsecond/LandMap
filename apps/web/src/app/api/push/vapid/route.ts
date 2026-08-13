import { getVapidPublicKey } from '@landmap/api/push';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const publicKey = getVapidPublicKey();
  return Response.json({ ok: true, publicKey });
}
