import { describe, expect, it } from 'vitest';
import { isOwnerAcquisitionPath, OWNER_ACQUISITION_PATH } from './ownerAcquisitionRoute';

describe('Yard Owner acquisition route', () => {
  it('recognizes only the private owner entry route', () => {
    expect(OWNER_ACQUISITION_PATH).toBe('/app/yard-owner');
    expect(isOwnerAcquisitionPath('/app/yard-owner')).toBe(true);
    expect(isOwnerAcquisitionPath('/app/yard-owner/')).toBe(true);
    expect(isOwnerAcquisitionPath('/app')).toBe(false);
    expect(isOwnerAcquisitionPath('/app/yard-owner/property')).toBe(false);
  });
});
