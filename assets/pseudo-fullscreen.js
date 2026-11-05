/* Bali 2027: CSS-only immersive mode. Never calls requestFullscreen(). */
(function () {
  'use strict';
  var root = document.documentElement;
  var selector = '.page-fullscreen-btn, [onclick*="togglePageFullscreen"]';

  function isActive() {
    return root.classList.contains('bali-pseudo-fullscreen');
  }
  function updateButtons() {
    document.querySelectorAll(selector).forEach(function (button) {
      var active = isActive();
      button.setAttribute('aria-pressed', String(active));
      button.setAttribute('aria-label', active ? 'Vypnout režim rozšířeného zobrazení' : 'Zapnout režim rozšířeného zobrazení');
      button.textContent = active ? '⛶ Vypnout rozšířené zobrazení' : '⛶ Rozšířit zobrazení';
      button.setAttribute('title', active ? 'Vrátit běžné zobrazení' : 'Rozšířené zobrazení bez hlášky Chromu');
    });
  }
  function setActive(active) {
    root.classList.toggle('bali-pseudo-fullscreen', !!active);
    updateButtons();
    return !!active;
  }
  function toggle() {
    return setActive(!isActive());
  }
  // Replace any old inline handler after all existing bundles have loaded.
  window.togglePageFullscreen = toggle;

  // Capture clicks before existing handlers, including inline onclick.
  document.addEventListener('click', function (event) {
    var target = event.target.closest && event.target.closest(selector);
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    toggle();
  }, true);

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isActive()) setActive(false);
  });

  // If a legacy change listener updates button labels, keep our label accurate.
  document.addEventListener('fullscreenchange', updateButtons);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateButtons, { once: true });
  } else {
    updateButtons();
  }
})();
