import { Hono } from 'hono';
import { createInitialStore, runCycle, runFollowUpCycle, runStandbyTick, runDialogue, runDailyLoop, approveTask, rejectTask, setAutonomy, mulberry32, } from '@landmap/sales';
import { emitWebhook } from '../webhooks/store.js';
import { createCrmAdapter, getCrmStatus, listCrmLedger, syncStoreToCrm } from '../crm/adapter.js';
import { computeDueAlerts, dueAlertSummary } from '../crm/due-alerts.js';
import { hydrateStore, persistFrom } from '@landmap/sales';
const g = globalThis;
/**
 * Recarrega o progresso persistido (KV) no store em memória ANTES de cada
 * ciclo. Em serverless cada instância nasce com store vazio; sem
 * await aqui o total nunca acumula além de um único loop (e o KV
 * era sobrescrito com a lista vazia+1 loop).
 * Aguarda a hidratação concluir para garantir continuidade.
 */
async function awaitHydrate(store) {
    try {
        const restored = await hydrateStore(store.subscriptions);
        if (restored.length > 0) {
            store.subscriptions = restored;
            store.bumpDaily();
        }
    }
    catch {
        // sem KV: mantém o store em memória
    }
}
/** Persiste o store atual no KV após cada ciclo (acumula entre instâncias). */
function persistStore(store) {
    void persistFrom(store.subscriptions, {
        firstSaleAt: store.firstSaleAt,
        firstSaleNotified: store.firstSaleNotified,
    }).catch(() => { });
}
function getStore() {
    if (!g.__landmapSalesStore) {
        g.__landmapSalesStore = createInitialStore();
    }
    return g.__landmapSalesStore;
}
function makeCtx(store) {
    const rng = mulberry32((Date.now() & 0xffffffff) || 1);
    return {
        store,
        autonomy: store.autonomy,
        rng,
        now: () => new Date().toISOString(),
        crm: createCrmAdapter(),
    };
}
function metaOf(store) {
    const followUps = store.pendingTasks().filter((t) => t.kind === 'follow_up');
    const due = computeDueAlerts(store);
    return {
        teamSize: store.agents.length,
        standby: store.agents.filter((a) => a.status === 'idle' || a.status === 'paused').length,
        running: store.agents.filter((a) => a.status === 'running').length,
        pendingFollowUps: followUps.length,
        pendingTasks: store.pendingTasks().length,
        lastTickAt: g.__landmapSalesLastTick ?? null,
        tickCount: g.__landmapSalesTickCount ?? 0,
        followupSquad: store.agents
            .filter((a) => ['followup', 'cold_recovery', 'waba_followup'].includes(a.role))
            .map((a) => a.id),
        dueAlerts: dueAlertSummary(due),
        crm: getCrmStatus(),
    };
}
/** Emit webhook once per overdue task until approved/rejected. */
function fireDueWebhooks(store) {
    if (!g.__landmapDueAlerted)
        g.__landmapDueAlerted = new Set();
    const alerts = computeDueAlerts(store);
    for (const a of alerts) {
        if (a.severity !== 'overdue')
            continue;
        if (g.__landmapDueAlerted.has(a.taskId))
            continue;
        g.__landmapDueAlerted.add(a.taskId);
        void emitWebhook('alert.fired', {
            kind: 'follow_up.due',
            severity: a.severity,
            taskId: a.taskId,
            title: a.title,
            dueAt: a.dueAt,
            hoursDelta: a.hoursDelta,
        }).catch(() => { });
    }
    // clear resolved
    for (const id of [...g.__landmapDueAlerted]) {
        const still = store.pendingTasks().some((t) => t.id === id && t.kind === 'follow_up');
        if (!still)
            g.__landmapDueAlerted.delete(id);
    }
}
export function createSalesRouter() {
    const app = new Hono();
    app.get('/agents', (c) => {
        const store = getStore();
        return c.json({
            ok: true,
            autonomy: store.autonomy,
            agents: store.agents.map((a) => ({ ...a })),
            teamSize: store.agents.length,
            meta: metaOf(store),
        });
    });
    app.get('/followups', (c) => {
        const store = getStore();
        const items = store
            .pendingTasks()
            .filter((t) => t.kind === 'follow_up')
            .map((t) => ({
            ...t,
            lead: t.leadId ? store.getLead(t.leadId) : undefined,
            deal: t.dealId ? store.getDeal(t.dealId) : undefined,
        }));
        return c.json({ ok: true, items, total: items.length });
    });
    app.get('/alerts/due', (c) => {
        const store = getStore();
        const items = computeDueAlerts(store);
        fireDueWebhooks(store);
        return c.json({ ok: true, items, summary: dueAlertSummary(items) });
    });
    app.get('/crm', (c) => {
        return c.json({ ok: true, ...listCrmLedger() });
    });
    app.post('/crm/sync', async (c) => {
        const store = getStore();
        const result = await syncStoreToCrm(store);
        void emitWebhook('lead.updated', {
            kind: 'crm.sync',
            ...result,
        }).catch(() => { });
        return c.json({ ok: true, ...result, ledger: listCrmLedger() });
    });
    /** Snapshot público do motor p/ dashboard tempo real (war-room). */
    app.get('/state', (c) => {
        const store = getStore();
        store.bumpDaily();
        const subs = store.subscriptions;
        const active = subs.filter((s) => s.status === 'active' || s.status === 'past_due').length;
        const trials = subs.filter((s) => s.status === 'trial').length;
        const mrr = subs.reduce((sum, s) => sum + (s.status === 'active' || s.status === 'past_due' ? s.mrr : 0), 0);
        const realChannel = !!process.env.RESEND_API_KEY || !!process.env.SMTP_HOST || !!process.env.TWILIO_ACCOUNT_SID;
        const realPayments = !!process.env.STRIPE_SECRET_KEY;
        const realLeads = subs.some((s) => s.leadId && !s.leadId.startsWith('lead'));
        return c.json({
            ok: true,
            generatedAt: new Date().toISOString(),
            autonomy: store.autonomy,
            total: subs.length,
            active,
            trials,
            mrr,
            goal: store.daily.goal,
            daily: store.daily,
            firstSaleAt: store.firstSaleAt,
            agents: store.agents.map((a) => ({
                id: a.id,
                name: a.name,
                role: a.role,
                status: a.status,
                currentTask: a.currentTask,
                actionsToday: a.actionsToday,
                successToday: a.successToday,
            })),
            totals: {
                leads: store.leads.length,
                deals: store.deals.length,
                tasks: store.tasks.length,
                events: store.events.length,
            },
            channelStats: store.channelStats,
            mode: {
                simulated: !realChannel && !realPayments ? true : !realChannel || !realPayments,
                realChannel,
                realPayments,
                realLeads,
                note: !realChannel && !realPayments
                    ? 'MODO SIMULADO: sem credenciais de envio/pagamento. Números são do motor (não vendas reais).'
                    : 'Parcial: algumas credenciais presentes.',
            },
        });
    });
    app.post('/cycle', async (c) => {
        const store = getStore();
        await awaitHydrate(store);
        const body = (await c.req.json().catch(() => ({})));
        if (body.autonomy)
            setAutonomy(store, body.autonomy);
        const result = await runCycle(store, makeCtx(store));
        g.__landmapSalesLastTick = new Date().toISOString();
        g.__landmapSalesTickCount = (g.__landmapSalesTickCount ?? 0) + 1;
        persistStore(store);
        fireDueWebhooks(store);
        void emitWebhook('score.updated', {
            kind: 'sales.cycle',
            autonomy: store.autonomy,
            tasks: result.tasks?.length ?? 0,
        }).catch(() => { });
        return c.json({ result, state: { ...store.toState(), meta: metaOf(store) } });
    });
    app.post('/followups/run', async (c) => {
        const store = getStore();
        await awaitHydrate(store);
        const body = (await c.req.json().catch(() => ({})));
        if (body.autonomy)
            setAutonomy(store, body.autonomy);
        const result = await runFollowUpCycle(store, makeCtx(store));
        g.__landmapSalesLastTick = new Date().toISOString();
        g.__landmapSalesTickCount = (g.__landmapSalesTickCount ?? 0) + 1;
        persistStore(store);
        fireDueWebhooks(store);
        void emitWebhook('lead.updated', {
            kind: 'followup.cycle',
            enqueued: result.tasks?.filter((t) => t.kind === 'follow_up').length ?? 0,
        }).catch(() => { });
        return c.json({ result, state: { ...store.toState(), meta: metaOf(store) } });
    });
    app.post('/tick', async (c) => {
        const store = getStore();
        await awaitHydrate(store);
        const body = (await c.req.json().catch(() => ({})));
        if (store.autonomy === 'off') {
            return c.json({
                ok: true,
                skipped: true,
                reason: 'autonomy_off',
                state: { ...store.toState(), meta: metaOf(store) },
            });
        }
        const result = body.mode === 'full'
            ? await runCycle(store, makeCtx(store))
            : await runStandbyTick(store, makeCtx(store));
        g.__landmapSalesLastTick = new Date().toISOString();
        g.__landmapSalesTickCount = (g.__landmapSalesTickCount ?? 0) + 1;
        persistStore(store);
        fireDueWebhooks(store);
        return c.json({
            ok: true,
            skipped: false,
            result,
            state: { ...store.toState(), meta: metaOf(store) },
        });
    });
    app.post('/autonomy', async (c) => {
        const store = getStore();
        const body = (await c.req.json().catch(() => ({})));
        if (body.level)
            setAutonomy(store, body.level);
        for (const a of store.agents) {
            if (store.autonomy === 'off') {
                a.status = 'paused';
                a.currentTask = 'Em espera (autonomia off)';
            }
            else if (a.status === 'paused') {
                a.status = 'idle';
                a.currentTask = 'Em espera na fila';
            }
        }
        return c.json({ autonomy: store.autonomy, agents: store.agents, meta: metaOf(store) });
    });
    app.post('/approve/:id', async (c) => {
        const store = getStore();
        const task = approveTask(store, c.req.param('id'));
        store.recomputeAnalytics();
        const crm = createCrmAdapter();
        if (task?.leadId) {
            const lead = store.getLead(task.leadId);
            if (lead)
                await crm.syncLead?.(lead);
        }
        if (task?.dealId) {
            const deal = store.getDeal(task.dealId);
            if (deal)
                await crm.syncDeal(deal);
        }
        if (task?.kind === 'follow_up') {
            void emitWebhook('lead.updated', {
                kind: 'follow_up.approved',
                taskId: task.id,
                leadId: task.leadId,
            }).catch(() => { });
        }
        return c.json({ task, state: { ...store.toState(), meta: metaOf(store) } });
    });
    app.post('/reject/:id', (c) => {
        const store = getStore();
        const task = rejectTask(store, c.req.param('id'));
        store.recomputeAnalytics();
        return c.json({ task, state: { ...store.toState(), meta: metaOf(store) } });
    });
    app.post('/approve-all-followups', async (c) => {
        const store = getStore();
        const ids = store.pendingTasks().filter((t) => t.kind === 'follow_up').map((t) => t.id);
        const crm = createCrmAdapter();
        const approved = [];
        for (const id of ids) {
            const task = approveTask(store, id);
            if (task) {
                approved.push(task);
                if (task.leadId) {
                    const lead = store.getLead(task.leadId);
                    if (lead)
                        await crm.syncLead?.(lead);
                }
            }
        }
        store.recomputeAnalytics();
        return c.json({
            ok: true,
            count: approved.length,
            state: { ...store.toState(), meta: metaOf(store) },
        });
    });
    app.post('/loop', async (c) => {
        const store = getStore();
        await awaitHydrate(store);
        // Driver autônomo (Vercel Cron): garante autopilot antes de rodar.
        if (store.autonomy !== 'autopilot')
            setAutonomy(store, 'autopilot');
        const body = (await c.req.json().catch(() => ({})));
        // Seed recebido numa ÚNICA requisição (mesmo processo) — necessário em
        // serverless, onde RESTORE/LOOP separados caem em instâncias distintas e
        // o store global não sobrevive. Sem KV, o driver local semeia o acumulado.
        if (body.seed && Array.isArray(body.seed.subscriptions) && body.seed.subscriptions.length) {
            store.subscriptions = body.seed.subscriptions;
            if (body.seed.firstSaleAt)
                store.firstSaleAt = body.seed.firstSaleAt;
            store.bumpDaily();
        }
        const result = await runDailyLoop(store, makeCtx(store), body.cycles ?? 400);
        g.__landmapSalesLastTick = new Date().toISOString();
        g.__landmapSalesTickCount = (g.__landmapSalesTickCount ?? 0) + 1;
        persistStore(store);
        return c.json({ ok: true, ...result, state: { ...store.toState(), meta: metaOf(store) } });
    });
    /**
     * Restaura o progresso acumulado a partir do driver local (bridge sem
     * KV). O processo Windows mantém o total em .sales_drive_progress.json e
     * semeia cada instância serverless antes do loop, garantindo acúmulo
     * contínuo até o teto SALES_CAP.
     */
    app.post('/restore', async (c) => {
        const store = getStore();
        const body = (await c.req.json().catch(() => ({})));
        if (Array.isArray(body.subscriptions)) {
            store.subscriptions = body.subscriptions;
            if (body.firstSaleAt)
                store.firstSaleAt = body.firstSaleAt;
            store.bumpDaily();
        }
        return c.json({
            ok: true,
            total: store.subscriptions.length,
            state: { ...store.toState(), meta: metaOf(store) },
        });
    });
    app.post('/dialogue', async (c) => {
        const store = getStore();
        if (store.autonomy === 'off') {
            return c.json({ ok: true, skipped: true, reason: 'autonomy_off', result: null, state: { ...store.toState(), meta: metaOf(store) } });
        }
        const result = await runDialogue(store, makeCtx(store));
        g.__landmapSalesLastTick = new Date().toISOString();
        g.__landmapSalesTickCount = (g.__landmapSalesTickCount ?? 0) + 1;
        return c.json({ ok: true, result, state: { ...store.toState(), meta: metaOf(store) } });
    });
    app.get('/subscriptions', (c) => {
        const store = getStore();
        store.bumpDaily();
        return c.json({
            ok: true,
            daily: store.daily,
            total: store.subscriptions.length,
            active: store.subscriptions.filter((s) => s.status === 'active' || s.status === 'past_due').length,
            trials: store.subscriptions.filter((s) => s.status === 'trial').length,
            mrr: store.subscriptions.reduce((sum, s) => sum + (s.status === 'active' || s.status === 'past_due' ? s.mrr : 0), 0),
            items: store.subscriptions.slice(-50).reverse(),
        });
    });
    app.get('/daily', (c) => {
        const store = getStore();
        store.bumpDaily();
        void emitWebhook('daily.report', { ...store.daily, total: store.subscriptions.length }).catch(() => { });
        return c.json({ ok: true, daily: store.daily, totalSubs: store.subscriptions.length });
    });
    return app;
}
