/* BALI 2027 · non-destructive hotel editorial spreads.
   Moves existing DOM nodes (never clones): original listeners, prices, selected
   hotel state, links, map embeds and Street View controls all stay attached. */
(function () {
  "use strict";
  var regionalNotes = {
    singapore: [
      "Singapur je první městskou zastávkou před odletem na Bali. Při výběru ubytování se vyplatí sledovat hlavně polohu vůči stanici MRT: podle ní poznáme, jak pohodlné budou večerní návraty i přesuny s batohem.",
      "Na programu jsou procházky městem, místní jídlo a zátoka Marina Bay. Z hotelových údajů nahoře zkontroluj čas příjezdu a odjezdu, případně zda je zahrnutá snídaně."
    ],
    uluwatu: [
      "Poloostrov Bukit na jihu Bali je výchozím bodem pro výlety k útesům, plážím Padang Padang a Suluban i k chrámu Uluwatu. Pro plánování dne je důležité počítat s přesuny mezi jednotlivými místy, nikoli jen se vzdušnou vzdáleností.",
      "Tato etapa navazuje na přílet do Denpasaru a převzetí skútrů. Při výběru pokoje proto porovnej nejen cenu a vybavení, ale také polohu vzhledem k plánovanému dennímu programu."
    ],
    ubud: [
      "Ubud slouží jako základna pro cesty do vnitrozemí Bali: k rýžovým terasám, vodopádům, chrámům a Opičímu pralesu. Na delší výlety je praktické vyrážet s časovou rezervou, protože vzdálenosti samy o sobě nevystihují délku přejezdu.",
      "U jednotlivých variant ubytování zvaž, zda ti více vyhovuje kontakt s centrem Ubudu, nebo klidnější zázemí mimo nejrušnější místa. Konkrétní vybavení a podmínky jsou uvedené v informacích o hotelu."
    ],
    lombokNorth: [
      "Severní Lombok je v itineráři odlišnou etapou od jihu ostrova. Při plánování pobytu je podstatné, jak bude hotel navazovat na příjezd na Lombok a na další přesun; cesta mezi jednotlivými oblastmi může tvořit významnou část dne.",
      "V této části cesty stojí za to porovnat polohu hotelu, možnosti okolních výletů a tempo, které skupině vyhovuje. Podrobnosti o konkrétním pokoji a rezervaci zůstávají v kartě nahoře."
    ],
    lombokSouth: [
      "Jižní Lombok nabízí odlišný charakter pobytu než sever ostrova. Do programu patří pobřeží, pláže a výlety na skútrech; při výběru základny proto hraje roli vzdálenost k jednotlivým zastávkám.",
      "Pokud chceš během dne projet více pláží, nech v programu prostor na zastávky a návrat. Informace o ceně, snídani a vybavení se řídí konkrétní zvolenou variantou hotelu."
    ],
    kutaLast: [
      "Poslední noc na Bali je především praktickou zastávkou před navazujícím letem. Vedle ceny pokoje je důležitá dostupnost letiště, čas odjezdu a to, zda se ubytování platí předem, nebo až na místě.",
      "Tuto noc je vhodné posuzovat jinak než delší pobytové etapy: přednost má jednoduchá logistika, sbalená zavazadla a dostatečná časová rezerva před odletem."
    ]
  };
  function enrichHotel(card) {
    var panel = card.querySelector(".bali-ed-hotel-spread > .uber-info-panel");
    if (!panel || panel.querySelector(".bali-ed-hotel-notes")) return;
    var identity = (card.id || "").replace(/^card-/, "").replace(/-[A-Z]$/, "");
    var notes = regionalNotes[identity];
    if (!notes) return;
    var out = document.createElement("aside");
    out.className = "bali-ed-hotel-notes";
    out.setAttribute("aria-label","Cestopisné informace o oblasti hotelu");
    var title = document.createElement("h4");
    title.textContent = "O hotelu, okolí a plánování pobytu";
    out.appendChild(title);
    notes.forEach(function (paragraph) {
      var p = document.createElement("p");
      p.textContent = paragraph;
      out.appendChild(p);
    });
    panel.appendChild(out);
  }
  function setup() {
    var root = document.getElementById("hlavni-obsah");
    if (!root) return;
    if (!window.matchMedia("(min-width: 1100px)").matches) {
      root.querySelectorAll(".bali-ed-hotel-spread").forEach(function (spread) {
        var parent = spread.parentNode;
        while (spread.firstChild) parent.insertBefore(spread.firstChild,spread);
        spread.remove();
      });
      return;
    }
    root.querySelectorAll(".uber-hotel-card").forEach(function (card, i) {
      if (card.querySelector(":scope > .bali-ed-hotel-spread")) { enrichHotel(card); return; }
      var media = card.querySelector(":scope > .uber-media-grid");
      var info = card.querySelector(":scope > .uber-info-panel");
      if (!media || !info) return;
      // Only pair the already-adjacent nodes. Unknown layouts are left untouched.
      if (media.nextElementSibling !== info) return;
      var spread = document.createElement("div");
      spread.className = "bali-ed-hotel-spread";
      if (i % 2) spread.classList.add("bali-ed-right");
      media.parentNode.insertBefore(spread, media);
      spread.appendChild(media);
      spread.appendChild(info);
      enrichHotel(card);
    });
    var pads = root.querySelectorAll(".lux-fold-pad:has(> .ph-strip)");
    pads.forEach(function (pad, i) {
      // Alternation uses stable chapter order instead of changeable photo order.
      pad.classList.toggle("bali-ed-right",i % 2 === 1);
    });
  }
  function boot() {
    setup();
    // Cards can be re-rendered after a hotel choice; catch those insertions.
    var root = document.getElementById("hlavni-obsah");
    if (!root || !window.MutationObserver) return;
    var queued = false;
    var observer = new MutationObserver(function (changes) {
      var relevant = changes.some(function (m) {
        return Array.prototype.some.call(m.addedNodes, function (node) {
          return node.nodeType === 1 &&
            (node.matches(".uber-hotel-card,.ph-strip") ||
             (node.querySelector && node.querySelector(".uber-hotel-card,.ph-strip")));
        });
      });
      if (!relevant || queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; setup(); });
    });
    observer.observe(root,{childList:true,subtree:true});
    // Restore the original DOM nesting if a desktop is resized to tablet/mobile.
    var mediaQuery = window.matchMedia("(min-width: 1100px)");
    if (mediaQuery.addEventListener) mediaQuery.addEventListener("change",setup);
    else if (mediaQuery.addListener) mediaQuery.addListener(setup);
    // Photo strips are inserted late by the existing photo loader.
    window.addEventListener("load",setup,{once:true});
    setTimeout(setup,1600);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();
