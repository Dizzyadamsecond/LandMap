/**
 * Crawl4aiClient — bridges the Python `crawl4ai_service/server.py` live crawler
 * into the TypeScript stack.
 *
 * The Python service is spawned on demand (Windows uses the bundled
 * `.venv/Scripts/python.exe`; POSIX falls back to `python3`). Because a browser
 * process is heavy, the client lazily starts the server once per process and
 * reuses it; if the service is unavailable it degrades to a clear error so the
 * caller can fall back to the direct-API integrations (IBGE/SIDRA/BCB/BrasilAPI).
 *
 * All crawl targets are validated server-side against an allow-list of public
 * Brazilian open-data hosts — this is a live open-data pipeline, not a proxy.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export interface Crawl4aiConfig {
  /** Port the Python service listens on. */
  port?: number;
  host?: string;
  /** Absolute path to the python interpreter (defaults to the bundled venv). */
  pythonPath?: string;
  /** Absolute path to server.py. */
  serverPath?: string;
}

export interface CrawlRequest {
  url: string;
  word_count_threshold?: number;
  exclude_tags?: string[];
  max_links?: number;
  bypass_cache?: boolean;
}

export interface CrawlResult {
  ok: boolean;
  url: string;
  markdown: string;
  links: string[];
  title: string;
  status_code?: number;
  elapsed_ms: number;
  error?: string;
}

const DEFAULT_PORT = 8777;
const DEFAULT_HOST = '127.0.0.1';

function repoRoot(): string {
  // integrations/src/crawl4ai.ts -> repo root
  return resolve(process.cwd(), '..', '..', '..');
}

export class Crawl4aiClient {
  private readonly port: number;
  private readonly host: string;
  private readonly pythonPath: string;
  private readonly serverPath: string;
  private proc: ChildProcess | null = null;
  private starting: Promise<void> | null = null;

  constructor(config: Crawl4aiConfig = {}) {
    this.port = config.port ?? Number(process.env.CRAWL4AI_PORT ?? DEFAULT_PORT);
    this.host = config.host ?? DEFAULT_HOST;
    const root = repoRoot();
    this.serverPath =
      config.serverPath ?? resolve(root, 'crawl4ai_service', 'server.py');
    this.pythonPath =
      config.pythonPath ??
      resolve(root, 'crawl4ai_service', '.venv', 'Scripts', 'python.exe');
    // POSIX fallback if the Windows venv path does not exist.
    if (!existsSync(this.pythonPath)) {
      this.pythonPath = 'python3';
    }
  }

  get configured(): boolean {
    return existsSync(this.serverPath);
  }

  get mock(): boolean {
    return false;
  }

  /** Ensure the Python crawler service is running. */
  async ensure(): Promise<void> {
    if (this.proc && !this.proc.killed) return;
    if (this.starting) return this.starting;
    this.starting = (async () => {
      if (!this.configured) throw new Error('crawl4ai service not found');
      this.proc = spawn(
        this.pythonPath,
        [this.serverPath, '--host', this.host, '--port', String(this.port)],
        { stdio: 'ignore', detached: false },
      );
      // Poll the health endpoint until ready (max ~20s).
      const deadline = Date.now() + 20_000;
      while (Date.now() < deadline) {
        try {
          const res = await fetch(`http://${this.host}:${this.port}/health`);
          if (res.ok) return;
        } catch {
          /* not ready yet */
        }
        await new Promise((r) => setTimeout(r, 500));
      }
      throw new Error('crawl4ai service did not start in time');
    })();
    return this.starting;
  }

  async crawl(req: CrawlRequest): Promise<CrawlResult> {
    await this.ensure();
    const res = await fetch(`http://${this.host}:${this.port}/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    const data = (await res.json()) as CrawlResult;
    if (!res.ok) {
      throw new Error(data.error ?? `crawl failed (${res.status})`);
    }
    return data;
  }
}
