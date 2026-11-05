/* BALI 2027 — main chapter and subsection alignment only.
   Existing navigation, locks, read status, maps and accordion handlers stay authoritative. */
(function () {
  "use strict";
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  var pending = null, tail = null, generation = 0, timers = [];

  function clearTimers() {
    timers.forEach(function (id) { clearTimeout(id); });
    timers = [];
  }
  function offset() {
    var root = document.documentElement;
    var raw = parseFloat(getComputedStyle(root).getPropertyValue("--stick-top")) || 0;
    return Math.max(12, Math.min(130, raw + 12));
  }
  function firstHeading(part) {
    var f = part.querySelector(":scope > .lux-part-body .lux-fold[id]");
    return f ? (f.querySelector(":scope > .lux-fold-h") || f) :
      (part.querySelector(":scope > .lux-part-head") || part);
  }
  function destination(el) {
    return Math.max(0, window.scrollY + el.getBoundingClientRect().top - offset());
  }
  function ensureTail() {
    if (!tail) {
      tail = document.createElement("div");
      tail.id = "bali-chapter-scroll-tail";
      tail.setAttribute("aria-hidden", "true");
      tail.style.cssText = "display:block!important;height:0;min-height:0;width:100%;flex:none;clear:both;pointer-events:none;overflow:hidden";
    }
    var parts = document.querySelectorAll(".lux-part");
    var last = parts[parts.length-1];
    if (last && tail.previousElementSibling !== last) last.insertAdjacentElement("afterend", tail);
    return tail;
  }
  function resetTail() {
    if (tail) tail.style.height = "0px";
  }
  function extendFor(target) {
    var spacer = ensureTail();
    var scroll = document.scrollingElement || document.documentElement;
    var goal = destination(target);
    var max = Math.max(0, scroll.scrollHeight - scroll.clientHeight);
    var missing = Math.max(0, Math.ceil(goal - max));
    var current = parseFloat(spacer.style.height) || 0;
    if (missing > 0) spacer.style.height = (current + missing + 80) + "px";
    return goal;
  }
  function align(target, owner, token) {
    if (token !== generation || !owner.isConnected || !owner.classList.contains("is-open") ||
        !target.isConnected || !target.getClientRects().length) return;
    var y = extendFor(target);
    // Direct positioning avoids competing smooth animations started by legacy accordion logic.
    window.scrollTo({ top: y, behavior: "instant" });
  }
  function start(owner, target, firstDelay) {
    generation++;
    clearTimers();
    var token = generation;
    if (!owner || !target) return;
    // The original accordion animation and preserve-header handler can move the page
    // for a while. Align again after they finish.
    [firstDelay, firstDelay + 300, firstDelay + 850].forEach(function (delay) {
      timers.push(setTimeout(function () { align(target, owner, token); }, delay));
    });
  }
  function chapterClick(event) {
    var node = event.target;
    if (!node || !node.closest) return;
    // Original behavior: both short chapters open immediately and never auto-scroll.
    var localPart = node.closest("#cast-misto, #cast-kontrola");
    if (localPart) { generation++; clearTimers(); resetTail(); return; }
    var button = node.closest(".lux-fold-btn");
    if (button) {
      var fold = button.closest(".lux-fold[id]");
      if (fold && fold.closest(".lux-part") && !fold.classList.contains("is-open")) {
        start(fold, fold.querySelector(":scope > .lux-fold-h") || fold, 230);
      }
      return;
    }
    var heading = node.closest(".lux-part > .lux-part-head");
    if (!heading) return;
    var other = node.closest("a,button,input,select,textarea,.trip-overview");
    if (other && other !== heading) return;
    var part = heading.closest(".lux-part");
    if (!part) return;
    if (part.classList.contains("is-open")) {
      generation++;
      clearTimers();
      resetTail();
      return;
    }
    start(part, firstHeading(part), 480);
  }
  function chapterKey(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (event.target && event.target.closest && event.target.closest("#cast-misto, #cast-kontrola")) {
      generation++; clearTimers(); resetTail(); return;
    }
    var head = event.target && event.target.matches &&
      event.target.matches(".lux-part > .lux-part-head") ? event.target : null;
    if (!head) return;
    var part = head.closest(".lux-part");
    if (!part) return;
    if (part.classList.contains("is-open")) {
      generation++; clearTimers(); resetTail();
    } else {
      start(part, firstHeading(part), 480);
    }
  }
  document.addEventListener("click", chapterClick, true);
  document.addEventListener("keydown", chapterKey, true);
  function init() {
    // No independent chapter locking: the existing sidebar checkbox is the only control.
    document.documentElement.classList.remove("bali-story-progressive");
    document.querySelectorAll(".lux-part.bali-story-concealed").forEach(function (p) {
      p.classList.remove("bali-story-concealed");
    });
    // Keep interactive itinerary-map clicks independent of its chapter header.
    document.querySelectorAll(".lux-part > .lux-part-head .trip-overview").forEach(function (map) {
      map.addEventListener("click", function (e) { e.stopPropagation(); });
      map.addEventListener("keydown", function (e) { e.stopPropagation(); });
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once:true });
  } else init();
})();
