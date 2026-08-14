# AgentPhone Integration — LandMap Admin

Integração completa de **AgentPhone** no LandMap, permitindo gerenciar agentes de voz com números telefônicos reais, fazer chamadas automáticas, e rastrear transcrições em tempo real.

## 📋 Visão Geral

AgentPhone fornece:
- ✅ **Agentes de voz com IA** — Claude/OpenAI/ElevenLabs processando chamadas em tempo real
- ✅ **Números telefônicos reais** — Números US (+1) e CA (+1) atribuídos a agentes
- ✅ **Múltiplas vozes** — Brian, Sophia, Arthur (ElevenLabs), Alloy, Nova, Onyx (OpenAI), AWS Polly
- ✅ **Modo Hosted** — Agente IA controla toda a conversa (sem webhook)
- ✅ **Modo Webhook** — Seu servidor controla cada turno (lógica customizada)
- ✅ **Chamadas de saída** — Fazer chamadas programáticas para leads/prospects
- ✅ **Transcrições** — Histórico de todas as chamadas + áudio (opcional)
- ✅ **SMS** — Enviar/receber SMS pelo mesmo número (futuro: integração Twilio)

## 🚀 Quick Start

### 1. Configurar API Key

```bash
# .env.local
AGENTPHONE_API_KEY=sk_live_xxxxx  # Get from agentphone.to
```

### 2. Acessar o painel admin

```
https://landmap.local/admin/agentphone
```

### 3. Criar primeiro agente

**UI Admin:**
- Clique "Novo agente"
- Escolha nome, voz (ex: Sophia), modo (hosted)
- Cole o system prompt
- Salve

**Code (SDK):**
```typescript
import { agentPhoneClient, createPreconfiguredAgent } from '@/lib/agentphone';

// Quick setup
const agent = await createPreconfiguredAgent('Vendas Curitiba', 'sales');
// → nome: 'Vendas Curitiba'
// → voz: Sophia
// → systemPrompt: prompt de vendas pré-configurado
// → beginMessage: "Olá! Estou ligando sobre uma oportunidade..."

// Custom
const custom = await agentPhoneClient.createAgent({
  name: 'Support Pro',
  voiceMode: 'hosted',
  systemPrompt: 'Você é um agente de suporte premium...',
  beginMessage: 'Olá, como posso ajudar?',
  voice: '11labs-Brian',
});
```

### 4. Comprar número

**UI:**
- Clique "Comprar número"
- Escolha agente
- Selecione país (US, CA)
- Opcionalmente escolha área (415, 212, etc)
- Salve

**Code:**
```typescript
const number = await agentPhoneClient.buyNumber('agent_123', 'US', '415');
// → +14155551234 (atribuído ao agente)
```

### 5. Fazer chamada

**UI:**
- Clique ☎️ ao lado do agente
- Insira número destino (+55 11 99999-9999)
- Mensagem inicial (opcional)
- Clique "Fazer chamada"

**Code:**
```typescript
const call = await agentPhoneClient.makeCall('agent_123', '+551199999999', {
  initialGreeting: 'Olá, estou ligando sobre a propriedade em Curitiba',
});

// Monitorar conclusão
const completed = await waitForCallCompletion(call.id);
console.log('Duração:', completed.durationSeconds + 's');
console.log('Transcrição:', completed.transcript);
```

## 🎯 Casos de Uso

### 1. Follow-up Automático de Leads

```typescript
// Integração com admin/agents (sales squad)
async function runVoiceFollowUp() {
  const leads = await getSalesPendingFollowups();
  const agent = await agentPhoneClient.getAgent('agent_followup_voice');

  for (const lead of leads) {
    const greeting = `Olá ${lead.name}, você estava interessado na propriedade em ${lead.city}?`;
    const call = await agentPhoneClient.makeCall(agent.id, lead.phone, {
      initialGreeting: greeting,
    });

    // Registrar no CRM
    await recordCall(lead.id, call.id, 'voice_followup');
  }
}
```

### 2. Geração de Leads (Cold Calling)

```typescript
// Script de prospect em frio
const coldCallAgent = await createPreconfiguredAgent('Cold Caller SP', 'lead-gen');
const prospectNumbers = ['+5511987654321', '+5511987654322', ...];

const results = await batchMakeCalls(coldCallAgent.id, prospectNumbers, {
  initialGreeting: 'Olá! Identificamos que você está na zona de alto potencial de valorização...',
  delayMs: 8000, // 8s entre chamadas (respeita rate limit)
});

// results[].callId → verificar transcrição depois
```

### 3. Suporte 24/7 Automático

```typescript
// Agente atende chamadas que chegam no número
const supportAgent = await createPreconfiguredAgent('Support 24h', 'support');
const supportNumber = (await agentPhoneClient.buyNumber(supportAgent.id, 'US', '415'))
  .phoneNumber;

// Configure redirecionador (seu PBX/Twilio) para encaminhar chamadas ao webhook:
// POST https://landmap/api/agentphone/webhooks
// Agente recebe, transcreve, responde automaticamente

// Histórico fica em /admin/agentphone → tab "Histórico de chamadas"
```

### 4. Notificações de Imóvel por Voz

```typescript
// Notifica proprietários quando novo imóvel similar aparece
async function notifyByVoice(owner, property) {
  const announcement = `Opa ${owner.name}, achamos um imóvel exatamente como você pediu! ${property.title} em ${property.city}, ${property.areaM2}m², R$ ${property.price.toLocaleString()}. Quer marcar uma visita?`;

  const call = await agentPhoneClient.makeCall('agent_notification', owner.phone, {
    initialGreeting: announcement,
  });
}
```

## 📡 Vozes Disponíveis

### ElevenLabs (Premium, mais natural)
- `11labs-Brian` — Homem, profissional, neutro
- `11labs-Sophia` — Mulher, amigável, eng/pt
- `11labs-Arthur` — Homem, educado, formal

### OpenAI (Rápido, low-cost)
- `alloy` — Neutro, conversacional
- `nova` — Feminino, amigável
- `onyx` — Masculino, grave

### AWS Polly (Clássico)
- `Polly.Amy` — Feminino, British
- `Polly.Brian` — Masculino, American

**Recomendação para LandMap:**
- Vendas → `11labs-Sophia` (cálido, engajador)
- Suporte → `11labs-Brian` (profissional, confiável)
- Prospecção → `alloy` (rápido, econômico)

## ⚙️ Configuração Webhook (Modo Avançado)

Se você quer lógica customizada (chamar APIs, consultar BD):

```typescript
// Agente em modo webhook
const customAgent = await agentPhoneClient.createAgent({
  name: 'Custom Logic Agent',
  voiceMode: 'webhook', // ← Key: agora você controla
  systemPrompt: '...prompt...',
});

// Seu servidor recebe turnos de conversa:
POST /seu-webhook
{
  "event": "agent.message",
  "channel": "voice",
  "data": {
    "transcript": "Sim, tenho interesse em imóvel residencial",
    "recentHistory": [...]
  }
}

// Você responde com JSON:
{
  "text": "Ótimo! Deixe-me consultar o nosso banco...",
  "interim": true  // TTS fala "Ótimo!" enquanto você processa
}
// Depois:
{
  "text": "Temos 3 opciónes em São Paulo. Qual bairro interessa?"
}
```

Veja `packages/api/src/routes/agentphone.ts` para esquema completo.

## 📊 Automação com Admin Agentes (Sales Squad)

**Integração com `/admin/agents` (follow-up team):**

```typescript
// In admin/agents auto-loop
if (autonomyLevel === 'autopilot') {
  // Sistema de vendas faz automações
  const followups = await getSalesFollowups();

  // NOVO: Cada follow-up pode ser voz
  for (const fu of followups) {
    if (fu.channel === 'voice' || fu.preferVoice) {
      const voiceAgent = await agentPhoneClient.getAgent(fu.agentVoiceId);
      const call = await agentPhoneClient.makeCall(voiceAgent.id, fu.lead.phone, {
        initialGreeting: fu.draft, // O draft do agente de vendas vira greeting
      });
      // Registrar chamada
      fu.linkedCallId = call.id;
    }
  }
}
```

## 🔒 Segurança & Privacidade

1. **API Key** — Armazenada em `.env.local`, **nunca commitir**
2. **Rate Limiting** — AgentPhone limita a 100 chamadas/dia (plano free). Respeitar `delayMs` em batch calls
3. **Conformidade** — Chamadas são registradas (áudio + transcrição). Respeitar LGPD/GDPR
4. **Webhook Secret** — Se usar modo webhook, valide `X-AgentPhone-Signature` header

## 📈 Monitoramento

**Dashboard Admin:**
- Total de agentes, números, chamadas
- Taxa de conclusão (completed/total)
- Tempo médio de chamada
- Minutos usados (billing)

**Logs:**
```
GET /api/agentphone/calls?limit=100
{
  "data": [
    {
      "id": "call_xxx",
      "direction": "outbound",
      "status": "completed",
      "durationSeconds": 245,
      "transcript": "Agente: Olá... Lead: Oi... Agente: ...",
      "startedAt": "2026-08-14T10:30:00Z",
      "endedAt": "2026-08-14T10:34:05Z"
    }
  ],
  "total": 42
}
```

## 💰 Preços (AgentPhone.to)

- **Free:** 1 número, 100 min/mês
- **Pro:** 10 números, 5k min/mês ~ $50/mês
- **Enterprise:** Custom

Adicionar em billing.ts para faturar clientes pro.

## 🛠️ Troubleshooting

| Problema | Causa | Solução |
|----------|-------|---------|
| "Call not initiated" | Agente sem número | Comprar número antes |
| "Webhook timeout" | Servidor lento | Retornar `interim` chunks imediatamente |
| "Bad audio quality" | Provider sobrecarregado | Tentar `alloy` (OpenAI) em vez de ElevenLabs |
| "Rate limit exceeded" | Muitas chamadas rápido | Aumentar `delayMs` em batchMakeCalls |

## 📚 Referências

- **Docs API:** https://docs.agentphone.to
- **Console:** https://agentphone.to
- **LandMap SDK:** `apps/web/src/lib/agentphone.ts`
- **Rota API:** `packages/api/src/routes/agentphone.ts`
- **Admin UI:** `apps/web/src/app/[locale]/admin/agentphone/page.tsx`
