/* BALI 2027 — no automatic scrolling during chapter, fold or hotel expansion.
   Keep native wheel/touch scrolling and all original section, lock and hotel handlers. */
(function () {
  "use strict";
  function init() {
    document.documentElement.classList.remove("bali-story-progressive");
    document.querySelectorAll(".lux-part.bali-story-concealed").forEach(function (part) {
      part.classList.remove("bali-story-concealed");
    });
    document.querySelectorAll(".lux-part > .lux-part-head .trip-overview").forEach(function (map) {
      map.addEventListener("click", function (event) { event.stopPropagation(); });
      map.addEventListener("keydown", function (event) { event.stopPropagation(); });
    });
    document.querySelectorAll("iframe").forEach(function (frame) {
      if (!frame.hasAttribute("loading")) frame.setAttribute("loading", "lazy");
    });
  }
  /* Legacy chapter handlers may call this hook. It must not reposition viewport. */
  window.baliAlignOpenedChapter = function () {};
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else init();
})();
