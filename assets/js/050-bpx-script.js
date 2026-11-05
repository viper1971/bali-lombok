
/* ---- Palubní vstupenky (boarding passy): letadla i lodě ---- */
(function () {
    'use strict';
    var MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    var WD = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
    var AP = {
        PRG: ['Praha', 'Václav Havel Airport'], DXB: ['Dubaj', 'Dubai International'], HEL: ['Helsinky', 'Helsinki-Vantaa'],
        ZRH: ['Curych', 'Zürich Airport'], IST: ['Istanbul', 'Istanbul Airport'], SIN: ['Singapur', 'Changi Airport'],
        DPS: ['Denpasar · Bali', 'Ngurah Rai Airport'], LOP: ['Praya · Lombok', 'Lombok International'], SNR: ['Sanur · Bali', 'Sanur Harbour'], BNG: ['Bangsal · Lombok', 'Bangsal Harbour']
    };
    var BR = {
        EK: { n: 'Emirates', b1: '#d71921', b2: '#8f0f15', ac: '#c3141b', hi: '#ffffff', img: 'https://viper1971.github.io/bali-lombok/emirates.png' },
        FZ: { n: 'flydubai', b1: '#f26a21', b2: '#c4410c', ac: '#c4410c', hi: '#ffffff' },
        AY: { n: 'Finnair', b1: '#1b2a8a', b2: '#0b1560', ac: '#0b1560', hi: '#ffffff', img: 'https://viper1971.github.io/bali-lombok/finair.jpg' },
        LX: { n: 'SWISS', b1: '#e30613', b2: '#a1000b', ac: '#c40510', hi: '#ffffff', img: 'https://viper1971.github.io/bali-lombok/swiss.png' },
        TK: { n: 'Turkish Airlines', b1: '#d7192d', b2: '#8c0d1c', ac: '#b8101f', hi: '#ffffff', img: 'https://viper1971.github.io/bali-lombok/turkish.png' },
        TR: { n: 'Scoot', b1: '#ffdd00', b2: '#f2b800', ac: '#1a1a1a', hi: '#111111' },
        TN: { n: 'TransNusa', b1: '#e2231a', b2: '#951410', ac: '#c41d14', hi: '#ffffff' },
        SF: { n: 'Starfish', b1: '#00a6c8', b2: '#005f86', ac: '#00708f', hi: '#ffffff', boat: 1 },
        WH: { n: 'Wahana Virendra', b1: '#1565b8', b2: '#0a3a74', ac: '#0d4a94', hi: '#ffffff', boat: 1 }
    };
    var LOC = { PRG: 'Praze', DXB: 'Dubaji', HEL: 'Helsinkách', ZRH: 'Curychu', IST: 'Istanbulu', SIN: 'Singapuru' };
    var OPERATED = { EK2239: 'flydubai', LX1484: 'Helvetic Airways' };
    var PLANE = 'M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z';
    var BOAT = 'M2.5 16h19l-3 4.5h-13z M5.5 14.8v-4h13v4z M8.5 9.8v-4h7v4z M11 5.8V3h2v2.8z';

    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function toMin(hm) { var p = String(hm).split(':'); return (+p[0]) * 60 + (+p[1]); }
    function hm(min) { min = ((min % 1440) + 1440) % 1440; return pad(Math.floor(min / 60)) + ':' + pad(min % 60); }
    function fmt(m) { return Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + pad(m % 60) + ' min' : ''); }
    function addDays(d, n) { return new Date(d.getTime() + n * 86400000); }
    function dstr(d) { return pad(d.getUTCDate()) + ' ' + MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); }
    function dayTitle(d) { var w = WD[d.getUTCDay()]; return w.charAt(0).toUpperCase() + w.slice(1) + ' ' + d.getUTCDate() + '. ' + (d.getUTCMonth() + 1) + '.'; }
    function parseDate(s) { var m = /(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/.exec(s || ''); return m ? new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])) : null; }
    function absMin(d, off, clock) { return d.getTime() / 60000 + off * 1440 + clock; }

    /* ---- jméno cestujícího (každý si ho nastaví u sebe) ---- */
    function getName() { try { return localStorage.getItem('bpx_name') || 'PRIJMENI/JMENO'; } catch (e) { return 'PRIJMENI/JMENO'; } }
    function cleanName(v) { return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z\/ .\-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40); }

    /* ---- deterministické „náhodné“ čárové kódy ---- */
    function rng(seed) {
        var h = 1779033703 ^ seed.length, i;
        for (i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
        return function () { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
    }
    function pdf417(seed) {
        var R = rng(seed), rows = 15, cols = 5, rh = 3, d = '', START = [8, 1, 1, 1, 1, 1, 1, 3], STOP = [7, 1, 1, 3, 1, 1, 1, 2, 1], r, c;
        function cw() { var w = [1, 1, 1, 1, 1, 1, 1, 1], e = 9; while (e--) w[(R() * 8) | 0]++; return w; }
        function put(x0, y0, ws) { var x = x0; ws.forEach(function (w, i) { if (i % 2 === 0) d += 'M' + x + ' ' + y0 + 'h' + w + 'v' + rh + 'h-' + w + 'z'; x += w; }); return x; }
        for (r = 0; r < rows; r++) {
            var x = put(0, r * rh, START);
            x = put(x, r * rh, cw());
            for (c = 0; c < cols; c++) x = put(x, r * rh, cw());
            x = put(x, r * rh, cw());
            put(x, r * rh, STOP);
        }
        return '<svg class="bpx-pdf" viewBox="0 0 154 ' + rows * rh + '" preserveAspectRatio="none" aria-hidden="true"><path d="' + d + '" fill="#111"/></svg>';
    }
    function bars(seed) {
        var R = rng(seed + '#1d'), x = 0, d = '', i, w;
        for (i = 0; i < 46; i++) { w = 1 + ((R() * 3) | 0); if (i % 2 === 0) d += 'M' + x + ' 0h' + w + 'v40h-' + w + 'z'; x += w; }
        return '<svg class="bpx-bar" viewBox="0 0 ' + x + ' 40" preserveAspectRatio="none" aria-hidden="true"><path d="' + d + '" fill="#111"/></svg>';
    }

    /* ---- loga (zjednodušené kresby; pokud na webu leží soubor loga, překryje je) ---- */
    function logo(k) {
        var B = BR[k], s = '<svg viewBox="0 0 150 40" role="img" aria-label="' + esc(B.n) + '">';
        if (k === 'EK') s += '<text x="75" y="19" text-anchor="middle" font-size="17" font-weight="700" fill="#d71921" font-family="Noto Naskh Arabic, Tahoma, Arial, serif">طيران الإمارات</text><text x="75" y="35" text-anchor="middle" font-size="14" font-weight="800" font-style="italic" fill="#d71921" font-family="Arial, Helvetica, sans-serif" letter-spacing="1">Emirates</text>';
        else if (k === 'FZ') s += '<text x="75" y="27" text-anchor="middle" font-size="22" font-weight="800" font-family="Arial, Helvetica, sans-serif"><tspan fill="#f26a21">fly</tspan><tspan fill="#2a3547">dubai</tspan></text>';
        else if (k === 'AY') s += '<path d="M14 28 L26 12 L30 12 L22 24 L34 24 L32 28z" fill="#0b1560"/><text x="42" y="27" font-size="20" font-weight="800" fill="#0b1560" font-family="Arial, Helvetica, sans-serif" letter-spacing="2.5">FINNAIR</text>';
        else if (k === 'LX') s += '<rect x="10" y="5" width="30" height="30" rx="2" fill="#e30613"/><path d="M23 11h4v7h7v4h-7v7h-4v-7h-7v-4h7z" fill="#fff"/><text x="47" y="28" font-size="21" font-weight="800" fill="#1a1a1a" font-family="Arial, Helvetica, sans-serif" letter-spacing="1.5">SWISS</text>';
        else if (k === 'TK') s += '<circle cx="24" cy="20" r="15" fill="#c8102e"/><circle cx="24" cy="20" r="11" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M17 24 L28 12 L26 21 L32 20 L21 29 L23 22z" fill="#fff"/><text x="44" y="17" font-size="12.5" font-weight="800" fill="#c8102e" font-family="Arial, Helvetica, sans-serif" letter-spacing="0.6">TURKISH</text><text x="44" y="31" font-size="12.5" font-weight="800" fill="#c8102e" font-family="Arial, Helvetica, sans-serif" letter-spacing="0.6">AIRLINES</text>';
        else if (k === 'TR') s += '<rect x="20" y="5" width="110" height="30" rx="15" fill="#ffdd00"/><text x="75" y="29" text-anchor="middle" font-size="23" font-weight="900" fill="#111" font-family="Arial Black, Arial, Helvetica, sans-serif" letter-spacing="0.5">scoot</text>';
        else if (k === 'TN') s += '<path d="M12 27 L30 11 L34 11 L26 22 L38 22 L36 27z" fill="#e2231a"/><text x="44" y="26" font-size="19" font-weight="800" fill="#1d2b53" font-family="Arial, Helvetica, sans-serif"><tspan fill="#e2231a">Trans</tspan>Nusa</text>';
        else if (k === 'SF') s += '<path d="M26 5l4.4 9.2 10.1 1.3-7.4 7 1.9 10-9-4.9-9 4.9 1.9-10-7.4-7 10.1-1.3z" fill="#ff8a1f"/><text x="48" y="27" font-size="19" font-weight="800" fill="#005f86" font-family="Arial, Helvetica, sans-serif" letter-spacing="0.5">Starfish</text>';
        else if (k === 'WH') s += '<path d="M10 24q5-8 10 0t10 0 10 0" fill="none" stroke="#1565b8" stroke-width="3.2" stroke-linecap="round"/><path d="M10 31q5-8 10 0t10 0 10 0" fill="none" stroke="#5bb4ee" stroke-width="3.2" stroke-linecap="round"/><text x="58" y="19" font-size="14" font-weight="800" fill="#0a3a74" font-family="Arial, Helvetica, sans-serif" letter-spacing="1.5">WAHANA</text><text x="58" y="33" font-size="11" font-weight="700" fill="#1565b8" font-family="Arial, Helvetica, sans-serif" letter-spacing="1">Virendra</text>';
        s += '</svg>';
        if (B.img) s += '<img src="' + B.img + '" alt="" loading="lazy" onerror="this.remove()">';
        return s;
    }

    /* ---- jedna palubní vstupenka ---- */
    function ticket(c) {
        var B = BR[c.brand], boat = !!B.boat, A = AP[c.from] || [c.from, ''], Z = AP[c.to] || [c.to, ''];
        var icon = boat ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + BOAT + '"/></svg>' : '<svg class="pl" viewBox="0 0 24 24" aria-hidden="true"><path d="' + PLANE + '"/></svg>';
        var dm = c.dep ? toMin(c.dep) : null, lead = boat ? 30 : (c.durMin >= 180 ? 60 : 45);
        var bt = dm == null ? 'TBA' : hm(dm - lead), depT = c.dep || 'TBA', arrT = c.arr || 'TBA';
        var date = dstr(c.date), wd = WD[c.date.getUTCDay()];
        var seed = c.no + c.from + c.to + date;
        var arrSup = c.aPlus > c.dPlus ? '<sup>+' + (c.aPlus - c.dPlus) + '</sup>' : '';
        var opLine = c.op ? ' · operated by ' + esc(c.op) : '';
        var pax = getName();
        var bcbp = 'M1' + pax.replace(/ /g, '') + ' ' + (boat ? 'FB' : 'E') + ' ' + c.from + c.to + ' ' + c.no.replace(/\s/g, '') + ' ' + date.replace(/ /g, '');
        return '<div class="bpx-wrap"><article class="bpx" style="--b1:' + B.b1 + ';--b2:' + B.b2 + ';--ac:' + B.ac + ';--hi:' + B.hi + '" aria-label="' + esc((boat ? 'Palubní vstupenka na loď ' : 'Palubní vstupenka ') + c.no + ' ' + A[0] + ' ➔ ' + Z[0] + ', ' + date) + '">' +
            '<div class="bpx-main">' +
            '<div class="bpx-head"><div class="bpx-logo">' + logo(c.brand) + '</div>' +
            '<div class="bpx-title"><b>BOARDING PASS</b><span>' + (boat ? 'Palubní vstupenka · rychloloď' : 'Palubní vstupenka') + esc(opLine) + '</span></div>' +
            '<div class="bpx-cls">' + esc(c.cls) + '</div></div>' +
            '<div class="bpx-body">' +
            '<div class="bpx-pax"><span class="bpx-lab">Passenger / Cestující</span><b class="bpx-name" role="button" tabindex="0" data-bpx-name title="Klepni a změň jméno na vstupence">' + esc(pax) + '</b><span class="bpx-edit">✎ změnit jméno</span></div>' +
            '<div class="bpx-route">' +
            '<div class="bpx-pt"><span class="bpx-lab">From / Odkud</span><span class="bpx-code">' + c.from + '</span><span class="bpx-city">' + esc(A[0]) + '</span><span class="bpx-apn">' + esc(A[1]) + '</span><span class="bpx-tm">' + depT + '</span></div>' +
            '<div class="bpx-path"><div class="bpx-line"><i>' + icon + '</i><b></b></div><span>' + esc(c.dur) + (boat ? ' · plavba' : (c.stops ? '' : ' · přímý let')) + '</span></div>' +
            '<div class="bpx-pt r"><span class="bpx-lab">To / Kam</span><span class="bpx-code">' + c.to + '</span><span class="bpx-city">' + esc(Z[0]) + '</span><span class="bpx-apn">' + esc(Z[1]) + '</span><span class="bpx-tm">' + arrT + arrSup + '</span></div>' +
            '</div>' +
            '<div class="bpx-grid">' +
            '<div><span class="bpx-lab">' + (boat ? 'Ship / Loď' : 'Flight / Let') + '</span><b class="hl">' + esc(c.no) + '</b></div>' +
            '<div><span class="bpx-lab">Date / Datum</span><b>' + date + '<small>' + wd + '</small></b></div>' +
            '<div><span class="bpx-lab">Boarding / Nástup</span><b class="hl">' + bt + '</b></div>' +
            '<div><span class="bpx-lab">' + (boat ? 'Pier / Molo' : 'Gate / Brána') + '</span><b>TBA</b></div>' +
            '<div><span class="bpx-lab">Seat / Sedadlo</span><b>TBA</b></div>' +
            '<div><span class="bpx-lab">Class / Třída</span><b>' + esc(c.cls) + '</b></div>' +
            '<div><span class="bpx-lab">Departs / Odlet</span><b>' + depT + '</b></div>' +
            '<div><span class="bpx-lab">Booking ref.</span><b>TBA</b></div>' +
            '</div></div>' +
            '<div class="bpx-code417">' + pdf417(seed) + '<div class="bpx-bcbp">' + esc(bcbp) + '</div></div>' +
            '<div class="bpx-foot"><b>' + (boat ? 'Nástup se uzavírá 15 minut před odplutím.' : 'Brána se zavírá 20 minut před odletem.') + '</b> ' + (boat ? 'Boarding closes 15 min before departure. Mějte u sebe pas a e-ticket.' : 'Gate closes 20 min before departure. Časy jsou místní.') + '</div>' +
            '</div>' +
            '<aside class="bpx-stub"><div class="bpx-st-top"><span>' + (boat ? 'Boat' : esc(B.n)) + '</span><b>' + esc(c.short || c.no) + '</b></div>' +
            '<div class="bpx-st-rt"><span>' + c.from + '</span>' + icon + '<span>' + c.to + '</span></div>' +
            '<div class="bpx-st-kv"><div><span class="bpx-lab">Date</span><b>' + pad(c.date.getUTCDate()) + ' ' + MON[c.date.getUTCMonth()] + '</b></div><div><span class="bpx-lab">Boarding</span><b>' + bt + '</b></div><div><span class="bpx-lab">' + (boat ? 'Pier' : 'Gate') + '</span><b>TBA</b></div><div><span class="bpx-lab">Seat</span><b>TBA</b></div></div>' +
            bars(seed) + '</aside></article></div>';
    }

    function conn(min, where) { return '<div class="bpx-conn"><span aria-hidden="true">⏳</span><span>' + (where || 'Přestup') + ' · ' + fmt(min) + '</span></div>'; }
    function head(t) { return '<h4 class="fl-h">' + t + '</h4>'; }
    function dur(s) { return String(s || '').replace(/(\d+)h/, '$1 h').replace(/(\d+)m/, '$1 min').trim(); }

    /* ---- rozbor dálkových letů z dat konfigurátoru ---- */
    function legs(str, base) {
        var out = [], prev = null;
        String(str || '').split(' + ').forEach(function (x) {
            var m = /^(.*?)\s*\((\d{2}):(\d{2})(?:\+(\d))?\s+(\w{3})\s+➔\s+(\d{2}):(\d{2})(?:\+(\d))?\s+(\w{3}),\s*([^)]+)\)/.exec(x.trim());
            if (!m) return;
            var f = /([A-Z0-9]{2})\s?(\d{1,4})\s*$/.exec(m[1]); if (!f) return;
            var dmn = (+m[2]) * 60 + (+m[3]), amn = (+m[6]) * 60 + (+m[7]);
            var dP = m[4] !== undefined ? +m[4] : (prev ? prev.aPlus + (dmn < prev.amn ? 1 : 0) : 0);
            var aP = m[8] !== undefined ? +m[8] : dP + (amn < dmn ? 1 : 0);
            var no = f[1] + f[2], brand = no === 'EK2239' ? 'FZ' : f[1];
            if (!BR[brand]) return;
            var L = { brand: brand, no: no, from: m[5], to: m[9], dep: hm(dmn), arr: hm(amn), dPlus: dP, aPlus: aP, dmn: dmn, amn: amn, date: addDays(base, dP), dur: dur(m[10]), durMin: 0, op: OPERATED[no] || '', cls: 'ECONOMY', stops: 0 };
            var dd = /(\d+)h\s*(?:(\d+)m)?/.exec(m[10]); L.durMin = dd ? (+dd[1]) * 60 + (+(dd[2] || 0)) : 0;
            out.push(L); prev = L;
        });
        return out;
    }
    function legsHTML(arr, base) {
        var h = '';
        arr.forEach(function (L, i) {
            h += ticket(L);
            var N = arr[i + 1];
            if (N) h += conn(Math.round(absMin(base, N.dPlus, N.dmn) - absMin(base, L.aPlus, L.amn)), 'Přestup v ' + (LOC[L.to] || (AP[L.to] ? AP[L.to][0] : L.to)) + ' (' + L.to + ')');
        });
        return h;
    }

    /* ---- pevné lety a lodě z itineráře ---- */
    function fixed(brand, no, from, to, dep, arr, durMin, y, mo, d, extra) {
        var o = { brand: brand, no: no, from: from, to: to, dep: dep, arr: arr, dPlus: 0, aPlus: 0, dur: fmt(durMin), durMin: durMin, date: new Date(Date.UTC(y, mo - 1, d)), op: '', cls: 'ECONOMY', stops: 0 };
        for (var k in extra) o[k] = extra[k];
        return o;
    }
    var TR288 = function () { return fixed('TR', 'TR288', 'SIN', 'DPS', '10:15', '13:05', 170, 2027, 8, 9); };
    var TR281 = function () { return fixed('TR', 'TR281', 'DPS', 'SIN', '11:15', '14:10', 175, 2027, 8, 24); };
    var TN_OUT = function () { return fixed('TN', 'TRANSNUSA', 'DPS', 'LOP', '12:40', '13:20', 40, 2027, 8, 15); };
    var TN_BACK = function () { return fixed('TN', 'TRANSNUSA', 'LOP', 'DPS', null, null, 40, 2027, 8, 23); };
    function viaPlane() { var l = document.getElementById('b3_label'); return !!(l && /TransNusa/i.test(l.textContent)); }
    var BOAT_OUT = function () { return fixed('SF', 'STARFISH', 'SNR', 'BNG', '13:00', '15:00', 120, 2027, 8, 15, { cls: 'STANDARD', short: 'STARFISH' }); };
    var BOAT_BACK = function () { return fixed('WH', 'WAHANA VIRENDRA', 'BNG', 'SNR', '13:30', '17:00', 210, 2027, 8, 23, { cls: 'STANDARD', short: 'WAHANA' }); };

    function curFlight() { try { return flightOptions[currentAirline]; } catch (e) { return null; } }
    function put(id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; }

    function render() {
        var f = curFlight();
        if (f) {
            var ob = parseDate(f.outDate), rb = parseDate(f.retDate);
            if (ob) {
                var outHTML = head(dayTitle(ob) + ': odlet z Prahy do Singapuru (' + esc(f.name || '') + ')') + legsHTML(legs(f.outFlights, ob), ob) +
                    '<p class="bpx-sub">Jméno na vstupence si každý změní klepnutím na něj. Brána, sedadlo a rezervační kód doplníš po odbavení.</p>';
                put('bpOutTrip', outHTML);
            }
            var fm = document.querySelector('#f-lety .lux-fold-meta'); if (fm) fm.textContent = '✈️ ' + (f.name || '') + ' · ' + Math.round(f.pricePerson || 0).toLocaleString('cs-CZ') + ' Kč';
            tripTexts(f, ob, rb, ob && rb ? legs(f.retFlights, rb) : []);
            if (ob && rb) {
                var t281 = TR281(), ret = legs(f.retFlights, rb);
                put('bpHome', head(dayTitle(t281.date) + ': odlet z Bali do Singapuru') + ticket(t281));
                put('bpRetTrip', (ret.length ? conn(Math.round(absMin(rb, ret[0].dPlus, ret[0].dmn) - absMin(t281.date, 0, toMin('14:10'))), 'Tranzit v Singapuru') +
                    head(dayTitle(rb) + ': dálkový let domů (' + esc(f.name || '') + ')') + legsHTML(ret, rb) +
                    '<p class="bpx-sub">Jméno na vstupence si každý změní klepnutím na něj. Brána, sedadlo a rezervační kód doplníš po odbavení.</p>' : ''));
            }
        }
        put('bpSinDps', head(dayTitle(TR288().date) + ': palubní vstupenka Singapur → Bali') + ticket(TR288()));
        var pl = viaPlane();
        put('bpBoatOut', head(dayTitle(BOAT_OUT().date) + (pl ? ': palubní vstupenka Bali → Lombok (let TransNusa)' : ': palubní vstupenka na loď Bali → Lombok')) + ticket(pl ? TN_OUT() : BOAT_OUT()));
        put('bpBoatBack', head(dayTitle(BOAT_BACK().date) + (pl ? ': palubní vstupenka Lombok → Bali (let TransNusa)' : ': palubní vstupenka na loď Lombok → Bali')) + ticket(pl ? TN_BACK() : BOAT_BACK()) + (pl ? '<p class="bpx-sub">Čas zpátečního letu TransNusa zatím v plánu není, proto je na vstupence TBA.</p>' : ''));
    }


    /* ---- texty nových etap v itineráři: Liberec ➔ Praha a Odlet z Prahy ---- */
    function setText(id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; }
    function dmy(d) { return d.getUTCDate() + '. ' + (d.getUTCMonth() + 1) + '. ' + d.getUTCFullYear(); }
    function dayY(d) { return dayTitle(d) + ' ' + d.getUTCFullYear(); }
    function tripTexts(f, ob, rb, ret) {
        var dep = toMin(f.outDep), air = dep - 180, lib = dep - 330, hub = f.hub || '', code = (/\((\w{3})\)/.exec(hub) || [])[1] || '';
        var lay = (f.outLayover || '').replace(/^.*?\s+v\s+/, '');
        setText('lbDep', hm(lib)); setText('lbAir', hm(air));
        setText('odletSub', (ob ? dmy(ob) : '') + ' · ' + esc(f.outDep) + ' · přestup ' + esc(LOC[code] ? 'v ' + LOC[code] : hub));
        setText('odletDesc', 'Na letišti v Praze jsme zhruba 3 h před odletem, tedy v <strong>' + hm(air) + '</strong>. Odlet je v <strong>' + esc(f.outDep) + '</strong> (' + esc(f.name || '') + '). Letíme spojem <strong>' + esc(f.outFlights || '') + '</strong>.');
        var am = /(\d{2}):(\d{2})/.exec(f.retArr || ''), arrP = am ? (+am[1]) * 60 + (+am[2]) : null;
        var rcode = (/\((\w{3})\)/.exec(f.retLayover || '') || [])[1] || '';
        setText('sinSub', esc(f.retDate || '') + ' · odlet ' + esc(f.retDep || '') + ' · přestup ' + (LOC[rcode] ? 'v ' + LOC[rcode] : ''));
        setText('sinDesc', 'Po tranzitu v Singapuru (přílet z Bali ve <strong>14:10</strong>) odlétáme z Changi v <strong>' + esc(f.retDep || '') + '</strong> (' + esc(f.name || '') + '). Na letišti musíme být s rezervou, brána se zavírá 20 min před odletem. Letíme spojem <strong>' + esc(f.retFlights || '') + '</strong>.');
        setText('sinLay', 'Přestup v ' + esc(LOC[rcode] || '') + (rcode ? ' (' + rcode + ')' : '') + ': <strong>' + esc((f.retLayover || '').split(' v ')[0].replace(/\.$/, '')) + '</strong>. Přistání v Praze <strong>' + esc(f.retArr || '') + '</strong>, celková doba cesty ' + esc((f.retDuration || '').replace(/\.$/, '')) + '.');
        var last = ret && ret.length ? ret[ret.length - 1] : null, home = last && rb ? addDays(rb, last.aPlus) : null;
        var hubCity = (AP[code] ? AP[code][0] : 'přestup');
        if (ob) { setText('lbDate', '🚌 ' + dayY(ob) + ' • Liberec ➔ Praha'); setText('lbSub', dmy(ob) + ' · na letiště Václava Havla'); setText('odDate', '✈️ ' + dayY(ob) + ' • Praha ➔ ' + esc(hubCity) + ' ➔ Singapur'); }
        if (rb) setText('sinDate', '✈️ ' + dayY(rb) + ' • Singapur ➔ ' + esc(AP[rcode] ? AP[rcode][0] : 'přestup') + ' ➔ Praha');
        if (home) { setText('domDate', '🚌 ' + dayY(home) + ' • Praha ➔ Liberec'); setText('domSub', dmy(home) + ' · z letiště Václava Havla'); }
        setText('domArr', arrP == null ? '--:--' : hm(arrP));
        setText('domHome', arrP == null ? '--:--' : hm(arrP + 150));
        setText('odletLay', 'Přestup v ' + esc(LOC[code] || hub) + (code ? ' (' + code + ')' : '') + ': <strong>' + esc((f.outLayover || '').split(' v ')[0].replace(/\.$/, '')) + '</strong>. Přílet do Singapuru <strong>' + esc(f.outArr || '') + '</strong>, celková doba cesty ' + esc((f.outDuration || '').replace(/\.$/, '')) + '.');
    }

    function editName() {
        var v = window.prompt('Jméno na palubní vstupence ve tvaru PŘÍJMENÍ/JMÉNO (bez diakritiky se doplní samo):', getName());
        if (v === null) return;
        v = cleanName(v); if (!v) return;
        try { localStorage.setItem('bpx_name', v); } catch (e) {}
        render();
    }
    document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('[data-bpx-name], .bpx-edit'); if (t) editName(); });
    document.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-bpx-name]')) { e.preventDefault(); editName(); } });

    if (typeof window.setFlightAirline === 'function' && !window.setFlightAirline.__bpx) {
        var orig = window.setFlightAirline;
        window.setFlightAirline = function () { var r = orig.apply(this, arguments); try { render(); } catch (e) {} try { if (window.renderRouteMap) window.renderRouteMap(); } catch (e) {} return r; };
        window.setFlightAirline.__bpx = true;
    }
    var lbl = document.getElementById('b3_label');
    if (lbl && window.MutationObserver) new MutationObserver(function () { try { render(); } catch (e) {} }).observe(lbl, { childList: true, characterData: true, subtree: true });
    window.BPX = { render: render };
    try { render(); } catch (e) { console.error('BPX', e); }
    try { if (window.renderRouteMap) window.renderRouteMap(); } catch (e) {}
})();


/* Interactive ticket tear-off: shared by all dynamically generated air and boat tickets.
   This is a visual itinerary effect, not verification of a real booking. */
(function () {
    'use strict';
    var KEY = 'bpx_teared_ticket_v1:';
    var pending = false;

    function ticketKey(card) {
        return KEY + (card.getAttribute('aria-label') || '') + '|' +
            ((card.querySelector('.bpx-pax .bpx-name') || {}).textContent || '');
    }
    function isBoat(card) {
        var label = card.querySelector('.bpx-st-top span');
        return !!label && label.textContent.trim().toLowerCase() === 'boat';
    }
    function valid(card) {
        var stub = card.querySelector(':scope > .bpx-stub');
        card.classList.remove('is-tearing');
        card.classList.add('is-validated');
        card.setAttribute('data-ticket-effect', 'complete');
        var main = card.querySelector(':scope > .bpx-main');
        if (main) main.setAttribute('data-ticket-stamp', isBoat(card) ? 'PLATNÝ LODNÍ LÍSTEK' : 'PLATNÁ LETENKA');
        if (stub) {
            stub.setAttribute('aria-hidden', 'true');
            stub.setAttribute('tabindex', '-1');
        }
    }
    function scan() {
        document.querySelectorAll('.bpx-wrap .bpx').forEach(function (card) {
            var stub = card.querySelector(':scope > .bpx-stub');
            if (!stub) return;
            if (card.classList.contains('is-validated') || card.classList.contains('is-tearing')) return;
            stub.setAttribute('role', 'button');
            stub.setAttribute('tabindex', '0');
            stub.setAttribute('title', 'Kliknutím animovat odtržení ústřižku');
            stub.setAttribute('aria-label', 'Odtrhnout ústřižek – ' +
                (isBoat(card) ? 'PLATNÝ LODNÍ LÍSTEK' : 'PLATNÁ LETENKA'));
            try { if (sessionStorage.getItem(ticketKey(card)) === '1') valid(card); } catch (e) {}
        });
    }
    function tear(stub) {
        var card = stub && stub.closest('.bpx');
        if (!card || card.classList.contains('is-tearing') || card.classList.contains('is-validated')) return;
        var key = ticketKey(card);
        card.classList.add('is-tearing');
        stub.setAttribute('aria-disabled', 'true');
        try { sessionStorage.setItem(key, '1'); } catch (e) {}
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            valid(card);
        } else {
            setTimeout(function () { if (card.isConnected) valid(card); }, 820);
        }
    }
    document.addEventListener('click', function (e) {
        var stub = e.target.closest && e.target.closest('.bpx-wrap .bpx-stub');
        if (!stub) return;
        e.preventDefault();
        e.stopPropagation();
        tear(stub);
    });
    document.addEventListener('keydown', function (e) {
        var stub = e.target.closest && e.target.closest('.bpx-wrap .bpx-stub');
        if (!stub || (e.key !== 'Enter' && e.key !== ' ')) return;
        e.preventDefault();
        tear(stub);
    });
    if (window.MutationObserver) {
        new MutationObserver(function (records) {
            if (pending || !records.some(function (record) {
                return Array.prototype.some.call(record.addedNodes, function (node) {
                    return node.nodeType === 1 && ((node.matches && node.matches('.bpx,.bpx-wrap,.bpx-host')) ||
                        (node.querySelector && node.querySelector('.bpx')));
                });
            })) return;
            pending = true;
            requestAnimationFrame(function () { pending = false; scan(); });
        }).observe(document.body, { childList: true, subtree: true });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan, { once: true });
    else scan();
})();
