import { useEffect, useState } from 'react';

export function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 bg-amber-900 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg"
      role="status"
    >
      You are offline. Saved screens remain available, but syncing and new loads will wait.
    </div>
  );
}
