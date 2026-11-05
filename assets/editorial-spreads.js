/* BALI 2027 · non-destructive hotel editorial spreads.
   Moves existing DOM nodes (never clones): original listeners, prices, selected
   hotel state, links, map embeds and Street View controls all stay attached. */
(function () {
  "use strict";
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
      if (card.querySelector(":scope > .bali-ed-hotel-spread")) return;
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
