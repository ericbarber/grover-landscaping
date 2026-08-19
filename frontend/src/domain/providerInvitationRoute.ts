export const PROVIDER_INVITATION_PATH = '/app/provider-invitation';

export function isProviderInvitationPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return normalized === PROVIDER_INVITATION_PATH;
}

export function providerInvitationTokenFromFragment(fragment: string): string | null {
  const value = new URLSearchParams(fragment.replace(/^#/, '')).get('invitation')?.trim();
  return value && value.length <= 512 ? value : null;
}
