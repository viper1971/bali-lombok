const VERSION = "7c7758ebd548bccc";
const SHELL = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "transportData.js", "assets/build/js-6dda22d8ecc1fdf7.js", "assets/build/js-7dded81f3fed5c97.js", "assets/build/js-2488850de2186fc8.js", "assets/build/js-501eb4bd46e1d70b.js", "assets/build/js-2e599de255746c53.js", "assets/build/js-bb4a3ceb15afc0b6.js", "assets/build/js-0e60bffd1a6f2b2e.js", "assets/build/js-c1f00c085f1b8ceb.js", "assets/build/js-c35312881ef731b6.js", "assets/build/js-2b30d50f325de86a.js", "assets/build/js-f8c4ac3468cd486a.js", "assets/build/js-2c6ab0b77b7db684.js", "assets/build/js-48b5b175b25e15a1.js", "assets/build/js-1992f88e13445a64.js", "assets/build/js-4d7e6ed6806f18b4.js", "assets/build/js-106a62179c3d05cd.js", "assets/build/js-7605ca0f3853c6dc.js", "assets/build/js-f0df09256b4f0d1a.js", "assets/build/js-e6786985e92367bc.js", "assets/build/js-5290c7ef67f42724.js", "assets/build/js-9667061e4641fabc.js", "assets/build/js-f029b26d43b4451c.js", "assets/build/js-da214515de04828a.js", "assets/build/js-f27a7b1bbddea03d.js", "assets/build/js-fb9ff92c6d2394de.js", "assets/build/js-383a502a9ac47b52.js", "assets/build/js-81520d8a96b72c27.js", "assets/build/js-3f7fd97b76843b61.js", "assets/build/js-dc55f54483a6ba75.js", "assets/build/js-ef258d70a9f2c944.js", "assets/build/js-0769b36773f357a1.js", "assets/build/js-1055bd6ea691f7c0.js", "assets/build/js-04ad42da1f21701e.js", "assets/build/js-a3f3bf99684c06a5.js", "assets/build/js-153e71891b283d3a.js", "assets/build/js-56c79a1ad691f8d6.js", "assets/build/js-b1dddb4c89aacaaa.js", "assets/build/js-cb95be97150e0150.js", "assets/build/js-b8375983750a5496.js", "assets/build/js-e9f9fbdb5c1c73f8.js", "assets/build/js-5a1848044019d793.js", "assets/build/js-c3445f047bc87c0d.js", "assets/build/js-48281df851632177.js", "assets/build/js-0ae42fb8f596a653.js", "assets/build/js-ac6364c7e2984443.js", "assets/build/js-62c8feddf2605478.js", "assets/build/js-863ce96035ff869a.js", "assets/build/js-3561b2f19ed97f1e.js", "assets/build/js-fd6f6f312edba2e7.js", "assets/build/js-b0fe52795d42a60b.js", "assets/build/js-de8562b6eccf462d.js", "assets/build/js-83c25ce305e77598.js", "assets/build/js-1c2a7821911be51c.js", "assets/build/js-5acaa9d8ef66d453.js", "assets/build/js-ecd341191156f1ff.js", "assets/build/js-bc50180b256573b5.js", "assets/build/js-c175eca74bf85207.js", "assets/build/css-f1d6aac72525a12d.css", "assets/build/css-2354d6983914dd7c.css", "assets/build/css-5707954a78ff26d4.css", "assets/build/css-44816ff7d483281e.css", "assets/build/css-c8479cdf358022a8.css", "assets/build/css-00b742be2a3b6835.css", "assets/build/css-0d384a022a89f339.css", "assets/build/css-de256e9c6937c66a.css", "assets/build/css-f97d0f343d89145f.css", "assets/build/css-817364c3563063e5.css", "assets/build/css-f8ccf612ec635808.css", "assets/build/css-081a57ffcd977809.css", "assets/build/css-c3234e3dfa14a0ad.css", "assets/build/css-2ad4871595e48808.css", "assets/build/css-d9de1e78a5f6070e.css", "assets/build/css-b6f6970a9f6ef385.css", "assets/build/css-0bd21eb124d90d46.css", "assets/build/css-fa67498e75513fa0.css"];
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
