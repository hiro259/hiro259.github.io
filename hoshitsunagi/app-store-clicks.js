/* Tracks only clicks on our three App Store links when Cloudflare Zaraz is enabled.
   Each location has its own event name so counts are visible in Zaraz Monitoring.
   Tracking is best-effort; nothing here intercepts or delays App Store navigation. */
(() => {
  'use strict';

  const events = {
    hero: 'app_store_click_hero',
    gameplay: 'app_store_click_gameplay',
    footer: 'app_store_click_footer',
  };
  const appStoreUrl = 'https://apps.apple.com/app/hoshitsunagi/id6811334455';

  document.querySelectorAll('a[data-app-store-position]').forEach((link) => {
    const position = link.dataset.appStorePosition;
    const eventName = events[position];

    // Keep the event strictly tied to the published HOSHITSUNAGI App Store URL.
    if (!eventName || link.href !== appStoreUrl) return;

    link.addEventListener('click', () => {
      const zaraz = window.zaraz;
      if (!zaraz || typeof zaraz.track !== 'function') return;

      try {
        const request = zaraz.track(eventName, {
          position: position,
          destination: 'app_store',
        });
        if (request && typeof request.catch === 'function') {
          request.catch(() => {});
        }
      } catch (_) {
        // Analytics failure must never block the App Store link.
      }
    });
  });
})();
