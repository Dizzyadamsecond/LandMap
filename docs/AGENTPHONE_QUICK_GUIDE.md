# 🎤 AgentPhone Quick Guide — LandMap

Integração de **agentes de voz com números telefônicos reais** no LandMap Admin. Automação máxima de follow-ups, suporte 24/7, cold calling, e notificações por voz.

---

## 📍 Acesso

```
🌍 https://landmap.local/admin/agentphone
```

Ou em produção:
```
🌍 https://landmapprod.vercel.app/pt-BR/admin/agentphone
```

---

## 🎯 Primeiros Passos (5 minutos)

### 1️⃣ Configurar API Key

**Arquivo: `.env.local`**
```bash
AGENTPHONE_API_KEY=sk_live_xxxxx
```

**Como obter:**
1. Ir para [agentphone.to](https://agentphone.to)
2. Sign up (ou login)
3. Dashboard → API Keys
4. Copiar `sk_live_...`
5. Colar em `.env.local`
6. Restart dev server: `pnpm dev`

### 2️⃣ Criar Agente (UI)

Na página de admin:

```
[Novo agente]
  Nome: "Vendedor Curitiba"
  Modo: Hosted (IA automática)
  Voz: Sophia (11labs) ← recomendado
  Prompt: "Você é um agente de vendas amigável..."
  Mensagem inicial: "Olá! Tenho uma oportunidade de imóvel"
  [Criar agente]
```

Resultado:
```
✅ Agente criado: agent_123456
   - Status: active
   - Voz: Sophia
   - Sem números (próximo passo)
```

### 3️⃣ Comprar Número

```
[Comprar número]
  Agente: Vendedor Curitiba
  País: Estados Unidos
  Área (opcional): 415 (São Francisco)
  [Comprar]
```

Resultado:
```
✅ Número comprado: +14155551234
   Atribuído a: Vendedor Curitiba
```

### 4️⃣ Fazer Primeira Chamada

Clique no botão ☎️ ao lado do agente:

```
[Fazer chamada]
  Agente: Vendedor Curitiba
  Número: +5511987654321
  Mensagem: "Olá João, achei um imóvel que combine com você!"
  [Chamar]
```

Resultado:
```
⏳ Chamada iniciada... (wait 30-120s)
✅ Chamada completa: 2m 15s
   Transcrição: "Agent: Olá João... Lead: Oi tudo bem... Agent: ..."
```

---

## 💻 Usar via Código (SDK)

### Import

```typescript
import { 
  agentPhoneClient, 
  createPreconfiguredAgent,
  batchMakeCalls,
  waitForCallCompletion
} from '@/lib/agentphone';
```

### Criar Agente Pré-configurado

```typescript
// Rápido: template pré-pronto
const agent = await createPreconfiguredAgent('Suporte 24h', 'support');
// Ou: 'sales', 'lead-gen'

// Custom
const myAgent = await agentPhoneClient.createAgent({
  name: 'Custom Bot',
  voiceMode: 'hosted', // ou 'webhook' para lógica customizada
  systemPrompt: 'Você é um robo que...',
  beginMessage: 'Olá, bem-vindo!',
  voice: '11labs-Brian', // ou 'alloy', 'nova', etc
});
```

### Fazer Chamada Individual

```typescript
const call = await agentPhoneClient.makeCall(
  agent.id,
  '+5511987654321',
  { initialGreeting: 'Olá, estou ligando sobre...' }
);

console.log(call.id); // call_xxx
console.log(call.status); // 'in-progress'

// Esperar conclusão
const completed = await waitForCallCompletion(call.id);
console.log(completed.transcript);
console.log(`${completed.durationSeconds}s`);
```

### Batch Calls (Múltiplos Leads)

```typescript
const leadNumbers = [
  '+5511987654321',
  '+5511987654322',
  '+5511987654323',
];

const results = await batchMakeCalls(
  agent.id,
  leadNumbers,
  { 
    initialGreeting: 'Olá, achei um imóvel para você!',
    delayMs: 15000, // 15s entre chamadas (importante!)
  }
);

// results[0] = { number: '+55...', callId: 'call_xxx', error?: '...' }
results.forEach(r => {
  if (r.error) {
    console.error(`Falhou: ${r.number} — ${r.error}`);
  } else {
    console.log(`Chamada iniciada: ${r.callId}`);
  }
});
```

### Voice Follow-up Automático

```typescript
import { voiceFollowupLead, voiceFollowupCampaign } from '@/lib/voice-automation';

// 1 lead
const result = await voiceFollowupLead({
  leadId: '123',
  leadName: 'João Silva',
  leadPhone: '+5511987654321',
  leadCity: 'Curitiba',
  propertyTitle: 'Apto 3 quartos Batel',
  propertyPrice: 450000,
  propertyArea: 120,
  draftMessage: 'Olá João, você ainda tem interesse na propriedade?',
  voiceMode: 'greeting',
});

// Múltiplos leads (com delay e callback)
const campaignResults = await voiceFollowupCampaign(
  [
    { leadId: '1', leadName: 'João', leadPhone: '+55...', ... },
    { leadId: '2', leadName: 'Maria', leadPhone: '+55...', ... },
  ],
  {
    delayBetweenCallsMs: 20000, // 20s entre
    onCallComplete: async (task, result) => {
      console.log(`${task.leadName}: ${result.durationSeconds}s`);
      // Registrar no CRM, BD, etc
      await saveToCRM(task.leadId, result.transcript);
    }
  }
);
```

---

## 🎙️ Vozes (8 opções)

| Voz | Provider | Tipo | Melhor para |
|-----|----------|------|-----------|
| **Sophia** | ElevenLabs | Feminino cálido | Vendas, suporte amigável |
| **Brian** | ElevenLabs | Masculino profissional | Suporte, formal |
| **Arthur** | ElevenLabs | Masculino educado | Executivo, premium |
| **Alloy** | OpenAI | Neutro, rápido | Economico, chatbot |
| **Nova** | OpenAI | Feminino | Geral |
| **Onyx** | OpenAI | Masculino | Geral |
| Polly.Amy | AWS | Feminino UK | Clássico |
| Polly.Brian | AWS | Masculino US | Clássico |

**Recomendação LandMap:**
- 🎯 **Vendas:** Sophia (cálida)
- 🆘 **Suporte:** Brian (confiável)
- 📞 **Cold call:** Alloy (rápido/econômico)

---

## 🔄 Integração com Admin Agentes (Squad Follow-up)

Fazer follow-up **por voz** é tão fácil quanto email:

```typescript
// Em /admin/agents (auto-loop)

// Antes (só email/SMS/WABA):
for (const fu of followUps) {
  if (fu.channel === 'email') { /* ... */ }
  if (fu.channel === 'sms') { /* ... */ }
}

// Agora (inclui voice):
for (const fu of followUps) {
  if (fu.channel === 'voice') {
    const result = await voiceFollowupLead({
      leadId: fu.leadId,
      leadName: fu.lead.name,
      leadPhone: fu.lead.phone, // ← novo
      leadCity: fu.lead.city,
      propertyTitle: fu.property?.title || '',
      propertyPrice: fu.property?.price || 0,
      propertyArea: fu.property?.areaM2 || 0,
      draftMessage: fu.draft, // O texto do agente vira greeting
      voiceMode: 'greeting',
    });
    fu.callId = result.callId;
    fu.transcript = result.transcript;
  }
}
```

No admin UI, vai aparecer um novo tipo de follow-up:
```
┌─ Follow-up de João Silva
├─ Canal: 🎤 Voice
├─ Agente: Vendedor Curitiba
├─ Status: ⏳ In Progress (1m 45s)
├─ Transcrição: "Agent: Olá... Lead: Oi..."
└─ Ações: [Transcrição completa] [Salvar no CRM]
```

---

## 🚨 Casos de Uso Reais

### 1. Follow-up de Visitante

```typescript
// Cron: Após visitante visitar propriedade no mapa
async function callAfterVisite() {
  const recent = await getRecentPropertyVisits(1); // últimas 24h
  
  for (const visit of recent) {
    await voiceFollowupLead({
      leadId: visit.userId,
      leadName: visit.userName,
      leadPhone: visit.userPhone,
      leadCity: visit.property.city,
      propertyTitle: visit.property.title,
      propertyPrice: visit.property.price,
      propertyArea: visit.property.areaM2,
      draftMessage: `Olá ${visit.userName}! Vi que você visitou "${visit.property.title}". Ficou interessado?`,
      voiceMode: 'full_conversation',
    });
  }
}

// Agendar para rodar diariamente
// cronHandler.schedule('0 10 * * *', callAfterVisite); // 10h da manhã
```

### 2. Cold Calling Automático

```typescript
// Campaign: Ligar para prospects novos (não-conversos)

async function coldCallCampaign() {
  const prospects = await getNeverConverted({ limit: 50, city: 'Curitiba' });
  
  const agent = await createPreconfiguredAgent(
    'Cold Caller CTB',
    'lead-gen'
  );
  
  const numbers = prospects.map(p => p.phone);
  
  const results = await batchMakeCalls(agent.id, numbers, {
    initialGreeting: 'Olá! Identificamos que você busca imóvel em Curitiba. Achei 3 oportunidades quentes!',
    delayMs: 25000, // 25s (respeita rate limit)
  });
  
  // Log
  const successful = results.filter(r => !r.error).length;
  console.log(`✅ ${successful}/${results.length} chamadas iniciadas`);
}
```

### 3. Notificação de Novo Imóvel

```typescript
// Quando novo imóvel é publicado em área que lead salvou

async function notifyNewProperty(property, subscribers) {
  const agent = await agentPhoneClient.getAgent('agent_notification');
  
  for (const sub of subscribers) {
    const message = `Opa ${sub.name}! Achei um ${property.type} novo em ${property.city}!
    ${property.title}, ${property.areaM2}m², R$ ${property.price}.
    Quer detalhes?`;
    
    await agentPhoneClient.makeCall(agent.id, sub.phone, {
      initialGreeting: message,
    });
  }
}
```

### 4. Suporte 24/7

```typescript
// Agente atende chamadas em horário fora de expediente

const supportAgent = await createPreconfiguredAgent('24h Support', 'support');
const supportNumber = await agentPhoneClient.buyNumber(supportAgent.id, 'US', '415');

// Configure seu PBX/Twilio para encaminhar chamadas:
// 1. Comprador liga para seu número principal
// 2. Se fora de expediente → encaminha para supportNumber
// 3. Agente IA atende e resolve automaticamente

console.log(`Número suporte 24h: ${supportNumber.phoneNumber}`);
```

---

## 📊 Monitoramento

### Dashboard Stats

```
Agentes: 5
  - 4 ativos
Números: 8
Chamadas este mês: 142
  - 128 completas (90%)
  - 14 em progresso
Minutos: 847
  - Custo estimado: $12.70
```

### Call History

```
Filtrar por:
- Status: completed ✅ | in-progress ⏳ | failed ❌
- Agent: [dropdown]
- Date range: [picker]
```

Cada chamada mostra:
- Tempo exato
- Duração
- Transcrição completa
- Áudio (se recording ativado)

---

## ⚡ Tips & Tricks

### 1. Use `delayMs` em Batch Calls
Sem delay, AgentPhone rate-limita. Recomendado: **15-30s**

```typescript
// ❌ Errado: vai falhar algumas chamadas
for (const num of numbers) {
  await agentPhoneClient.makeCall(agentId, num);
}

// ✅ Certo: respeita rate limit
await batchMakeCalls(agentId, numbers, { delayMs: 20000 });
```

### 2. Capture Call ID Imediatamente
Salve o call ID logo após iniciar, para rastrear depois:

```typescript
const call = await agentPhoneClient.makeCall(...);
await saveToDB({
  leadId,
  callId: call.id,
  startedAt: new Date(),
});
```

### 3. Transcrições Automáticas
Depois que chamada completa, transcrição é gerada. Checa:

```typescript
const completed = await waitForCallCompletion(callId);
console.log(completed.transcript); // Pronto!
```

### 4. Integrar com CRM
Após chamada, salve no seu CRM:

```typescript
const result = await voiceFollowupLead(task);

// Salvar no Twenty CRM, HubSpot, etc
await crm.activities.create({
  type: 'call',
  contactId: task.leadId,
  notes: result.transcript,
  duration: result.durationSeconds,
});
```

---

## 🔐 Segurança

- **API Key:** Nunca commit `.env.local` — use secrets em staging/prod
- **Phone Numbers:** Números são privados, SMS apenas via webhook autorizado
- **Recordings:** Áudio armazenado em AgentPhone (confira conformidade com LGPD/GDPR)
- **Rate Limits:** 100-500 chamadas/dia (plano). Usa `delayMs` para evitar bloqueio

---

## 💰 Billing

AgentPhone charges:
- **Mensalidade:** $50-200 (plano)
- **Por minuto:** $0.10-0.20 (dependendo de voz/provider)

Exemplo:
- 100 chamadas × 2 min = 200 min
- 200 min × $0.15 = **$30/mês**

Adicione markup ao plano do cliente (ex: +50% = $45) para lucrar.

---

## 🆘 Troubleshooting

| Erro | Causa | Fix |
|------|-------|-----|
| "API key invalid" | `.env.local` errada | Confirme `sk_live_...` em agentphone.to |
| "Agent has no numbers" | Comprar número antes | `[Comprar número]` no UI |
| "Call rate limited" | Muitas chamadas rápido | Aumentar `delayMs` para 25000+ |
| "Webhook timeout" | Servidor lento | Retornar `interim: true` chunks em webhook |
| "Bad audio" | Rede/provider overload | Try OpenAI `alloy` em vez de ElevenLabs |

---

## 📞 Suporte

- **Docs:** https://docs.agentphone.to
- **Status:** https://status.agentphone.to
- **Email:** support@agentphone.to

---

**Pronto pra ligar? 🎤 Acesse `/admin/agentphone` e crie seu primeiro agente!**
