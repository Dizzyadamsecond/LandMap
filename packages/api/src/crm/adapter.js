const g = globalThis;
function ledgerLeads() {
    if (!g.__landmapCrmLeads)
        g.__landmapCrmLeads = new Map();
    return g.__landmapCrmLeads;
}
function ledgerDeals() {
    if (!g.__landmapCrmDeals)
        g.__landmapCrmDeals = new Map();
    return g.__landmapCrmDeals;
}
function ledgerSyncs() {
    if (!g.__landmapCrmSyncs)
        g.__landmapCrmSyncs = [];
    return g.__landmapCrmSyncs;
}
function pushSync(rec) {
    const list = ledgerSyncs();
    list.unshift(rec);
    if (list.length > 200)
        list.length = 200;
}
function twentyConfig() {
    const baseUrl = (process.env.TWENTY_BASE_URL || '').replace(/\/$/, '');
    const apiKey = process.env.TWENTY_API_KEY || '';
    if (!baseUrl || !apiKey)
        return null;
    return { baseUrl, apiKey };
}
async function twentyRequest(cfg, path, init) {
    const res = await fetch(`${cfg.baseUrl}${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cfg.apiKey}`,
            ...(init?.headers || {}),
        },
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Twenty ${res.status}: ${text || res.statusText}`);
    }
    return res.json();
}
/** Map LandMap pipeline stages to Twenty subset. */
function toTwentyStage(stage) {
    const allowed = new Set([
        'captured',
        'contacted',
        'qualified',
        'scheduled',
        'closed_won',
        'closed_lost',
    ]);
    if (allowed.has(stage))
        return stage;
    if (stage === 'proposal' || stage === 'negotiation')
        return 'scheduled';
    return 'captured';
}
export function getCrmStatus() {
    const cfg = twentyConfig();
    return {
        mode: cfg ? 'live' : 'ledger',
        twentyConfigured: Boolean(cfg),
        twentyBaseUrl: cfg?.baseUrl,
        ledgerLeads: ledgerLeads().size,
        ledgerDeals: ledgerDeals().size,
        recentSyncs: ledgerSyncs().length,
    };
}
export function listCrmLedger() {
    return {
        leads: [...ledgerLeads().values()],
        deals: [...ledgerDeals().values()],
        syncs: ledgerSyncs().slice(0, 50),
        status: getCrmStatus(),
    };
}
export class LandMapCrmAdapter {
    async syncLead(lead) {
        const at = new Date().toISOString();
        const crmId = `lm_lead_${lead.id}`;
        ledgerLeads().set(lead.id, { ...lead, crmId, syncedAt: at });
        const cfg = twentyConfig();
        let externalId;
        let ok = true;
        let error;
        let target = 'landmap';
        if (cfg) {
            target = 'both';
            try {
                const res = await twentyRequest(cfg, '/leads', {
                    method: 'POST',
                    body: JSON.stringify({
                        name: lead.name,
                        email: lead.email,
                        phone: lead.phone,
                        status: lead.tier ?? 'new',
                        source: lead.source ?? 'landmap',
                        score: lead.score,
                    }),
                });
                externalId = res?.data?.lead?.id;
            }
            catch (e) {
                ok = false;
                error = e instanceof Error ? e.message : 'twenty error';
            }
        }
        pushSync({
            id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            at,
            kind: 'lead',
            entityId: lead.id,
            title: lead.name,
            target,
            ok,
            error,
            externalId,
        });
    }
    async syncDeal(deal) {
        const at = new Date().toISOString();
        const crmId = `lm_deal_${deal.id}`;
        ledgerDeals().set(deal.id, { ...deal, crmId, syncedAt: at });
        const cfg = twentyConfig();
        let externalId;
        let ok = true;
        let error;
        let target = 'landmap';
        if (cfg) {
            target = 'both';
            try {
                const res = await twentyRequest(cfg, '/opportunities', {
                    method: 'POST',
                    body: JSON.stringify({
                        title: deal.title,
                        stage: toTwentyStage(deal.stage),
                        amount: deal.amount,
                        currency: deal.currency || 'BRL',
                        leadId: deal.leadId,
                        notes: deal.notes,
                    }),
                });
                externalId = res?.data?.opportunity?.id;
            }
            catch (e) {
                ok = false;
                error = e instanceof Error ? e.message : 'twenty error';
            }
        }
        pushSync({
            id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            at,
            kind: 'deal',
            entityId: deal.id,
            title: deal.title,
            target,
            ok,
            error,
            externalId,
        });
    }
}
export function createCrmAdapter() {
    return new LandMapCrmAdapter();
}
/** Sync all open leads + deals currently in the sales store. */
export async function syncStoreToCrm(store) {
    const crm = createCrmAdapter();
    for (const lead of store.leads) {
        await crm.syncLead?.(lead);
    }
    for (const deal of store.deals) {
        await crm.syncDeal(deal);
    }
    return {
        leads: store.leads.length,
        deals: store.deals.length,
        status: getCrmStatus(),
    };
}
