/* Offline režim pro stránku Singapur · Bali · Lombok 2027
   - stránka: nejdřív síť, při výpadku uložená kopie
   - kurzy a API: nejdřív síť, při výpadku poslední uložená hodnota
   - obrázky, písma, skripty, dlaždice map: z uložené kopie hned, na pozadí se obnoví
   Tlačítko „Uložit pro offline“ v menu pošle seznam souborů zprávou 'precache'. */
const CACHE = 'cesta-offline-v1';
const TILES = 'cesta-tiles-v1';
const MAX_TILES = 600;

self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
    e.waitUntil(caches.keys().then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE && k !== TILES; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); }));
});

function trim(name, max) {
    return caches.open(name).then(function (c) {
        return c.keys().then(function (ks) { if (ks.length > max) return Promise.all(ks.slice(0, ks.length - max).map(function (k) { return c.delete(k); })); });
    });
}
function networkFirst(req, name, timeoutMs) {
    return caches.open(name).then(function (cache) {
        return new Promise(function (resolve) {
            var done = false;
            var timer = timeoutMs ? setTimeout(function () {
                cache.match(req, { ignoreSearch: req.mode === 'navigate' }).then(function (m) { if (m && !done) { done = true; resolve(m); } });
            }, timeoutMs) : null;
            fetch(req).then(function (res) {
                clearTimeout(timer);
                if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()).catch(function () {});
                if (!done) { done = true; resolve(res); }
            }).catch(function () {
                clearTimeout(timer);
                cache.match(req, { ignoreSearch: req.mode === 'navigate' }).then(function (m) {
                    if (done) return; done = true;
                    resolve(m || new Response('Jsi offline a tahle stránka ještě není uložená.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }));
                });
            });
        });
    });
}
function staleWhileRevalidate(req, name, max) {
    return caches.open(name).then(function (cache) {
        return cache.match(req).then(function (hit) {
            var net = fetch(req).then(function (res) {
                if (res && (res.ok || res.type === 'opaque')) { cache.put(req, res.clone()).then(function () { if (max) trim(name, max); }).catch(function () {}); }
                return res;
            }).catch(function () { return hit; });
            return hit || net;
        });
    });
}

self.addEventListener('fetch', function (e) {
    var req = e.request;
    if (req.method !== 'GET' || !/^https?:/.test(req.url)) return;
    var url = new URL(req.url);
    if (req.mode === 'navigate') { e.respondWith(networkFirst(req, CACHE, 4000)); return; }
    if (/kurzy\.cz|frankfurter|api\.|wikimedia\.org\/w\/api/.test(url.hostname + url.pathname)) { e.respondWith(networkFirst(req, CACHE, 0)); return; }
    if (/tile\.openstreetmap\.org/.test(url.hostname)) { e.respondWith(staleWhileRevalidate(req, TILES, MAX_TILES)); return; }
    e.respondWith(staleWhileRevalidate(req, CACHE, 0));
});

/* předběžné uložení: stránka pošle seznam adres, odpověď (počet uložených) jde zpátky přes MessageChannel */
self.addEventListener('message', function (e) {
    var d = e.data || {};
    if (d.type !== 'precache' || !Array.isArray(d.urls)) return;
    var port = e.ports && e.ports[0], ok = 0, fail = 0;
    e.waitUntil(caches.open(CACHE).then(function (cache) {
        var q = d.urls.slice(0, 400), i = 0;
        function worker() {
            if (i >= q.length) return Promise.resolve();
            var u = q[i++];
            var same = u.indexOf(self.location.origin) === 0;
            return fetch(u, same ? {} : { mode: 'no-cors' }).then(function (res) {
                if (res && (res.ok || res.type === 'opaque')) { ok++; return cache.put(u, res); } fail++;
            }).catch(function () { fail++; }).then(worker);
        }
        return Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]);
    }).then(function () { if (port) port.postMessage({ ok: ok, fail: fail }); }));
});
