import { describe, expect, it } from 'vitest';
import {
  isOwnerAcquisitionPath,
  OWNER_ACQUISITION_PATH,
  OWNER_CARE_SETUP_RESUME_PATH,
  ownerCareSetupResumeDestination,
  ownerCareSetupResumeRequested,
} from './ownerAcquisitionRoute';

describe('Yard Owner acquisition route', () => {
  it('recognizes only the private owner entry route', () => {
    expect(OWNER_ACQUISITION_PATH).toBe('/app/yard-owner');
    expect(isOwnerAcquisitionPath('/app/yard-owner')).toBe(true);
    expect(isOwnerAcquisitionPath('/app/yard-owner/')).toBe(true);
    expect(isOwnerAcquisitionPath('/app')).toBe(false);
    expect(isOwnerAcquisitionPath('/app/yard-owner/property')).toBe(false);
  });

  it('recognizes only the explicit care-setup resume request', () => {
    expect(OWNER_CARE_SETUP_RESUME_PATH).toBe('/app/yard-owner?resume=care');
    expect(ownerCareSetupResumeRequested('?resume=care')).toBe(true);
    expect(ownerCareSetupResumeRequested('?resume=property')).toBe(false);
    expect(ownerCareSetupResumeRequested('')).toBe(false);
  });

  it('resumes one property at its next setup step without guessing among properties', () => {
    expect(ownerCareSetupResumeDestination('?resume=care', 1, 'ready')).toBe('connect_care');
    expect(ownerCareSetupResumeDestination('?resume=care', 1, 'draft')).toBe('yard_brief');
    expect(ownerCareSetupResumeDestination('?resume=care', 1, undefined)).toBe('yard_brief');
    expect(ownerCareSetupResumeDestination('?resume=care', 2, 'ready')).toBeNull();
    expect(ownerCareSetupResumeDestination('', 1, 'ready')).toBeNull();
  });
});
