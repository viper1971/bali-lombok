/* Screen pagination of the original DOM: no cloned forms, maps or hotel cards. */
(function () {
    'use strict';
    var desktop = window.matchMedia('(min-width:901px)');
    var active = null, pages = [], page = 0, callback = null, timer = 0, busy = false;
    var masks = new Map(), branches = new Set(), wraps = [], observer = null;
    var sizeKey = '', header = null, pendingTarget = null;
    var media = 'iframe,img,svg,canvas,video,.sv-stage,.uber-media-box,.map-box,.trip-show,.leaflet-container';
    var containers = '.lux-fold-body,.lux-fold-pad,.hotel-tab-shell,.hotel-tab-panel,.uber-hotel-card,[id$="AccContent"],.mg-stage-metadata';
    function restoreMasks() {
        masks.forEach(function (saved, el) {
            if (saved.value) el.style.setProperty('display', saved.value, saved.priority);
            else el.style.removeProperty('display');
        });
        masks.clear();
        branches.forEach(function (el) { el.classList.remove('pr-branch', 'pr-single'); });
        branches.clear();
    }
    function hide(el) {
        if (!masks.has(el)) masks.set(el, { value: el.style.getPropertyValue('display'), priority: el.style.getPropertyPriority('display') });
        el.style.setProperty('display', 'none', 'important');
    }
    function visible(el) {
        var display = getComputedStyle(el).display;
        return !el.closest('.hotel-inactive') && display !== 'none' && (el.getClientRects().length > 0 || display === 'contents');
    }
    function children(el) {
        return Array.from(el.children).filter(function (c) {
            return c !== header && !c.matches('script,style,link,template') && visible(c) && getComputedStyle(c).position !== 'absolute';
        });
    }
    function wrapText(el) {
        Array.from(el.childNodes).forEach(function (node) {
            if (node.nodeType !== 3 || !node.textContent.trim()) return;
            var marker = document.createComment('presentation text');
            var chunks = node.textContent.match(/(?:\S+\s*){1,35}/g) || [node.textContent];
            // Keep exact original whitespace and text in the original Text node on exit.
            var leading = /^\s*/.exec(node.textContent)[0];
            node.before(marker);
            var spans = chunks.map(function (chunk, i) {
                var span = document.createElement('span');
                span.className = 'pr-text-piece';
                span.textContent = (i === 0 ? leading : '') + chunk;
                marker.before(span);
                return span;
            });
            node.remove();
            wraps.push({ marker: marker, original: node, spans: spans });
        });
    }
    function restoreText() {
        wraps.forEach(function (w) { w.spans.forEach(function (s) { s.remove(); }); w.marker.replaceWith(w.original); });
        wraps = [];
    }
    function clear() {
        if (observer) observer.disconnect();
        restoreMasks();
        restoreText();
        if (active) active.classList.remove('pr-current', 'pr-preparing');
        document.body.classList.remove('pres-paged');
        document.documentElement.classList.remove('pres-paged');
    }
    function notify() { if (callback) callback(); }
    function fits(selected) {
        var bottom = active.getBoundingClientRect().bottom - 12;
        return selected.every(function (el) { return el.getBoundingClientRect().bottom <= bottom + 1; });
    }
    function paint(units, selected) {
        restoreMasks();
        var all = new Set(), wanted = new Set();
        units.forEach(function (unit) {
            for (var el = unit; el && el !== active; el = el.parentElement) all.add(el);
        });
        selected.forEach(function (unit) {
            for (var el = unit; el && el !== active; el = el.parentElement) wanted.add(el);
        });
        all.forEach(function (el) {
            if (!wanted.has(el)) hide(el);
            else if (units.indexOf(el) === -1) { el.classList.add('pr-branch'); branches.add(el); }
        });
        branches.forEach(function (el) {
            if (getComputedStyle(el).display.indexOf('grid') !== -1 && children(el).length === 1) el.classList.add('pr-single');
        });
    }
    function collect(el, limit, units) {
        if (el === header || !visible(el) || el.matches('script,style,link,template')) return;
        var kids = children(el);
        if (el.matches(media) || (getComputedStyle(el).display !== 'contents' && !el.matches(containers) && el.getBoundingClientRect().height <= limit * 0.68) || !kids.length) {
            units.push(el); return;
        }
        wrapText(el);
        children(el).forEach(function (c) { collect(c, limit, units); });
    }
    function splitUnit(el) {
        if (el.matches(media + ',.pr-text-piece')) return [];
        wrapText(el);
        return children(el);
    }
    function layout(anchor, last) {
        if (!active || busy) return;
        busy = true;
        if (observer) observer.disconnect();
        restoreMasks(); restoreText();
        document.body.classList.toggle('pres-paged', desktop.matches);
        document.documentElement.classList.toggle('pres-paged', desktop.matches);
        active.classList.toggle('pr-current', desktop.matches);
        if (!desktop.matches) { pages = []; page = 0; active.classList.remove('pr-preparing'); sizeKey = innerWidth + ':' + innerHeight; busy = false; notify(); return; }
        if (active.classList.contains('lux-fold')) {
            active.classList.add('is-open', 'is-settled');
            var body = active.querySelector(':scope > .lux-fold-body');
            if (body) body.removeAttribute('inert');
        }
        header = active.querySelector(':scope > .lux-fold-h');
        var units = [], result = [], current = [], limit = Math.max(100, active.clientHeight - (header ? header.offsetHeight : 0) - 32);
        active.style.setProperty('--pr-space', limit + 'px');
        Array.from(active.children).forEach(function (el) { collect(el, limit, units); });
        if (!units.length) units = [active];
        var subdivisions = 0;
        for (var i = 0; i < units.length; i++) {
            var unit = units[i], trial = current.concat(unit);
            paint(units, trial);
            if (fits(trial)) { current = trial; continue; }
            if (current.length) {
                // Keep a trailing heading with the content it introduces.
                if (current.length > 1 && current[current.length - 1].matches('h1,h2,h3,h4,h5,h6')) {
                    var heading = current.pop();
                    result.push(current); current = [heading]; i--; continue;
                }
                result.push(current); current = []; i--; continue;
            }
            // Only an oversized block is divided, at its existing child boundaries.
            restoreMasks();
            var parts = splitUnit(unit);
            if (parts.length && subdivisions++ < 1500) { units.splice.apply(units, [i, 1].concat(parts)); i--; continue; }
            // Unbreakable visual/control: CSS bounds its viewport dimensions.
            // Keep a diagnostic so an unexpected component is never silently clipped.
            unit.classList.add('pr-fit-block');
            paint(units, [unit]);
            current = [unit];
        }
        if (current.length) result.push(current);
        pages = result.length ? result : [units];
        if (pendingTarget) { anchor = pendingTarget; pendingTarget = null; }
        var found = anchor ? pages.findIndex(function (p) { return p.some(function (el) { return el === anchor || el.contains(anchor) || anchor.contains(el); }); }) : -1;
        page = last ? pages.length - 1 : found >= 0 ? found : Math.min(page, pages.length - 1);
        paint(units, pages[page]);
        active.scrollTop = 0;
        active.dataset.presentationPages = String(pages.length);
        sizeKey = innerWidth + ':' + innerHeight;
        active.classList.remove('pr-preparing');
        busy = false;
        observe(); notify(); refresh();
    }
    function refresh() {
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('pres:pagechange'));
    }
    function schedule() {
        if (!active || busy) return;
        clearTimeout(timer);
        timer = setTimeout(function () { layout(pages[page] && pages[page][0]); }, 260);
    }
    function observe() {
        if (!observer) observer = new MutationObserver(function (records) {
            if (records.some(function (r) {
                var target = r.target.nodeType === 1 ? r.target : r.target.parentElement;
                return target && !target.closest('.sv-stage,.leaflet-container,.trip-show,.ticket-badge') &&
                    (r.type === 'characterData' || Array.from(r.addedNodes).concat(Array.from(r.removedNodes)).some(function (n) { return n.nodeType === 1 && !n.matches('iframe'); }));
            })) schedule();
        });
        if (active) observer.observe(active, { childList: true, characterData: true, subtree: true });
    }
    window.luxPresentationPages = {
        mount: function (el, changed, last) {
            clearTimeout(timer); clear(); active = el; callback = changed; page = 0; pages = [];
            document.body.classList.toggle('pres-paged', desktop.matches);
            document.documentElement.classList.toggle('pres-paged', desktop.matches);
            el.classList.toggle('pr-current', desktop.matches);
            if (desktop.matches) {
                el.classList.add('pr-preparing');
                timer = setTimeout(function () { if (active === el) layout(null, last); }, 320);
            } else layout(null, last);
        },
        unmount: function () {
            clearTimeout(timer); clear();
            if (active) { active.style.removeProperty('--pr-space'); active.querySelectorAll('.pr-fit-block').forEach(function (el) { el.classList.remove('pr-fit-block'); }); delete active.dataset.presentationPages; }
            active = null; pages = []; callback = null; pendingTarget = null;
        },
        turn: function (step) {
            if (!active || !desktop.matches || page + step < 0 || page + step >= pages.length) return false;
            page += step;
            paint(pages.flat(), pages[page]); active.scrollTop = 0;
            notify(); refresh(); return true;
        },
        reveal: function (target) {
            if (!active || !active.contains(target)) return false;
            if (!pages.length) { pendingTarget = target; return true; }
            var found = pages.findIndex(function (p) { return p.some(function (el) { return el === target || el.contains(target) || target.contains(el); }); });
            if (found < 0) return false;
            page = found; paint(pages.flat(), pages[page]); active.scrollTop = 0;
            notify(); refresh(); return true;
        },
        state: function () { return { index: page, total: pages.length || 1, enabled: !!active && desktop.matches, preparing: !!active && active.classList.contains('pr-preparing') }; },
        reflow: schedule
    };
    window.addEventListener('resize', function () { if (active && sizeKey !== innerWidth + ':' + innerHeight) schedule(); });
    desktop.addEventListener('change', schedule);
    document.addEventListener('load', function (e) { if (active && active.contains(e.target) && e.target.tagName === 'IMG') schedule(); }, true);
    document.addEventListener('change', function (e) { if (active && active.contains(e.target)) schedule(); });
    document.addEventListener('click', function (e) {
        if (active && active.contains(e.target) && e.target.closest('button,select,input,summary,[onclick]') && !e.target.closest('.sv-stage,.leaflet-container')) schedule();
    });
    document.addEventListener('click', function (e) {
        if (active && header && e.target.closest('.lux-fold-h') === header) { e.preventDefault(); e.stopImmediatePropagation(); }
    }, true);
    // Preserve zoom, and allow wheel scrolling inside the chapter menu/dialogs.
    document.addEventListener('wheel', function (e) {
        if (!active || !desktop.matches || e.ctrlKey || e.target.closest('#presNav,#presNotes,#presWeb,[role="dialog"],.leaflet-container')) return;
        e.preventDefault();
    }, { passive: false });
    document.addEventListener('keydown', function (e) {
        if (!active || !desktop.matches || e.target.closest('input,select,textarea,[contenteditable="true"],#presNav,#presWeb')) return;
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') e.preventDefault();
    });
})();
