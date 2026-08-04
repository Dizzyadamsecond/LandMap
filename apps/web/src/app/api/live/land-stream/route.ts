// apps/web/src/app/api/live/land-stream/route.ts
// SSE — stream de oportunidade de terreno NACIONAL em tempo real.
// A Vercel suporta SSE (diferente de WebSocket server persistente). Cada
// cliente recebe o ranking top-N recompilado a cada tick (Selic/IPCA vivos).
import { buildLandSnapshot, type LandSnapshot } from '../../../../lib/landData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const TICK_MS = 15_000;

export async function GET(req: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      // envia snapshot inicial imediato
      try {
        const snap: LandSnapshot = await buildLandSnapshot(40);
        send('snapshot', snap);
      } catch (e) {
        send('error', { message: (e as Error).message });
      }

      const timer = setInterval(async () => {
        try {
          const snap: LandSnapshot = await buildLandSnapshot(40);
          send('snapshot', snap);
        } catch {
          /* silencioso: mantém a conexão viva */
        }
      }, TICK_MS);

      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(timer);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      req.signal.addEventListener('abort', close);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
