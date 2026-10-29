import { FIELD_APP_DISPLAY_NAME } from './appIdentity';

export function registerProductionServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        const announceUpdate = () => window.dispatchEvent(
          new CustomEvent('yardfolio-service-worker-update', { detail: registration }),
        );
        if (registration.waiting) announceUpdate();
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              announceUpdate();
            }
          });
        });
      })
      .catch((error: unknown) => {
        console.error(`${FIELD_APP_DISPLAY_NAME} service worker registration failed.`, error);
      });
  });
}
