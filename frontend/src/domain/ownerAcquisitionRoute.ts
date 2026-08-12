export const OWNER_ACQUISITION_PATH = '/app/yard-owner';

export function isOwnerAcquisitionPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return normalized === OWNER_ACQUISITION_PATH;
}
