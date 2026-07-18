const invitationPrefix = '/organization-invitations/';

export function organizationInvitationTokenFromPath(pathname: string): string | null {
  if (!pathname.startsWith(invitationPrefix)) return null;
  const remainder = pathname.slice(invitationPrefix.length);
  const [encodedToken, extra] = remainder.split('/');
  if (!encodedToken || extra) return null;
  try {
    const token = decodeURIComponent(encodedToken).trim();
    return token || null;
  } catch {
    return null;
  }
}
