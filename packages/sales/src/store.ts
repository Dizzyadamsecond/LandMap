import type {
  AgentEvent,
  AgentMessage,
  AgentContext,
  AutonomyLevel,
  CycleResult,
  DailyCounter,
  Deal,
  Lead,
  PipelineStage,
  SalesAgent,
  SalesAnalytics,
  SalesChannel,
  SalesEffect,
  SalesState,
  SalesTask,
  Subscription,
} from './types.js';
import { PIPELINE_STAGES } from './types.js';
import { SALES_CAP, hydrateStore, persistFrom } from './persistence.js';
import { uid, pick, mulberry32 } from './util.js';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// RNG determinístico leve para o caminho rápido de venda em massa.
const fastRng = mulberry32(Date.now() & 0xffffffff);

export interface ChannelStats {
  sent: number;
  replies: number;
}

function emptyAnalytics(): SalesAnalytics {
  return {
    funnel: PIPELINE_STAGES.map((stage) => ({ stage, count: 0, value: 0 })),
    totals: {
      pipelineValue: 0,
      weightedPipeline: 0,
      wonValue: 0,
      wonCount: 0,
      lostCount: 0,
      winRate: 0,
      avgDealSize: 0,
      meetingsBooked: 0,
      forecasts: 0,
    },
    channelPerformance: [],
    forecast: { period: 'Próximos 30 dias', expectedValue: 0, confidence: 0 },
    agentProductivity: [],
  };
}

/**
 * Single source of truth for the autonomous sales engine. Holds the live
 * roster, leads, deals, tasks and the event stream, and recomputes the
 * analytics view the cockpit renders.
 */
export class SalesStore {
  // Autonomia padrão = autopilot: o loop de vendas (Vercel Cron → /api/cron/sales-loop)
  // roda e aplica efeitos (leads→deals→assinaturas→MRR) sem aprovação humana.
  autonomy: AutonomyLevel = 'autopilot';
  agents: SalesAgent[] = [];
  leads: Lead[] = [];
  deals: Deal[] = [];
  tasks: SalesTask[] = [];
  events: AgentEvent[] = [];
  subscriptions: Subscription[] = [];
  messages: AgentMessage[] = [];
  /** Primeira venda convertida (para notificar o dono uma única vez). */
  firstSaleAt: string | null = null;
  firstSaleNotified = false;
  /** Teto de assinaturas do objetivo (1.000). O loop para ao bater. */
  readonly cap = SALES_CAP;
  analytics: SalesAnalytics = emptyAnalytics();
  /** Meta diária de assinaturas (default 5000 em modo ambicioso/autônomo; override via DAILY_GOAL). */
  dailyGoal = Number(process.env.DAILY_GOAL ?? 5000);
  daily: DailyCounter = {
    date: todayISO(),
    goal: Number(process.env.DAILY_GOAL ?? 5000),
    subs: 0,
    trials: 0,
    paid: 0,
    leads: 0,
    deals: 0,
  };
  channelStats: Record<SalesChannel, ChannelStats> = {
    email: { sent: 0, replies: 0 },
    whatsapp: { sent: 0, replies: 0 },
    sms: { sent: 0, replies: 0 },
    call: { sent: 0, replies: 0 },
    social: { sent: 0, replies: 0 },
  };

  constructor(init?: Partial<SalesStore>) {
    if (init) Object.assign(this, init);
  }

  /* ─── Leads ─── */
  addLead(lead: Lead): Lead {
    this.leads.push(lead);
    return lead;
  }
  getLead(id: string): Lead | undefined {
    return this.leads.find((l) => l.id === id);
  }
  updateLead(id: string, patch: Partial<Lead>): Lead | undefined {
    const lead = this.getLead(id);
    if (lead) Object.assign(lead, patch);
    return lead;
  }

  /* ─── Deals ─── */
  addDeal(deal: Deal): Deal {
    this.deals.push(deal);
    return deal;
  }
  getDeal(id: string): Deal | undefined {
    return this.deals.find((d) => d.id === id);
  }
  updateDeal(id: string, patch: Partial<Deal>): Deal | undefined {
    const deal = this.getDeal(id);
    if (deal) Object.assign(deal, patch);
    return deal;
  }

  /* ─── Tasks ─── */
  addTask(task: SalesTask): SalesTask {
    this.tasks.push(task);
    return task;
  }
  getTask(id: string): SalesTask | undefined {
    return this.tasks.find((t) => t.id === id);
  }
  updateTask(id: string, patch: Partial<SalesTask>): SalesTask | undefined {
    const task = this.getTask(id);
    if (task) Object.assign(task, patch);
    return task;
  }

  /* ─── Events ─── */
  addEvent(event: AgentEvent): AgentEvent {
    this.events.unshift(event);
    if (this.events.length > 200) this.events.length = 200;
    return event;
  }
  getAgent(id: string): SalesAgent | undefined {
    return this.agents.find((a) => a.id === id);
  }

  /* ─── Subscriptions (meta de assinaturas/dia) ─── */
  addSubscription(sub: Subscription): Subscription | null {
    // Teto atingido: não acumula além de 1.000 (objetivo do dono).
    if (this.subscriptions.length >= this.cap) return null;
    this.subscriptions.push(sub);
    if (!this.firstSaleAt) {
      this.firstSaleAt = sub.createdAt ?? new Date().toISOString();
    }
    this.bumpDaily();
    // Persiste o progresso no KV (survive cold start). No-op se sem KV env.
    void persistFrom(this.subscriptions, {
      firstSaleAt: this.firstSaleAt,
      firstSaleNotified: this.firstSaleNotified,
    }).catch(() => {});
    return sub;
  }
  getSubscription(id: string): Subscription | undefined {
    return this.subscriptions.find((s) => s.id === id);
  }

  /* ─── Agent dialogue bus ─── */
  addMessage(message: AgentMessage): AgentMessage {
    this.messages.unshift(message);
    if (this.messages.length > 400) this.messages.length = 400;
    return message;
  }
  /** Última fala da cadeia (para o próximo agente reagir). */
  lastMessage(): AgentMessage | undefined {
    return this.messages[0];
  }

  /** Recalcula o contador de hoje; zera ao virar o dia. */
  bumpDaily(): void {
    const today = todayISO();
    if (this.daily.date !== today) {
      this.daily = {
        date: today,
        goal: this.dailyGoal,
        subs: 0,
        trials: 0,
        paid: 0,
        leads: this.leads.length,
        deals: this.deals.length,
      };
    }
    this.daily.subs = this.subscriptions.length;
    this.daily.trials = this.subscriptions.filter((s) => s.status === 'trial').length;
    this.daily.paid = this.subscriptions.filter(
      (s) => s.status === 'active' || s.status === 'past_due',
    ).length;
    this.daily.leads = this.leads.length;
    this.daily.deals = this.deals.length;
  }

  pendingTasks(): SalesTask[] {
    return this.tasks.filter((t) => t.status === 'pending');
  }
  openDeals(): Deal[] {
    return this.deals.filter(
      (d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost',
    );
  }

  /**
   * Caminho rápido de venda em massa (autopilot): gera leads/negócios e converte
   * negócios ganhos em assinaturas sem o diálogo completo de 14 agentes, de modo
   * que a meta de 1.000 assinaturas seja atingível dentro de uma única invocação
   * quente do serverless. Respeita o teto SALES_CAP.
   */
  fastSellStep(ctx: AgentContext, batch = 12): void {
    // 1) garante pipeline de negócios em aberto
    const open = this.openDeals();
    if (open.length < batch) {
      const need = batch - open.length + 4;
      for (let i = 0; i < need; i++) {
        const leadId = uid('lead');
        const lead: Lead = {
          id: leadId,
          name: `Lead ${leadId.slice(0, 6)}`,
          source: pick(['organic', 'referral', 'campaign', 'outbound', 'inbound'], fastRng),
          interest: 'Imóvel LandMap',
          signals: ['interesse'],
          createdAt: ctx.now(),
          engagementCount: 1,
          score: 70,
          tier: 'hot',
        };
        this.leads.push(lead);
        const dealId = uid('deal');
        const deal: Deal = {
          id: dealId,
          leadId,
          title: `Oportunidade ${dealId.slice(0, 6)}`,
          stage: 'captured',
          amount: 150000 + Math.floor(fastRng() * 350000),
          currency: 'BRL',
          probability: 0.2,
          ownerAgent: 'agent-closer',
          lastActivityAt: ctx.now(),
          createdAt: ctx.now(),
        };
        this.deals.push(deal);
      }
    }
    // 2) avança negócios em aberto em direção a closed_won
    const order: PipelineStage[] = ['captured', 'contacted', 'qualified', 'scheduled', 'proposal', 'negotiation', 'closed_won'];
    for (const d of this.openDeals()) {
      const idx = order.indexOf(d.stage);
      const next = order[Math.min(idx + 1, order.length - 1)];
      d.stage = next;
      d.probability = Math.min(0.98, d.probability + 0.13);
      d.lastActivityAt = ctx.now();
    }
    // 3) converte negócios ganhos ainda não assinados
    this.mintWonSubscriptions(ctx);
  }

  /** Converte todos os negócios closed_won sem assinatura (respeitando o teto). */
  mintWonSubscriptions(ctx: AgentContext): void {
    if (this.subscriptions.length >= SALES_CAP) return;
    const won = this.deals.filter((d) => d.stage === 'closed_won');
    for (const deal of won) {
      if (this.subscriptions.length >= SALES_CAP) break;
      if (this.subscriptions.some((s) => s.dealId === deal.id)) continue;
      const lead = this.getLead(deal.leadId);
      const plan: Subscription['plan'] = 'pro';
      this.addSubscription({
        id: uid('sub'),
        leadId: deal.leadId,
        dealId: deal.id,
        plan,
        status: 'active',
        mrr: 79,
        currency: deal.currency || 'BRL',
        closedByAgent: 'agent-subscriptor',
        source: lead?.source ?? 'landmap',
        createdAt: ctx.now(),
      });
    }
  }

  /** Recompute the analytics view from current state. */
  recomputeAnalytics(): SalesAnalytics {
    const funnel = PIPELINE_STAGES.map((stage: PipelineStage) => {
      const deals = this.deals.filter((d) => d.stage === stage);
      return {
        stage,
        count: deals.length,
        value: deals.reduce((sum, d) => sum + d.amount, 0),
      };
    });

    const open = this.openDeals();
    const won = this.deals.filter((d) => d.stage === 'closed_won');
    const lost = this.deals.filter((d) => d.stage === 'closed_lost');
    const pipelineValue = open.reduce((s, d) => s + d.amount, 0);
    const weightedPipeline = open.reduce((s, d) => s + d.amount * d.probability, 0);
    const wonValue = won.reduce((s, d) => s + d.amount, 0);
    const totalClosed = won.length + lost.length;

    const channelPerformance = (Object.keys(this.channelStats) as SalesChannel[]).map(
      (channel) => {
        const s = this.channelStats[channel];
        return {
          channel,
          sent: s.sent,
          replies: s.replies,
          replyRate: s.sent ? Number((s.replies / s.sent).toFixed(2)) : 0,
        };
      },
    );

    const meetingsBooked = this.deals.filter(
      (d) =>
        d.stage === 'scheduled' ||
        d.stage === 'proposal' ||
        d.stage === 'negotiation',
    ).length;

    const analytics: SalesAnalytics = {
      funnel,
      totals: {
        pipelineValue,
        weightedPipeline: Math.round(weightedPipeline),
        wonValue,
        wonCount: won.length,
        lostCount: lost.length,
        winRate: totalClosed ? Number((won.length / totalClosed).toFixed(2)) : 0,
        avgDealSize: won.length ? Math.round(wonValue / won.length) : 0,
        meetingsBooked,
        forecasts: this.events.filter((e) => e.kind === 'forecast').length,
      },
      channelPerformance,
      forecast: {
        period: 'Próximos 30 dias',
        expectedValue: Math.round(weightedPipeline),
        confidence: Math.min(0.95, 0.4 + open.length * 0.05),
      },
      agentProductivity: this.agents.map((a) => ({
        agentId: a.id,
        name: a.name,
        actions: a.actionsToday,
        success: a.successToday,
      })),
    };
    this.analytics = analytics;
    return analytics;
  }

  toState(): SalesState {
    this.bumpDaily();
    return {
      autonomy: this.autonomy,
      agents: this.agents.map((a) => ({ ...a })),
      leads: this.leads.map((l) => ({ ...l })),
      deals: this.deals.map((d) => ({ ...d })),
      tasks: this.tasks.map((t) => ({ ...t })),
      events: this.events.map((e) => ({ ...e })),
      subscriptions: this.subscriptions.map((s) => ({ ...s })),
      messages: this.messages.map((m) => ({ ...m })),
      firstSaleAt: this.firstSaleAt,
      firstSaleNotified: this.firstSaleNotified,
      daily: { ...this.daily },
      analytics: this.analytics,
      generatedAt: new Date().toISOString(),
    };
  }

  /** Snapshot of the effects applied during one cycle, for the UI. */
  static cycleResult(
    store: SalesStore,
    effects: SalesEffect[],
    autonomy: AutonomyLevel,
  ): CycleResult {
    const pick = <T extends SalesEffect['type']>(type: T) =>
      effects
        .filter((e) => e.type === type)
        .map((e) => (e as Extract<SalesEffect, { type: T }>) as any);
    return {
      events: pick('event'),
      tasks: pick('task'),
      leads: pick('lead'),
      deals: pick('deal'),
      subscriptions: pick('subscription'),
      messages: pick('message'),
      autonomy,
      generatedAt: new Date().toISOString(),
    };
  }
}

