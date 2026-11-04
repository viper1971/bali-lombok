
/* Označení přečtených sekcí: sekce otevřená kliknutím nebo z menu dostane fajfku (uloženo v prohlížeči) */
(function () {
    var KEY = 'lux_read_v1';
    var read = {};
    try { (JSON.parse(localStorage.getItem(KEY) || '[]') || []).forEach(function (id) { read[id] = true; }); } catch (e) { console.warn('Přečtené sekce nešly načíst:', e); }

    function save() { try { localStorage.setItem(KEY, JSON.stringify(Object.keys(read))); } catch (e) {} }

    /* ---- postupné odemykání: viditelná je jen první nepřečtená sekce a ty už přečtené ---- */
    var LOCK_KEY = 'lux_lock_v1', UNL_KEY = 'lux_unl_v1', TRIP_START = new Date('2027-08-06T00:00:00+02:00').getTime();
    /* První krok nemá .lux-fold, takže je nutné ho vést samostatně.
       Po rozbalení výběru letenek se odemkne další nepřečtená sekce. */
    var FLIGHT_FIRST_KEY = 'lux_flight_first_seen_v1';
    var flightFirstSeen = false;
    try { flightFirstSeen = localStorage.getItem(FLIGHT_FIRST_KEY) === '1'; } catch (e) {}
    var unl = {}; try { localStorage.removeItem(UNL_KEY); } catch (e) {}   // odemknutí odkazem platí jen pro tuhle návštěvu, nic se neukládá
    try { if (/[?&](vse|unlock)\b/.test(location.search)) localStorage.setItem(LOCK_KEY, '0'); } catch (e) {}
    var prevLocked = null, INIT_HASH = location.hash;   // kotvu si zapamatovat hned, jiný skript ji po načtení z adresy odstraní
    function lockOn() { var v = null; try { v = localStorage.getItem(LOCK_KEY); } catch (e) {} return v !== '0' && Date.now() < TRIP_START; }
    function say(msg) {
        if (typeof window.showToast === 'function') { try { window.showToast(msg); return; } catch (e) {} }
        var t = document.createElement('div'); t.className = 'lux-toast'; t.setAttribute('role', 'status'); t.textContent = msg;
        document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3200);
    }
    function foldTitle(f) { var t = f.querySelector('.lux-fold-t'); return t ? t.textContent.trim() : f.id; }
    function applyLocks(all) {
        var on = lockOn(), needsFlight = on && !flightFirstSeen, fu = null;
        if (!needsFlight) {
            for (var i = 0; i < all.length; i++) { if (!read[all[i].id]) { fu = all[i]; break; } }
        }
        var now = {}, locked = 0, fresh = [];
        all.forEach(function (f) {
            var l = needsFlight || (on && !read[f.id] && !unl[f.id] && f !== fu);
            now[f.id] = l; if (l) locked++;
            f.classList.toggle('lux-locked', l); f.inert = l;
            if (l) f.setAttribute('aria-hidden', 'true'); else f.removeAttribute('aria-hidden');
            if (prevLocked && prevLocked[f.id] && !l) fresh.push(f);
        });
        [].forEach.call(document.querySelectorAll('.lux-part'), function (p) {
            var fs = p.querySelectorAll('.lux-fold[id]:not([data-nocount])');
            var allL = on && fs.length > 0 && [].every.call(fs, function (f) { return now[f.id]; });
            p.classList.toggle('lux-locked', allL);
        });
        /* odkazy v menu a jinde na zamčené sekce */
        [].forEach.call(document.querySelectorAll('a[href^="#"]'), function (a) {
            var id = a.getAttribute('href').slice(1); if (!id) return;
            var t = document.getElementById(decodeURIComponent(id));
            var l = !!(t && t.closest && (t.closest('.lux-fold.lux-locked') || t.closest('.lux-part.lux-locked')));
            a.classList.toggle('is-locked', l);
        });
        /* poznámka pod aktuální sekcí */
        var note = document.getElementById('luxLockNote');
        if (on && (fu || needsFlight) && locked > 0) {
            if (!note) {
                note = document.createElement('div'); note.id = 'luxLockNote'; note.className = 'lux-locknote';
                note.innerHTML = '<span class="lux-locknote-ic" aria-hidden="true">🔒</span><span class="lux-locknote-t"><b></b><span>Další sekce se objeví, až tuhle otevřeš a přečteš. Tak se tě nezahltí všechno najednou.</span></span><button type="button" class="lux-tool">Ukaž mi všechno</button>';
                note.querySelector('button').addEventListener('click', function () { window.luxSetLock(false); });
            }
            note.querySelector('b').textContent = needsFlight
                ? 'Nejdřív otevři Výběr letenek · potom následuje příprava'
                : 'Zbývá odemknout ' + locked + ' ' + (locked === 1 ? 'sekci' : locked < 5 ? 'sekce' : 'sekcí');
            var anchor = needsFlight ? document.getElementById('flightPick') : fu;
            if (anchor && anchor.parentNode && note.previousElementSibling !== anchor) anchor.parentNode.insertBefore(note, anchor.nextSibling);
        } else if (note && note.parentNode) { note.parentNode.removeChild(note); }
        if (fresh.length) {
            fresh.forEach(function (f) { f.classList.remove('lux-reveal'); void f.offsetWidth; f.classList.add('lux-reveal'); setTimeout(function () { f.classList.remove('lux-reveal'); }, 900); });
            if (fresh.length === 1) say('🔓 Odemčeno: ' + foldTitle(fresh[0]));
        }
        prevLocked = now;
    }
    window.luxLockState = lockOn;
    window.luxSetLock = function (on) {
        var wasOn = lockOn();
        try { localStorage.setItem(LOCK_KEY, on ? '1' : '0'); } catch (e) {}
        if (on && !wasOn) {
            /* Při zapnutí postupného režimu začínáme vždy letenkami,
               aniž mažeme přečtenost ostatních částí či volby hotelů. */
            flightFirstSeen = false;
            try { localStorage.removeItem(FLIGHT_FIRST_KEY); } catch (e) {}
            var choice = document.getElementById('flightPick');
            if (choice) choice.open = false;
            [].forEach.call(document.querySelectorAll('.lux-fold.is-open'), function (f) {
                try { window.luxToggle(f.id); } catch (e) {}
            });
        }
        paint();
        var c = document.getElementById('lpLockChk'); if (c) c.checked = on;
        if (!on) say('Sekce jsou odemčené všechny. Zpět je zamkneš v „Jak to funguje?“.');
    };
    function folds() { return [].slice.call(document.querySelectorAll('.lux-fold[id]:not([data-nocount])')); }
    function paint() {
        var all = folds(), done = 0;
        all.forEach(function (f) {
            var on = !!read[f.id];
            if (on) done++;
            f.classList.toggle('is-read', on);
            var btn = f.querySelector(':scope > .lux-fold-h .lux-fold-btn');
            if (btn && !btn.querySelector('.lux-read')) {
                var s = document.createElement('span');
                s.className = 'lux-read';
                s.setAttribute('aria-hidden', 'true');
                s.textContent = '✓';
                var chev = btn.querySelector('.lux-fold-chev');
                btn.insertBefore(s, chev || null);
            }
            if (btn) btn.setAttribute('title', on ? 'Přečteno' : '');
        });
        var c = document.getElementById('luxReadCount');
        if (c) c.textContent = done === all.length && all.length ? 'Vše přečteno' : 'Přečteno ' + done + ' z ' + all.length + ' sekcí';
        applyLocks(all);
        renderProgress(all, done);
    }
    function renderProgress(all, done) {
        var pct = all.length ? Math.round(done / all.length * 100) : 0;
        var el = function (id) { return document.getElementById(id); };
        if (el('lpDone')) el('lpDone').textContent = done;
        if (el('lpAll')) el('lpAll').textContent = all.length;
        if (el('lpFill')) el('lpFill').style.width = pct + '%';
        if (el('lpSub')) el('lpSub').textContent = pct + ' % hotovo' + (done < all.length ? ' · zbývá ' + (all.length - done) : '');
        var host = el('lpParts'); if (!host) return;
        var groups = [], map = {};
        all.forEach(function (f) {
            var p = f.closest('.lux-part'); var key = p ? p.id : '_';
            if (!map[key]) {
                var t = p && p.querySelector('.lux-part-title');
                map[key] = { id: key, name: t ? t.textContent.trim() : 'Ostatní', items: [] };
                groups.push(map[key]);
            }
            map[key].items.push(f);
        });
        host.innerHTML = '';
        groups.forEach(function (g) {
            var n = g.items.filter(function (f) { return read[f.id]; }).length;
            var a = document.createElement('a');
            a.className = 'lp-chip' + (n === g.items.length ? ' is-done' : '');
            a.href = '#' + g.id; a.title = g.name + ': přečteno ' + n + ' z ' + g.items.length;
            var s = document.createElement('span'); s.textContent = g.name;
            var bb = document.createElement('b'); bb.textContent = n === g.items.length ? '✓' : n + '/' + g.items.length;
            a.appendChild(s); a.appendChild(bb); host.appendChild(a);
        });
        if (typeof window.luxGameRender === 'function') {
            try { window.luxGameRender({ done: done, total: all.length, groups: groups.map(function (g) { return { id: g.id, name: g.name, len: g.items.length, n: g.items.filter(function (f) { return read[f.id]; }).length }; }) }); } catch (e) { console.warn(e); }
        }
    }
    function mark(f) {
        if (!f || !f.id || f.hasAttribute('data-nocount') || read[f.id]) return;
        read[f.id] = true; save(); paint();
    }

    function clearRead() {
        if (!confirm('Opravdu zrušit označení všech přečtených sekcí?')) return false;
        read = {}; unl = {}; prevLocked = null; flightFirstSeen = false;
        try { localStorage.removeItem(FLIGHT_FIRST_KEY); } catch (e) {}
        save(); paint();
        return true;
    }
    window.luxClearRead = clearRead;

    function init() {
        var flightPick = document.getElementById('flightPick');
        if (flightPick) {
            flightPick.addEventListener('toggle', function () {
                if (!flightPick.open || flightFirstSeen) return;
                flightFirstSeen = true;
                try { localStorage.setItem(FLIGHT_FIRST_KEY, '1'); } catch (e) {}
                paint();
            });
            /* Přístupný je jako první vždy i pro přímý odkaz z menu. */
            if (flightPick.open && !flightFirstSeen) {
                flightFirstSeen = true;
                try { localStorage.setItem(FLIGHT_FIRST_KEY, '1'); } catch (e) {}
            }
        }
        // odkaz z adresy (někdo ti poslal odkaz na konkrétní sekci) ji rovnou odemkne
        (function () {
            var h = INIT_HASH && INIT_HASH.slice(1); if (!h) return;
            var f = document.getElementById(decodeURIComponent(h));
            if (f && f.classList && f.classList.contains('lux-fold') && !read[f.id]) unl[f.id] = true;
        })();
        // kliknutí na zamčenou sekci (menu, mapa, noci, ukazatel): nepustit a vysvětlit
        document.addEventListener('click', function (e) {
            var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
            var id = a.getAttribute('href').slice(1); if (!id) return;
            var t = document.getElementById(decodeURIComponent(id));
            if (t && t.closest && (t.closest('.lux-fold.lux-locked') || t.closest('.lux-part.lux-locked'))) {
                e.preventDefault(); e.stopImmediatePropagation();
                say('🔒 Tahle sekce se odemkne, až přečteš ty před ní.');
            }
        }, true);
        // Opening is asynchronous: the closed header scrolls first, then its
        // class changes. Observe the actual disclosure, not the initial click.
        // This also covers menu links and the directly opened chapter contents.
        var readObserver = new MutationObserver(function (records) {
            records.forEach(function (record) {
                var fold = record.target;
                if (fold.classList.contains('is-open')) mark(fold);
            });
        });
        folds().forEach(function (fold) {
            readObserver.observe(fold, { attributes: true, attributeFilter: ['class'] });
            if (fold.classList.contains('is-open')) mark(fold);
        });
        // počítadlo a vymazání v horní liště nástrojů
        var tools = document.querySelector('.lux-dash-tools');
        if (tools && !document.getElementById('luxReadCount')) {
            var c = document.createElement('span'); c.id = 'luxReadCount'; c.className = 'lux-read-count';
            var b = document.createElement('button'); b.type = 'button'; b.className = 'lux-tool'; b.textContent = 'Vymazat přečtené';
            b.addEventListener('click', clearRead);
            tools.insertBefore(c, tools.firstChild);
            tools.appendChild(b);
        }
        // položka v menu (Obsah)
        var nav = document.getElementById('bottomNav');
        if (nav && !document.getElementById('menuClearRead')) {
            var g = document.createElement('div'); g.className = 'nav-group-title'; g.textContent = 'Přečtené sekce';
            var m = document.createElement('button'); m.type = 'button'; m.id = 'menuClearRead'; m.className = 'nav-item';
            m.innerHTML = '<span class="icon">✓</span><span>Vymazat označení přečtených</span>';
            m.addEventListener('click', function () {
                if (clearRead() && typeof window.toggleMenuModal === 'function') window.toggleMenuModal();
            });
            nav.appendChild(g); nav.appendChild(m);
        }
        paint();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

