# Plano Estruturado — Esquadrão de Agentes LandMap (1k→5k assinaturas/dia)

> Objetivo: fazer os agentes conversarem entre si (diálogo estruturado, não só
> efeitos isolados) e empurrarem o funil até a ASSINATURA, com meta diária de
> 1.000 (baseline) a 5.000 (ambiciosa). PWA com notificações push + e-mail
> recorrente para ltdapax9@gmail.com. Tudo $0/open-source, sem stubs.

## 1. Arquitetura de diálogo (agentes conversando)

Cada agente NÃO age sozinho: ele emite efeitos + `messages` (linha de tempo do
diálogo). O orchestrator roda `runDialogue()` que encadeia os papéis numa
conversa real:

  Prospector ─▶ Qualifier ─▶ Enriquecedora ─▶ Outbound ─▶ Follow-up
       │                                              │
       └─▶ Market Intel (alimenta sinais)      Closer ◀─ Negotiator
                                                     │
                                                Subscriptor ◀─ Onboarding
                                                     │
                                                Account Manager (sucesso)

O "diálogo" é materializado por `AgentBus` (store.messages[]): cada agente pode
ler a última fala do anterior e reagir. Ex.: Closer diz "negócio em negociação,
preciso de prova social" → Subscriptor lê e responde "enviando trial de 7 dias
+ ranking da região do lead". Isso é o que torna o fechamento de ASSINATURA
automatizável.

## 2. Modelo de assinatura (novo)

`Subscription` = lead convertido em assinante. Campos: plano (free/trial/pro/
enterprise), MRR, ciclo, origem do fechamento (qual agente fechou), status
(active/canceled/trial). Contador diário `daily` persiste por data no global.

Funil de assinatura (estágios):
  visitor → lead → qualified → contacted → trial → subscriber → paid → renew

## 3. Meta diária e health

- `store.daily[dateISO]` = { subs: number, goal: number, leads, trials, paid }
- Goal padrão 1.000; sobe para 5.000 quando `DAILY_GOAL` env ou flag de "modo
  ambicioso" estiver on.
- `runDailyLoop()` roda N ciclos + diálogo + enfileira assinaturas; recalcula
  progresso e dispara webhook `daily.report`.

## 4. Loop 24/7 (server-side, não só no browser)

- Rota `POST /api/sales/loop` consome um batch (ex.: 20 ciclos + 1 diálogo) e
  atualiza o store global.
- `vercel.json` agenda cron `0 */1 * * *` → `/api/cron/sales-loop` (a cada 1h)
  para sustentar fluxo contínuo mesmo sem admin aberto.
- Cockpit continua com auto-loop client-side (já existe) como reforço visual.

## 5. PWA + notificações

- `public/sw.js` (service worker) com `push` + `notificationclick`.
- Registrar SW no root layout (client component) e pedir permissão.
- Rota `POST /api/push/subscribe` salva `subscription` (IndexedDB/ledger global).
- Rota `POST /api/push/send` dispara Web Push (VAPID) para assinantes — usada
  pelo loop ao bater marcos (ex.: 100 assinaturas, relatório diário).

## 6. E-mail recorrente

- `packages/api/src/mailer.ts`: adapter com 3 backends, prioridade:
  1. Resend (`RESEND_API_KEY`) — produção real, $0 até 3k/mês.
  2. SMTP (`SMTP_*`) — fallback open-source.
  3. Ledger (default) — salva em `globalThis` e loga; não quebra em dev.
- `POST /api/mail/send` envia relatório para ltdapax9@gmail.com.
- Cron diário (08:00 local) envia resumo: assinaturas do dia, progresso vs meta,
  agentes que mais fecharam, alertas.

## 7. KPIs e instrumentação

- `analytics.subscriptions`: total, ativas, trial, MRR, por plano, churn.
- Canal de melhor conversão (email/whatsapp) destacado no cockpit.
- Webhooks existentes reutilizados: `score.updated`, `lead.updated`,
  `alert.fired`, novo `subscription.created`, `daily.report`.

## 8. Plano de execução (8h)

1. Estender types/store (Subscription, DailyCounter, AgentBus) — ✅
2. Agente Subscriptor + handoff no Closer — ✅
3. orchestrator runDialogue + runDailyLoop — ✅
4. Rotas /api/sales (+subscriptions,+daily,+dialogue,+loop) — ✅
5. PWA sw.js + register + /push/subscribe + /push/send — ✅
6. mailer + /mail/send + vercel.json crons — ✅
7. typecheck/build — ✅
8. fetches (web_search) p/ market intel alimentar Prospector/Market Intel — ✅

## 9. Notas de risco

- "1k-5k assinaturas/dia" é meta de capacidade do MOTOR, não tráfego pago. O
  Prospector gera leads sintéticos em demo; em produção liga-se a fontes reais
  (scraper, Twenty, integrações) já presentes no repo.
- Autonomia: manter copilot/autopilot como hoje; assinatura só é contada quando
  `closed_won` vira `Subscription`.
- Sem chaves de API no repo: Resend/SMTP/VAPID são opcionais (ledger fallback).
