/* BALI 2027: Street View loads when genuinely visible; no wheel/scroll handlers.
   Limits concurrent Google iframe loading to protect native page scrolling. */
(function () {
  "use strict";
  if (window.__baliStreetViewAutoload) return;
  window.__baliStreetViewAutoload = true;

  var stages = [];
  var active = new Map();
  var pending = new Set();
  var failures = new Set();
  var loading = 0;
  var maxConcurrent = 1;
  var maxLoaded = 4;
  var entering = null;
  var leaving = null;

  function canDisplay(stage) {
    if (!stage || !stage.isConnected || !stage.id || !stage.getAttribute("data-sv-url")) return false;
    if (stage.closest(".lux-part:not(.is-open),.lux-fold:not(.is-open),.hotel-inactive,[inert]")) return false;
    var alternative = stage.closest(".alt-hotels-collapse");
    if (alternative && !alternative.classList.contains("open")) return false;
    return stage.getClientRects().length > 0;
  }

  function distanceFromViewport(stage) {
    var rect = stage.getBoundingClientRect();
    if (rect.top > window.innerHeight) return rect.top - window.innerHeight;
    if (rect.bottom < 0) return -rect.bottom;
    return 0;
  }

  function evictIfNeeded(incoming) {
    if (active.size < maxLoaded) return;
    var victim = null;
    var farthest = -1;
    active.forEach(function (_when, stage) {
      if (stage === incoming) return;
      var distance = distanceFromViewport(stage);
      if (distance > farthest) { farthest = distance; victim = stage; }
    });
    if (victim && typeof window.svUnload === "function") {
      try { window.svUnload(victim.id); } catch (_) {}
      active.delete(victim);
    }
  }

  function pump() {
    if (loading >= maxConcurrent || !pending.size || typeof window.svLoad !== "function") return;
    var next = null;
    var shortest = Infinity;
    pending.forEach(function (stage) {
      if (!canDisplay(stage) || failures.has(stage) || active.has(stage) ||
          stage.classList.contains("is-loaded") || stage.classList.contains("is-loading")) {
        pending.delete(stage);
        return;
      }
      var distance = distanceFromViewport(stage);
      if (distance < shortest) { shortest = distance; next = stage; }
    });
    if (!next) return;
    pending.delete(next);
    // Do not load offscreen iframe just because a parent accordion was opened.
    if (shortest > 200) return;
    evictIfNeeded(next);
    var ok = false;
    try { ok = !!window.svLoad(next.id); } catch (_) {}
    if (!ok) { failures.add(next); pump(); return; }
    loading += 1;
    active.set(next, Date.now());
    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      loading = Math.max(0, loading - 1);
      if (next.classList.contains("is-failed")) {
        failures.add(next);
        active.delete(next);
      }
      pump();
    }
    next.addEventListener("sv:request-finished", finish, { once: true });
    // Fallback in case an old embedded script did not emit completion.
    setTimeout(finish, 22000);
  }

  function enqueue(stage) {
    if (!canDisplay(stage) || active.has(stage) || failures.has(stage)) return;
    if (stage.classList.contains("is-loaded") || stage.classList.contains("is-loading")) return;
    pending.add(stage);
    pump();
  }

  function init() {
    if (!("IntersectionObserver" in window)) return;
    stages = Array.from(document.querySelectorAll(".sv-stage[data-sv-url]"));
    if (!stages.length) return;

    entering = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) enqueue(entry.target);
        else pending.delete(entry.target);
      });
    }, { rootMargin: "100px 0px", threshold: 0.01 });

    leaving = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) return;
        var stage = entry.target;
        // Keep nearby panoramas loaded; unload only far away to limit RAM.
        if (active.has(stage) && typeof window.svUnload === "function") {
          try { window.svUnload(stage.id); } catch (_) {}
          active.delete(stage);
        }
      });
    }, { rootMargin: "1300px 0px", threshold: 0 });

    stages.forEach(function (stage) {
      entering.observe(stage);
      leaving.observe(stage);
      stage.addEventListener("click", function (e) {
        if (e.target.closest(".sv-play")) {
          // Native button onclick still handles manual activation.
          failures.delete(stage);
        }
      });
    });
    // No scroll handlers, timers polling DOM geometry or mutation observers.
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
