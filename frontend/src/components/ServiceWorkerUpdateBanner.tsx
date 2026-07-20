import { useEffect, useState } from 'react';

export function ServiceWorkerUpdateBanner() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      setRegistration((event as CustomEvent<ServiceWorkerRegistration>).detail);
    };
    window.addEventListener('grover-service-worker-update', handleUpdate);
    return () => window.removeEventListener('grover-service-worker-update', handleUpdate);
  }, []);

  function applyUpdate() {
    const worker = registration?.waiting;
    if (!worker) return;
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });
    worker.postMessage({ type: 'SKIP_WAITING' });
  }

  if (!registration) return null;

  return (
    <aside className="fixed inset-x-3 bottom-[calc(11rem+env(safe-area-inset-bottom))] z-50 rounded-xl bg-blue-950 p-4 text-sm text-white shadow-xl sm:left-auto sm:right-4 sm:max-w-sm lg:bottom-24">
      <p className="font-bold">A Grover Field update is ready</p>
      <p className="mt-1 text-blue-100">
        Finish any unsaved work, then reload into the latest version.
      </p>
      <button
        className="mt-3 min-h-11 w-full rounded-lg border border-white/70 bg-white/10 px-4 font-bold"
        onClick={applyUpdate}
        type="button"
      >
        Update and reload
      </button>
    </aside>
  );
}
