/* Protect native page wheel scrolling over live Maps/Street View iframes.
   Maps remain live; visitors explicitly toggle pointer interaction when needed. */
(function () {
  "use strict";
  function isGoogleEmbed(frame) {
    var src = frame.getAttribute("src") || "";
    return /^(https?:)?\/\/(?:www\.)?(?:maps\.google\.com|google\.com\/maps)/i.test(src) ||
      (frame.title || "").indexOf("Google Street View") >= 0;
  }
  function setup(frame) {
    if (!frame || !frame.isConnected || !isGoogleEmbed(frame) || frame.dataset.baliWheelGuard === "1") return;
    var wrapper = frame.parentElement;
    if (!wrapper || wrapper.classList.contains("bali-wheel-map-control")) return;
    frame.dataset.baliWheelGuard = "1";
    wrapper.classList.add("bali-wheel-map-control");
    var button = document.createElement("button");
    button.type = "button";
    button.className = "bali-wheel-map-toggle";
    button.setAttribute("aria-pressed", "false");
    button.textContent = "Ovládat mapu";
    if (wrapper.closest(".sv-stage")) button.textContent = "Ovládat Street View";
    function enable(yes) {
      wrapper.classList.toggle("bali-wheel-map-active", yes);
      button.setAttribute("aria-pressed", String(yes));
      button.textContent = yes ? "Zpět na posouvání stránky" :
        (wrapper.closest(".sv-stage") ? "Ovládat Street View" : "Ovládat mapu");
    }
    button.addEventListener("click", function(e) { e.preventDefault(); e.stopPropagation(); enable(!wrapper.classList.contains("bali-wheel-map-active")); });
    wrapper.addEventListener("keydown", function(e) {
      if (e.key === "Escape" && wrapper.classList.contains("bali-wheel-map-active")) {
        enable(false); button.focus(); e.stopPropagation();
      }
    });
    wrapper.appendChild(button);
  }
  function scan(node) {
    if (node.nodeType !== 1 && node.nodeType !== 9) return;
    if (node.tagName === "IFRAME") setup(node);
    if (node.querySelectorAll) node.querySelectorAll("iframe").forEach(setup);
  }
  function boot() {
    scan(document);
    var queued = false;
    new MutationObserver(function(records) {
      if (queued || !records.some(function(r) {
        return Array.prototype.some.call(r.addedNodes || [], function(n) {
          return n.nodeType === 1 && (n.tagName === "IFRAME" || n.querySelector && n.querySelector("iframe"));
        });
      })) return;
      queued = true;
      requestAnimationFrame(function() { queued = false; scan(document); });
    }).observe(document.body,{childList:true,subtree:true});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();
