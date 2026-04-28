import { openDB, IDBPDatabase } from 'idb';

interface QueueEntry {
  id: string;
  method: string;
  path: string;
  body: unknown;
  timestamp: number;
}

interface SkoraDB {
  'offline-queue': {
    key: string;
    value: QueueEntry;
    indexes: { 'by-timestamp': number };
  };
}

let dbPromise: Promise<IDBPDatabase<SkoraDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<SkoraDB>('skora-offline', 1, {
      upgrade(db) {
        const store = db.createObjectStore('offline-queue', { keyPath: 'id' });
        store.createIndex('by-timestamp', 'timestamp');
      },
    });
  }
  return dbPromise;
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function enqueue(method: string, path: string, body: unknown): Promise<void> {
  const db = await getDB();
  await db.add('offline-queue', {
    id: generateId(),
    method,
    path,
    body,
    timestamp: Date.now(),
  });
  notifyCountChanged();
}

export async function getCount(): Promise<number> {
  const db = await getDB();
  return db.count('offline-queue');
}

export async function getAll(): Promise<QueueEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex('offline-queue', 'by-timestamp');
}

export async function remove(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('offline-queue', id);
  notifyCountChanged();
}

export async function flush(
  executor: (method: string, path: string, body: unknown) => Promise<void>,
  onProgress?: (done: number, total: number) => void,
): Promise<{ succeeded: number; failed: number }> {
  const entries = await getAll();
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    try {
      await executor(entry.method, entry.path, entry.body);
      await remove(entry.id);
      succeeded++;
    } catch {
      failed++;
    }
    onProgress?.(i + 1, entries.length);
  }

  return { succeeded, failed };
}

// Lightweight event bus so DashboardLayout can react to queue changes
type CountListener = (count: number) => void;
const listeners = new Set<CountListener>();

export function onCountChange(fn: CountListener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

async function notifyCountChanged() {
  const count = await getCount();
  listeners.forEach((fn) => fn(count));
}

// Refresh the count from DB (call on app start to hydrate the UI)
export async function refreshCount(): Promise<number> {
  const count = await getCount();
  listeners.forEach((fn) => fn(count));
  return count;
}
