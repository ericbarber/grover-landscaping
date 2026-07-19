import { useEffect, useRef, useState } from 'react';

export function NetworkStatusBanner() {
  const [status, setStatus] = useState<'online' | 'offline' | 'recovered'>(
    () => navigator.onLine ? 'online' : 'offline',
  );
  const recoveryTimeout = useRef<number | null>(null);

  useEffect(() => {
    const clearRecoveryTimeout = () => {
      if (recoveryTimeout.current !== null) {
        window.clearTimeout(recoveryTimeout.current);
        recoveryTimeout.current = null;
      }
    };
    const markOnline = () => {
      clearRecoveryTimeout();
      setStatus('recovered');
      recoveryTimeout.current = window.setTimeout(() => setStatus('online'), 4_000);
    };
    const markOffline = () => {
      clearRecoveryTimeout();
      setStatus('offline');
    };
    window.addEventListener('online', markOnline);
    window.addEventListener('offline', markOffline);
    return () => {
      clearRecoveryTimeout();
      window.removeEventListener('online', markOnline);
      window.removeEventListener('offline', markOffline);
    };
  }, []);

  if (status === 'online') return null;

  return (
    <div
      className={`fixed inset-x-0 top-0 z-50 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg ${
        status === 'offline' ? 'bg-amber-900' : 'bg-emerald-800'
      }`}
      role="status"
    >
      {status === 'offline'
        ? 'You are offline. Saved screens remain available, but syncing and new loads will wait.'
        : 'Back online. New loads and syncing are available again.'}
    </div>
  );
}
