export function isApplicationPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return normalized === '/app'
    || normalized.startsWith('/app/')
    || normalized === '/auth/callback'
    || normalized.startsWith('/organization-invitations/');
}
