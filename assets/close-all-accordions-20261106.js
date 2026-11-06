/* BALI 2027 — Close every open journey accordion in one action.
   Does not change read progress, hotel selection, locks or window scroll position. */
(function () {
  "use strict";

  function closeAll() {
    var root = document.getElementById("hlavni-obsah") || document;
    var count = 0;

    // Close nested scripted accordions using their existing click handlers.
    root.querySelectorAll('.lux-acc-btn[aria-expanded="true"]').forEach(function (button) {
      try { button.click(); count++; } catch (_) {}
    });

    // Native details: flight selection, sub-itineraries and other disclosures.
    root.querySelectorAll("details[open]").forEach(function (details) {
      details.open = false;
      count++;
    });

    // Close hotel variants/independent expandable groups without changing choices.
    root.querySelectorAll(".alt-hotels-collapse.open").forEach(function (el) {
      el.classList.remove("open");
      var stage = el.id && el.id.replace(/^collapse-/, "");
      var button = stage && document.getElementById("btn-toggle-" + stage);
      if (button) {
        button.setAttribute("aria-expanded", "false");
        var arrow = button.querySelector(".arrow-indicator");
        if (arrow) arrow.textContent = "▼";
      }
      count++;
    });

    root.querySelectorAll(".acc.open").forEach(function (el) {
      el.classList.remove("open");
      var content = el.querySelector(".acc-content");
      if (content) content.style.maxHeight = "0px";
      count++;
    });

    // Close fold bodies directly. Calling luxToggle 300+ times would trigger
    // expensive animations and repeatedly rewrite the page height.
    root.querySelectorAll(".lux-fold.is-open").forEach(function (fold) {
      fold.classList.remove("is-open", "is-settled", "no-anim");
      var body = fold.querySelector(":scope > .lux-fold-body");
      if (body) body.setAttribute("inert", "");
      var toggle = fold.querySelector(":scope > .lux-fold-h .lux-fold-btn");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
      count++;
    });

    root.querySelectorAll(".lux-part.is-open").forEach(function (part) {
      part.classList.remove("is-open");
      var head = part.querySelector(":scope > .lux-part-head");
      if (head) head.setAttribute("aria-expanded", "false");
      count++;
    });

    // Defensive sync for nested accordions where an inline handler is delayed.
    root.querySelectorAll(".lux-acc-btn").forEach(function (button) {
      if (button.getAttribute("aria-expanded") !== "false") button.setAttribute("aria-expanded", "false");
      var icon = button.querySelector(".lux-acc-chev");
      if (icon) icon.classList.remove("rotate");
      var id = button.getAttribute("aria-controls");
      var panel = id && document.getElementById(id);
      if (panel) panel.classList.remove("open");
    });

    try {
      localStorage.removeItem("lux_open_part_v1");
      localStorage.setItem("lux_open_folds_v1", "[]");
    } catch (_) {}

    // Leave the dashboard, its read counts and the current scroll alone.
    return count;
  }

  function init() {
    var button = document.getElementById("baliCloseAllAccordions");
    if (!button || button.dataset.bound === "1") return;
    button.dataset.bound = "1";
    button.addEventListener("click", function (event) {
      event.preventDefault();
      closeAll();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else init();
})();
