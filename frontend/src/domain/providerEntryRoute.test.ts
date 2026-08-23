import { describe, expect, it } from 'vitest';
import {
  isProviderEntryPath,
  PROVIDER_ENTRY_PATH,
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
});
