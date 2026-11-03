const VERSION = "091dc80e0077abd3";
const SHELL = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "transportData.js", "assets/build/js-a8fb75dcd6534736.js", "assets/build/js-27a5af24ef09ab15.js", "assets/build/js-9431cbfa982987ad.js", "assets/build/js-562a77ebd1e2ed4a.js", "assets/build/js-53abd70116987b5e.js", "assets/build/js-034f709c9947bfd4.js", "assets/build/js-eed8ff620bf37182.js", "assets/build/js-0304ec556d961e63.js", "assets/build/js-4fde4d295ea0730c.js", "assets/build/js-2a8e8abc108bdc8b.js", "assets/build/js-1150f97d2b378838.js", "assets/build/js-501ae3b3bd10a725.js", "assets/build/js-e1ba1d163fbf42ee.js", "assets/build/js-35c5ac57d6d482ea.js", "assets/build/js-6d5748afbb43b17b.js", "assets/build/js-918083ccf7201996.js", "assets/build/js-106e28fabb1195b8.js", "assets/build/js-edd7264c77e03679.js", "assets/build/js-dd90b2eefaa5a816.js", "assets/build/js-9b1d3994381ab8ec.js", "assets/build/js-e960816b919cb7be.js", "assets/build/js-8018143239389d2f.js", "assets/build/js-d3453b667ed15e44.js", "assets/build/js-2a2e6647a2fad797.js", "assets/build/js-310671a8893e019e.js", "assets/build/js-d32721153245f756.js", "assets/build/js-b06969aba976c32b.js", "assets/build/js-287957725fbebecf.js", "assets/build/js-bcfe26c2a002b49a.js", "assets/build/js-3219b32d2db5f027.js", "assets/build/js-15587aae9c24a62d.js", "assets/build/js-ac085c3aacbd3d32.js", "assets/build/js-684dde3d3bac56d6.js", "assets/build/js-fcd994c179247e9e.js", "assets/build/js-2274b4b16615505c.js", "assets/build/js-1dae15f588633411.js", "assets/build/js-d8217a4fe966bf56.js", "assets/build/js-4d37941f9887ddd0.js", "assets/build/js-dbe05a0235480da3.js", "assets/build/js-688f9892423e2628.js", "assets/build/js-71830e2a26ee0cb5.js", "assets/build/js-d597c7bc58059231.js", "assets/build/js-5a485d2a404ed63f.js", "assets/build/js-498f1a73cf4fd1ab.js", "assets/build/js-2a0e61505d8a6e6b.js", "assets/build/js-5d081c54f2ba2431.js", "assets/build/js-bd54327c3885e430.js", "assets/build/js-554bd78d10ba32c6.js", "assets/build/js-29e96d5d9a4b17df.js", "assets/build/js-0650ab416c7c8751.js", "assets/build/js-532b495ebdb2fc76.js", "assets/build/js-0dc71255fb5d0b00.js", "assets/build/js-525a279af25c5764.js", "assets/build/js-c4d3fe47342be4bb.js", "assets/build/js-87fa99716183f102.js", "assets/build/js-eb8349365f5bbcc8.js", "assets/build/css-613ec9680ad29884.css", "assets/build/css-0bf59c48c4f36c4b.css", "assets/build/css-993f7f92be32fafd.css", "assets/build/css-ed30100c4937ee79.css", "assets/build/css-fefa4167edc081b4.css", "assets/build/css-d91e4adb36959e5e.css", "assets/build/css-bd1c3854a1d0257c.css", "assets/build/css-a651917dbc089a08.css", "assets/build/css-196ad84ede3c838b.css", "assets/build/css-c4d100c569da2682.css", "assets/build/css-a9507dbad3ba3df8.css", "assets/build/css-8a3860b3d5095721.css", "assets/build/css-df70f456662283c8.css", "assets/build/css-003c1ad96c39a287.css", "assets/build/css-4a71fcb02688e8f3.css", "assets/build/css-3b2cf702df00362a.css", "assets/build/css-e2c7d129282c9e60.css", "assets/build/css-82563569096115d5.css", "assets/build/css-9053caa8be06d544.css", "assets/build/css-985ae35a3b15d50d.css", "assets/build/css-90124539b7e68290.css", "assets/build/css-de8bcea3a84370b2.css"];
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
