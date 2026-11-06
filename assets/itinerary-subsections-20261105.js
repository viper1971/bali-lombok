/* Destination ideas, not an imposed day-by-day schedule.
   Reuses the exact existing Street View DOM nodes, URLs, IDs and play controls. */
(function () {
  "use strict";
  var titles = {
    singapur: "Singapur", uluwatu: "Uluwatu a poloostrov Bukit",
    ubud: "Ubud a okolí", lombok: "Severní Lombok a ostrovy Gili",
    kuta: "Jižní Lombok", farewell: "Kuta a Jimbaran"
  };
  var extra = {
    farewell: [
      "Pláž na jihu Bali, vhodná k procházce a pozorování pobřeží. Street View ukazuje podobu okolí.",
      "Ulice v oblasti Kuta s obchody, kavárnami a suvenýry. Street View umožňuje prohlédnout okolní zástavbu."
    ]
  };
  function textOf(element) { return element ? (element.textContent || "").replace(/\s+/g, " ").trim() : ""; }
  function build(details) {
    if (details.dataset.destinationGalleryReady === "1") return;
    var inner = details.querySelector(":scope > .bali-itinerary-inner");
    if (!inner) return;
    var originalCards = Array.from(inner.querySelectorAll('.spot-card-sg,.spot-card,.spot-card-ubud,.spot-card-lombok,.spot-card-kuta'));
    var items = originalCards.length ? originalCards : Array.from(inner.querySelectorAll('.sv-card')).map(function (sv) { return sv.parentElement; });
    if (!items.length) return;
    var gallery = document.createElement("div");
    gallery.className = "bali-destination-grid";
    var region = titles[details.dataset.itinerary] || "Okolí";
    items.forEach(function (source, index) {
      var sv = source.querySelector(".sv-card");
      if (!sv) return;
      var h = source.querySelector('[class*="spot-title"]') || (originalCards.length ? source.querySelector("h3,h4,strong") : source.querySelector("strong,h3,h4"));
      var p = source.querySelector("p");
      var name = textOf(h) || "Zajímavé místo " + (index + 1);
      var description = originalCards.length ? textOf(p) : (extra[details.dataset.itinerary] || [])[index];
      var item = document.createElement("article");
      item.className = "bali-destination-card";
      var title = document.createElement("h3");
      title.className = "bali-destination-title";
      title.textContent = name;
      var body = document.createElement("p");
      body.className = "bali-destination-description";
      body.textContent = description || "Prohlédni si místo a jeho okolí pomocí interaktivního Street View.";
      item.appendChild(title);
      item.appendChild(body);
      item.appendChild(sv);
      gallery.appendChild(item);
    });
    if (!gallery.children.length) return;
    var heading = details.querySelector(":scope > summary strong");
    if (heading) heading.textContent = "Návrhy co navštívit – " + region;
    var small = details.querySelector(":scope > summary small");
    if (small) small.textContent = "Zajímavá místa, jejich popis a interaktivní Street View";
    var intro = document.createElement("p");
    intro.className = "bali-destination-intro";
    intro.textContent = "Inspirace k návštěvě v oblasti " + region + ". Vyber si místa podle zájmu; každá karta obsahuje popis a možnost virtuální prohlídky.";
    // Keep the former schedule DOM available to legacy handlers, but out of view.
    Array.from(inner.children).forEach(function (node) {
      node.classList.add('bali-original-schedule-hidden');
      node.setAttribute('aria-hidden', 'true');
    });
    inner.appendChild(intro);
    inner.appendChild(gallery);
    details.dataset.destinationGalleryReady = "1";
  }
  function init() {
    document.querySelectorAll("details.bali-itinerary-subsection").forEach(build);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();
