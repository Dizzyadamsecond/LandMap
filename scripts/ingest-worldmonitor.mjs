#!/usr/bin/env node
/**
 * RAG ingest — conecta os dossiês WorldMonitor ao índice embeddings do LandMap.
 *
 * Uso:
 *   node scripts/ingest-worldmonitor.mjs
 *
 * Lê data/worldmonitor/rag/*.md e os indexa com namespace `worldmonitor`
 * no índice persistido (data/landmap/embeddings-index.json), que alimenta
 * /api/rag/query e o chat local.
 *
 * Chamado pelo orquestrador 24/7 depois de cada coleta (ou manualmente).
 */
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Resolve @landmap/llm via its built dist (works regardless of cwd).
const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const distRoot = join(__dirname, '..', 'packages', 'llm', 'dist');

// ingestion.ts captures ROOT = cwd/../.. at IMPORT time — chdir first so the
// module resolves the repo root correctly on Windows.
const APPS_WEB = join(__dirname, '..', 'apps', 'web');
process.chdir(APPS_WEB);

const { ingestSource, loadPersistedIndex } = await import(
  pathToFileURL(join(distRoot, 'index.js')).href
);

const RAG_DIR_REL = join('data', 'worldmonitor', 'rag');

async function main() {
  // ROOT in ingestion.ts = cwd/../.. — with cwd pinned to apps/web, ROOT is
  // the repo root, so a RELATIVE path resolves to <repo>/data/worldmonitor/rag.
  const dir = join('data', 'worldmonitor', 'rag');
  const abs = join(APPS_WEB, '..', '..', dir);
  const files = existsSync(abs)
    ? (await import('node:fs')).readdirSync(abs).filter((f) => f.endsWith('.md'))
    : [];
  if (!files.length) {
    console.error('[ingest-worldmonitor] rag dir missing/empty:', abs);
    process.exit(1);
  }
  const results = [];
  for (const file of files) {
    // relative to ROOT (repo root) — avoids the absolute-path join duplication
    const rel = join(dir, file);
    results.push(await ingestSource({ path: rel, namespace: 'worldmonitor' }));
  }
  const index = loadPersistedIndex();
  const wmEntries = index.filter((e) => e.source.includes('worldmonitor'));
  console.log(
    `[ingest-worldmonitor] ${results.length} sources · ` +
    `${wmEntries.length} worldmonitor entries no índice · ` +
    `${index.length} total`
  );
}

main().catch((err) => {
  console.error('[ingest-worldmonitor]', err);
  process.exit(1);
});
