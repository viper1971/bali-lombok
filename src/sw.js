/* Generated shell list and version are prepended by tools/build.py. */
const OLD_PREFIX = 'bali2027-' + self.registration.scope;
const PREFIX = OLD_PREFIX + '::';
const CACHE = PREFIX + VERSION;
const TILES = PREFIX + 'tiles-v1';
const RUNTIME = PREFIX + 'runtime-v1';
const SHELL_URLS = new Set(SHELL.map(path => { const u = new URL(path, self.registration.scope); return u.origin + u.pathname; }));
const MAX_TILES = 600;
self.addEventListener('install', event => {
    // Do not activate a partially downloaded release.
    event.waitUntil((async () => {
        try {
            const cache = await caches.open(CACHE);
            await cache.addAll(SHELL);
            for (const path of ['./', 'index.html']) {
                if (!await sameBuild(await cache.match(new URL(path, self.registration.scope).href))) {
                    throw new Error('HTML neodpovídá instalované verzi aplikace');
                }
            }
        } catch (error) {
            await caches.delete(CACHE);
            throw error;
        }
        await self.skipWaiting();
    })());
});
async function sameBuild(response) {
    return !!response && (await response.clone().text()).includes('<meta name="bali-build" content="' + VERSION + '">');
}
function isAppNavigation(request) {
    if (request.mode !== 'navigate') return false;
    return isAppHTML(new URL(request.url));
}
function isAppHTML(url) {
    return url.origin + url.pathname === self.registration.scope ||
        url.origin + url.pathname === new URL('index.html', self.registration.scope).href;
}
function ownedVersion(name) {
    return (name.startsWith(PREFIX) && /^[a-f0-9]{16}$/.test(name.slice(PREFIX.length))) ||
        (name.startsWith(OLD_PREFIX) && /^[a-f0-9]{16}$/.test(name.slice(OLD_PREFIX.length)));
}
function isTile(url) {
    return url.hostname === 'tile.openstreetmap.org' || url.hostname.endsWith('.tile.openstreetmap.org');
}
function isRuntime(url) {
    if (url.origin === self.location.origin) {
        return url.href.startsWith(self.registration.scope) && /\.(?:png|jpe?g|webp|gif|svg|avif|ico|woff2?|ttf|otf|mp4|webm|mp3|ogg|pdf)$/i.test(url.pathname);
    }
    // Public resources used by this application. Never import unrelated app data.
    return /^(?:fonts\.googleapis\.com|fonts\.gstatic\.com|flagcdn\.com|upload\.wikimedia\.org|images\.unsplash\.com|api\.frankfurter\.(?:dev|app)|data\.kurzy\.cz)$/.test(url.hostname) ||
        (url.hostname === 'commons.wikimedia.org' && url.pathname === '/w/api.php') ||
        (url.hostname === 'viper1971.github.io' && url.pathname.startsWith('/bali-lombok/') && /\.(?:png|jpe?g|webp|gif|svg|avif|ico)$/i.test(url.pathname)) ||
        (url.hostname === 'unpkg.com' && /^\/leaflet@1\.9\.4\/dist\//.test(url.pathname));
}
function cacheFor(url) {
    if (isTile(url)) return TILES;
    if (SHELL_URLS.has(url.origin + url.pathname) || (url.origin === self.location.origin && /\.(?:html?|js|css)$/i.test(url.pathname))) return CACHE;
    return RUNTIME;
}
async function migrateRuntime(keys) {
    const candidates = keys.filter(name => (ownedVersion(name) && name !== CACHE) ||
        name === OLD_PREFIX + 'tiles-v1' || name === 'cesta-tiles-v1' || /^cesta-offline-v\d+$/.test(name));
    // Prefer existing stable entries, then the most recently created old cache.
    for (const name of candidates.reverse()) {
        const old = await caches.open(name);
        for (const request of await old.keys()) {
            const url = new URL(request.url || request);
            if (!/^https?:$/.test(url.protocol) || (!isTile(url) && !isRuntime(url))) continue;
            const target = await caches.open(isTile(url) ? TILES : RUNTIME);
            if (await target.match(request)) continue;
            const response = await old.match(request);
            if (valid(response)) await target.put(request, response);
        }
    }
    const tiles = await caches.open(TILES), tileKeys = await tiles.keys();
    await Promise.all(tileKeys.slice(0, Math.max(0, tileKeys.length - MAX_TILES)).map(key => tiles.delete(key)));
}
self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        // Delete old code only after all eligible offline content was copied.
        await migrateRuntime(keys);
        await Promise.all(keys.filter(name => (ownedVersion(name) && name !== CACHE) || name === OLD_PREFIX + 'tiles-v1')
            .map(name => caches.delete(name)));
        await self.clients.claim();
    })());
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
async function networkFirst(request, name = CACHE) {
    const cache = await caches.open(name);
    const cached = () => cache.match(request, {ignoreSearch: request.mode === 'navigate'});
    try {
        const response = await fetch(request);
        if (!response.ok) return await cached() || response;
        // Online HTML may belong to a newer deployment. Keep the complete
        // installed fallback until that deployment's worker installs its shell.
        if (!isAppNavigation(request) || await sameBuild(response)) {
            await save(cache, request, response).catch(() => {});
        }
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
    // Google embeds manage their own redirects, cookies and document responses.
    // Never replace them with cached opaque responses or an app offline fallback.
    if ((url.origin !== self.location.origin && request.mode === 'navigate') ||
        ((url.hostname === 'maps.google.com' || url.hostname === 'www.google.com' || url.hostname === 'google.com') && /^\/maps(?:\/|$)/.test(url.pathname))) return;
    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request));
    } else if (/kurzy\.cz|frankfurter|api\.|wikimedia\.org\/w\/api/.test(url.hostname + url.pathname)) {
        event.respondWith(networkFirst(request, RUNTIME));
    } else if (url.origin === self.location.origin && /\/assets\/build\/(?:css|js)-[a-f0-9]{16}\.(?:css|js)$/.test(url.pathname)) {
        // Immutable content hash: a cache hit never needs a background download.
        event.respondWith(caches.open(CACHE).then(async cache => {
            const hit = await cache.match(request);
            if (hit) return hit;
            const response = await fetch(request);
            await save(cache, request, response).catch(() => {});
            return response;
        }));
    } else if (isTile(url)) {
        event.respondWith(staleWhileRevalidate(event, TILES, MAX_TILES));
    } else {
        event.respondWith(staleWhileRevalidate(event, cacheFor(url), 0));
    }
});
self.addEventListener('message', event => {
    const data = event.data || {};
    if (data.type !== 'precache' || !Array.isArray(data.urls)) return;
    const port = event.ports && event.ports[0];
    event.waitUntil((async () => {
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
                    // Manual offline saving can race a deployment just like navigation.
                    // Never replace this worker's complete shell with another build.
                    if (isAppHTML(url) && !await sameBuild(response)) throw new Error('HTML build mismatch');
                    const cache = await caches.open(cacheFor(url));
                    await save(cache, url.href, response, isTile(url) ? MAX_TILES : 0);
                    ok++;
                } catch (_) { fail++; }
            }
        }
        await Promise.all(Array.from({length: 6}, worker));
        if (port) port.postMessage({ok, fail});
    })());
});
