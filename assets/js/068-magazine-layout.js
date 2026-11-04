/* Optional editorial skin. The trip's calculations and stored selections are untouched. */
(function () {
  'use strict';
  var root = document.documentElement;
  var mode = 'magazine';
  root.setAttribute('data-magazine', 'on');
  try { localStorage.removeItem('bali_magazine_appearance_v1'); } catch (_) {}
  function init() {
    document.querySelectorAll('[id$="AccContent"]:has(>[class*="day-block"])').forEach(function (content) {
      var note = document.createElement('p');
      note.className = 'mg-visit-note';
      note.textContent = 'Náměty k návštěvě — pořadí i den si vybereme podle nálady, počasí a času. Uvedené okruhy a časy návštěv jsou orientační, termíny letů a přesunů platí podle itineráře.';
      content.prepend(note);
    });

    document.querySelectorAll('.sv-stage[data-sv-url]').forEach(function (stage) {
      var card = stage.closest('.sv-card');
      if (!card) return;
      var latitude = /!1d(-?[\d.]+)/.exec(stage.dataset.svUrl);
      var longitude = /!2d(-?[\d.]+)/.exec(stage.dataset.svUrl);
      var pano = /!1s([^!]+)/.exec(stage.dataset.svUrl);
      var destination = new URL('https://www.google.com/maps/@');
      destination.searchParams.set('api', '1');
      destination.searchParams.set('map_action', 'pano');
      if (latitude && longitude) destination.searchParams.set('viewpoint', latitude[1] + ',' + longitude[1]);
      else if (pano) destination.searchParams.set('pano', pano[1]);
      else return;
      var link = document.createElement('a');
      link.className = 'mg-open-maps';
      link.href = destination.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Otevřít v Mapách ↗';
      card.appendChild(link);
    });

    var cover = document.querySelector('.mg-cover');
    if (cover && window.matchMedia && window.HTMLDialogElement) {
      var desktop = window.matchMedia('(min-width: 901px)');
      if (desktop.matches && mode === 'magazine' && !location.hash && !new URL(location.href).searchParams.has('jednoduse')) {
        var gate = document.createElement('dialog');
        gate.className = 'mg-entry';
        gate.setAttribute('aria-labelledby', 'magazineCoverTitle');
        cover.before(gate);
        gate.appendChild(cover);
        gate.showModal();
        root.classList.add('mg-entry-open');
        function enter() {
          gate.close();
          root.classList.remove('mg-entry-open');
          gate.replaceWith(cover);
          desktop.removeEventListener('change', enter);
        }
        gate.addEventListener('cancel', function (event) { event.preventDefault(); });
        cover.querySelector('.mg-cover-cta').addEventListener('click', enter, { once: true });
        desktop.addEventListener('change', enter);
      }
    }
    document.addEventListener('click', function (event) {
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
