import { useEffect, useState } from 'react';

const DISMISSED_KEY = 'grover-install-guidance-dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIosDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function wasDismissed() {
  try {
    return window.sessionStorage.getItem(DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function rememberDismissal() {
  try {
    window.sessionStorage.setItem(DISMISSED_KEY, 'true');
  } catch {
    // The guidance may return during this browsing session when storage is unavailable.
  }
}

export function InstallAppBanner() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(
    () => !wasDismissed() && !isStandalone() && isIosDevice(),
  );

  useEffect(() => {
    if (isStandalone() || wasDismissed()) return;

    const offerInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const markInstalled = () => {
      setInstallPrompt(null);
      setShowIosGuide(false);
    };
    window.addEventListener('beforeinstallprompt', offerInstall);
    window.addEventListener('appinstalled', markInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', offerInstall);
      window.removeEventListener('appinstalled', markInstalled);
    };
  }, []);

  function dismiss() {
    rememberDismissal();
    setInstallPrompt(null);
    setShowIosGuide(false);
  }

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (choice.outcome === 'accepted') setShowIosGuide(false);
  }

  if (!installPrompt && !showIosGuide) return null;

  return (
    <aside className="fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-50 rounded-xl bg-emerald-950 p-4 text-sm text-white shadow-xl sm:left-auto sm:right-4 sm:max-w-sm lg:bottom-3">
      <p className="font-bold">Keep Grover Field on this phone</p>
      <p className="mt-1 text-emerald-100">
        {installPrompt
          ? 'Install the app for quicker access from your home screen.'
          : 'In Safari, tap Share, then Add to Home Screen.'}
      </p>
      <div className="mt-3 flex gap-2">
        {installPrompt && (
          <button
            className="min-h-11 flex-1 rounded-lg bg-white px-4 font-bold text-emerald-950"
            onClick={() => void install()}
            type="button"
          >
            Install app
          </button>
        )}
        <button
          className="min-h-11 flex-1 rounded-lg border border-white/70 px-4 font-bold"
          onClick={dismiss}
          type="button"
        >
          Not now
        </button>
      </div>
    </aside>
  );
}
