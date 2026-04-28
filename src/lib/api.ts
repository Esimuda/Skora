import * as queue from './offlineQueue';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

function getToken(): string | null {
  try {
    const stored = localStorage.getItem('skora-auth-storage');
    return stored ? JSON.parse(stored)?.state?.token : null;
  } catch {
    return null;
  }
}

function isNetworkError(e: unknown): boolean {
  if (!(e instanceof TypeError)) return false;
  const msg = (e as TypeError).message.toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('load failed')
  );
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  const authToken = token ?? getToken();

  // If already known-offline and this is a mutation, skip the round-trip
  const isMutation = method !== 'GET';
  if (isMutation && !navigator.onLine) {
    await queue.enqueue(method, path, body);
    window.dispatchEvent(new CustomEvent('skora:offline-queued'));
    return (body ?? {}) as T;
  }

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(err.message ?? `Request failed (${res.status})`);
    }

    // 204 No Content — don't try to parse JSON
    if (res.status === 204) return undefined as T;
    return res.json();
  } catch (e) {
    if (isNetworkError(e) && isMutation) {
      // Network down mid-request — queue for later
      await queue.enqueue(method, path, body);
      window.dispatchEvent(new CustomEvent('skora:offline-queued'));
      return (body ?? {}) as T;
    }
    throw e;
  }
}

// Called by the sync manager to replay queued requests
export async function replayRequest(method: string, path: string, body: unknown): Promise<void> {
  const authToken = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message ?? `Sync failed (${res.status})`);
  }
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown, token?: string) =>
    request<T>('POST', path, body, token),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
