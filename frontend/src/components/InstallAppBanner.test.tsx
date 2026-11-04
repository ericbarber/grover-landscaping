import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  INSTALL_REMINDER_DELAY_MS,
  InstallAppBanner,
  installReminderIsDue,
} from './InstallAppBanner';

function storage(values: Record<string, string> = {}): Storage {
  return {
    clear: vi.fn(),
    getItem: vi.fn((key: string) => values[key] ?? null),
    key: vi.fn(),
    length: Object.keys(values).length,
    removeItem: vi.fn(),
    setItem: vi.fn(),
  };
}

function installBrowserGlobals({
  ios = true,
  standalone = false,
  localValues = {},
}: {
  ios?: boolean;
  standalone?: boolean;
  localValues?: Record<string, string>;
} = {}) {
  vi.stubGlobal('window', {
    localStorage: storage(localValues),
    matchMedia: vi.fn(() => ({ matches: standalone })),
    sessionStorage: storage(),
  });
  vi.stubGlobal('navigator', {
    maxTouchPoints: ios ? 5 : 0,
    standalone,
    userAgent: ios ? 'Mozilla/5.0 (iPhone)' : 'Mozilla/5.0 (Linux; Android 15)',
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('InstallAppBanner', () => {
  it('treats missing, expired, and malformed reminder values as due', () => {
    expect(installReminderIsDue(null, 1_000)).toBe(true);
    expect(installReminderIsDue('1000', 1_000)).toBe(true);
    expect(installReminderIsDue('not-a-time', 1_000)).toBe(true);
    expect(installReminderIsDue('1001', 1_000)).toBe(false);
    expect(INSTALL_REMINDER_DELAY_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('gives iPhone users explicit save and reminder actions', () => {
    installBrowserGlobals();

    const markup = renderToStaticMarkup(<InstallAppBanner />);

    expect(markup).toContain('Install Grover Field');
    expect(markup).toContain('Add to Home Screen');
    expect(markup).toContain('I’ve saved it');
    expect(markup).toContain('Remind me later');
    expect(markup).toContain('Reminders wait seven days.');
    expect(markup).not.toContain('Not now');
  });

  it('stays hidden while a saved reminder is still in the future', () => {
    const future = String(Date.now() + INSTALL_REMINDER_DELAY_MS);
    installBrowserGlobals({
      localValues: { 'yardfolio-install-guidance-remind-after': future },
    });

    expect(renderToStaticMarkup(<InstallAppBanner />)).toBe('');
  });

  it('stays hidden when the app is already running in standalone mode', () => {
    installBrowserGlobals({ standalone: true });

    expect(renderToStaticMarkup(<InstallAppBanner />)).toBe('');
  });
});
