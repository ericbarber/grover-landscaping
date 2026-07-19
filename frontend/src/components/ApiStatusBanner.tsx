import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../api/baseUrl';

export function ApiStatusBanner() {
  const [isUnavailable, setIsUnavailable] = useState(false);

  useEffect(() => {
    let disposed = false;
    let timeout: number | null = null;

    async function checkReadiness() {
      if (!navigator.onLine) {
        setIsUnavailable(false);
        return;
      }
      const controller = new AbortController();
      timeout = window.setTimeout(() => controller.abort(), 5_000);
      try {
        const response = await fetch(`${API_BASE_URL}/health/ready`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!disposed) setIsUnavailable(!response.ok);
      } catch {
        if (!disposed && navigator.onLine) setIsUnavailable(true);
      } finally {
        if (timeout !== null) window.clearTimeout(timeout);
      }
    }

    const interval = window.setInterval(() => void checkReadiness(), 30_000);
    const handleOnline = () => void checkReadiness();
    const handleOffline = () => setIsUnavailable(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    void checkReadiness();
    return () => {
      disposed = true;
      if (timeout !== null) window.clearTimeout(timeout);
      window.clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isUnavailable) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-40 bg-red-800 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg"
      role="status"
    >
      The Grover API is temporarily unavailable. This screen will retry automatically.
    </div>
  );
}
