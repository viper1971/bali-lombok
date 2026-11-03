
/* Nenačtený obrázek: vlajka → emoji, ostatní se skryjí místo prázdné ikonky */
(function () {
    var FLAGS = { sg: '🇸🇬', id: '🇮🇩', cz: '🇨🇿', gb: '🇬🇧', us: '🇺🇸', eu: '🇪🇺', ae: '🇦🇪', tr: '🇹🇷', ch: '🇨🇭', qa: '🇶🇦', my: '🇲🇾', th: '🇹🇭', de: '🇩🇪', nl: '🇳🇱', au: '🇦🇺' };
    function fix(img) {
        if (!img || img.tagName !== 'IMG') return;
        var src = img.getAttribute('src') || '';
        if (!src || src.indexOf('${') === 0) return;
        var m = /flagcdn\.com\/[^/]+\/([a-z]{2})\./i.exec(src);
        if (m) {
            var span = document.createElement('span');
            span.className = 'img-fallback-flag';
            span.textContent = FLAGS[m[1].toLowerCase()] || m[1].toUpperCase();
            span.setAttribute('role', 'img');
            span.setAttribute('aria-label', img.alt || m[1].toUpperCase());
            if (img.getAttribute('style')) span.setAttribute('style', img.getAttribute('style'));
            span.style.width = 'auto'; span.style.boxShadow = 'none'; span.style.lineHeight = '1';
            img.replaceWith(span);
            return;
        }
        if (/toplist\.cz/i.test(src)) { var box = document.getElementById('toplistFloat'); if (box) box.style.display = 'none'; return; }
        img.dataset.fbHidden = '1'; img.style.display = 'none';
    }
    document.addEventListener('load', function (e) { var t = e.target; if (t && t.tagName === 'IMG' && t.dataset.fbHidden) { delete t.dataset.fbHidden; t.style.display = ''; } }, true);
    document.addEventListener('error', function (e) { if (e.target && e.target.tagName === 'IMG') fix(e.target); }, true);
    function sweep() { [].forEach.call(document.images, function (img) { if (img.complete && img.getAttribute('src') && img.naturalWidth === 0) fix(img); }); }
    document.addEventListener('DOMContentLoaded', sweep);
    window.addEventListener('load', sweep);
})();
