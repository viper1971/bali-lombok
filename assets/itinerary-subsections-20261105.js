/* Reveal an existing, tested itinerary accordion only after its subsection opens.
   This preserves its original map, slideshow and Street View initialization. */
(function () {
  'use strict';
  function reveal(details) {
    if (!details.open) return;
    var trigger = details.querySelector('.lux-acc-btn[aria-controls]');
    if (!trigger) return;
    if (trigger.getAttribute('aria-expanded') !== 'true') trigger.click();
  }
  function init() {
    document.querySelectorAll('details.bali-itinerary-subsection').forEach(function (details) {
      details.addEventListener('toggle', function () { reveal(details); });
      if (details.open) reveal(details);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
