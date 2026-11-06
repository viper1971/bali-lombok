/* BALI 2027 — One toggle for all itinerary disclosures.
   Keeps reading progress, hotel selections and page scroll untouched. */
(function () {
  "use strict";

  function root() {
    return document.getElementById("hlavni-obsah") || document;
  }

  function containsOpen() {
    return !!root().querySelector(
      ".lux-fold.is-open, .lux-part.is-open, details[open], " +
      ".alt-hotels-collapse.open, .acc.open, .lux-acc-btn[aria-expanded='true']"
    );
  }

  function setFold(fold, opened) {
    fold.classList.toggle("is-open", opened);
    fold.classList.toggle("is-settled", opened);
    fold.classList.remove("no-anim");
    var body = fold.querySelector(":scope > .lux-fold-body");
    if (body) {
      if (opened) body.removeAttribute("inert");
      else body.setAttribute("inert", "");
    }
    var button = fold.querySelector(":scope > .lux-fold-h .lux-fold-btn");
    if (button) button.setAttribute("aria-expanded", opened ? "true" : "false");
  }

  function setPart(part, opened) {
    part.classList.toggle("is-open", opened);
    var header = part.querySelector(":scope > .lux-part-head");
    if (header) header.setAttribute("aria-expanded", opened ? "true" : "false");
  }

  function setHotelAlternatives(opened) {
    root().querySelectorAll(".alt-hotels-collapse").forEach(function (panel) {
      panel.classList.toggle("open", opened);
      var stage = panel.id && panel.id.replace(/^collapse-/, "");
      var button = stage && document.getElementById("btn-toggle-" + stage);
      if (!button) return;
      button.setAttribute("aria-expanded", opened ? "true" : "false");
      var icon = button.querySelector(".arrow-indicator");
      if (icon) icon.textContent = opened ? "▲" : "▼";
    });
  }

  function setSmallAccordions(opened) {
    root().querySelectorAll(".acc").forEach(function (acc) {
      acc.classList.toggle("open", opened);
      var content = acc.querySelector(".acc-content");
      if (content) content.style.maxHeight = opened ? "none" : "0px";
    });
  }

  function setNestedAccordions(opened) {
    root().querySelectorAll(".lux-acc-btn").forEach(function (button) {
      var active = button.getAttribute("aria-expanded") === "true";
      // Reuse existing click handlers so the content, icon and associated
      // hotel map/photo components remain in sync.
      if (active !== opened) {
        try { button.click(); } catch (_) {}
      }
    });
  }

  function setAll(opened) {
    var scope = root();
    // Do not invoke 300 individual luxToggle calls: they schedule animations.
    // Change all sections directly and then save the resulting state once.
    scope.querySelectorAll(".lux-part").forEach(function (part) {
      setPart(part, opened);
    });
    scope.querySelectorAll(".lux-fold").forEach(function (fold) {
      setFold(fold, opened);
    });
    scope.querySelectorAll("details").forEach(function (details) {
      details.open = opened;
    });
    setHotelAlternatives(opened);
    setSmallAccordions(opened);
    // Opening details.bali-itinerary-subsection may itself open its child
    // accordion in an asynchronous toggle handler. Reconcile afterwards.
    setNestedAccordions(opened);

    try {
      if (opened) {
        localStorage.setItem("lux_open_part_v1", "all");
        localStorage.setItem("lux_open_folds_v1", JSON.stringify(
          Array.from(scope.querySelectorAll(".lux-fold.is-open"), function (fold) { return fold.id; }).filter(Boolean)
        ));
      } else {
        localStorage.removeItem("lux_open_part_v1");
        localStorage.setItem("lux_open_folds_v1", "[]");
      }
    } catch (_) {}
  }

  function syncLabel(button) {
    var opened = containsOpen();
    button.textContent = opened ? "▴ Zavřít vše" : "▾ Otevřít vše";
    button.title = opened ? "Zavřít všechny otevřené kapitoly a podsekce" :
      "Otevřít všechny kapitoly a podsekce";
    button.setAttribute("aria-label", button.title);
    button.setAttribute("aria-pressed", String(opened));
  }

  function init() {
    var button = document.getElementById("baliCloseAllAccordions");
    if (!button || button.dataset.bound === "1") return;
    button.dataset.bound = "1";

    var busy = false;
    button.addEventListener("click", function (event) {
      event.preventDefault();
      if (busy) return;
      busy = true;
      var opened = !containsOpen();
      setAll(opened);
      syncLabel(button);
      // Wait for native details toggle handlers to synchronize nested panels.
      setTimeout(function () {
        setNestedAccordions(opened);
        syncLabel(button);
        busy = false;
      }, 120);
    });

    var scheduled = false;
    function scheduleSync() {
      if (scheduled || busy) return;
      scheduled = true;
      requestAnimationFrame(function () {
        scheduled = false;
        if (!busy) syncLabel(button);
      });
    }
    // Manual section toggles also update the button; no scroll listener.
    document.addEventListener("click", function (event) {
      if (event.target.closest(".lux-fold-btn,.lux-part-head,.lux-acc-btn,.acc-header,.acc-trigger,.alt-hotels-collapse,summary")) {
        setTimeout(scheduleSync, 0);
      }
    }, true);
    document.addEventListener("toggle", scheduleSync, true);
    syncLabel(button);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else init();
})();
