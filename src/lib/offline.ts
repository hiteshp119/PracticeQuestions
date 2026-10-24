// Keeps exactly the cards Today needs available offline:
// today's and tomorrow's question of the day plus everything due today or tomorrow.
import { DATA, questionUrl } from './data';

const CACHE = 'pq-questions';

export async function registerSW() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  try { await navigator.serviceWorker.register('./sw.js', { scope: './' }); } catch { /* offline support unavailable */ }
}

export async function keepOffline(keys: string[]): Promise<number> {
  if (!('caches' in window) || !navigator.onLine) return 0;
  // The question index must be available offline too. The service worker stores it on later visits;
  // on the very first visit it isn't in control yet, so store it here as well.
  try {
    const idxUrl = new URL(`${DATA}/index.json`, location.href).href;
    const r = await fetch(idxUrl, { cache: 'no-cache' });
    if (r.ok) await (await caches.open('pq-data')).put(idxUrl, r);
  } catch { /* offline */ }
  const want = new Set(keys.map((k) => new URL(questionUrl(k), location.href).href));
  const cache = await caches.open(CACHE);
  for (const req of await cache.keys()) if (!want.has(req.url)) await cache.delete(req);
  let n = 0;
  for (const url of want) {
    if (await cache.match(url)) { n++; continue; }
    try {
      const r = await fetch(url);
      if (r.ok) { await cache.put(url, r); n++; }
    } catch { /* will retry next visit */ }
  }
  return n;
}

export async function isCached(key: string): Promise<boolean> {
  if (!('caches' in window)) return false;
  const cache = await caches.open(CACHE);
  return !!(await cache.match(new URL(questionUrl(key), location.href).href));
}
