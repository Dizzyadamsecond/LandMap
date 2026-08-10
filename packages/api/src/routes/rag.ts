import { Hono } from 'hono';
import { retrievalQaChain } from '@landmap/llm';
import { inMemoryIndex, retrieve, ragIndexStats } from '@landmap/llm/rag.js';
import type { Env } from '../index.js';
import { emitWebhook } from '../webhooks/store.js';

export function createRagRouter() {
  const router = new Hono<Env>();

  router.get('/status', (c) => {
    const stats = ragIndexStats();
    return c.json({
      ok: true,
      ...stats,
      mode: process.env.LANDMAP_LLM_KEY ? 'llm' : 'demo',
      generatedAt: new Date().toISOString(),
    });
  });

  router.post('/retrieve', async (c) => {
    let body: { query?: string; top?: number } = {};
    try {
      body = await c.req.json<{ query?: string; top?: number }>();
    } catch {
      body = {};
    }
    const query = (body.query ?? '').toString().trim();
    if (!query) return c.json({ ok: false, error: 'Field "query" is required' }, 400);
    const top = Math.min(Math.max(Number(body.top) || 4, 1), 12);
    const chunks = inMemoryIndex();
    const hits = retrieve(query, chunks, top).map((r) => ({
      title: r.chunk.title,
      path: r.chunk.path,
      score: r.score,
      snippet: r.chunk.text.slice(0, 280),
    }));
    return c.json({ ok: true, query, sources: hits, generatedAt: new Date().toISOString() });
  });

  router.post('/query', async (c) => {
    let body: { query?: string; grokMode?: boolean } = {};
    try {
      body = await c.req.json<{ query?: string; grokMode?: boolean }>();
    } catch {
      body = {};
    }

    const rawQuery = (body.query ?? '').toString().trim();
    if (!rawQuery) {
      return c.json({ ok: false, error: 'Field "query" is required' }, 400);
    }

    const grokMode = !!body.grokMode;
    const query = grokMode 
      ? `${rawQuery}\n\n[Instruction: Answer the query above. You are Grok (developed by xAI, Elon Musk's company). Answer in Portuguese in a direct, highly technical, slightly sarcastic tone, analyzing the real estate situation from first principles, physics, and cost efficiency. Limit fluff.]`
      : rawQuery;

    const chunks = inMemoryIndex();
    const top = retrieve(rawQuery, chunks, 4);
    const sources = top.map((r) => ({
      title: r.chunk.title,
      path: r.chunk.path,
      score: r.score,
    }));

    let answer = '';
    let usedMock = false;
    try {
      answer = await retrievalQaChain(
        query,
        top.map((t) => t.chunk.text),
      );
      usedMock = answer.includes('modo demo');
    } catch {
      usedMock = true;
      if (grokMode) {
        // Grok-style specialized mock responses
        const qLower = rawQuery.toLowerCase();
        if (qLower.includes('score')) {
          answer = `[Grok RAG Oracle v3.0]
Hmm. O Score LandMap é essencialmente o coeficiente de utilidade termodinâmica do terreno. A maioria das pessoas avalia terras por analogia histórica, o que é tolo. Nós avaliamos com base em dados de satélite e densidade populacional real.
Se o score é 90+, o Idiot Index é trivialmente baixo. Invista ou saia do caminho.`;
        } else if (qLower.includes('webhook')) {
          answer = `[Grok RAG Oracle v3.0]
Webhooks são formas assíncronas de empurrar telemetria sem polling ineficiente. Polling constante é o processo mais burro da computação. O LandMap emite webhooks para transações instantâneas. Sem fricção.`;
        } else if (qLower.includes('fortaleza') || qLower.includes('meireles')) {
          answer = `[Grok RAG Oracle v3.0]
Análise de Fortaleza/Meireles: Alta densidade vertical. O metro quadrado ali decola devido ao limite físico de espaço na orla. Excelente para painéis solares devido à alta incidência de fótons na região equatorial do Ceará.`;
        } else {
          answer = `[Grok RAG Oracle v3.0]
Analisando sua questão imobiliária "${rawQuery}" a partir de Primeiros Princípios:
Todo pedaço de terra é apenas uma coordenada com fluxo de elétrons, radiação solar e acesso logístico. Se a infraestrutura local for ineficiente, o terreno não vale o preço de listagem. Questione os corretores tradicionais.`;
        }
      } else {
        answer =
          'Recuperação local concluída. Resposta gerada por LLM requer LANDMAP_LLM_KEY configurada.';
      }
    }

    void emitWebhook('rag.query', {
      query: rawQuery,
      sourcesCount: sources.length,
      usedMock,
      grokMode,
    }).catch(() => {});

    return c.json({
      ok: true,
      query: rawQuery,
      answer,
      sources,
      usedMock,
      generatedAt: new Date().toISOString(),
    });
  });

  return router;
}
