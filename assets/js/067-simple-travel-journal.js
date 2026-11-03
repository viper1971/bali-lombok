/* Travel journal view. Reads the existing selection and calculations; changes no prices. */
(function () {
  'use strict';
  var stages = [
    ['singapore', 'f-leg-sg', 'Singapur', 'Zahrady, světla a chutě Asie', 'Futuristická zátoka, tradiční čtvrti a večery mezi superstromy.'],
    ['uluwatu', 'f-leg-uluwatu', 'Bali · Uluwatu', 'Útesy nad Indickým oceánem', 'První balijské dny mezi plážemi, chrámy a západy slunce.'],
    ['ubud', 'f-leg-ubud', 'Bali · Ubud', 'Zelené srdce ostrova', 'Rýžové terasy, vodopády a čas na poznávání okolí Ubudu.'],
    ['lombokNorth', 'f-leg-lombok-sever', 'Lombok · západ a sever', 'Ostrovní rytmus a výlet na Gili', 'Moře, podvodní svět a poznávání Lomboku podle zvoleného programu.'],
    ['lombokSouth', 'f-leg-kuta', 'Kuta a Are Guling', 'Pláže, vyhlídky a volnější tempo', 'Jižní pobřeží Lomboku a prostor užít si cestu po svém.'],
    ['kutaLast', 'f-leg-rozlucka', 'Bali · rozloučení', 'Ještě jeden večer na Bali', 'Poslední noc před odletem, odpočinek a příprava na návrat.']
  ];
  var descriptions = ['Přelet ze Singapuru na Bali', 'Z Uluwatu do Ubudu', 'Z Bali na Lombok', 'Přesun na jih Lomboku', 'Z Lomboku zpět na Bali', 'Tranzit v Singapuru a cesta domů'];
  var unit = 'pers';
  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function text(id) { var node = el(id); return node ? node.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function money(n) { return Math.round(n).toLocaleString('cs-CZ') + ' Kč'; }
  function amount(id) { var s = text(id); return /\d/.test(s) ? Number(s.replace(/[^\d-]/g, '')) : null; }
  function attr(node, name) { return node && node.getAttribute(name) || ''; }
  function url(value) { try { var u = new URL(value, location.href); return /^https?:$/.test(u.protocol) ? esc(u.href) : ''; } catch (_) { return ''; } }
  function image(src, alt, cls) { return '<img class="' + cls + '" src="' + url(src) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async" width="640" height="440">'; }
  function dates(stage) { var fold = el(stage[1]); var sub = fold && fold.querySelector('.lux-fold-s'); return sub ? sub.textContent.trim() : ''; }
  function hotel(stage) { try { return hotelCatalog[stage[0]].options[selectedHotels[stage[0]]]; } catch (_) { return null; } }
  function cleanHeading(node) { var clone = node.cloneNode(true); clone.querySelectorAll('button,.st-date').forEach(function (n) { n.remove(); }); return clone.textContent.replace(/\s+/g, ' ').trim(); }
  function program(stage) {
    var fold = el(stage[1]);
    if (!fold) return '';
    var days = Array.from(fold.querySelectorAll('h4')).filter(function (h) { return /\d+\.\s*DEN\s*:/i.test(h.textContent); });
    var rows = days.map(function (h) {
      var label = cleanHeading(h).replace(/^[^\p{L}\d]+/u, '');
      var para = h.nextElementSibling;
      var detail = para && para.tagName === 'P' ? para.textContent.trim() : '';
      var day = h.querySelector('.st-date');
      return '<li><span class="sj-day-date">' + esc(day ? day.textContent : '') + '</span><div><h4>' + esc(label) + '</h4>' + (detail ? '<p>' + esc(detail) + '</p>' : '') + '</div></li>';
    }).join('');
    return '<div class="sj-program"><h3>Program pobytu <span>' + (days.length ? days.length + ' ' + (days.length === 1 ? 'den' : days.length < 5 ? 'dny' : 'dní') : 'podle itineráře') + '</span></h3>' + (rows ? '<ol class="sj-days">' + rows + '</ol>' : '') + '</div>';
  }
  function stageHtml(stage, index) {
    var h = hotel(stage), choice = typeof selectedHotels !== 'undefined' ? selectedHotels[stage[0]] : '';
    var card = el('card-' + stage[0] + '-' + choice);
    var breakfast = card && card.querySelector('.breakfast-badge');
    var room = h ? money(h.price) : 'Cena není uvedena';
    return '<article class="sj-stage" id="sj-stage-' + index + '"><div class="sj-stage-top"><span class="sj-stage-number">' + String(index + 1).padStart(2, '0') + '</span><div><p class="sj-eyebrow">' + esc(stage[2]) + '</p><h2>' + esc(stage[3]) + '</h2><p class="sj-muted">' + esc(dates(stage)) + '</p></div></div><p class="sj-stage-intro">' + esc(stage[4]) + '</p>' +
      '<div class="sj-hotel">' + (h && h.img ? image(h.img, h.name, 'sj-hotel-photo') : '') + '<div class="sj-hotel-copy"><span class="sj-eyebrow">Vybrané ubytování</span><h3>' + esc(h ? h.name : stage[2]) + '</h3><p class="sj-hotel-price">' + room + '</p><p class="sj-muted">za pokoj · celý pobyt' + (h ? '<br>' + money(h.price / 2) + ' / osoba při sdílení pokoje' : '') + '</p>' + (breakfast ? '<p class="sj-breakfast">' + esc(breakfast.textContent) + '</p>' : '') + '</div></div>' + program(stage) + '</article>' +
      '<div class="sj-transfer"><span aria-hidden="true">↓</span><div><small>Pokračujeme dál</small><p>' + esc(descriptions[index]) + '</p>' + '</div></div>';
  }
  var budgetGroups = [['Letenky', ['b1', 'b2']], ['Ubytování', ['b4']], ['Lodě a skútry', ['b3', 'b5']], ['Víza a poplatky', ['b11', 'b12', 'b13', 'b14']], ['Jídlo', ['bxFood']], ['Aktivity a další zvolené výdaje', ['bxAct']]];
  function budgetRows() {
    return budgetGroups.map(function (g) { var n = g[1].reduce(function (sum, key) { return sum + (amount(key + '_' + unit) || 0); }, 0); return '<div class="sj-cost"><span>' + esc(g[0]) + '</span><strong>' + money(n) + '</strong></div>'; }).join('');
  }
  function flightHtml() {
    var f; try { f = flightOptions[currentAirline]; } catch (_) { return ''; }
    if (!f) return '';
    return '<div class="sj-flights"><div><span class="sj-eyebrow">Cesta tam</span><h3>Praha → Singapur</h3><p>' + esc(f.outDate) + ' · ' + esc(f.outDep) + ' → ' + esc(f.outArr) + '</p><small>Přestup: ' + esc(f.outLayover) + '</small></div><div><span class="sj-eyebrow">Cesta zpět</span><h3>Singapur → Praha</h3><p>' + esc(f.retDate) + ' · ' + esc(f.retDep) + ' → ' + esc(f.retArr) + '</p><small>Přestup: ' + esc(f.retLayover) + '</small></div></div><p class="sj-muted">Aktuální výběr: ' + esc(f.name) + '</p>';
  }
  function build(options) {
    var root = el('simplePage'); if (root) root.classList.add('sj-page');
    unit = 'pers';
    return '<header class="sj-top"><button type="button" class="sj-brand" data-sj-go="sj-start" aria-label="Na začátek přehledu">B/L <span>Naše cesta 2027</span></button><button type="button" class="sj-button" data-sp="print">Vytisknout / PDF</button></header>' +
      '<nav class="sj-nav" aria-label="Navigace cestovatelského přehledu">' + [['sj-route', 'Trasa'], ['sj-hotels', 'Hotely a program'], ['sj-budget', 'Rozpočet']].map(function (n) { return '<button type="button" data-sj-go="' + n[0] + '">' + n[1] + '</button>'; }).join('') + '</nav>' +
      '<main class="sj-main"><section class="sj-hero" id="sj-start"><div class="sj-hero-inner"><p class="sj-eyebrow">6.–25. srpna 2027 · 20 dní na cestě</p><h1>Tři světy.<br>Jedna společná cesta.</h1><p>Singapur, Bali a Lombok. Od světel velkoměsta přes zelené vnitrozemí až k plážím a ostrovnímu klidu.</p><button type="button" class="sj-button sj-primary" data-sj-go="sj-route">Prozkoumat naši cestu <span aria-hidden="true">↓</span></button></div><span class="sj-photo-credit">Bali · ilustrační fotografie / Unsplash</span></section>' +
      '<div class="sj-container"><section class="sj-route" id="sj-route"><div class="sj-section-title"><span class="sj-eyebrow">Od prvního letu až domů</span><h2>Naše cesta v jednom pohledu</h2><p>Šest pobytů, od světel Singapuru až po pláže Lomboku.</p></div><div class="sj-route-stops">' + stages.map(function (s, i) { return '<button type="button" data-sj-go="sj-stage-' + i + '"><span>' + String(i + 1).padStart(2, '0') + '</span><strong>' + esc(s[2]) + '</strong><small>' + esc(dates(s)) + '</small></button>'; }).join('') + '</div><div class="sj-flight-details"><h3>Lety a návrat domů</h3>' + flightHtml() + '</div></section>' +
      '<section class="sj-journey" id="sj-hotels"><div class="sj-section-title"><span class="sj-eyebrow">Místa, kde budeme doma</span><h2>Od města k ostrovům</h2><p>Kde bydlíme, co nás čeká a kam pokračujeme dál.</p></div><div class="sj-stages">' + stages.map(stageHtml).join('') + '</div></section>' +
      '<section class="sj-budget" id="sj-budget"><div class="sj-section-title"><span class="sj-eyebrow">Podle našich aktuálních voleb</span><h2>Kolik nás cesta vyjde</h2><p>Přehled plánovaných výdajů za celou cestu.</p></div><div class="sj-budget-layout"><div class="sj-budget-total"><div class="sj-unit" aria-label="Zobrazení ceny">' + [['pers', 'Osoba'], ['fam', 'Pár'], ['sing', 'Sólo']].map(function (u) { return '<button type="button" data-sj-unit="' + u[0] + '" aria-pressed="' + (u[0] === unit) + '">' + u[1] + '</button>'; }).join('') + '</div><p class="sj-muted" id="sj-total-label">Na osobu při sdílení pokoje</p><strong id="sj-total" aria-live="polite">' + esc(text('bxGrand_pers') || text('floatPricePerson')) + '</strong><p>Včetně vybraného jídla a aktivit.</p><small>Plánovaný výdaj, nikoli potvrzení zaplacení. Hotovost je součást výdajů, nepřičítá se znovu.</small></div><div class="sj-budget-breakdown" id="sj-budget-rows">' + budgetRows() + '</div></div>' + '<div class="sj-cash">' + (options.cashHtml || '<p>Plán hotovosti je dostupný v podrobném přehledu.</p>') + '</div></section>' +
      '<footer class="sj-footer"><div><span class="sj-eyebrow">Singapur · Bali · Lombok</span><h2>Těšíme se na společné zážitky.</h2></div><div class="sj-footer-actions"><button type="button" class="sj-button" data-sp="link">Sdílet tento přehled</button><button type="button" class="sj-button" data-sp="print">Vytisknout</button></div></footer></div></main>';
  }
  document.addEventListener('click', function (event) {
    var root = event.target.closest('#simplePage'); if (!root) return;
    var go = event.target.closest('[data-sj-go]');
    if (go) { var target = el(go.dataset.sjGo); if (target) target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }
    var price = event.target.closest('[data-sj-unit]');
    if (price) { unit = price.dataset.sjUnit; root.querySelectorAll('[data-sj-unit]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.sjUnit === unit)); }); el('sj-total').textContent = text('bxGrand_' + unit) || '–'; el('sj-total-label').textContent = { pers: 'Na osobu při sdílení pokoje', fam: 'Celkem za pár · dvě osoby', sing: 'Sólo · jedna osoba v pokoji' }[unit]; el('sj-budget-rows').innerHTML = budgetRows(); }
  });
  function refreshBudget() {
    var root = el('simplePage');
    if (!root || !root.classList.contains('is-open') || !el('sj-total')) return;
    el('sj-total').textContent = text('bxGrand_' + unit) || '–';
    el('sj-budget-rows').innerHTML = budgetRows();
  }
  document.addEventListener('DOMContentLoaded', function () {
    var pending = false;
    var observer = new MutationObserver(function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; refreshBudget(); });
    });
    ['bxGrand_pers', 'bxGrand_fam', 'bxGrand_sing'].forEach(function (id) {
      var node = el(id); if (node) observer.observe(node, { childList: true, subtree: true, characterData: true });
    });
  });
  window.baliSimpleTravel = { build: build };
})();
