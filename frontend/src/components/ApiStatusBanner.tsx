import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../api/baseUrl';

export function ApiStatusBanner() {
  const [status, setStatus] = useState<'ready' | 'unavailable' | 'recovered'>('ready');
  const wasUnavailable = useRef(false);
  const recoveryTimeout = useRef<number | null>(null);

  useEffect(() => {
    let disposed = false;
    let timeout: number | null = null;

    const markReady = () => {
      if (recoveryTimeout.current !== null) {
        window.clearTimeout(recoveryTimeout.current);
        recoveryTimeout.current = null;
      }
      if (wasUnavailable.current) {
        wasUnavailable.current = false;
        setStatus('recovered');
        recoveryTimeout.current = window.setTimeout(() => setStatus('ready'), 4_000);
      } else {
        setStatus('ready');
      }
    };
    const markUnavailable = () => {
      if (recoveryTimeout.current !== null) {
        window.clearTimeout(recoveryTimeout.current);
        recoveryTimeout.current = null;
      }
      wasUnavailable.current = true;
      setStatus('unavailable');
    };

    async function checkReadiness() {
      if (document.hidden) return;
      if (!navigator.onLine) {
        wasUnavailable.current = false;
        setStatus('ready');
        return;
      }
      const controller = new AbortController();
      timeout = window.setTimeout(() => controller.abort(), 5_000);
      try {
        const response = await fetch(`${API_BASE_URL}/health/ready`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!disposed) {
          if (response.ok) markReady();
          else markUnavailable();
        }
      } catch {
        if (!disposed && navigator.onLine) markUnavailable();
      } finally {
        if (timeout !== null) window.clearTimeout(timeout);
      }
    }

    const interval = window.setInterval(() => void checkReadiness(), 30_000);
    const handleOnline = () => void checkReadiness();
    const handleOffline = () => {
      wasUnavailable.current = false;
      setStatus('ready');
    };
    const handleVisibilityChange = () => {
      if (!document.hidden) void checkReadiness();
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    void checkReadiness();
    return () => {
      disposed = true;
      if (timeout !== null) window.clearTimeout(timeout);
      if (recoveryTimeout.current !== null) window.clearTimeout(recoveryTimeout.current);
      window.clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (status === 'ready') return null;

  return (
    <div
      className={`fixed inset-x-0 top-0 z-40 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg ${
        status === 'unavailable' ? 'bg-red-800' : 'bg-emerald-800'
      }`}
      role="status"
    >
      {status === 'unavailable'
        ? 'The Grover API is temporarily unavailable. This screen will retry automatically.'
        : 'The Grover API is available again. Syncing and new requests can resume.'}
    </div>
  );
}
