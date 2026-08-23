export const PROVIDER_ENTRY_PATH = '/providers/start';

export type ProviderEntryPath = 'owner-operator' | 'company-owner' | 'team-invitation' | 'owner-invitation';

export function isProviderEntryPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return normalized === PROVIDER_ENTRY_PATH;
}

export function providerWorkspaceHref(path: Extract<ProviderEntryPath, 'owner-operator' | 'company-owner'>): string {
  return `/app?provider-entry=${path}`;
}

export function providerEntryModeFromSearch(search: string): Extract<ProviderEntryPath, 'owner-operator' | 'company-owner'> | null {
  const value = new URLSearchParams(search).get('provider-entry');
  return value === 'owner-operator' || value === 'company-owner' ? value : null;
}
