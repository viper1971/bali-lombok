/* Generated shell list and version are prepended by tools/build.py. */
const PREFIX = 'bali2027-' + self.registration.scope;
const CACHE = PREFIX + VERSION;
const TILES = PREFIX + 'tiles-v1';
const MAX_TILES = 600;
self.addEventListener('install', event => {
    // Do not activate a partially downloaded release.
    event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys
        .filter(key => key.startsWith(PREFIX) && key !== CACHE && key !== TILES)
        .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
const valid = response => response && (response.ok || response.type === 'opaque');
async function save(cache, request, response, max) {
    if (!valid(response)) return;
    await cache.put(request, response.clone());
    if (max) {
        const keys = await cache.keys();
        await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map(key => cache.delete(key)));
    }
}
async function networkFirst(request) {
    const cache = await caches.open(CACHE);
    const cached = () => cache.match(request, {ignoreSearch: request.mode === 'navigate'});
    try {
        const response = await fetch(request);
        if (!response.ok) return await cached() || response;
        await save(cache, request, response).catch(() => {});
        return response;
    } catch (_) {
        return await cached() || new Response('Jsi offline a tahle stránka ještě není uložená.', {
            status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8'}
        });
    }
}
function staleWhileRevalidate(event, name, max) {
    const task = caches.open(name).then(async cache => {
        const hit = await cache.match(event.request);
        const network = fetch(event.request).then(async response => {
            await save(cache, event.request, response, max).catch(() => {});
            return response;
        }).catch(() => hit || Response.error());
        return {hit, network};
    });
    // Keep the worker alive until the background cache write has completed.
    event.waitUntil(task.then(result => result.network).then(() => {}).catch(() => {}));
    return task.then(result => result.hit || result.network);
}
self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET' || !/^https?:/.test(request.url)) return;
    const url = new URL(request.url);
    if (request.mode === 'navigate' || /kurzy\.cz|frankfurter|api\.|wikimedia\.org\/w\/api/.test(url.hostname + url.pathname)) {
        event.respondWith(networkFirst(request));
    } else if (url.origin === self.location.origin && /\/assets\/build\/(?:css|js)-[a-f0-9]{16}\.(?:css|js)$/.test(url.pathname)) {
        // Immutable content hash: a cache hit never needs a background download.
        event.respondWith(caches.open(CACHE).then(async cache => {
            const hit = await cache.match(request);
            if (hit) return hit;
            const response = await fetch(request);
            await save(cache, request, response).catch(() => {});
            return response;
        }));
    } else if (url.hostname.endsWith('.tile.openstreetmap.org')) {
        event.respondWith(staleWhileRevalidate(event, TILES, MAX_TILES));
    } else {
        event.respondWith(staleWhileRevalidate(event, CACHE, 0));
    }
});
self.addEventListener('message', event => {
    const data = event.data || {};
    if (data.type !== 'precache' || !Array.isArray(data.urls)) return;
    const port = event.ports && event.ports[0];
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE);
        const urls = [...new Set([...SHELL.map(path => new URL(path, self.registration.scope).href), ...data.urls])];
        let index = 0, ok = 0, fail = 0;
        async function worker() {
            while (index < urls.length) {
                const raw = urls[index++];
                try {
                    const url = new URL(raw);
                    if (!/^https?:$/.test(url.protocol)) throw new Error('protocol');
                    const response = await fetch(url.href, url.origin === self.location.origin ? {} : {mode: 'no-cors'});
                    if (!valid(response)) throw new Error('response');
                    await cache.put(url.href, response);
                    ok++;
                } catch (_) { fail++; }
            }
        }
        await Promise.all(Array.from({length: 6}, worker));
        if (port) port.postMessage({ok, fail});
    })());
});
