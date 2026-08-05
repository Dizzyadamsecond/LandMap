import { Hono } from 'hono';
import { inMemoryIndex, retrieve } from '@landmap/llm/rag.js';
export function createLLMRagRouter() {
    const router = new Hono();
    router.post('/ingest', async (c) => {
        const body = await c.req.json();
        if (!Array.isArray(body) || body.length === 0) {
            return c.json({ error: 'Body must be a non-empty array of { path, title, text }' }, 400);
        }
        const chunks = inMemoryIndex();
        const added = body.map((d, i) => ({
            id: String(d.path || d.title || `doc_${chunks.length + i}`),
            path: d.path,
            title: d.title,
            text: d.text,
            tokens: d.text.split(/\s+/).filter(Boolean).length,
        }));
        for (const chunk of added) {
            chunks.push(chunk);
        }
        return c.json({ indexed: added.length, total: chunks.length });
    });
    router.post('/searchSimilar', async (c) => {
        const body = await c.req.json();
        if (!body.query || typeof body.query !== 'string') {
            return c.json({ error: 'Field "query" is required' }, 400);
        }
        const top = typeof body.top === 'number' ? body.top : 3;
        const chunks = inMemoryIndex();
        const results = retrieve(body.query, chunks, top);
        return c.json({ query: body.query, top, results: results.map((r) => ({ id: r.chunk.id, text: r.chunk.text, score: r.score })) });
    });
    return router;
}
