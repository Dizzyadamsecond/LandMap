// lib/webhook.js
// Verificação do webhook Meta (GET) + normalização de inbound (POST).
// Não depende de nenhum framework — retorna funções puras testáveis.

// GET /webhook?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
export function verifyQuery({ query, verifyToken }) {
  const mode = query['hub.mode'];
  const token = query['hub.verify_token'];
  const challenge = query['hub.challenge'];
  if (mode === 'subscribe' && token === verifyToken) {
    return { ok: true, challenge: parseInt(challenge, 10) };
  }
  return { ok: false };
}

// Recebe o body JSON do POST da Meta e devolve uma lista achatada de mensagens.
// Cada item normalizado: { from, name, wamid, type, text, timestamp, raw }
export function parseInbound(body) {
  const out = [];
  try {
    const entries = body?.entry || [];
    for (const entry of entries) {
      for (const change of entry?.changes || []) {
        const value = change?.value || {};
        const contacts = value?.contacts || [];
        const nameOf = (waId) => contacts.find((c) => c.wa_id === waId)?.profile?.name || '';
        for (const msg of value?.messages || []) {
          const waId = msg.from;
          out.push({
            from: waId,
            name: nameOf(waId),
            wamid: msg.id,
            type: msg.type,
            text: msg.text?.body || msg.interactive?.button_reply?.title || msg.button?.text || '',
            timestamp: msg.timestamp ? new Date(Number(msg.timestamp) * 1000).toISOString() : new Date().toISOString(),
            raw: msg,
          });
        }
      }
    }
  } catch (e) {
    // body malformado — retorna vazio, servidor responde 200 mesmo assim (Meta exige).
  }
  return out;
}
