export const OWNER_ACQUISITION_PATH = '/app/yard-owner';
export const OWNER_CARE_SETUP_RESUME_PATH = `${OWNER_ACQUISITION_PATH}?resume=care`;

export function isOwnerAcquisitionPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return normalized === OWNER_ACQUISITION_PATH;
}

export function ownerCareSetupResumeRequested(search: string): boolean {
  return new URLSearchParams(search).get('resume') === 'care';
}

export function ownerCareSetupResumeDestination(
  search: string,
  propertyCount: number,
  briefStatus: 'draft' | 'ready' | undefined,
): 'yard_brief' | 'connect_care' | null {
  if (!ownerCareSetupResumeRequested(search) || propertyCount !== 1) return null;
  return briefStatus === 'ready' ? 'connect_care' : 'yard_brief';
}
