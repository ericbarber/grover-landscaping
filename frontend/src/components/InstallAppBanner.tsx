import { useEffect, useState } from 'react';
import { FIELD_APP_DISPLAY_NAME } from '../appIdentity';

const LEGACY_DISMISSED_KEY = 'yardfolio-install-guidance-dismissed';
const REMIND_AFTER_KEY = 'yardfolio-install-guidance-remind-after';
const SAVED_KEY = 'yardfolio-install-guidance-saved';
export const INSTALL_REMINDER_DELAY_MS = 7 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIosDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
}

function storageValue(storageName: 'localStorage' | 'sessionStorage', key: string) {
  try {
    return window[storageName].getItem(key);
  } catch {
    return null;
  }
}

export function installReminderIsDue(remindAfter: string | null, now = Date.now()) {
  if (!remindAfter) return true;
  const reminderTime = Number(remindAfter);
  return !Number.isFinite(reminderTime) || reminderTime <= now;
}

function wasSaved() {
  return storageValue('localStorage', SAVED_KEY) === 'true';
}

function shouldOfferInstall() {
  const dismissedThisSession = storageValue('sessionStorage', LEGACY_DISMISSED_KEY)
    === 'true';
  return !dismissedThisSession
    && !wasSaved()
    && installReminderIsDue(storageValue('localStorage', REMIND_AFTER_KEY));
}

function rememberSaved() {
  try {
    window.localStorage.setItem(SAVED_KEY, 'true');
    window.localStorage.removeItem(REMIND_AFTER_KEY);
  } catch {
    // Installed display mode still prevents the guidance from returning when storage is unavailable.
  }
}

function scheduleReminder() {
  try {
    window.localStorage.setItem(
      REMIND_AFTER_KEY,
      String(Date.now() + INSTALL_REMINDER_DELAY_MS),
    );
  } catch {
    // The guidance may return during a later browsing session when storage is unavailable.
  }
}

export function InstallAppBanner() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(
    () => shouldOfferInstall() && !isStandalone() && isIosDevice(),
  );

  useEffect(() => {
    if (isStandalone() || wasSaved()) return;

    const offerInstall = (event: Event) => {
      event.preventDefault();
      if (shouldOfferInstall()) setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const markInstalled = () => {
      rememberSaved();
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

  function remindLater() {
    scheduleReminder();
    setInstallPrompt(null);
    setShowIosGuide(false);
  }

  function confirmSaved() {
    rememberSaved();
    setShowIosGuide(false);
  }

  async function install() {
    if (!installPrompt || isInstalling) return;
    setIsInstalling(true);
    setInstallError(null);
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setInstallPrompt(null);
      if (choice.outcome === 'accepted') {
        rememberSaved();
        setShowIosGuide(false);
      } else {
        remindLater();
      }
    } catch {
      setInstallError('The installer did not open. Try again or use your browser menu.');
    } finally {
      setIsInstalling(false);
    }
  }

  if (!installPrompt && !showIosGuide) return null;

  return (
    <aside aria-labelledby="install-app-title" className="fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-50 rounded-xl bg-emerald-950 p-4 text-sm text-white shadow-xl sm:left-auto sm:right-4 sm:max-w-sm lg:bottom-3">
      <p className="font-bold" id="install-app-title">Install {FIELD_APP_DISPLAY_NAME}</p>
      <p className="mt-1 text-emerald-100">
        {installPrompt
          ? 'Save the app to this device for quicker access and a full-screen workspace.'
          : 'In Safari, tap Share, choose Add to Home Screen, then tap Add.'}
      </p>
      {installError && <p className="mt-2 text-xs font-semibold text-amber-200" role="status">{installError}</p>}
      <div className="mt-3 flex flex-col gap-2 min-[380px]:flex-row">
        {installPrompt && (
          <button
            className="min-h-11 flex-1 rounded-lg bg-white px-4 font-bold text-emerald-950 disabled:cursor-wait disabled:opacity-70"
            disabled={isInstalling}
            onClick={() => void install()}
            type="button"
          >
            {isInstalling ? 'Opening installer…' : 'Install app'}
          </button>
        )}
        {showIosGuide && (
          <button
            className="min-h-11 flex-1 rounded-lg bg-white px-4 font-bold text-emerald-950"
            onClick={confirmSaved}
            type="button"
          >
            I’ve saved it
          </button>
        )}
        <button
          className="min-h-11 flex-1 rounded-lg border border-white/70 px-4 font-bold"
          onClick={remindLater}
          type="button"
        >
          Remind me later
        </button>
      </div>
      <p className="mt-2 text-xs text-emerald-200">Reminders wait seven days.</p>
    </aside>
  );
}
