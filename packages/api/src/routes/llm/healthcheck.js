import { Hono } from 'hono';
export function createLLMHealthcheckRouter() {
    const router = new Hono();
    router.get('/healthcheck', (c) => {
        return c.json({ status: 'ok', module: '@landmap/llm', checkedAt: new Date().toISOString() });
    });
    return router;
}
