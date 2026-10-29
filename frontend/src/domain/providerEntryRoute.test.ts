import { describe, expect, it } from 'vitest';
import {
  isProviderEntryPath,
  PROVIDER_ENTRY_PATH,
  providerEntryHref,
  providerEntryModeFromSearch,
  providerWorkspaceHref,
} from './providerEntryRoute';

describe('provider entry route', () => {
  it('recognizes only the dedicated public entry path', () => {
    expect(PROVIDER_ENTRY_PATH).toBe('/providers/start');
    expect(isProviderEntryPath('/providers/start')).toBe(true);
    expect(isProviderEntryPath('/providers/start/')).toBe(true);
    expect(isProviderEntryPath('/app/provider-invitation')).toBe(false);
  });

  it('carries the selected provider path into authenticated setup', () => {
    expect(providerWorkspaceHref('owner-operator')).toBe('/app?provider-entry=owner-operator');
    expect(providerWorkspaceHref('company-owner')).toBe('/app?provider-entry=company-owner');
    expect(providerEntryModeFromSearch('?provider-entry=owner-operator')).toBe('owner-operator');
    expect(providerEntryModeFromSearch('?provider-entry=company-owner&utm_source=review')).toBe('company-owner');
    expect(providerEntryModeFromSearch('?provider-entry=crew-member')).toBeNull();
  });

  it('preserves only bounded campaign attribution through provider setup', () => {
    const search = '?utm_source=google&utm_medium=cpc&utm_campaign=phoenix_launch&token=secret';
    expect(providerEntryHref(search)).toBe(
      '/providers/start?utm_source=google&utm_medium=cpc&utm_campaign=phoenix_launch',
    );
    expect(providerWorkspaceHref('company-owner', search)).toBe(
      '/app?utm_source=google&utm_medium=cpc&utm_campaign=phoenix_launch&provider-entry=company-owner',
    );
    expect(providerWorkspaceHref('owner-operator', '?utm_source=')).toBe(
      '/app?provider-entry=owner-operator',
    );
  });
});
