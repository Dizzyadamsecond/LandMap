'use client';

/**
 * pwaSync — background sync offline-first (skill pwa-expert).
 *
 * Enfileira ações (ex.: favorito salvo offline) em IndexedDB e agenda um
 * sync event; o service worker reenvia quando a conexão volta. Sem
 * dependências externas (IndexedDB nativo).
 */

export interface SyncAction {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  createdAt: number;
  attempts: number;
}

const DB_NAME = 'landmap-offline';
const STORE = 'pending-actions';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    t.oncomplete = () => db.close();
  });
}

/** Enfileira uma ação offline e agenda sync (se suportado). */
export async function enqueueSyncAction(action: Omit<SyncAction, 'id' | 'createdAt' | 'attempts'>): Promise<SyncAction> {
  const full: SyncAction = {
    ...action,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    attempts: 0,
  };
  await tx('readwrite', (s) => s.put(full));
  // Agenda o sync — Chrome/Edge; Safari cai no retry manual via online event
  try {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      const reg = await navigator.serviceWorker.ready;
      await (reg as any).sync.register('landmap-sync');
    }
  } catch {
    /* background sync não suportado — o SW tenta na reconexão via fetch handler */
  }
  return full;
}

/** Lê a fila pendente (para debug/UI). */
export async function listPendingActions(): Promise<SyncAction[]> {
  return tx('readonly', (s) => s.getAll());
}
