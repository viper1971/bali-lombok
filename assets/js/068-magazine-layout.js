/* Optional editorial skin. The trip's calculations and stored selections are untouched. */
(function () {
  'use strict';
  var root = document.documentElement;
  var key = 'bali_magazine_appearance_v1';
  var mode = 'magazine';
  try { if (localStorage.getItem(key) === 'classic') mode = 'classic'; } catch (_) {}
  try {
    var requested = new URL(location.href).searchParams.get('vzhled');
    if (requested === 'puvodni') mode = 'classic';
    if (requested === 'casopis') mode = 'magazine';
  } catch (_) {}
  function labels() {
    var active = root.getAttribute('data-magazine') === 'on';
    document.querySelectorAll('[data-magazine-switch]').forEach(function (button) {
      button.textContent = active ? 'Původní vzhled' : 'Časopisový vzhled';
      button.setAttribute('aria-label', active ? 'Přepnout na původní vzhled webu' : 'Přepnout na časopisový vzhled webu');
    });
  }
  function setMode(next, remember) {
    mode = next === 'classic' ? 'classic' : 'magazine';
    root.setAttribute('data-magazine', mode === 'magazine' ? 'on' : 'off');
    if (remember) {
      try { localStorage.setItem(key, mode); } catch (_) {}
      try {
        var u = new URL(location.href);
        u.searchParams.delete('vzhled');
        history.replaceState(null, '', u.href);
      } catch (_) {}
    }
    labels();
    // Existing maps must remeasure after a change of layout.
    if (remember) window.requestAnimationFrame(function () {
      window.dispatchEvent(new Event('resize'));
      (window.__luxMaps || []).forEach(function (map) { if (map.invalidateSize) map.invalidateSize(); });
    });
    return mode;
  }
  setMode(mode, false);
  window.baliMagazine = { setMode: function (next) { return setMode(next, true); } };
  function init() {
    labels();
    document.addEventListener('click', function (event) {
      var button = event.target.closest && event.target.closest('[data-magazine-switch]');
      if (button) { setMode(mode === 'magazine' ? 'classic' : 'magazine', true); return; }
      var link = event.target.closest && event.target.closest('a[data-magazine-target]');
      if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button > 0) return;
      var id = link.getAttribute('href').slice(1), target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      if (window.luxPartFor) window.luxPartFor(target);
      var fold = target.closest('.lux-fold');
      if (fold && !fold.classList.contains('is-open') && window.luxToggle) window.luxToggle(fold.id);
      if (target.tagName === 'DETAILS') target.open = true;
      window.setTimeout(function () {
        var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      }, 90);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
