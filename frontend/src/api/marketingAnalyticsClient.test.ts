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

  it('records only a bounded setup stage while preserving campaign attribution', async () => {
    vi.resetModules();
    const fetchMock = vi.fn((_input: RequestInfo | URL, _request?: RequestInit) => (
      Promise.resolve({ ok: true })
    ));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('window', {
      sessionStorage: { getItem: () => null, setItem: () => undefined },
      crypto: { randomUUID: () => 'setup-session' },
      location: {
        pathname: '/app',
        search: '?provider-entry=company-owner&utm_source=search&utm_campaign=phoenix',
      },
    });
    const { trackMarketingEvent } = await import('./marketingAnalyticsClient');
    trackMarketingEvent('setup_stage_completed', 'landscaping_company', 'first_route');

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, request] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(request?.body))).toEqual(expect.objectContaining({
      event_name: 'setup_stage_completed',
      persona: 'landscaping_company',
      detail: 'first_route',
      source: 'search',
      campaign: 'phoenix',
    }));
    vi.unstubAllGlobals();
  });
});
