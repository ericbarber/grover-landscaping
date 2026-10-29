export const PROVIDER_ENTRY_PATH = '/providers/start';

export type ProviderEntryPath = 'owner-operator' | 'company-owner' | 'team-invitation' | 'owner-invitation';

export function isProviderEntryPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return normalized === PROVIDER_ENTRY_PATH;
}

function approvedAttributionParams(search: string): URLSearchParams {
  const source = new URLSearchParams(search);
  const approved = new URLSearchParams();
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
    const value = source.get(key)?.trim();
    if (value) approved.set(key, value.slice(0, 120));
  }
  return approved;
}

export function providerEntryHref(search = ''): string {
  const attribution = approvedAttributionParams(search).toString();
  return attribution ? `${PROVIDER_ENTRY_PATH}?${attribution}` : PROVIDER_ENTRY_PATH;
}

export function providerWorkspaceHref(
  path: Extract<ProviderEntryPath, 'owner-operator' | 'company-owner'>,
  search = '',
): string {
  const params = approvedAttributionParams(search);
  params.set('provider-entry', path);
  return `/app?${params.toString()}`;
}

export function providerEntryModeFromSearch(search: string): Extract<ProviderEntryPath, 'owner-operator' | 'company-owner'> | null {
  const value = new URLSearchParams(search).get('provider-entry');
  return value === 'owner-operator' || value === 'company-owner' ? value : null;
}
