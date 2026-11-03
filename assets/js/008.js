
/* Leaflet (interaktivní mapy) se stahuje až ve chvíli, kdy je mapa skoro na obrazovce
   nebo když uživatel otevře mapu přes celou obrazovku – stránka se díky tomu načte rychleji. */
(function () {
    var p = null, cssReady = false;
    window.ensureLeaflet = function () {
        if (window.L && window.L.map && cssReady) return Promise.resolve(window.L);
        if (p) return p;
        p = new Promise(function (ok, fail) {
            var css = document.createElement('link'), js = null;
            var done = false, cssLoaded = false, jsLoaded = !!(window.L && window.L.map);
            var timer = setTimeout(function () { failed('Načítání mapy překročilo časový limit'); }, 12000);
            function failed(message) {
                if (done) return; done = true; clearTimeout(timer);
                css.remove(); if (js) js.remove(); cssReady = false; p = null;
                fail(new Error(message));
            }
            function ready() {
                if (done || !cssLoaded || !jsLoaded) return;
                done = true; clearTimeout(timer); cssReady = true;
                try { if (!L.__luxHooked && L.Map.addInitHook) { L.Map.addInitHook(function () { (window.__luxMaps = window.__luxMaps || []).push(this); }); L.__luxHooked = true; } } catch (e) {}
                ok(window.L);
            }
            css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            css.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='; css.crossOrigin = '';
            css.onload = function () { cssLoaded = true; ready(); };
            css.onerror = function () { failed('Styly mapy se nepodařilo načíst'); };
            document.head.appendChild(css);
            if (!jsLoaded) {
                js = document.createElement('script');
                js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                js.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='; js.crossOrigin = '';
                js.onload = function () {
                    if (!window.L || !window.L.map) { failed('Knihovna mapy není dostupná'); return; }
                    jsLoaded = true; ready();
                };
                js.onerror = function () { failed('Leaflet se nepodařilo načíst'); };
                document.head.appendChild(js);
            }
        });
        return p;
    };
    var started = false, observer = null;
    function start() {
        if (started) return; started = true;
        ensureLeaflet().then(function () { if (typeof initLeafletMaps === 'function') initLeafletMaps(); }).catch(function () { started = false; });
    }
    window.luxLazyMaps = function () {
        var els = ['islandMap', 'flightMap'].map(function (id) { return document.getElementById(id); }).filter(Boolean);
        if (!els.length) return;
        if (!('IntersectionObserver' in window)) { start(); return; }
        if (observer) observer.disconnect();
        var io = observer = new IntersectionObserver(function (en) {
            if (en.some(function (e) { return e.isIntersecting; })) { io.disconnect(); start(); }
        }, { rootMargin: '600px 0px' });
        els.forEach(function (el) { io.observe(el); });
    };
    window.addEventListener('online', function () { if (!started) window.luxLazyMaps(); });
    document.addEventListener('DOMContentLoaded', function () {
        if (typeof window.openMapFullscreen === 'function' && !window.openMapFullscreen.__lazy) {
            var orig = window.openMapFullscreen;
            window.openMapFullscreen = function (type) {
                var m = document.getElementById('mapFsModal'), c = document.getElementById('mapFsContainer');
                if (m && c) { m.style.display = 'flex'; c.innerHTML = '<div style="color:#fff;display:grid;place-items:center;height:100%;font-weight:700">Načítám mapu…</div>'; }
                return ensureLeaflet().then(function () { start(); orig(type); })
                    .catch(function (err) {
                        try { console.error('Mapa na celou obrazovku:', err); } catch (e) {}
                        if (c) c.innerHTML = '<div style="color:#fff;display:grid;place-items:center;height:100%;font-weight:700;text-align:center;padding:20px">Mapu se nepodařilo načíst.<br>Zkontroluj připojení a zkus to znovu.</div>';
                        if (window.showToast) showToast('Mapu se nepodařilo načíst – zkontroluj připojení.');
                    });
            };
            window.openMapFullscreen.__lazy = true;
        }
    });
})();
