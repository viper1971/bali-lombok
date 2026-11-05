/* BALI 2027 - visit-once chapter progression and predictable accordion scrolling.
   Keeps the existing luxToggle, reader progress, navigation, map and locking code. */
(function () {
  "use strict";
  var KEY = "bali_story_visited_v1";
  var chapters = [];
  var visited = Object.create(null);
  var scrollTimer = 0;
  var unveilTimer = 0;
  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");

  function folds(part) {
    return Array.prototype.slice.call(part.querySelectorAll(".lux-fold[id]:not([data-nocount])"));
  }
  function load() {
    try {
      var data = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (Array.isArray(data)) data.forEach(function (id) {
        if (typeof id === "string") visited[id] = true;
      });
    } catch (err) { /* Keep usable in private browsing. */ }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(Object.keys(visited))); }
    catch (err) { /* Storage may be disabled. */ }
  }
  function mark(fold) {
    if (!fold || !fold.id || visited[fold.id]) return;
    visited[fold.id] = true;
    save();
    refresh();
  }
  function complete(part) {
    var list = folds(part);
    return !list.length || list.every(function (fold) {
      return !!visited[fold.id] || fold.classList.contains("is-read");
    });
  }
  function refresh() {
    if (!chapters.length) return;
    var accessible = true;
    chapters.forEach(function (part, i) {
      var wasHidden = part.classList.contains("bali-story-concealed");
      part.classList.toggle("bali-story-concealed", !accessible);
      if (accessible && wasHidden) {
        part.classList.add("bali-story-next-ready");
        window.setTimeout(function () { part.classList.remove("bali-story-next-ready"); }, 470);
      }
      part.setAttribute("data-bali-story-access", accessible ? "unlocked" : "waiting");
      // Previously unlocked chapters remain navigable regardless of their current accordion state.
      if (accessible) accessible = complete(part);
    });
  }
  function offset() {
    // Sticky navigation has different heights on desktop and mobile.
    var top = 14;
    ["header.site-header", ".mg-nav", ".mg-topbar", ".top-nav", "#premiumTopNav"].forEach(function (selector) {
      var el = document.querySelector(selector);
      if (!el) return;
      var style = getComputedStyle(el), r = el.getBoundingClientRect();
      if ((style.position === "fixed" || style.position === "sticky") && r.top <= 8 && r.bottom > top && r.height < 145) {
        top = r.bottom + 10;
      }
    });
    var computed = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--stick-top")) || 0;
    return Math.max(top, Math.min(computed + 12, 125));
  }
  function scrollToFold(fold) {
    if (!fold || fold.closest(".bali-story-concealed")) return;
    var heading = fold.querySelector(":scope > .lux-fold-h") || fold;
    if (!heading.getClientRects().length) return;
    var y = Math.max(0, window.scrollY + heading.getBoundingClientRect().top - offset());
    window.scrollTo({ top: y, behavior: reducedMotion && reducedMotion.matches ? "instant" : "smooth" });
  }
  function scheduleScroll(fold, delay) {
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(function () { scrollToFold(fold); }, delay);
  }
  function onClick(e) {
    var target = e.target;
    if (!target || !target.closest) return;
    var foldBtn = target.closest(".lux-fold-btn");
    if (foldBtn) {
      var fold = foldBtn.closest(".lux-fold[id]");
      if (fold && chapters.some(function (p) { return p.contains(fold); })) {
        var opening = !fold.classList.contains("is-open");
        if (opening) {
          // Wait for existing luxToggle handler and animations, without changing its behavior.
          window.setTimeout(function () {
            if (fold.classList.contains("is-open")) {
              mark(fold);
              scheduleScroll(fold, 80);
            }
          }, 90);
        }
      }
      return;
    }
    var heading = target.closest(".lux-part > .lux-part-head");
    if (!heading) return;
    var nested = target.closest("a,button,input,select,textarea,[role=button],.trip-overview");
    if (nested && nested !== heading) return;
    var part = heading.closest(".lux-part");
    if (!part || part.classList.contains("bali-story-concealed")) return;
    var opening = !part.classList.contains("is-open");
    if (opening) {
      window.setTimeout(function () {
        if (part.classList.contains("is-open")) {
          var first = folds(part)[0];
          if (first) scheduleScroll(first, 180);
        }
      }, 320);
    }
  }
  function onKeyboard(e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var h = e.target && e.target.matches && e.target.matches(".lux-part > .lux-part-head") ? e.target : null;
    if (!h) return;
    var part = h.closest(".lux-part");
    if (!part || part.classList.contains("bali-story-concealed") || part.classList.contains("is-open")) return;
    window.setTimeout(function () {
      if (part.classList.contains("is-open")) {
        var first = folds(part)[0];
        if (first) scheduleScroll(first, 180);
      }
    }, 320);
  }
  function watch() {
    // Existing code also changes accordions programmatically (anchors, search, reader progress).
    // Track those opens so visit-once does not depend exclusively on pointer clicks.
    var observer = new MutationObserver(function (changes) {
      var dirty = false;
      changes.forEach(function (change) {
        var el = change.target;
        if (!el.matches || !el.matches(".lux-fold[id]")) return;
        if (el.classList.contains("is-open")) {
          if (!visited[el.id] && !el.closest(".bali-story-concealed")) {
            visited[el.id] = true;
            dirty = true;
          }
        }
        if (el.classList.contains("is-read")) dirty = true;
      });
      if (dirty) {
        window.clearTimeout(unveilTimer);
        unveilTimer = window.setTimeout(function () {
          save();
          refresh();
        }, 70);
      }
    });
    chapters.forEach(function (part) {
      folds(part).forEach(function (f) {
        observer.observe(f, { attributes: true, attributeFilter: ["class"] });
      });
    });
  }
  function init() {
    chapters = Array.prototype.slice.call(document.querySelectorAll(".lux-part[id]"));
    if (!chapters.length) return;
    load();
    // Honor the site's existing read progress, including older visits.
    chapters.forEach(function (part) {
      folds(part).forEach(function (fold) {
        if (fold.classList.contains("is-read")) visited[fold.id] = true;
      });
    });
    document.documentElement.classList.add("bali-story-progressive");
    refresh();
    save();
    watch();
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKeyboard, true);

    // Map belongs to the second chapter's heading; its own clicks must not collapse chapter.
    document.querySelectorAll(".lux-part > .lux-part-head .trip-overview").forEach(function (map) {
      map.addEventListener("click", function (e) { e.stopPropagation(); });
      map.addEventListener("keydown", function (e) { e.stopPropagation(); });
    });
    // A link or an existing navigation control may have opened a fold before listener registration.
    chapters.forEach(function (part) {
      folds(part).forEach(function (fold) {
        if (fold.classList.contains("is-open") && !fold.closest(".bali-story-concealed")) mark(fold);
      });
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else init();
})();
