import { describe, expect, it, vi } from 'vitest';

describe('marketing analytics', () => {
  it('uses a per-tab anonymous identifier without personal details', async () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
      },
      crypto: { randomUUID: () => 'event-session' },
      location: { origin: 'http://localhost:5173' },
    });
    const { marketingSessionId } = await import('./marketingAnalyticsClient');
    expect(marketingSessionId()).toBe('ms_event-session');
    expect(marketingSessionId()).toBe('ms_event-session');
    vi.unstubAllGlobals();
  });

  it('creates a compatible fallback when randomUUID is unavailable', async () => {
    vi.resetModules();
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: () => { throw new Error('storage denied'); },
        setItem: () => { throw new Error('storage denied'); },
      },
      crypto: {
        getRandomValues: (values: Uint32Array) => {
          values.set([1, 2, 3, 4]);
          return values;
        },
      },
      location: { origin: 'http://192.168.1.10:5173', search: '', pathname: '/' },
    });
    const { marketingSessionId } = await import('./marketingAnalyticsClient');
    expect(marketingSessionId()).toBe('ms_00000001000000020000000300000004');
    expect(marketingSessionId()).toBe('ms_00000001000000020000000300000004');
    vi.unstubAllGlobals();
  });
});
