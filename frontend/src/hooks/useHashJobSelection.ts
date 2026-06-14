import { useEffect } from 'react';

function readJobIdFromHash(): string | null {
  const hash = window.location.hash.replace(/^#/, '');

  if (!hash.startsWith('job-')) {
    return null;
  }

  return hash.replace(/^job-/, '');
}

export function useHashJobSelection(onSelectJob: (jobId: string) => void) {
  useEffect(() => {
    function syncHashSelection() {
      const jobId = readJobIdFromHash();

      if (jobId) {
        onSelectJob(jobId);
      }
    }

    syncHashSelection();
    window.addEventListener('hashchange', syncHashSelection);

    return () => {
      window.removeEventListener('hashchange', syncHashSelection);
    };
  }, [onSelectJob]);
}
