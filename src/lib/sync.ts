// Progress + notes sync through one private GitHub Gist.
// The token lives only in this browser's storage; it is never part of the synced data or the repo.
import { getState, merge, replaceState, setChangeHook, setSettings } from './store';
import type { State } from './types';

const TOKEN_KEY = 'pq-gist-token';
const FILE = 'practice-questions-progress.json';
const DESC = 'Practice Questions progress (pq-sync)';
const API = 'https://api.github.com';

export type SyncStatus = { kind: 'off' } | { kind: 'syncing' } | { kind: 'ok'; at: number } | { kind: 'error'; message: string } | { kind: 'offline' };
let status: SyncStatus = { kind: 'off' };
const listeners = new Set<(s: SyncStatus) => void>();
function setStatus(s: SyncStatus) { status = s; listeners.forEach((f) => f(s)); }
export function onSyncStatus(f: (s: SyncStatus) => void) { listeners.add(f); f(status); return () => listeners.delete(f); }

export function getToken(): string | null { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } }
function setToken(t: string | null) { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } }

async function gh(path: string, init: RequestInit = {}) {
  const token = getToken();
  const r = await fetch(API + path, {
    ...init,
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  if (r.status === 401) throw new Error('GitHub rejected the token. Create a new one with the "gist" permission and paste it again.');
  if (!r.ok) throw new Error(`GitHub returned ${r.status}.`);
  return r.json();
}

async function findOrCreate(): Promise<string> {
  const known = getState().settings.gistId;
  if (known) return known;
  for (let page = 1; page <= 5; page++) {
    const list = await gh(`/gists?per_page=100&page=${page}`);
    const hit = list.find((g: { description: string; files: Record<string, unknown> }) => g.description === DESC && g.files[FILE]);
    if (hit) { setSettings({ gistId: hit.id }); return hit.id; }
    if (list.length < 100) break;
  }
  const created = await gh('/gists', { method: 'POST', body: JSON.stringify({ description: DESC, public: false, files: { [FILE]: { content: JSON.stringify(getState()) } } }) });
  setSettings({ gistId: created.id });
  return created.id;
}

async function readRemote(id: string): Promise<State | null> {
  const g = await gh(`/gists/${id}`);
  const f = g.files?.[FILE];
  if (!f) return null;
  let text: string = f.content;
  if (f.truncated) text = await (await fetch(f.raw_url)).text();
  try { return JSON.parse(text); } catch { return null; }
}

let pushTimer: number | undefined;
let busy = false;

export async function syncNow(): Promise<void> {
  if (!getToken()) { setStatus({ kind: 'off' }); return; }
  if (!navigator.onLine) { setStatus({ kind: 'offline' }); return; }
  if (busy) return;
  busy = true;
  setStatus({ kind: 'syncing' });
  try {
    const id = await findOrCreate();
    const remote = await readRemote(id);
    const local = getState();
    const merged = remote ? merge(local, remote) : local;
    if (remote) replaceState(merged);
    await gh(`/gists/${id}`, { method: 'PATCH', body: JSON.stringify({ files: { [FILE]: { content: JSON.stringify(merged) } } }) });
    setStatus({ kind: 'ok', at: Date.now() });
  } catch (e) {
    setStatus({ kind: 'error', message: (e as Error).message || 'Sync failed.' });
  } finally {
    busy = false;
  }
}

export async function connect(token: string): Promise<void> {
  setToken(token.trim());
  await syncNow();
}

export function disconnect() {
  setToken(null);
  setSettings({ gistId: undefined });
  setStatus({ kind: 'off' });
}

export function startSync() {
  setChangeHook(() => {
    if (!getToken()) return;
    clearTimeout(pushTimer);
    pushTimer = window.setTimeout(syncNow, 2500);
  });
  window.addEventListener('online', () => syncNow());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncNow(); });
  syncNow();
}
