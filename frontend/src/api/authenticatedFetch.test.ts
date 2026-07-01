import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  authenticatedFetch,
  AuthenticationRequiredError,
  configureApiAuthentication,
} from './authenticatedFetch';

afterEach(() => {
  configureApiAuthentication(false, async () => null);
  vi.unstubAllGlobals();
});

describe('authenticatedFetch', () => {
  it('adds the current Bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuthentication(true, async () => 'access-token');

    await authenticatedFetch('https://api.example.test/jobs');

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    expect(new Headers(requestInit.headers).get('authorization')).toBe('Bearer access-token');
  });

  it('rejects protected requests without a session', async () => {
    configureApiAuthentication(true, async () => null);

    await expect(authenticatedFetch('https://api.example.test/jobs')).rejects.toBeInstanceOf(
      AuthenticationRequiredError,
    );
  });
});
