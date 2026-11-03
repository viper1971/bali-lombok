
/* ===== TRIP: společný stav pro Jídlo a Vstupné a aktivity ===== */
(function () {
    'use strict';
    var KEY = 'trip_extras_v2';
    var NB = '\u00a0';
    var NF = function (v, d) { return new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: d == null ? 0 : d, minimumFractionDigits: 0 }).format(v); };
    var kcTxt = function (v) { return NF(v) + NB + 'Kč'; };

    /* ---------- JÍDLO ----------
       Sazby jsou na 1 osobu a den, v místní měně, BEZ snídaní (snídaně jsou v ceně hotelů).
       Ceny vychází z běžných cen 2026: hawker S$4-6, kopi S$1,5-2, pivo v SG restauraci S$12-15,
       warung nasi campur Rp 30-45 tis., Bintang v restauraci Rp 45-60 tis., večeře v turistické
       restauraci Rp 120-200 tis., mořské plody a beach kluby Rp 300-500 tis. */
    var SG_DAYS = 2.75;   /* 2 dny 7.-9. 8. + tranzit 24. 8. (cca 9 h ve městě = 0,75 dne) */
    var BA_DAYS = 16;     /* Bali + Lombok 9.-24. 8. */
    var FOOD = {
        skromne: {
            name: 'Skromné', ico: '💰', key: 'skromne',
            desc: 'Hawkery, kopitiamy a warungy, voda z obchodu. Žádné drahé podniky.',
            sg: [{ t: 'Oběd', v: 5.5, d: 'Hawker: kuřecí rýže, laksa, mee pok (S$4–6)' }, { t: 'Večeře', v: 6.5, d: 'Hawker nebo food court (S$5–8)' }, { t: 'Pití a svačiny', v: 4, d: 'Kopi/teh S$1,5–2, voda, ovoce' }],
            ba: [{ t: 'Oběd', v: 35000, d: 'Warung: nasi campur, mie goreng (Rp 25–40 tis.)' }, { t: 'Večeře', v: 45000, d: 'Warung nebo noční trh (Rp 35–55 tis.)' }, { t: 'Pití', v: 30000, d: 'Voda, ledová káva, jedno pivo ze stánku' }, { t: 'Svačiny', v: 15000, d: 'Ovoce, pisang goreng, jízdní drobnosti' }]
        },
        pohodove: {
            name: 'Pohodové', ico: '😌', key: 'pohodove',
            desc: 'Mix lokálních podniků a příjemných restaurací, kávy, pivo k večeři a občas dezert.',
            sg: [{ t: 'Oběd', v: 9, d: 'Food court nebo kopitiam s dezertem (S$8–10)' }, { t: 'Večeře', v: 22, d: 'Běžná restaurace: hlavní chod S$15–22 + sdílený předkrm' }, { t: 'Pití a svačiny', v: 14, d: 'Káva S$5–6, pivo v restauraci S$12–15, svačina' }],
            ba: [{ t: 'Oběd', v: 75000, d: 'Turistický warung nebo kavárna (Rp 60–90 tis.)' }, { t: 'Večeře', v: 140000, d: 'Restaurace s hlavním chodem a nápojem (Rp 110–180 tis.)' }, { t: 'Pití', v: 90000, d: 'Kávy, smoothie, 1–2 Bintang (Rp 45–60 tis. za pivo)' }, { t: 'Svačiny', v: 35000, d: 'Dezert, zmrzlina, ovoce' }]
        },
        luxusni: {
            name: 'Luxusní', ico: '🥂', key: 'luxusni',
            desc: 'Dobré restaurace, mořské plody v Jimbaranu, beach kluby, koktejly a rooftop bary.',
            sg: [{ t: 'Oběd', v: 25, d: 'Restaurace nebo dim sum (S$20–30)' }, { t: 'Večeře', v: 70, d: 'Dobrá restaurace, 2 chody a drink (S$55–90)' }, { t: 'Pití a svačiny', v: 40, d: 'Koktejl S$22–30, rooftop bar, specialty káva' }],
            ba: [{ t: 'Oběd', v: 150000, d: 'Kavárna u pláže nebo restaurace (Rp 120–180 tis.)' }, { t: 'Večeře', v: 420000, d: 'Mořské plody, beach klub, steak (Rp 300–500 tis.)' }, { t: 'Pití', v: 280000, d: 'Koktejly, víno, beach klub (Rp 90–150 tis. za drink)' }, { t: 'Svačiny', v: 100000, d: 'Dezerty, smoothie bowl, specialty káva' }]
        }
    };
    var FOOD_ORDER = ['skromne', 'pohodove', 'luxusni'];
    function sumV(arr) { return arr.reduce(function (a, x) { return a + x.v; }, 0); }

    /* ---------- KURZY (stejný zdroj jako Plán hotovosti: panel Přepočet měn) ---------- */
    var FALL = { SGD: 24.347 / 1.4285, USD: 24.347 / 1.115, IDR: 24.347 / 20225 };
    function rates() {
        var x = window.luxFx;
        if (x && x.mid && x.mid.SGD && x.mid.IDR && x.mid.USD) return { SGD: x.mid.SGD, USD: x.mid.USD, IDR: x.mid.IDR };
        return FALL;
    }

    /* ---------- VSTUPNÉ A AKTIVITY ----------
       amt = částka na osobu v měně cur; kc = pevná částka v Kč; fn(ctx) = dynamická částka.
       def = předzaškrtnuto, card = platí se kartou (započítá se do ceny, ne do hotovosti),
       est = jen odhad, tip = nový tip z okolí, bali = podíl výdaje na Bali (zbytek je Lombok). */
    var GROUPS = [
        { id: 'sg', t: '🇸🇬 Singapur', s: '7.–9. 8. a tranzit 24. 8.' },
        { id: 'ulu', t: '🌊 Uluwatu a poloostrov Bukit', s: '9.–12. 8.' },
        { id: 'ubud', t: '🌾 Ubud a okolí', s: '12.–15. 8.' },
        { id: 'lom', t: '🏝️ Lombok a Gili', s: '15.–23. 8.' },
        { id: 'misc', t: '🧾 Přesuny, drobné výdaje a ubytování na místě', s: 'celá cesta' }
    ];
    var ACTS = [
        /* Singapur */
        { id: 'sgMhd', g: 'sg', ico: '🚇', t: 'Jízdné v Singapuru (MRT, autobus)', s: 'Jízdné SG', n: 'Povinná položka. Odhad 500 Kč na osobu na všechny dny. Platí se kartou (viz sekce Karta do MHD), do hotovosti se nepočítá.', kc: 500, cur: 'SGD', card: 1, def: 0, must: 1, est: 1 },
        { id: 'sgStore', g: 'sg', ico: '🎒', t: 'Úschovna batohů na Changi', s: 'Úschovna Changi', n: '10,90 S$ za batoh na 24 h. Obvykle kartou u automatu nebo předem online. Hodí se při tranzitu 24. 8.', amt: 10.9, cur: 'SGD', card: 1, def: 0 },
        { id: 'sgGardens', g: 'sg', ico: '🌳', t: 'Gardens by the Bay: Flower Dome + Cloud Forest', s: 'Gardens by the Bay', n: 'Kombinovaná vstupenka stojí podle prodejců cca S$ 42–46. Supertree Grove a večerní show jsou zdarma. Kupuje se online kartou.', amt: 44, cur: 'SGD', card: 1, def: 0 },
        { id: 'sgSkyway', g: 'sg', ico: '🌉', t: 'OCBC Skyway mezi Supertrees', s: 'Skyway', n: 'Vyhlídková lávka ve výšce, cca S$ 14 navíc. Hodí se k západu slunce.', amt: 14, cur: 'SGD', card: 1, def: 0, tip: 1 },
        { id: 'sgJewel', g: 'sg', ico: '💎', t: 'Jewel Changi: Canopy Park', s: 'Jewel Canopy Park', n: 'Rain Vortex je zdarma. Za Canopy Park (lávky, zahrady) se platí vstup, cca S$ 8, pro tranzit 24. 8.', amt: 8, cur: 'SGD', card: 1, def: 0, tip: 1, est: 1 },
        { id: 'sgOrchid', g: 'sg', ico: '🌺', t: 'National Orchid Garden (Botanic Gardens)', s: 'Orchid Garden', n: 'Botanická zahrada je zdarma, za orchidejovou část se platí cca S$ 15.', amt: 15, cur: 'SGD', card: 1, def: 0, tip: 1, est: 1 },
        /* Uluwatu */
        { id: 'uluTemple', g: 'ulu', ico: '⛩️', t: 'Chrám Uluwatu (vstup)', s: 'Chrám Uluwatu', n: 'Rp 60 000 pro cizince. Sarong půjčí u vchodu. Hlídej opičky, berou brýle a telefony.', amt: 60000, cur: 'IDR', bali: 1, def: 0 },
        { id: 'uluKecak', g: 'ulu', ico: '🔥', t: 'Tanec Kecak při západu slunce', s: 'Kecak', n: 'Rp 150 000, platí se zvlášť k vstupu do chrámu. Představení na pokladně bývají vyprodaná, přijď včas.', amt: 150000, cur: 'IDR', bali: 1, def: 0 },
        { id: 'uluPadang', g: 'ulu', ico: '🏖️', t: 'Pláže Padang Padang a jeskyně Suluban', s: 'Padang Padang', n: 'Vstup na pláže bývá Rp 10–20 tis. a parkování zvlášť. Bingin a Balangan jsou zdarma.', amt: 20000, cur: 'IDR', bali: 1, def: 0, est: 1 },
        { id: 'uluGwk', g: 'ulu', ico: '🗿', t: 'GWK Cultural Park (obří socha Garuda Wisnu)', s: 'GWK', n: 'Park z itineráře. Vstupné cca Rp 150 000, ověř aktuální ceník na webu parku.', amt: 150000, cur: 'IDR', bali: 1, def: 0, est: 1 },
        /* Ubud */
        { id: 'ubTegal', g: 'ubud', ico: '🌾', t: 'Rýžové terasy Tegalalang', s: 'Tegalalang', n: 'Vstup Rp 25–50 tis. podle vchodu. Za houpačky a fotopointy se platí zvlášť.', amt: 50000, cur: 'IDR', bali: 1, def: 0 },
        { id: 'ubKanto', g: 'ubud', ico: '🌊', t: 'Vodopád Kanto Lampo', s: 'Kanto Lampo', n: 'Vstup cca Rp 20 000 a parkování.', amt: 20000, cur: 'IDR', bali: 1, def: 0, est: 1 },
        { id: 'ubTibu', g: 'ubud', ico: '💦', t: 'Vodopád Tibumana', s: 'Tibumana', n: 'Vstup Rp 25 000.', amt: 25000, cur: 'IDR', bali: 1, def: 0 },
        { id: 'ubTirta', g: 'ubud', ico: '🛁', t: 'Posvátné prameny Tirta Empul', s: 'Tirta Empul', n: 'Vstup Rp 75 000 pro cizince. Sarong je součástí vstupu. Rituální koupel Melukat je zdarma, jen se dává příspěvek.', amt: 75000, cur: 'IDR', bali: 1, def: 0 },
        { id: 'ubMonkey', g: 'ubud', ico: '🐒', t: 'Monkey Forest Ubud', s: 'Monkey Forest', n: 'Od 4. 2026 Rp 130 000. Platí se jen kartou nebo e-money, hotovost už nevezmou.', amt: 130000, cur: 'IDR', card: 1, bali: 1, def: 0 },
        { id: 'ubTegen', g: 'ubud', ico: '💧', t: 'Vodopád Tegenungan', s: 'Tegenungan', n: 'Nejdostupnější vodopád u Ubudu, vstup Rp 30 000. Bývá plný lidí, jdi brzy ráno.', amt: 30000, cur: 'IDR', bali: 1, def: 0, tip: 1 },
        { id: 'ubSwing', g: 'ubud', ico: '🎢', t: 'Houpačka nad terasami (Tegalalang swing)', s: 'Houpačka', n: 'Fotozážitek za cca Rp 350 000. Ceny se liší podle místa, ověř na místě.', amt: 350000, cur: 'IDR', bali: 1, def: 0, tip: 1, est: 1 },
        { id: 'ubBatur', g: 'ubud', ico: '🌋', t: 'Východ slunce na sopce Batur (trek s průvodcem)', s: 'Batur', n: 'Průvodce je povinný, cena cca Rp 600 000. Budíček kolem 2:00 ráno, počítej s přesunem z Ubudu.', amt: 600000, cur: 'IDR', bali: 1, def: 0, tip: 1, est: 1 },
        /* Lombok */
        { id: 'loTiu', g: 'lom', ico: '🌊', t: 'Vodopády Sendang Gile a Tiu Kelep', s: 'Sendang Gile a Tiu Kelep', n: 'Vstup do areálu (Rp 20 tis.) a podíl na povinném místním průvodci. Celkem cca Rp 50 000 na osobu.', amt: 50000, cur: 'IDR', bali: 0, def: 0, est: 1 },
        { id: 'loSade', g: 'lom', ico: '🛖', t: 'Tradiční vesnice Sade (Sasak)', s: 'Vesnice Sade', n: 'Vstup se platí formou příspěvku, cca Rp 10–20 tis., průvodce dostane spropitné.', amt: 20000, cur: 'IDR', bali: 0, def: 0, est: 1 },
        { id: 'loBeach', g: 'lom', ico: '🏖️', t: 'Pláže na jihu (Tanjung Aan, Selong Belanak, Mawun, Are Guling)', s: 'Pláže na Lomboku', n: 'Většina pláží je zdarma, platí se parkování nebo lehátka. Odhad Rp 40 000 na osobu za celý pobyt.', amt: 40000, cur: 'IDR', bali: 0, def: 0, est: 1 },
        { id: 'loGili', g: 'lom', ico: '🚤', t: 'Soukromá loď se skleněným dnem na Gili', s: 'Loď na Gili', fn: function (c) { return 1000000 / c.people; }, n: 'Cca Rp 1 000 000 za celou loď, vydělené počtem lidí ve skupině. Je to nápad z itineráře.', cur: 'IDR', bali: 0, def: 0, est: 1, gili: 1 },
        { id: 'loSnork', g: 'lom', ico: '🤿', t: 'Šnorchlování u 3 Gili, sdílená loď (levnější varianta)', s: 'Šnorchlování Gili', n: 'Želvy a korály za cca Rp 220 000. Alternativa k soukromé lodi, nezaškrtávej obojí.', amt: 220000, cur: 'IDR', bali: 0, def: 0, tip: 1, est: 1 },
        { id: 'loSurf', g: 'lom', ico: '🏄', t: 'Surfařská lekce (Selong Belanak nebo Are Guling)', s: 'Surf lekce', n: 'Hodina s instruktorem a prkno cca Rp 300 000. Selong Belanak je na začátečníky ideální.', amt: 300000, cur: 'IDR', bali: 0, def: 0, tip: 1, est: 1 },
        /* Přesuny, drobné, hotel */
        { id: 'taxi', g: 'misc', ico: '🚖', t: 'Taxi a transfery', s: 'Taxi a transfery', n: 'Odhad 500 Kč na osobu. Sanur → hotel u letiště, ráno na letiště, večery po pití.', kc: 500, cur: 'IDR', bali: 0.1, def: 0, est: 1 },
        { id: 'miscSmall', g: 'misc', ico: '💰', t: 'Drobné: parkování, toalety, sarongy, dýška', s: 'Drobné výdaje', n: 'Rp 15 000 denně × 15 dní jízdy. Parkovací obsluha chce 2–5 tisíc za zastavení.', amt: 225000, cur: 'IDR', bali: 7 / 15, def: 0, est: 1 },
        { id: 'hotel', g: 'misc', ico: '🏨', t: 'Poslední hotel na místě (23.–24. 8.)', s: 'Poslední hotel', hotel: 1, cur: 'USD', bali: 0, def: 0, n: '' }
    ];

    /* ---------- STAV ---------- */
    var st = { level: 'pohodove', c: {} };
    try {
        var sv = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (sv && typeof sv === 'object') { if (FOOD[sv.level]) st.level = sv.level; if (sv.c && typeof sv.c === 'object') st.c = sv.c; }
    } catch (e) {}
    function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
    function isOn(a) { if (a.hotel || a.must) return true; /* poslední hotel na místě je povinný, ne volitelný */ return Object.prototype.hasOwnProperty.call(st.c, a.id) ? !!st.c[a.id] : !!a.def; }

    var T = { people: 8, solo: false };
    var subs = [];
    function emit(skipActivityRerender) { save(); subs.forEach(function (f) { if (skipActivityRerender && (f === renderFood || f === renderActs)) return; try { f(); } catch (e) { if (window.console) console.warn(e); } }); try { window.dispatchEvent(new Event('trip:change')); } catch (e) {} }

    function lastHotel() {
        try { var v = selectedHotels.kutaLast, h = hotelCatalog.kutaLast.options[v]; if (h && h.price > 0) return { v: v, name: h.name, price: h.price }; } catch (e) {}
        return null;
    }
    function mkctx(o) {
        o = o || {};
        return { people: o.people || T.people, solo: o.solo != null ? o.solo : T.solo, m: rates(), lh: lastHotel() };
    }
    function hotelNa(c) { return !!(c.lh && c.lh.v !== 'C'); }
    function amtOf(a, c) {
        if (a.hotel) {
            var room = c.lh ? c.lh.price : 30 * c.m.USD * 2;
            return (c.solo ? room : room / 2) / c.m.USD;
        }
        if (a.fn) return a.fn(c);
        if (a.kc != null) return a.kc / c.m[a.cur];
        return a.amt;
    }

    /* součty zaškrtnutých položek (na 1 osobu) */
    function sums(o) {
        var c = mkctx(o), r = { kc: 0, cashKc: 0, cardKc: 0, count: 0, items: [], cash: { SGD: 0, USD: 0, IDR: 0 }, bali: 0, hotelUsd: 0, ctx: c };
        var idrW = 0;
        ACTS.forEach(function (a) {
            if (!isOn(a) || (a.hotel && hotelNa(c))) return;
            var amt = amtOf(a, c), kc = amt * c.m[a.cur];
            r.kc += kc; r.count++;
            r.items.push({ a: a, amt: amt, kc: kc, card: !!a.card });
            if (a.card) r.cardKc += kc;
            else {
                r.cashKc += kc; r.cash[a.cur] += amt;
                if (a.cur === 'IDR') idrW += amt * (a.bali || 0);
                if (a.hotel) r.hotelUsd += amt;
            }
        });
        r.bali = r.cash.IDR > 0 ? idrW / r.cash.IDR : 0;
        return r;
    }
    function food(level) {
        var L = FOOD[level || st.level], m = rates();
        var sgd = sumV(L.sg), idr = sumV(L.ba);
        var sgKc = sgd * SG_DAYS * m.SGD, baKc = idr * BA_DAYS * m.IDR;
        return { level: L.key, name: L.name, sgd: sgd, idr: idr, sgKc: sgKc, baKc: baKc, kc: sgKc + baKc, sgDayKc: sgd * m.SGD, baDayKc: idr * m.IDR, L: L, m: m };
    }

    /* ---------- vykreslení: JÍDLO ---------- */
    function $(id) { return document.getElementById(id); }
    function renderFood() {
        var f = food(), host = $('tjLevels'); if (!host) return;
        host.innerHTML = FOOD_ORDER.map(function (k) {
            var x = food(k), on = k === st.level;
            return '<button type="button" class="tj-lvl' + (on ? ' is-on' : '') + '" data-lvl="' + k + '" aria-pressed="' + on + '">' +
                '<span class="tj-lvl-ico" aria-hidden="true">' + x.L.ico + '</span><b>' + x.L.name + '</b><small>' + x.L.desc + '</small>' +
                '<span class="tj-lvl-d">Singapur: S$' + NF(x.sgd, 1) + ' ≈ ' + kcTxt(x.sgDayKc) + ' na den<br>Bali a Lombok: Rp' + NB + NF(x.idr) + ' ≈ ' + kcTxt(x.baDayKc) + ' na den</span>' +
                '<span class="tj-lvl-t">≈ ' + kcTxt(x.kc) + '<em>na osobu za celou cestu</em></span></button>';
        }).join('');
        var t = $('tjCalcTitle'); if (t) t.textContent = 'Výpočet pro úroveň „' + f.name + '“';
        var rows = '';
        function block(title, arr, cur, days, daysTxt, mrate) {
            var h = '<div class="tj-grp"><div class="tj-grp-h"><b>' + title + '</b><span>' + daysTxt + '</span></div>';
            arr.forEach(function (x) {
                var loc = cur === 'SGD' ? 'S$' + NB + NF(x.v, 1) : 'Rp' + NB + NF(x.v);
                h += '<div class="tj-line"><div><b>' + x.t + '</b><small>' + x.d + '</small></div><div class="tj-line-a"><b>' + loc + '</b><small>≈ ' + kcTxt(x.v * mrate) + '</small></div></div>';
            });
            var dayV = sumV(arr);
            h += '<div class="tj-line tj-subtot"><div><b>Součet na den</b></div><div class="tj-line-a"><b>' + (cur === 'SGD' ? 'S$' + NB + NF(dayV, 1) : 'Rp' + NB + NF(dayV)) + '</b><small>≈ ' + kcTxt(dayV * mrate) + '</small></div></div>';
            h += '<div class="tj-line tj-tot"><div><b>× ' + NF(days, 2) + ' dne</b></div><div class="tj-line-a"><b>' + kcTxt(dayV * days * mrate) + '</b></div></div></div>';
            return h;
        }
        rows += block('🇸🇬 Singapur', f.L.sg, 'SGD', SG_DAYS, '2 dny + tranzit 0,75 dne', f.m.SGD);
        rows += block('🇮🇩 Bali a Lombok', f.L.ba, 'IDR', BA_DAYS, '16 dní', f.m.IDR);
        rows += '<div class="tj-grand"><span>Jídlo celkem na osobu (' + f.name + ')</span><b>' + kcTxt(f.kc) + '</b><small>Pár (2 osoby): ' + kcTxt(f.kc * 2) + ' · solo: ' + kcTxt(f.kc) + ' (jídlo je vždy na osobu)</small></div>';
        $('tjFoodTbl').innerHTML = rows;
        $('tjMethod').innerHTML =
            '<b>Způsob výpočtu</b><ol>' +
            '<li><b>Denní sazba</b> = součet typických jídel za den: oběd, večeře, pití a svačiny. <b>Snídaně nejsou v ceně jídla</b>, protože hotely jsou se snídaní a ta je už v ceně ubytování.</li>' +
            '<li><b>Ceny jídel</b> vycházejí z běžných cen v roce 2026: v Singapuru hawker S$4–6, kopi S$1,5–2, pivo v restauraci S$12–15, v Indonésii warung Rp 25–45 tis., Bintang v restauraci Rp 45–60 tis., večeře v turistické restauraci Rp 120–200 tis., mořské plody a beach kluby Rp 300–500 tis.</li>' +
            '<li><b>Počet dní:</b> Singapur 2 dny (7.–9. 8.) + tranzit 24. 8. (cca 9 hodin ve městě = 0,75 dne), tedy 2,75 dne. Bali a Lombok 16 dní.</li>' +
            '<li><b>Celkem</b> = S$ za den × 2,75 × kurz S$ + Rp za den × 16 × kurz Rp. Kurzy se berou z panelu Přepočet měn v Plánu hotovosti (střed), jinak ze záložního kurzu. Při změně kurzu se částky v Kč přepočtou.</li>' +
            '<li>Částky jsou <b>na 1 osobu</b>. Pár platí dvojnásobek. Jídlo se <b>započítává do celkové ceny dovolené</b>. Podíl jídla placený hotově nastavíš v Plánu hotovosti (výchozí 100 %).</li></ol>';
        var mt = $('tjMetaFood'); if (mt) mt.textContent = f.name + ' · ' + kcTxt(f.kc);
        // PREMIUM v20: read-only presentation of original food() values.
        if ($('p20FoodTotal')) $('p20FoodTotal').textContent = kcTxt(f.kc);
        if ($('p20FoodPlan')) $('p20FoodPlan').textContent = 'Zvoleno: ' + f.name;
        if ($('p20FoodSg')) $('p20FoodSg').textContent = kcTxt(f.sgDayKc);
        if ($('p20FoodBa')) $('p20FoodBa').textContent = kcTxt(f.baDayKc);
    }

    /* ---------- vykreslení: AKTIVITY ---------- */
    function amtText(a, amt) {
        return a.cur === 'SGD' ? 'S$' + NB + NF(amt, amt < 20 && amt % 1 ? 1 : 0) : a.cur === 'USD' ? '$' + NB + NF(amt, amt < 100 && amt % 1 ? 1 : 0) : 'Rp' + NB + NF(amt);
    }
    function renderActs() {
        var host = $('tjActs'); if (!host) return;
        var ae = document.activeElement, focusId = ae && ae.getAttribute && ae.closest && ae.closest('#tjActs') ? ae.getAttribute('data-id') : null;
        var c = mkctx(), S = sums(), html = '';
        GROUPS.forEach(function (g) {
            var items = ACTS.filter(function (a) { return a.g === g.id; });
            var gs = 0;
            items.forEach(function (a) { var na = a.hotel && hotelNa(c); if (isOn(a) && !na) gs += amtOf(a, c) * c.m[a.cur]; });
            var groupCount = items.filter(function(a){ return isOn(a) && !(a.hotel && hotelNa(c)); }).length;
            html += '<div class="tj-card tj-act-grp" data-p20-id="' + g.id + '"><div class="tj-grp-h"><b>' + g.t + '</b><span>' + groupCount + ' vybráno · ' + kcTxt(gs) + '</span><small>' + g.s + '</small></div>';
            items.forEach(function (a) {
                var na = a.hotel && hotelNa(c), on = isOn(a) && !na, amt = amtOf(a, c), kc = amt * c.m[a.cur];
                var note = a.n;
                if (a.hotel) {
                    var lh = c.lh;
                    note = lh ? (lh.v === 'C' ? lh.name + ' (varianta C) se platí na místě hotově (povinná platba): ' + kcTxt(lh.price) + ' za pokoj a noc, ' + (c.solo ? 'solo platí celý pokoj.' : 'dělí se mezi 2 lidi.') : 'Povinná platba, ne volitelná. Vybraný hotel (varianta ' + lh.v + ') se platí kartou předem, takže na místě se hotově neplatí nic. Hotovost se přidá automaticky, jen když vybereš hotel C.') : 'Výběr hotelu pro poslední noc ještě není načtený, počítá se odhad 30 USD na osobu.';
                }
                var tags = (a.card ? '<span class="tj-tag tj-tag-card">kartou</span>' : '<span class="tj-tag tj-tag-cash">hotově</span>') + ((a.hotel || a.must) ? '<span class="tj-tag tj-tag-cash">povinné</span>' : '') + (a.tip ? '<span class="tj-tag tj-tag-tip">💡 tip z okolí</span>' : '') + (a.est ? '<span class="tj-tag tj-tag-est">odhad</span>' : '');
                html += '<label class="tj-row' + (on ? '' : ' is-off') + (na ? ' is-na' : '') + '">' +
                    '<input type="checkbox" data-id="' + a.id + '"' + (on ? ' checked' : '') + ((na || a.hotel || a.must) ? ' disabled' : '') + ' aria-label="' + a.t.replace(/"/g, '') + '">' +
                    '<span class="tj-ico" aria-hidden="true">' + a.ico + '</span>' +
                    '<span class="tj-main"><b>' + a.t + ' ' + tags + '</b><small>' + note + '</small></span>' +
                    '<span class="tj-amt"><b>' + amtText(a, amt) + '</b><small>≈ ' + kcTxt(kc) + '</small></span></label>';
            });
            html += '</div>';
        });
        host.innerHTML = html;
        if (focusId) { var el = host.querySelector('input[data-id="' + focusId + '"]'); if (el) { try { el.focus({ preventScroll: true }); } catch (e) { /* focus is optional; never scroll to an item */ } } }
        $('tjActSum').innerHTML =
            '<div><span>Vybráno</span><b>' + S.count + (S.count === 1 ? ' položka' : (S.count >= 2 && S.count <= 4 ? ' položky' : ' položek')) + '</b></div>' +
            '<div class="tj-sum-main"><span>Vstupné a aktivity celkem na osobu</span><b>' + kcTxt(S.kc) + '</b></div>' +
            '<div><span>z toho hotově (jde do Plánu hotovosti)</span><b>' + kcTxt(S.cashKc) + '</b></div>' +
            '<div><span>z toho kartou</span><b>' + kcTxt(S.cardKc) + '</b></div>' +
            '<div class="tj-sum-note">Pár (2 osoby): ' + kcTxt(S.kc * 2) + ' · počet lidí ve skupině pro dělené položky: ' + c.people + '</div>';
        var mt = $('tjMetaAct'); if (mt) mt.textContent = S.count + ' pol. · ' + kcTxt(S.kc);
        applyActivityFilters();
    }

    /* v42: při změně jediného zaškrtávátka NENAHRAZUJEME DOM seznamu.
       Aktualizují se jen součty, skupiny a související finanční výpočty. */
    function updateActivityNumbersInPlace() {
        var c=mkctx(), S=sums();
        GROUPS.forEach(function(g) {
            var group=document.querySelector('#tjActs .tj-act-grp[data-p20-id="'+g.id+'"]');
            if (!group) return;
            var items=ACTS.filter(function(a){return a.g===g.id;});
            var value=0,count=0;
            items.forEach(function(a){
                var active=isOn(a) && !(a.hotel && hotelNa(c));
                if(active){count++;value+=amtOf(a,c)*c.m[a.cur];}
                var cb=group.querySelector('input[data-id="'+a.id+'"]');
                if(cb){
                    cb.checked=active;
                    cb.closest('.tj-row').classList.toggle('is-off',!active);
                }
            });
            var summary=group.querySelector('.tj-grp-h > span');
            if(summary)summary.textContent=count+' vybráno · '+kcTxt(value);
        });
        var sum=$('tjActSum');
        if(sum)sum.innerHTML =
            '<div><span>Vybráno</span><b>'+S.count+(S.count===1?' položka':S.count<5?' položky':' položek')+'</b></div>'+
            '<div class="tj-sum-main"><span>Vstupné a aktivity celkem na osobu</span><b>'+kcTxt(S.kc)+'</b></div>'+
            '<div><span>z toho hotově (jde do Plánu hotovosti)</span><b>'+kcTxt(S.cashKc)+'</b></div>'+
            '<div><span>z toho kartou</span><b>'+kcTxt(S.cardKc)+'</b></div>'+
            '<div class="tj-sum-note">Pár (2 osoby): '+kcTxt(S.kc*2)+' · počet lidí ve skupině pro dělené položky: '+c.people+'</div>';
        var meta=$('tjMetaAct');
        if(meta)meta.textContent=S.count+' pol. · '+kcTxt(S.kc);
    }

    /* ---------- PREMIUM v20: filtrování pouze pohledu, nikdy nemění zaškrtnuté položky ani součty ---------- */
    var p20Group = 'all';
    function applyActivityFilters() {
        var only = $('p20OnlySelected') && $('p20OnlySelected').checked;
        var groups = document.querySelectorAll('#tjActs .tj-act-grp');
        var shown = 0;
        Array.prototype.forEach.call(groups, function (g) {
            var matchGroup = p20Group === 'all' || g.getAttribute('data-p20-id') === p20Group;
            var visibleItems = 0;
            Array.prototype.forEach.call(g.querySelectorAll('.tj-row'), function (row) {
                var show = matchGroup && (!only || !row.classList.contains('is-off'));
                row.hidden = !show;
                if (show) { row.style.removeProperty('display'); visibleItems++; }
                else row.style.setProperty('display', 'none', 'important');
            });
            g.hidden = !matchGroup || !visibleItems;
            if (g.hidden) g.style.setProperty('display', 'none', 'important');
            else g.style.removeProperty('display');
            shown += visibleItems;
        });
        if ($('p20Empty')) $('p20Empty').hidden = shown !== 0;
        if ($('p20ShownCount')) $('p20ShownCount').textContent = shown + (shown === 1 ? ' položka' : shown < 5 && shown > 1 ? ' položky' : ' položek');
    }
    var filterBox = $('p20ActControls');
    if (filterBox) {
        filterBox.addEventListener('click', function(e){
            var b=e.target.closest('[data-p20-group]'); if(!b)return;
            p20Group=b.getAttribute('data-p20-group');
            Array.prototype.forEach.call(filterBox.querySelectorAll('[data-p20-group]'),function(el){
                var active = el === b; el.classList.toggle('is-current', active); el.setAttribute('aria-pressed', String(active));
            });
            applyActivityFilters();
        });
        filterBox.addEventListener('change',function(e){if(e.target.id === 'p20OnlySelected')applyActivityFilters();});
    }

    /* ---------- události ---------- */
    var rootF = $('jidlo'), rootA = $('aktivity');
    if (rootF) rootF.addEventListener('click', function (e) {
        var b = e.target.closest('[data-lvl]'); if (!b) return;
        var k = b.getAttribute('data-lvl'); if (FOOD[k] && k !== st.level) { st.level = k; emit(); }
    });
    if (rootA) {
        rootA.addEventListener('change', function (e) {
            var cb = e.target.closest('input[data-id]'); if (!cb) return;
            st.c[cb.getAttribute('data-id')] = cb.checked ? 1 : 0;
            updateActivityNumbersInPlace();
            emit(true); // žádné překreslení seznamu ani obnova focusu
        });
        rootA.addEventListener('click', function (e) {
            var b = e.target.closest('[data-bulk]'); if (!b) return;
            var mode = b.getAttribute('data-bulk');
            st.c = {};
            if (mode !== 'def') ACTS.forEach(function (a) { st.c[a.id] = mode === 'all' ? 1 : 0; });
            emit();
        });
    }

    /* ---------- veřejné API ---------- */
    window.TRIP = {
        FOOD: FOOD, ACTS: ACTS, SG_DAYS: SG_DAYS, BA_DAYS: BA_DAYS,
        level: function () { return st.level; },
        levelName: function () { return FOOD[st.level].name; },
        setLevel: function (k) { if (FOOD[k] && k !== st.level) { st.level = k; emit(); } },
        food: food, sums: sums, rates: rates,
        onChange: function (f) { subs.push(f); },
        setCtx: function (people, solo) {
            if (T.people === people && T.solo === !!solo) return;
            T.people = people; T.solo = !!solo; renderActs();
        }
    };
    subs.push(renderFood, renderActs);
    renderFood(); renderActs();

    /* poslední hotel nebo kurzy se změnily: překresli (bez zásahu uživatele) */
    var lastKey = null;
    function stateKey() { var h = lastHotel(), m = rates(); return (h ? h.v + h.price : '') + '|' + Math.round(m.SGD * 1000) + '|' + Math.round(m.IDR * 1e7); }
    setInterval(function () { var k = stateKey(); if (lastKey !== null && k !== lastKey) emit(); lastKey = k; }, 900);
    window.addEventListener('lux:fx', function () { emit(); });
    window.addEventListener('load', function () { renderFood(); renderActs(); });
})();
