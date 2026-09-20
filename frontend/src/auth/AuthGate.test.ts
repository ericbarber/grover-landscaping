import { describe, expect, it } from 'vitest';
import { authGateShowsEnvironmentChrome, authGateState } from './AuthGate';

describe('authentication and access gate state', () => {
  it('keeps protected work hidden through authentication and access verification', () => {
    expect(authGateState({
      loading: true,
      error: null,
      authenticated: false,
      accessStatus: 'idle',
    })).toBe('authentication-loading');
    expect(authGateState({
      loading: false,
      error: null,
      authenticated: true,
      accessStatus: 'loading',
    })).toBe('access-loading');
  });

  it('distinguishes sign-in, authentication failure, and access failure', () => {
    expect(authGateState({
      loading: false,
      error: null,
      authenticated: false,
      accessStatus: 'idle',
    })).toBe('signed-out');
    expect(authGateState({
      loading: false,
      error: 'configuration unavailable',
      authenticated: false,
      accessStatus: 'idle',
    })).toBe('authentication-error');
    expect(authGateState({
      loading: false,
      error: null,
      authenticated: true,
      accessStatus: 'unavailable',
    })).toBe('access-unavailable');
  });

  it('opens the application only after access verification succeeds', () => {
    expect(authGateState({
      loading: false,
      error: null,
      authenticated: true,
      accessStatus: 'ready',
    })).toBe('ready');
  });

  it('keeps diagnostic identity chrome out of the hosted application shell', () => {
    expect(authGateShowsEnvironmentChrome('local_review')).toBe(true);
    expect(authGateShowsEnvironmentChrome('disabled')).toBe(true);
    expect(authGateShowsEnvironmentChrome('cognito')).toBe(false);
  });
});
