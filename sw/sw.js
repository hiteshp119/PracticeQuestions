// Service worker: app shell offline, plus the question files the app chose to keep (pq-questions).
const SHELL_PREFIX = 'pq-shell-';
const DATA = 'pq-data';
const QUESTIONS = 'pq-questions';

async function manifest() {
  const r = await fetch('precache.json', { cache: 'no-store' });
  return r.json();
}
function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const m = await manifest();
    const cache = await caches.open(SHELL_PREFIX + hash(m.version));
    await cache.addAll(m.files);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    let current = null;
    try { current = SHELL_PREFIX + hash((await manifest()).version); } catch { /* offline during activate */ }
    if (current) for (const k of await caches.keys()) if (k.startsWith(SHELL_PREFIX) && k !== current) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function fromShell(req) {
  for (const k of await caches.keys()) {
    if (!k.startsWith(SHELL_PREFIX)) continue;
    const hit = await (await caches.open(k)).match(req, { ignoreSearch: true, ignoreVary: true });
    if (hit) return hit;
  }
  return null;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith('/data/index.json')) {
    event.respondWith((async () => {
      try {
        const r = await fetch(req);
        if (r.ok) (await caches.open(DATA)).put(url.pathname, r.clone());
        return r;
      } catch {
        return (await (await caches.open(DATA)).match(url.pathname, { ignoreVary: true })) || new Response('offline', { status: 504 });
      }
    })());
    return;
  }

  if (url.pathname.includes('/data/q/')) {
    event.respondWith((async () => {
      try { return await fetch(req); } catch {
        return (await (await caches.open(QUESTIONS)).match(req.url, { ignoreVary: true })) || new Response('offline', { status: 504 });
      }
    })());
    return;
  }

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try { return await fetch(req); } catch { return (await fromShell('index.html')) || new Response('offline', { status: 504 }); }
    })());
    return;
  }

  event.respondWith((async () => (await fromShell(req)) || fetch(req))());
});
