import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../api/baseUrl';

type ApiCheck = 'checking' | 'ready' | 'unavailable';

function installedDisplayMode() {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function DiagnosticRow({
  label,
  value,
  healthy,
}: {
  label: string;
  value: string;
  healthy: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200 py-3 last:border-0">
      <dt className="font-semibold text-slate-700">{label}</dt>
      <dd className={`text-right font-bold ${healthy ? 'text-emerald-700' : 'text-amber-800'}`}>
        {value}
      </dd>
    </div>
  );
}

export function MobileDiagnosticsPage() {
  const [apiCheck, setApiCheck] = useState<ApiCheck>('checking');
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  async function runApiCheck() {
    setApiCheck('checking');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5_000);
    try {
      const response = await fetch(`${API_BASE_URL}/health/ready`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      setApiCheck(response.ok ? 'ready' : 'unavailable');
    } catch {
      setApiCheck('unavailable');
    } finally {
      window.clearTimeout(timeout);
      setCheckedAt(new Date());
    }
  }

  useEffect(() => {
    void runApiCheck();
  }, []);

  const workerSupported = 'serviceWorker' in navigator;
  const workerControlsPage = Boolean(navigator.serviceWorker?.controller);
  const apiReady = apiCheck === 'ready';

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950">
      <section className="mx-auto max-w-xl">
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-800">Grover Field</p>
        <h1 className="mt-1 text-3xl font-black">Mobile diagnostics</h1>
        <p className="mt-2 text-slate-600">
          Use these checks when the app will not load, sync, or install correctly on this phone.
        </p>

        <dl className="mt-6 rounded-2xl bg-white px-5 shadow-sm">
          <DiagnosticRow
            healthy={navigator.onLine}
            label="Browser network"
            value={navigator.onLine ? 'Online' : 'Offline'}
          />
          <DiagnosticRow
            healthy={apiReady}
            label="Grover API"
            value={apiCheck === 'checking' ? 'Checking…' : apiReady ? 'Ready' : 'Unavailable'}
          />
          <DiagnosticRow
            healthy={window.isSecureContext}
            label="Secure connection"
            value={window.isSecureContext ? 'Available' : 'Not available'}
          />
          <DiagnosticRow
            healthy={workerSupported}
            label="Offline shell support"
            value={workerSupported ? 'Supported' : 'Not supported'}
          />
          <DiagnosticRow
            healthy={workerControlsPage}
            label="Offline shell active"
            value={workerControlsPage ? 'Active' : 'Not active'}
          />
          <DiagnosticRow
            healthy={installedDisplayMode()}
            label="Home-screen app"
            value={installedDisplayMode() ? 'Installed mode' : 'Browser mode'}
          />
        </dl>

        <p className="mt-3 text-xs text-slate-500">
          API: {API_BASE_URL}
          {checkedAt ? ` · Checked ${checkedAt.toLocaleTimeString()}` : ''}
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            className="min-h-12 rounded-xl bg-emerald-800 px-5 font-bold text-white"
            disabled={apiCheck === 'checking'}
            onClick={() => void runApiCheck()}
            type="button"
          >
            {apiCheck === 'checking' ? 'Checking…' : 'Run checks again'}
          </button>
          <a
            className="grid min-h-12 place-items-center rounded-xl border border-slate-400 bg-white px-5 font-bold text-slate-800"
            href="/"
          >
            Return to app
          </a>
        </div>
      </section>
    </main>
  );
}
