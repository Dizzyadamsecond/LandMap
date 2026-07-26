// lib/cloud-api.js
// Cliente da WhatsApp Business Cloud API (Meta) — 100% funcional, $0.
// Modo DRY-RUN quando não há token: registra o payload e grava em outbox.jsonl,
// sem nunca bater na Meta. Preencha WHATSAPP_TOKEN para ir a LIVE.
import { appendFile } from 'node:fs/promises';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export function createCloudClient(opts = {}) {
  const {
    token = process.env.WHATSAPP_TOKEN || '',
    phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0',
    dryRun = process.env.WHATSAPP_TOKEN ? false : (process.env.WABA_DRY_RUN !== 'false'),
    dataDir = process.env.WABA_DATA_DIR || './data',
  } = opts;

  const log = (...a) => { if (process.env.WABA_LOG) console.log('[waba:cloud]', ...a); };

  async function writeOutbox(entry) {
    try {
      await mkdir(dataDir, { recursive: true });
      await appendFile(path.join(dataDir, 'outbox.jsonl'), JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n');
    } catch (e) { log('outbox write failed', e.message); }
  }

  async function graphFetch(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
    return { status: res.status, json };
  }

  // Central de envio: recebe o body já formatado da Cloud API e roteia.
  async function send(body) {
    if (dryRun || !token) {
      const entry = { mode: 'DRY_RUN', phoneId, body };
      await writeOutbox(entry);
      log('DRY_RUN send ->', JSON.stringify(body).slice(0, 200));
      return { dryRun: true, ok: true, wamid: 'dry-' + randomUUID(), echo: body };
    }
    const url = `https://graph.facebook.com/${apiVersion}/${phoneId}/messages`;
    const { status, json } = await graphFetch(url, body);
    if (status >= 400) {
      log('send error', status, JSON.stringify(json).slice(0, 300));
      return { dryRun: false, ok: false, status, json };
    }
    return { dryRun: false, ok: true, status, json, wamid: json?.messages?.[0]?.id };
  }

  // --- Helpers de alto nível ---

  function text(to, text) {
    return send({ messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'text', text: { preview_url: true, body: text } });
  }

  // template: { name, language: 'pt_BR', components?: [...] }
  function template(to, tpl) {
    return send({ messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'template', template: tpl });
  }

  function image(to, link, caption) {
    return send({ messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'image', image: { link, caption: caption || '' } });
  }
  function document(to, link, caption, filename) {
    return send({ messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'document', document: { link, caption: caption || '', filename: filename || 'file.pdf' } });
  }
  function audio(to, link) {
    return send({ messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'audio', audio: { link } });
  }
  function interactive(to, body) {
    return send({ messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'interactive', interactive: body });
  }

  // Marca mensagem recebida como lida (pressiona "visto").
  async function markRead(wamid) {
    if (dryRun || !token) { log('DRY_RUN markRead', wamid); return { dryRun: true, ok: true }; }
    const url = `https://graph.facebook.com/${apiVersion}/${phoneId}/messages`;
    const { status, json } = await graphFetch(url, { messaging_product: 'whatsapp', status: 'read', message_id: wamid });
    return { dryRun: false, ok: status < 400, status, json };
  }

  return { text, template, image, document, audio, interactive, markRead, send, get dryRun() { return dryRun; } };
}
