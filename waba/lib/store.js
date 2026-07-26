// lib/store.js
// Armazenamento atômico em JSON (zero dependências). Ideal para dev / self-host
// leve. Para produção escalar, troque internamente por Postgres/SQLite sem mudar a API.
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export function createStore({ dataDir = process.env.WABA_DATA_DIR || './data' } = {}) {
  const file = path.join(dataDir, 'store.json');
  let cache = null;

  async function load() {
    if (cache) return cache;
    try {
      const raw = await readFile(file, 'utf8');
      cache = JSON.parse(raw);
    } catch {
      cache = { contacts: {}, leads: {}, messages: [] };
    }
    cache.contacts ||= {};
    cache.leads ||= {};
    cache.messages ||= [];
    return cache;
  }

  // Escrita atômica: escreve em .tmp e rename (nunca corrompe o arquivo).
  async function save() {
    await mkdir(dataDir, { recursive: true });
    const tmp = file + '.tmp';
    await writeFile(tmp, JSON.stringify(cache, null, 2));
    await rename(tmp, file);
  }

  async function upsertContact({ waId, name, phone, extra = {} }) {
    const db = await load();
    const prev = db.contacts[waId] || {};
    const contact = { waId, name: name || prev.name || '', phone: phone || waId, firstSeen: prev.firstSeen || new Date().toISOString(), lastSeen: new Date().toISOString(), ...prev.extra, ...extra };
    db.contacts[waId] = contact;
    await save();
    return contact;
  }

  // Lead é idempotente por waId: a primeira inbound cria; próximas atualizam
  // o mesmo lead (não duplica). O escalar muda status no lead vivo.
  async function addLead({ waId, name, phone, source = 'whatsapp', notes = '', interest = '', extra = {} }) {
    const db = await load();
    const existingId = Object.keys(db.leads).find((id) => db.leads[id].waId === waId);
    if (existingId) {
      const lead = { ...db.leads[existingId], name: name || db.leads[existingId].name, phone: phone || db.leads[existingId].phone, updatedAt: new Date().toISOString() };
      db.leads[existingId] = lead;
      await save();
      return lead;
    }
    const id = randomUUID();
    const lead = { id, waId, name: name || '', phone: phone || waId, source, interest, notes, extra, status: 'new', createdAt: new Date().toISOString() };
    db.leads[id] = lead;
    await save();
    return lead;
  }

  async function updateLead(id, patch = {}) {
    const db = await load();
    if (!db.leads[id]) return null;
    db.leads[id] = { ...db.leads[id], ...patch, updatedAt: new Date().toISOString() };
    await save();
    return db.leads[id];
  }

  async function logMessage({ waId, direction, type, text, wamid = '' }) {
    const db = await load();
    const m = { id: randomUUID(), waId, direction, type, text, wamid, ts: new Date().toISOString() };
    db.messages.push(m);
    if (db.messages.length > 50000) db.messages = db.messages.slice(-50000);
    await save();
    return m;
  }

  async function listLeads() {
    const db = await load();
    return Object.values(db.leads).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }
  async function listMessages(waId) {
    const db = await load();
    return db.messages.filter((m) => m.waId === waId);
  }

  return { upsertContact, addLead, updateLead, logMessage, listLeads, listMessages, load, save };
}
