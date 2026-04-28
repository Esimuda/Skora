import * as queue from './offlineQueue';
import { replayRequest } from './api';

export type SyncState = 'idle' | 'syncing' | 'synced' | 'error';

type StateListener = (state: SyncState, queueCount: number) => void;
const listeners = new Set<StateListener>();

let currentState: SyncState = 'idle';
let currentCount = 0;
let syncing = false;

export function onSyncStateChange(fn: StateListener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(state: SyncState, count: number) {
  currentState = state;
  currentCount = count;
  listeners.forEach((fn) => fn(state, count));
}

export async function syncNow() {
  if (syncing || !navigator.onLine) return;
  const count = await queue.getCount();
  if (count === 0) return;

  syncing = true;
  notify('syncing', count);

  const { succeeded, failed } = await queue.flush(replayRequest, (done, total) => {
    notify('syncing', total - done);
  });

  syncing = false;

  if (failed === 0) {
    notify('synced', 0);
    // Reset to idle after 3s
    setTimeout(() => notify('idle', 0), 3000);
  } else {
    notify('error', failed);
  }

  if (succeeded > 0) {
    window.dispatchEvent(new CustomEvent('skora:sync-complete', { detail: { succeeded } }));
  }
}

export async function init() {
  // Hydrate count from IndexedDB on start
  currentCount = await queue.refreshCount();
  if (currentCount > 0) notify('idle', currentCount);

  // Listen to offline-queued events to update count
  queue.onCountChange((count) => {
    if (currentState !== 'syncing') notify(count > 0 ? 'idle' : 'idle', count);
  });

  // Sync when connectivity returns
  window.addEventListener('online', () => {
    syncNow();
  });

  // Sync on offline-queued if we come back online quickly
  window.addEventListener('skora:offline-queued', async () => {
    currentCount = await queue.getCount();
    notify('idle', currentCount);
  });

  // Attempt initial sync if online (handles app restart while queued items exist)
  if (navigator.onLine && currentCount > 0) {
    setTimeout(syncNow, 2000);
  }
}

export function getCurrentCount() {
  return currentCount;
}
