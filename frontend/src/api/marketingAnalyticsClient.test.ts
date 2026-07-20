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
});
