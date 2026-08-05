import { Hono } from 'hono';
import { z } from 'zod';
import { Dispatcher } from '@landmap/automation';
import { buildProfile, conversionProbability } from '@landmap/sales';
import { CnpjClient } from '@landmap/integrations';
/**
 * Automação omnichannel anti-ban.
 *
 *   POST /automation/dispatch   → tenta enviar 1 mensagem por lead (consentimento + rate-limit)
 *   GET  /automation/lead-intel → monta perfil de mercado via CNPJ/BrasilAPI (oficial, sem scrape)
 *
 * Default: AUTOMATION_LIVE=0 → MockSender (não dispara rede). Suba a flag
 * SÓ com opt-in real dos leads e after validar manualmente.
 */
export function createAutomationRouter() {
    const router = new Hono();
    const dispatcher = new Dispatcher();
    router.onError((err, c) => {
        const status = err.status ?? 500;
        const message = err instanceof Error ? err.message : 'Internal Server Error';
        return c.json({ error: message }, { status });
    });
    const dispatchSchema = z.object({
        leadId: z.string(),
        name: z.string().optional(),
        interest: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        score: z.number().min(0).max(100).default(60),
        stage: z
            .enum(['captured', 'contacted', 'qualified', 'scheduled', 'proposal', 'negotiation', 'closed_won', 'closed_lost'])
            .default('qualified'),
        engagement: z.number().min(0).default(1),
        intent: z.number().min(0).max(1).default(0.4),
        followUpsSent: z.number().min(0).default(0),
        daysSinceActivity: z.number().min(0).default(0),
        toleranceDays: z.number().min(1).default(7),
        channelFit: z.number().min(0).max(1).default(0.6),
        consent: z
            .object({
            whatsapp: z.enum(['none', 'opt_in', 'opt_out']).default('none'),
            call: z.enum(['none', 'opt_in', 'opt_out']).default('none'),
            sms: z.enum(['none', 'opt_in', 'opt_out']).default('none'),
        })
            .default({}),
        timezone: z.string().default('America/Sao_Paulo'),
        draft: z.object({
            whatsapp: z.string().optional(),
            callScript: z.string().optional(),
            sms: z.string().optional(),
        }),
    });
    router.post('/dispatch', async (c) => {
        const parsed = dispatchSchema.safeParse(await c.req.json().catch(() => ({})));
        if (!parsed.success)
            return c.json({ error: 'Invalid input', issues: parsed.error.issues }, 400);
        const b = parsed.data;
        const profile = buildProfile({
            id: b.leadId,
            name: b.name ?? 'Lead',
            interest: b.interest ?? '',
            source: 'landmap',
            signals: [],
            createdAt: new Date().toISOString(),
            engagementCount: b.engagement,
        });
        profile.intent = b.intent;
        profile.followUpToleranceDays = b.toleranceDays;
        const probability = conversionProbability({
            score: b.score,
            stage: b.stage,
            engagement: b.engagement,
            daysSinceActivity: b.daysSinceActivity,
            intent: b.intent,
            followUpsSent: b.followUpsSent,
            toleranceDays: b.toleranceDays,
            channelFit: b.channelFit,
        });
        const result = await dispatcher.dispatch({
            leadId: b.leadId,
            probability,
            profile,
            compliance: {
                leadId: b.leadId,
                consent: {
                    whatsapp: b.consent.whatsapp ?? 'none',
                    call: b.consent.call ?? 'none',
                    sms: b.consent.sms ?? 'none',
                },
                timezone: b.timezone,
            },
            followUpsSent: b.followUpsSent,
            draft: b.draft,
        });
        return c.json({
            leadId: b.leadId,
            probability,
            ...result,
            live: process.env.AUTOMATION_LIVE === '1',
            generatedAt: new Date().toISOString(),
        });
    });
    /**
     * Lead Intel — monta perfil de MERCADO a partir de CNPJ oficial (Receita
     * Federal via BrasilAPI). NÃO raspa contato pessoal; devolve apenas dados
     * públicos da empresa (razão social, porte, situação) p/ qualificação.
     */
    router.get('/lead-intel', async (c) => {
        const cnpj = c.req.query('cnpj');
        if (!cnpj)
            return c.json({ error: 'cnpj query param required' }, 400);
        const client = new CnpjClient();
        if (!client.configured) {
            return c.json({ configured: false, note: 'CNPJ em mock (sem rede). Configure BRASILAPI se necessário.' }, 200);
        }
        try {
            const company = await client.getCompany(cnpj);
            return c.json({ configured: true, cnpj, company, generatedAt: new Date().toISOString() });
        }
        catch (e) {
            return c.json({ configured: true, cnpj, error: e.message }, 502);
        }
    });
    return router;
}
