import { buildSnapshot, buildTick } from '@landmap/api/history40.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/history40/stream — Server-Sent Events (SSE).
 *
 * Entrega os MESMOS payloads do WebSocket (/ws/history40 no @landmap/api):
 *   event: snapshot  -> { type:'history40.snapshot', series, meta, generatedAt }
 *   event: tick      -> { type:'history40.tick', series:{cdi,ipca,...}, ts }
 *
 * SSE funciona em qualquer runtime (Vercel incluído); o WebSocket nativo fica
 * disponível quando o @landmap/api roda como servidor Node (pnpm dev:api).
 */
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const enqueue = (payload: unknown, event: string) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`),
          );
        } catch {
          // client gone
        }
      };

      // Snapshot imediato (40 anos completos)
      enqueue(buildSnapshot(), 'snapshot');

      // Ticks periódicos (mesmo ritmo do WebSocket: 5s)
      const timer = setInterval(() => {
        enqueue(buildTick(), 'tick');
      }, 5000);

      // Keep-alive comment a cada 15s (proxies não cortam conexões ociosas)
      const ka = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          /* noop */
        }
      }, 15000);

      const cleanup = () => {
        clearInterval(timer);
        clearInterval(ka);
        try {
          controller.close();
        } catch {
          /* noop */
        }
      };

      (controller as any)._cleanup = cleanup;
    },
    cancel() {
      const cleanup = (controller: any) => controller?._cleanup?.();
      // cancel() não recebe controller — usamos closure via start
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
