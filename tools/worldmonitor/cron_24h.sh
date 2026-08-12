#!/usr/bin/env bash
# WorldMonitor 24/7 — cron wrapper (Hermes cron local).
# Roda a coleta completa (Open-Meteo + Overpass + WRI) + ingestão RAG.
# Uso: bash tools/worldmonitor/cron_24h.sh [--quick]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PY="${PYTHON:-$(command -v python || command -v python3)}"
LOG="$ROOT/data/worldmonitor/cron_24h.log"

echo "[$(date -Is)] WorldMonitor cron start" >> "$LOG"

# 1) Scraper completo (tolerante a rate-limit; overpass concorrente)
"$PY" -u "$ROOT/tools/worldmonitor/run.py" "$@" >> "$LOG" 2>&1 || \
  echo "[$(date -Is)] scraper FAILED rc=$?" >> "$LOG"

# 2) Ingestão RAG (namespace worldmonitor no índice embeddings)
if [ -d "$ROOT/apps/web/node_modules" ] || [ -d "$ROOT/node_modules" ]; then
  (cd "$ROOT" && node scripts/ingest-worldmonitor.mjs >> "$LOG" 2>&1) || \
    echo "[$(date -Is)] rag ingest FAILED rc=$?" >> "$LOG"
fi

echo "[$(date -Is)] WorldMonitor cron done" >> "$LOG"
