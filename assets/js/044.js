
/* =====================================================================
   ÚPRAVY 10/2026 – ukazatel dočtení sekcí, časové osy letů, Street View
   ===================================================================== */
(function () {
    function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

    /* ---------- Ukotvená hlavička otevřené sekce + pás „kolik zbývá“ ---------- */
    ready(function () {
        var folds = [].slice.call(document.querySelectorAll('.lux-fold'));
        folds.forEach(function (f) {
            var btn = f.querySelector(':scope > .lux-fold-h > .lux-fold-btn');
            if (!btn || btn.querySelector('.lux-fold-prog')) return;
            var pct = document.createElement('span');
            pct.className = 'lux-fold-pct'; pct.setAttribute('aria-hidden', 'true');
            var chev = btn.querySelector('.lux-fold-chev');
            btn.insertBefore(pct, chev || null);
            var bar = document.createElement('span');
            bar.className = 'lux-fold-prog'; bar.setAttribute('aria-hidden', 'true');
            bar.appendChild(document.createElement('i'));
            btn.appendChild(bar);
        });

        var ticking = false;
        function update() {
            ticking = false;
            var vh = window.innerHeight;
            var anyStuck = false;
            var bottomBar = document.querySelector('.vip-floating-bar');
            var reserve = bottomBar && bottomBar.offsetParent !== null ? Math.min(bottomBar.offsetHeight + 16, vh * 0.3) : 0;
            folds.forEach(function (f) {
                if (!f.classList.contains('is-open')) { f.classList.remove('is-stuck'); return; }
                var h = f.querySelector(':scope > .lux-fold-h');
                var body = f.querySelector(':scope > .lux-fold-body');
                if (!h || !body) return;
                var hr = h.getBoundingClientRect(), br = body.getBoundingClientRect();
                var stickTop = parseFloat(getComputedStyle(h).top) || 0;
                var stuck = f.getBoundingClientRect().top < stickTop - 1 && br.bottom > hr.bottom;
                f.classList.toggle('is-stuck', stuck);
                if (stuck) anyStuck = true;
                var visible = vh - hr.bottom - reserve;            // kolik obsahu je vidět pod hlavičkou
                var scrollable = br.height - visible;               // kolik je potřeba odscrolovat
                var done = hr.bottom - br.top;                      // kolik už je pod hlavičkou schované
                var p = scrollable <= 0 ? 1 : Math.max(0, Math.min(1, done / scrollable));
                var i = h.querySelector('.lux-fold-prog > i');
                if (i) i.style.setProperty('--p', p.toFixed(4));
                var t = h.querySelector('.lux-fold-pct');
                if (t) t.textContent = p >= 0.995 ? 'konec' : 'zbývá ' + Math.round((1 - p) * 100) + ' %';
            });
            document.body.classList.toggle('has-stuck', anyStuck);
        }
        function req() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
        window.addEventListener('scroll', req, { passive: true });
        window.addEventListener('resize', req);
        document.addEventListener('click', function () { setTimeout(req, 60); setTimeout(req, 520); });
        try { new ResizeObserver(req).observe(document.body); } catch (e) {}
        req();
    });

    /* ---------- Gantt letů: dvě časové osy (Praha + Singapur) ---------- */
    ready(function () {
        var HOUR = 40; // px na hodinu – stejné měřítko jako pruhy
        function pad(n) { return (n < 10 ? '0' : '') + n; }
        function build(cardId, main, alt, shift, note, arrivalCity) {
            var card = document.getElementById(cardId);
            if (!card || card.dataset.gx) return;
            var hdr = card.querySelector('.gantt-header');
            if (!hdr || hdr.children.length < 2) return;
            var first = hdr.children[0], axis = hdr.children[1];
            var labels = [].map.call(axis.children, function (d) { return d.textContent.trim(); });
            var start = parseInt(labels[0], 10), n = labels.length;
            if (isNaN(start)) return;
            card.dataset.gx = '1';
            first.classList.add('gx-head');
            first.innerHTML = '<span class="gx-main">' + main + '</span><span class="gx-alt">' + alt + '</span>';
            first.title = 'Letecká společnost';
            var rowMain = '', rowAlt = '';
            for (var i = 0; i < n; i++) {
                var hMain = (start + i) % 24, hAlt = ((start + i + shift) % 24 + 24) % 24;
                rowMain += '<span style="left:' + (i * HOUR) + 'px">' + pad(hMain) + ':00</span>';
                rowAlt += '<span style="left:' + (i * HOUR) + 'px">' + pad(hAlt) + ':00</span>';
            }
            axis.classList.add('gx-axis', 'gx-grid');
            axis.innerHTML = '<div class="gx-axis-row gx-main-row">' + rowMain + '</div><div class="gx-axis-row gx-alt-row">' + rowAlt + '</div>';
            // mřížka v řádcích – každá svislá čára = celá hodina
            [].forEach.call(card.querySelectorAll('.gantt-row'), function (r) {
                var track = r.children[1];
                if (track) track.classList.add('gx-grid');
                // štítek příletu: jasně říct, ve kterém čase je
                var last = track && track.lastElementChild;
                if (last && /Přílet/.test(last.textContent)) {
                    var m = last.textContent.match(/(\d{1,2}:\d{2})/);
                    if (m) last.textContent = 'Přílet ' + m[1] + ' ' + arrivalCity;
                    last.style.whiteSpace = 'nowrap';
                    last.style.width = 'auto';
                    last.style.paddingLeft = '10px'; last.style.paddingRight = '10px';
                }
            });
            // popisek pod nadpisem
            var info = [].filter.call(card.querySelectorAll('div'), function (d) { return d.children.length === 0 && /⏱️/.test(d.textContent); })[0];
            if (info) info.innerHTML = note;
        }
        build('ganttFlightsComparison_outbound', 'Praha (SELČ)', 'Singapur (SGT, +6 h)', 6,
            '⏱️ Horní osa je pražský čas odletu, žlutá osa pod ní je čas v Singapuru. Konec pruhu = přílet podle žluté osy.', 'v Singapuru');
        build('ganttFlightsComparison_return', 'Singapur (SGT)', 'Praha (SELČ, −6 h)', -6,
            '⏱️ Horní osa je singapurský čas odletu, žlutá osa pod ní je čas v Praze. Konec pruhu = přílet podle žluté osy.', 'v Praze');
    });

    /* ---------- Street View: načte se samo, až k němu dojedeš ---------- */
    ready(function () {
        if (typeof window.svLoad !== 'function') return;
        var stages = [].slice.call(document.querySelectorAll('.sv-stage[data-sv-url]'));
        if (!stages.length) return;
        var queue = [], busy = false;
        function next() {
            if (busy) return;
            var stage = queue.shift();
            if (!stage) return;
            stage.classList.remove('is-queued');
            if (stage.closest('[inert]') || !stage.getBoundingClientRect().height) {
                io.observe(stage);
                next();
                return;
            }
            busy = true;
            var settled = false;
            var timer;
            function finish() {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                stage.removeEventListener('sv:request-finished', finish);
                busy = false;
                next();
            }
            stage.addEventListener('sv:request-finished', finish);
            // A slow external server must not block all subsequent panoramas.
            timer = setTimeout(finish, 4000);
            if (!window.svLoad(stage.id)) finish();
        }
        if (!('IntersectionObserver' in window)) return; // starý prohlížeč: zůstává tlačítko
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                var el = e.target;
                if (el.querySelector('iframe')) { io.unobserve(el); return; }
                if (e.isIntersecting) {
                    if (queue.indexOf(el) < 0) { queue.push(el); el.classList.add('is-queued'); }
                    io.unobserve(el);
                    next();
                }
            });
        }, { rootMargin: '150px 0px 150px 0px', threshold: 0.01 });
        stages.forEach(function (el) { if (el.id) io.observe(el); });
    });
})();
