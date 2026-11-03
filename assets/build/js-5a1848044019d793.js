
/* ===== Kurzy měn, export do kalendáře, sdílení odkazů ===== */
(function () {
    var nf = function (v, d) { return new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: d == null ? 2 : d, minimumFractionDigits: 0 }).format(v); };
    function toast(msg) {
        if (typeof window.showToast === 'function') { try { window.showToast(msg); return; } catch (e) {} }
        var t = document.createElement('div'); t.className = 'lux-toast'; t.setAttribute('role', 'status'); t.textContent = msg;
        document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600);
    }

    /* ---------- kurzy měn: panel je rozbalený hned po načtení ----------
       Hlavní zdroj: PRODEJ VALUT (hotovost) z kurzy.cz (CC BY 4.0, JSONP), nejvýhodnější z více bank a směnáren.
       ECB (frankfurter) slouží jen jako kontrola rozumnosti a záloha, kde valutový kurz neexistuje. */
    var FX_KEY = 'lux_fx_v1', KZ_KEY = 'lux_kz_v1', FXS_KEY = 'lux_fxs_v2';
    var CUR = ['CZK', 'USD', 'EUR', 'SGD', 'IDR'];
    var FOREIGN = ['USD', 'EUR', 'SGD', 'IDR'];
    var SYM = { CZK: 'Kč', USD: '$', EUR: '€', SGD: 'S$', IDR: 'Rp' };
    var FX_FALLBACK = { t: 0, date: '2026-10-27', fallback: true, rates: { EUR: 1, CZK: 24.347, SGD: 1.4285, IDR: 20225, USD: 1.115 } };
    var FX_RANGE = { CZK: [50000, 500], USD: [2000, 10], EUR: [2000, 10], SGD: [2000, 10], IDR: [10000000, 50000] };
    var FX_QUICK = { CZK: [1000, 5000, 15000, 30000], USD: [100, 300, 700, 1000], EUR: [100, 300, 600, 1000], SGD: [20, 50, 100, 500], IDR: [100000, 500000, 1000000, 5000000] };
    var KZ_SOURCES = [
        [43, 'Exchange'], [44, 'Exchange VIP'], [62, 'Eurowex'], [119, 'Akcenta CZ'], [120, 'Petra Finance'], [121, 'Nekázanka Exchange'],
        [1, 'ČSOB'], [2, 'Česká spořitelna'], [4, 'Komerční banka'], [5, 'MONETA'], [16, 'Raiffeisenbank'], [56, 'Fio banka'],
        [58, 'Air bank'], [46, 'mBank'], [10, 'UniCredit Bank'], [51, 'Poštovní spořitelna'], [49, 'Max banka'], [123, 'Trinity Bank']
    ];
    var FX_REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    function fxCached() { try { var c = JSON.parse(localStorage.getItem(FX_KEY) || 'null'); return c && c.rates && c.rates.CZK ? c : null; } catch (e) { return null; } }
    function fxLoad() { /* ECB: jen kontrola a záloha */
        var c = fxCached();
        if (c && Date.now() - c.t < 12 * 3600000) return Promise.resolve(c);
        var q = '?base=EUR&symbols=CZK,SGD,IDR,USD';
        var urls = ['https://api.frankfurter.dev/v1/latest' + q, 'https://api.frankfurter.app/latest' + q];
        function tryUrl(k) {
            if (k >= urls.length) return Promise.reject();
            return fetch(urls[k]).then(function (r) { if (!r.ok) throw 0; return r.json(); })
                .then(function (d) {
                    if (!d || !d.rates || !d.rates.CZK) throw 0;
                    var o = { t: Date.now(), date: d.date, rates: Object.assign({ EUR: 1 }, d.rates) };
                    try { localStorage.setItem(FX_KEY, JSON.stringify(o)); } catch (e) {}
                    return o;
                }).catch(function () { return tryUrl(k + 1); });
        }
        return tryUrl(0).catch(function () { if (c) { c.stale = true; return c; } throw 0; });
    }
    /* kurzy.cz přes JSONP (funguje bez CORS) */
    function kzParse(id, d) {
        if (!d || !d.kurzy) return null;
        var o = { id: id, name: d.banka, date: d.denc, k: {} };
        FOREIGN.forEach(function (c) {
            var x = d.kurzy[c]; if (!x) return;
            var j = x.jednotka || 1;
            o.k[c] = { vp: x.val_prodej ? x.val_prodej / j : null, dp: x.dev_prodej ? x.dev_prodej / j : null };
        });
        return o;
    }
    function kzFetch(id) {
        return new Promise(function (res) {
            var cb = '__kz' + id + '_' + (Date.now() % 1e6), done = false, sc = document.createElement('script'), tm;
            function fin(v) { if (done) return; done = true; clearTimeout(tm); try { delete window[cb]; } catch (e) { window[cb] = undefined; } if (sc.parentNode) sc.parentNode.removeChild(sc); res(v); }
            window[cb] = function (d) { fin(kzParse(id, d)); };
            tm = setTimeout(function () { fin(null); }, 9000);
            sc.async = true; sc.onerror = function () { fin(null); };
            sc.src = 'https://data.kurzy.cz/json/meny/b[' + id + ']cb[' + cb + '].js';
            document.head.appendChild(sc);
        });
    }
    function kzCache() { try { var c = JSON.parse(localStorage.getItem(KZ_KEY) || 'null'); return c && c.d ? c : null; } catch (e) { return null; } }
    function fxFmt(c, v) { var d = c === 'IDR' ? 0 : 2; return new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: d, maximumFractionDigits: d }).format(v); }
    function fxUnit(c) { return c === 'CZK' ? 'Kč' : c; }
    function fxTween(el, to, fmt) {
        var from = el._v == null ? to : el._v; el._v = to;
        if (el._raf) cancelAnimationFrame(el._raf);
        if (FX_REDUCED || from === to) { el.textContent = fmt(to); return; }
        var t0 = performance.now(), dur = 300;
        (function step(t) {
            var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
            el.textContent = fmt(from + (to - from) * e);
            if (k < 1) el._raf = requestAnimationFrame(step); else el._raf = 0;
        })(t0);
    }
    function fxCopy(txt) {
        if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt).then(function () { return true; }, function () { return false; });
        try { var ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); var ok = document.execCommand('copy'); ta.remove(); return Promise.resolve(ok); } catch (e) { return Promise.resolve(false); }
    }

    function fxBuild() {
        var host = document.getElementById('lpFx'); if (!host) return null;
        var st = { cur: 'USD', amt: 700, src: 'auto' };
        try { var sv = JSON.parse(localStorage.getItem(FXS_KEY) || 'null'); if (sv && CUR.indexOf(sv.cur) > -1 && isFinite(sv.amt) && sv.amt >= 0) { st.cur = sv.cur; st.amt = sv.amt; if (sv.src === 'auto' || KZ_SOURCES.some(function (s) { return String(s[0]) === String(sv.src); })) st.src = sv.src; } } catch (e) {}
        var fx = fxCached() || FX_FALLBACK, r = fx.rates;
        var kz = {}, kzTotal = KZ_SOURCES.length, kzDone = 0, status = 'loading';
        var cc = kzCache(); if (cc) { kz = cc.d; }
        var P = {};

        host.innerHTML =
            '<div class="fx-head">' +
                '<div class="fx-title"><span class="fx-ico" aria-hidden="true">💱</span><div><b>Přepočet měn · prodej valut</b><span class="fx-live" id="fxLive"><i></i><span>načítám kurzy…</span></span></div></div>' +
                '<div class="fx-chips" id="fxChips"></div>' +
            '</div>' +
            '<div class="fx-main">' +
                '<div class="fx-in">' +
                    '<label class="fx-lbl" for="lpFxAmt">Mám</label>' +
                    '<div class="fx-field"><span class="fx-sym" id="fxSym"></span><input id="lpFxAmt" type="text" inputmode="decimal" autocomplete="off" aria-label="Částka"><span class="fx-code" id="fxCode"></span></div>' +
                    '<div class="fx-seg" role="group" aria-label="Měna částky" id="fxSeg"></div>' +
                    '<input class="fx-range" id="fxRange" type="range" min="0" step="1" aria-label="Posuvník částky">' +
                    '<div class="fx-quick" id="fxQuick" role="group" aria-label="Rychlé částky"></div>' +
                '</div>' +
                '<div class="fx-out">' +
                    '<span class="fx-lbl">To je (kurz prodeje valut)</span>' +
                    '<div class="fx-tiles" id="lpFxOut">' + CUR.map(function (c) {
                        return '<div class="fx-tile" data-c="' + c + '"><button type="button" class="fx-tile-main" aria-label="Přepnout: mám ' + c + '">' +
                            '<span class="fx-tile-top"><span class="fx-badge">' + SYM[c] + '</span><span class="fx-tile-code">' + c + '</span></span>' +
                            '<b class="fx-tile-val">0</b><span class="fx-tile-sub"></span><span class="fx-tile-m"></span><span class="fx-swap" aria-hidden="true">⇄ přepnout</span></button>' +
                            '<button type="button" class="fx-copy" aria-label="Kopírovat částku v ' + c + '" title="Kopírovat"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg></button></div>';
                    }).join('') + '</div>' +
                    '<div class="fx-foot"><label class="fx-lbl fx-lbl-n" for="fxSel">Zdroj kurzu:</label><select class="fx-sel" id="fxSel">' +
                        '<option value="auto">Nejvýhodnější prodej z ' + kzTotal + ' bank a směnáren</option>' +
                        '<optgroup label="Směnárny">' + KZ_SOURCES.slice(0, 6).map(function (s) { return '<option value="' + s[0] + '">' + s[1] + '</option>'; }).join('') + '</optgroup>' +
                        '<optgroup label="Banky">' + KZ_SOURCES.slice(6).map(function (s) { return '<option value="' + s[0] + '">' + s[1] + '</option>'; }).join('') + '</optgroup>' +
                    '</select></div>' +
                '</div>' +
            '</div>' +
            '<p class="fx-note" id="fxNote"></p>' +
            '<a class="fx-cash" href="https://www.valuty.net/smenarny?pobocka=4" target="_blank" rel="noopener noreferrer"><span class="fx-cash-ico" aria-hidden="true">💵</span><span><b>Tip na hotovost (SGD):</b> singapurské dolary si můžeme pohodlně objednat předem v Jablonci nad Nisou (vyzvednutí do pár dnů). Kurz a zásoby zkontroluj v ceníku směnárny.</span><span class="fx-cash-go">Ceník ↗</span></a>' +
            '<output class="sr-only" id="fxSum" aria-live="polite"></output>';

        var $q = function (s) { return host.querySelector(s); };
        var amt = $q('#lpFxAmt'), range = $q('#fxRange'), seg = $q('#fxSeg'), quick = $q('#fxQuick'), chips = $q('#fxChips'),
            live = $q('#fxLive'), note = $q('#fxNote'), sum = $q('#fxSum'), sym = $q('#fxSym'), code = $q('#fxCode'), sel = $q('#fxSel');
        sel.value = String(st.src);
        var tiles = {}; host.querySelectorAll('.fx-tile').forEach(function (t) { tiles[t.getAttribute('data-c')] = t; });
        var sumTimer = 0;

        /* výběr kurzu pro každou měnu: nejnižší prodej valut (kolik Kč zaplatíš za 1 jednotku) */
        function pick() {
            P = { CZK: { p: 1, n: '', kind: 'czk' } };
            var ids = st.src === 'auto' ? KZ_SOURCES.map(function (s) { return s[0]; }) : [+st.src];
            FOREIGN.forEach(function (c) {
                var ref = r.CZK / r[c], best = null, bestDev = null;
                ids.forEach(function (id) {
                    var o = kz[id], x = o && o.k && o.k[c]; if (!x) return;
                    if (x.vp && x.vp >= ref * 0.97 && x.vp <= ref * 1.35 && (!best || x.vp < best.p)) best = { p: x.vp, n: o.name, kind: 'val', date: o.date };
                    if (x.dp && x.dp >= ref * 0.97 && x.dp <= ref * 1.35 && (!bestDev || x.dp < bestDev.p)) bestDev = { p: x.dp, n: o.name, kind: 'dev', date: o.date };
                });
                P[c] = best || (st.src !== 'auto' && bestDev) || { p: ref, n: 'ECB střed', kind: 'ecb' };
            });
        }
        function parseAmt() { var v = parseFloat(String(amt.value).replace(/[\s\u00a0]/g, '').replace(',', '.')); return isFinite(v) && v > 0 ? v : 0; }
        function save() { try { localStorage.setItem(FXS_KEY, JSON.stringify(st)); } catch (e) {} }
        function inputStr(v) { v = st.cur === 'IDR' ? Math.round(v) : Math.round(v * 100) / 100; return String(v).replace('.', ','); }
        function syncRange() {
            var cfg = FX_RANGE[st.cur], max = cfg[0], v = Math.min(st.amt, max);
            range.max = max; range.step = cfg[1]; range.value = v;
            range.style.setProperty('--p', (max ? v / max * 100 : 0) + '%');
        }
        function kindText(m) { return m.kind === 'val' ? m.n + ' · prodej valut' : m.kind === 'dev' ? m.n + ' · devizový prodej (ne hotovost)' : 'ECB střed · valutový kurz nenalezen'; }
        function renderChips() {
            var defs = [['SGD', 1], ['IDR', 100000], ['USD', 1], ['EUR', 1]];
            chips.innerHTML = defs.map(function (d) {
                var c = d[0], u = d[1], m = P[c];
                return '<div class="fx-chip ' + (m.kind === 'ecb' ? 'ecb' : '') + '" title="' + kindText(m) + '"><span class="fx-chip-l">' + new Intl.NumberFormat('cs-CZ').format(u) + ' ' + c + '</span>' +
                    '<span class="fx-chip-v">' + nf(m.p * u, c === 'IDR' ? 0 : 2) + ' Kč</span><span class="fx-chip-src">' + m.n + '</span></div>';
            }).join('');
        }
        function renderNote() {
            var dates = FOREIGN.map(function (c) { return P[c].date; }).filter(Boolean);
            var when = dates.length ? dates[0] : '';
            var t = 'Kurzy prodeje valut (za kolik Kč koupíš hotovost), ' + (st.src === 'auto' ? 'u každé měny nejnižší z ' + (kzDone || kzTotal) + ' načtených bank a směnáren' : 'ze zvoleného zdroje') + (when ? ', kurzový lístek k ' + when : '') + '. ';
            if (FOREIGN.some(function (c) { return P[c].kind !== 'val'; })) t += 'Tam, kde valutový kurz není k dispozici, je použit střed ECB (' + (fx.fallback ? 'záložní, orientační' : fx.date) + '). ';
            t += 'Skutečný kurz si vždy ověř u směnárny. Zdroj dat: ';
            note.textContent = t;
            var a = document.createElement('a'); a.href = 'https://www.kurzy.cz/'; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'kurzy.cz'; a.style.color = 'var(--primary)'; note.appendChild(a); note.appendChild(document.createTextNode('.'));
            live.className = 'fx-live ' + (status === 'ok' ? 'is-ok' : status === 'off' ? 'is-off' : '');
            live.lastChild.textContent = status === 'ok' ? 'živé kurzy · kurzy.cz' : status === 'off' ? 'offline · záložní kurz' : 'načítám kurzy…';
        }
        function renderSrc() {
            var c = st.cur;
            sym.textContent = SYM[c]; code.textContent = c;
            seg.innerHTML = CUR.map(function (x) { return '<button type="button" class="fx-btn" data-c="' + x + '" aria-pressed="' + (x === c) + '">' + fxUnit(x) + '</button>'; }).join('');
            quick.innerHTML = FX_QUICK[c].map(function (v) { return '<button type="button" class="fx-btn" data-v="' + v + '">' + new Intl.NumberFormat('cs-CZ').format(v) + (c === 'USD' && v === 700 ? ' <span class="fx-star" title="Odhad na osobu">★</span>' : '') + '</button>'; }).join('');
            Object.keys(tiles).forEach(function (k) { tiles[k].classList.toggle('is-src', k === c); });
            syncRange();
        }
        function calc() {
            var v = parseAmt(), c0 = st.cur, czk = v * P[c0].p, lines = [];
            CUR.forEach(function (c) {
                if (c === c0) return;
                var val = czk / P[c].p;
                var t = tiles[c], valEl = t.querySelector('.fx-tile-val');
                fxTween(valEl, val, function (x) { return fxFmt(c, x); });
                var rate = P[c0].p / P[c].p, u = 1; if (rate < 0.5) while (rate * u < 1 && u < 1e7) u *= 10;
                t.querySelector('.fx-tile-sub').textContent = new Intl.NumberFormat('cs-CZ').format(u) + ' ' + fxUnit(c0) + ' = ' + fxFmt(c, rate * u) + ' ' + fxUnit(c);
                var mm = c === 'CZK' ? P[c0] : P[c];
                t.querySelector('.fx-tile-m').textContent = c === 'CZK' && c0 === 'CZK' ? '' : kindText(mm);
                t.querySelector('.fx-tile-m').classList.toggle('is-warn', mm.kind !== 'val');
                t._plain = (c === 'IDR' ? Math.round(val) : Math.round(val * 100) / 100).toString().replace('.', ',');
                t._unit = fxUnit(c); t._ideal = c === 'IDR' ? Math.round(val) : Math.round(val * 100) / 100;
                if (c === 'CZK') lines.push(fxFmt(c, val) + ' Kč');
            });
            clearTimeout(sumTimer);
            sumTimer = setTimeout(function () { sum.textContent = fxFmt(c0, v) + ' ' + fxUnit(c0) + ' = ' + lines.join(', '); }, 700);
        }
        function publish() {
            try {
                var cash = {}, mid = {}, kind = {}, srcN = {};
                FOREIGN.forEach(function (c) { cash[c] = P[c].p; kind[c] = P[c].kind; srcN[c] = P[c].n; mid[c] = r.CZK / r[c]; });
                window.luxFx = { cash: cash, mid: mid, kind: kind, src: srcN, idrPerUsd: r.IDR / r.USD, status: status, date: fx.date, fallback: !!fx.fallback };
                window.dispatchEvent(new CustomEvent('lux:fx', { detail: window.luxFx }));
            } catch (e) {}
        }
        function refreshAll() { pick(); renderChips(); renderNote(); calc(); publish(); }
        function setAmt(v) { st.amt = v; amt.value = inputStr(v); syncRange(); calc(); save(); }
        function setCur(c, newAmt) { st.cur = c; if (newAmt != null) st.amt = newAmt; amt.value = inputStr(st.amt); renderSrc(); calc(); save(); }

        amt.addEventListener('input', function () { st.amt = parseAmt(); syncRange(); calc(); save(); });
        amt.addEventListener('focus', function () { amt.select(); });
        range.addEventListener('input', function () { setAmt(+range.value); });
        seg.addEventListener('click', function (e) { var b = e.target.closest('[data-c]'); if (b && b.getAttribute('data-c') !== st.cur) setCur(b.getAttribute('data-c')); });
        quick.addEventListener('click', function (e) { var b = e.target.closest('[data-v]'); if (b) setAmt(+b.getAttribute('data-v')); });
        sel.addEventListener('change', function () { st.src = sel.value === 'auto' ? 'auto' : +sel.value; save(); refreshAll(); });
        host.querySelector('#lpFxOut').addEventListener('click', function (e) {
            var t = e.target.closest('.fx-tile'); if (!t) return;
            var c = t.getAttribute('data-c');
            if (e.target.closest('.fx-copy')) {
                var btn = e.target.closest('.fx-copy'), txt = t._plain || '';
                fxCopy(txt).then(function (ok) {
                    if (ok) { btn.classList.add('is-done'); setTimeout(function () { btn.classList.remove('is-done'); }, 1200); }
                    toast(ok ? 'Zkopírováno: ' + txt + ' ' + t._unit : 'Kopírování se nepovedlo');
                });
                return;
            }
            setCur(c, t._ideal || 0);
        });

        pick(); renderSrc(); amt.value = inputStr(st.amt); renderChips(); renderNote(); calc(); publish();

        return {
            refresh: function () {
                fxLoad().then(function (f) { fx = f; r = f.rates; refreshAll(); }).catch(function () {});
                var fresh = cc && Date.now() - cc.t < 15 * 60000;
                if (fresh) { kzDone = Object.keys(kz).length; status = kzDone ? 'ok' : 'off'; refreshAll(); return; }
                var got = {};
                Promise.all(KZ_SOURCES.map(function (s) {
                    return kzFetch(s[0]).then(function (o) {
                        kzDone++; if (o) { got[s[0]] = o; kz[s[0]] = o; status = 'ok'; refreshAll(); }
                    });
                })).then(function () {
                    if (Object.keys(got).length) { try { localStorage.setItem(KZ_KEY, JSON.stringify({ t: Date.now(), d: got })); } catch (e) {} status = 'ok'; }
                    else status = Object.keys(kz).length ? 'ok' : 'off';
                    kzDone = Object.keys(kz).length; refreshAll();
                });
            }
        };
    }
    var fxApi = fxBuild();
    function fxInit() { if (fxApi) fxApi.refresh(); }

    /* ---------- export do kalendáře (.ics) ---------- */
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function ymd(d) { return '2027' + '08' + pad(d); }
    function esc(t) { return String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
    function buildIcs() {
        var base = /^https?:/.test(location.protocol) ? location.href.split('#')[0] : '';
        var now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
        var ev = [], legs = window.TRIP_LEGS || [];
        var f = typeof window.getSelectedFlight === 'function' ? (window.getSelectedFlight() || {}) : {};
        function add(uid, from, toExcl, title, desc) {
            ev.push(['BEGIN:VEVENT', 'UID:' + uid + '@cesta-2027', 'DTSTAMP:' + now,
                'DTSTART;VALUE=DATE:' + ymd(from), 'DTEND;VALUE=DATE:' + ymd(toExcl),
                'SUMMARY:' + esc(title), 'DESCRIPTION:' + esc(desc), 'TRANSP:TRANSPARENT', 'END:VEVENT'].join('\r\n'));
        }
        add('odlet', 6, 7, '✈️ Odlet z Prahy do Singapuru', (f.name ? 'Let: ' + f.name + '\n' : '') + (f.outDep ? 'Odlet v ' + f.outDep + '\n' : '') + (base ? base + '#f-leg-sg' : ''));
        legs.forEach(function (l) {
            add(l.id, l.from, l.from === l.to ? l.to + 1 : l.to, l.n + '. ' + l.name, 'Etapa cesty Singapur · Bali · Lombok' + (base ? '\n' + base + '#' + l.id : ''));
        });
        add('prilet', 25, 26, '🏠 Přílet domů do Prahy', base);
        return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Cesta 2027//CS', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
            'X-WR-CALNAME:Singapur · Bali · Lombok 2027'].concat(ev).concat(['END:VCALENDAR']).join('\r\n');
    }
    function downloadIcs() {
        var blob = new Blob([buildIcs()], { type: 'text/calendar;charset=utf-8' });
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'singapur-bali-lombok-2027.ics';
        document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
        toast('📅 Kalendář stažen – otevři soubor a etapy se přidají do kalendáře.');
    }
    function icsInit() {
        var bar = document.querySelector('.lp-btns'); if (!bar || bar.querySelector('.lp-ics')) return;
        var b = document.createElement('button'); b.type = 'button'; b.className = 'lux-tool lp-ics'; b.textContent = '📅 Do kalendáře';
        b.title = 'Stáhne termíny všech etap jako soubor .ics pro Google, Apple nebo Outlook kalendář';
        b.addEventListener('click', downloadIcs); bar.insertBefore(b, bar.firstChild);
    }

    /* ---------- sdílení odkazu na část nebo den ---------- */
    function linkTo(id) { return location.href.split('#')[0] + '#' + id; }
    function share(id, title) {
        var url = linkTo(id);
        var coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
        if (navigator.share && coarse) { navigator.share({ title: title, url: url }).catch(function () {}); return; }
        var done = function () { toast('🔗 Odkaz zkopírován – vlož ho do WhatsAppu nebo e-mailu.'); };
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(done, function () { window.prompt('Zkopíruj odkaz:', url); });
        else window.prompt('Zkopíruj odkaz:', url);
    }
    function slug(t) { return t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40); }
    function shareInit() {
        // dny uvnitř itinerářů dostanou stabilní kotvy (např. #ubud-den-2)
        [].forEach.call(document.querySelectorAll('[class*="accordion-content"][id$="AccContent"]'), function (acc) {
            var baseId = slug(acc.id.replace(/AccContent$/, ''));
            var n = 0;
            [].forEach.call(acc.querySelectorAll(':scope > [class^="day-block"], :scope > div > [class^="day-block"]'), function (blk) {
                var h = blk.querySelector('h4'); if (!h) return;
                n++;
                if (!blk.id) blk.id = baseId + '-den-' + n;
                if (h.querySelector('.share-link')) return;
                var b = document.createElement('button'); b.type = 'button'; b.className = 'share-link';
                b.textContent = '🔗'; b.setAttribute('aria-label', 'Sdílet odkaz na: ' + h.textContent.trim());
                b.title = 'Zkopírovat odkaz na tento den';
                b.addEventListener('click', function () { share(blk.id, h.textContent.trim()); });
                h.appendChild(b);
            });
        });
        // každá rozbalovací část (víza, etapy…) má dole tlačítko na sdílení
        [].forEach.call(document.querySelectorAll('.lux-fold[id] > [id$="-b"] .lux-fold-pad'), function (pad) {
            if (pad.querySelector(':scope > .share-row')) return;
            var fold = pad.closest('.lux-fold'), t = fold.querySelector('.lux-fold-t');
            var row = document.createElement('div'); row.className = 'share-row';
            var b = document.createElement('button'); b.type = 'button'; b.className = 'share-link';
            b.textContent = '🔗 Sdílet odkaz na tuto část';
            b.addEventListener('click', function () { share(fold.id, t ? t.textContent.trim() : document.title); });
            row.appendChild(b); pad.appendChild(row);
        });
    }
    // odkaz s #kotvou vedoucí do zavřeného itineráře: itinerář rozbalit a doscrollovat
    var initialHash = location.hash;   // zapamatovat hned – jiný skript kotvu po načtení z adresy odstraní
    function openHashTarget(h) {
        h = h || location.hash;
        if (!h) return;
        var t = document.getElementById(decodeURIComponent(h.slice(1))); if (!t) return;
        var acc = t.closest('[class*="accordion-content"]');
        if (acc && !acc.classList.contains('open') && window.luxAccToggle) {
            luxAccToggle(acc.id, true);
            // obsah se ještě rozbaluje a dočítají se fotky – pozici chvíli hlídat, dokud uživatel sám nescrolluje
            var userMoved = false, stop = function () { userMoved = true; };
            ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { window.addEventListener(ev, stop, { once: true, passive: true }); });
            function offset() {   // nad cílem nesmí zůstat přilepená hlavička otevřené etapy
                var f = t.closest('.lux-fold.is-open'), fh = f && f.querySelector(':scope > .lux-fold-h');
                if (!fh || getComputedStyle(fh).position !== 'sticky') return 84;
                return (parseFloat(getComputedStyle(fh).top) || 0) + fh.offsetHeight + 16;
            }
            [650, 1100, 1700, 2500].forEach(function (ms, k) {
                setTimeout(function () {
                    if (userMoved) return;
                    var top = t.getBoundingClientRect().top, off = offset();
                    if (k === 0 || Math.abs(top - off) > 30) window.scrollTo({ top: Math.max(0, top + window.scrollY - off), behavior: k === 0 ? 'smooth' : 'auto' });
                    if (k === 0) { t.classList.add('is-target-flash'); setTimeout(function () { t.classList.remove('is-target-flash'); }, 2000); }
                }, ms);
            });
        }
    }

    // spouští se hned (DOM nad skriptem je hotový), aby kotvy existovaly dřív než se zpracuje #odkaz
    shareInit();
    document.addEventListener('DOMContentLoaded', function () { icsInit(); shareInit(); /* kotva z adresy po načtení nic neotevírá */ });
    window.addEventListener('hashchange', function () { setTimeout(function () { openHashTarget(location.hash); }, 50); });
    window.addEventListener('load', function () { (window.requestIdleCallback || setTimeout)(fxInit); });
})();
