
        /* Skládací složky, cestovní páteř a živé hlavičky etap */
        (function () {
            var KEY = 'lux_open_folds_v1';
            var maps = window.__luxMaps = [];
            function hookLeaflet() { try { if (window.L && L.Map && L.Map.addInitHook && !L.__luxHooked) { L.Map.addInitHook(function () { maps.push(this); }); L.__luxHooked = true; } } catch (e) {} }

            function load() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
            function save() {
                try {
                    localStorage.setItem(KEY, JSON.stringify([].map.call(document.querySelectorAll('.lux-fold.is-open'), function (f) { return f.id; })));
                } catch (e) {}
            }
            function refresh() {
                maps.forEach(function (m) { try { m.invalidateSize(); } catch (e) {} });
                try { window.dispatchEvent(new Event('resize')); } catch (e) {}
            }
            // Align once on opening. Later image loads and scrolling never pin the page.
            window.luxPreserveHeader = function (header, change) {
                change();
                if (!header.isConnected) return;
                var top = header.getBoundingClientRect().top + window.scrollY - 8;
                window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
            };
            function setState(f, open, instant) {
                if (!f) return;
                function change() {
                    /* vždy jen jedna otevřená sekce; ostatní se zavřou samy (vnořené podrobnosti uvnitř otevřené sekce se netýkají) */
                    if (open) {
                        var flightPick = document.getElementById('flightPick');
                        if (flightPick && flightPick.open) flightPick.open = false;
                        if (window.luxPartFor) window.luxPartFor(f);
                        [].forEach.call(document.querySelectorAll('.lux-fold.is-open'), function (o) {
                            if (o !== f && !o.contains(f) && !f.contains(o)) { setState(o, false, true); }
                        });
                    }
                    var body = f.querySelector(':scope > .lux-fold-body');
                    var btn = f.querySelector(':scope > .lux-fold-h .lux-fold-btn');
                    if (instant) f.classList.add('no-anim');
                    f.classList.toggle('is-open', open);
                    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
                    if (body) { if (open) body.removeAttribute('inert'); else body.setAttribute('inert', ''); }
                    clearTimeout(f._t);
                    if (open) { f._t = setTimeout(function () { f.classList.add('is-settled'); refresh(); }, instant ? 30 : 480); }
                    else { f.classList.remove('is-settled'); }
                    if (instant) requestAnimationFrame(function () { requestAnimationFrame(function () { f.classList.remove('no-anim'); }); });
                }
                if (open && !instant) window.luxPreserveHeader(f, change);
                else change();
            }
            window.luxToggle = function (id) {
                var f = document.getElementById(id);
                if (!f) return;
                setState(f, !f.classList.contains('is-open'), false);
                save();
            };
            window.luxAll = function (scopeId, open) {
                var scope = (scopeId && document.getElementById(scopeId)) || document;
                [].forEach.call(scope.querySelectorAll('.lux-fold'), function (f) { setState(f, open, true); });
                save();
            };
            function openAncestors(el) {
                stopHeaderPin();
                if (window.luxPartFor) window.luxPartFor(el);
                var changed = false, f = el && el.closest ? el.closest('.lux-fold') : null;
                while (f) {
                    if (!f.classList.contains('is-open')) { setState(f, true, true); changed = true; }
                    f = f.parentElement ? f.parentElement.closest('.lux-fold') : null;
                }
                if (changed) save();
                return changed;
            }
            function goTo(t) {
                openAncestors(t);
                requestAnimationFrame(function () { requestAnimationFrame(function () {
                    var y = t.getBoundingClientRect().top + window.scrollY - 8;
                    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
                }); });
            }
            // každý odkaz na kotvu nejdřív rozbalí složky, ve kterých cíl leží
            document.addEventListener('click', function (e) {
                var a = e.target.closest && e.target.closest('a[href^="#"]');
                if (!a) return;
                var id = a.getAttribute('href').slice(1);
                if (!id) return;
                var t = document.getElementById(decodeURIComponent(id));
                if (!t) return;
                e.preventDefault();
                goTo(t);
                try { history.replaceState(null, '', '#' + id); } catch (_) {}
            });
            window.addEventListener('hashchange', function () {
                var t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
                if (t) goTo(t);
            });
            // kód stránky volá scrollIntoView na prvky uvnitř složek – nejdřív je rozbalíme
            var _siv = Element.prototype.scrollIntoView;
            Element.prototype.scrollIntoView = function () { try { openAncestors(this); } catch (e) {} return _siv.apply(this, arguments); };

            // jednotná rozbalovací tlačítka podrobných plánů: aria-expanded podle stavu ikony
            document.addEventListener('click', function (e) {
                var b = e.target.closest && e.target.closest('.lux-acc-btn');
                if (!b) return;
                setTimeout(function () {
                    var open = !!b.querySelector('.lux-acc-chev.rotate');
                    b.setAttribute('aria-expanded', open ? 'true' : 'false');
                    refresh();
                }, 30);
            });
            // živé hlavičky: vybraný hotel + cena u každé etapy, cena v dlaždici
            function syncMeta() {
                try {
                    [].forEach.call(document.querySelectorAll('.lux-fold[data-stage]'), function (f) {
                        var k = f.getAttribute('data-stage');
                        var v = selectedHotels[k];
                        var h = hotelCatalog[k].options[v];
                        var el = f.querySelector(':scope > .lux-fold-h .lux-fold-meta');
                        if (el && h) el.textContent = '🏨 ' + v + ': ' + h.name + ' · ' + (typeof formatKz === 'function' ? formatKz(h.price) : h.price) + ' Kč';
                    });
                } catch (e) {}
                try {
                    [].forEach.call(document.querySelectorAll('.rm-live[data-bind]'), function (el) {
                        var src = document.getElementById(el.getAttribute('data-bind'));
                        if (src) el.textContent = (el.getAttribute('data-prefix') || '') + src.textContent.trim();
                    });
                } catch (e) {}
            }
            function init() {
                hookLeaflet();   // Leaflet se teď načítá s defer, je k dispozici až tady
                var folds = document.querySelectorAll('.lux-fold');
                // při načtení je vše sbalené (odkaz s #kotvou rozbalí jen svůj cíl)
                [].forEach.call(folds, function (f) { setState(f, false, true); });
                try { localStorage.removeItem(KEY); } catch (e) {}
                /* vše zavřené: kotva v adrese po načtení nic neotevírá */
                syncMeta();
                setTimeout(syncMeta, 800);
                setTimeout(syncMeta, 2500);
                try {
                    var mo = new MutationObserver(syncMeta);
                    [].forEach.call(document.querySelectorAll('[id^="selected-hotel-slot-"], #calcPricePerson'), function (n) {
                        mo.observe(n, { childList: true, subtree: true, characterData: true });
                    });
                } catch (e) {}
            }
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
            window.addEventListener('load', function () { syncMeta(); refresh(); });
        })();

