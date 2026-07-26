// lib/agent.js
// SDK do agente de vendas/leads AUTOMATIZADO, embutível em qualquer projeto.
// Exemplo mínimo:
//   import { createAgent } from 'waba-automate/agent';
//   const agent = createAgent({
//     client, store,
//     welcome: (c) => `Olá ${c.name || 'tudo bem'}! 👋 Como podemos ajudar?`,
//     onKeyword: {
//       'preco': (c) => 'Nossos planos: ...',
//       'humano': async (c, ctx) => { await ctx.escalate(c); return 'Já chamo um consultor. 🤝'; },
//     },
//     fallback: (c) => 'Não entendi. Digite PRECO, PLANOS ou HUMANO.',
//   });
//   await agent.handle(inboundMessage);

export function createAgent(opts = {}) {
  const {
    client,
    store,
    welcome,
    onKeyword = {},
    fallback,
    beforeReply,
    afterReply,
  } = opts;

  function normalize(text = '') {
    return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  }

  // Decide a resposta. Retorna string (texto) ou { type, ... } para tipos ricos.
  async function decide(contact, message, ctx) {
    if (beforeReply) await beforeReply(contact, message, ctx);
    const norm = normalize(message.text);
    // keywords
    for (const [kw, fn] of Object.entries(onKeyword)) {
      if (norm.includes(normalize(kw))) {
        const out = await fn(contact, ctx);
        return out;
      }
    }
    if (norm === '' && typeof welcome === 'function') return welcome(contact);
    if (typeof fallback === 'function') return fallback(contact);
    return 'Recebemos sua mensagem. Em breve nossa equipe responde. 🤖';
  }

  function render(reply) {
    if (typeof reply === 'string') return { type: 'text', body: reply };
    return reply; // já é { type, ... }
  }

  async function dispatch(contact, reply, out) {
    const r = render(reply);
    if (r.type === 'text') return client.text(contact.waId, r.body);
    if (r.type === 'template') return client.template(contact.waId, r.template);
    if (r.type === 'image') return client.image(contact.waId, r.link, r.caption);
    if (r.type === 'document') return client.document(contact.waId, r.link, r.caption, r.filename);
    if (r.type === 'interactive') return client.interactive(contact.waId, r.body);
    return { ok: false, error: 'unknown reply type' };
  }

  // Handler principal: recebe mensagem inbound normalizada e processa tudo.
  async function handle(msg) {
    const contact = await store.upsertContact({ waId: msg.from, name: msg.name });
    await store.logMessage({ waId: msg.from, direction: 'in', type: msg.type, text: msg.text, wamid: msg.wamid });
    await client.markRead(msg.wamid);

    // captura lead automaticamente a cada inbound
    const lead = await store.addLead({ waId: msg.from, name: msg.name, phone: msg.from });
    const ctx = { lead, escalate: async (c) => { lead.status = 'escalated'; await store.updateLead(lead.id, { status: 'escalated' }); } };

    const reply = await decide(contact, msg, ctx);
    const result = await dispatch(contact, reply, ctx);
    if (result?.ok || result?.dryRun) {
      const r = render(reply);
      const text = r.type === 'text' ? r.body : `[${r.type}]`;
      await store.logMessage({ waId: msg.from, direction: 'out', type: r.type, text });
    }
    if (afterReply) await afterReply(contact, msg, reply, result);
    return { contact, lead, reply, result };
  }

  return { handle, decide, dispatch, normalize };
}
