import { describe, expect, it } from 'vitest';
import type { OrganizationMembership } from '../api/client';
import { crewLeadOptionLabel } from './OwnerCrewAdministrationPanel';

const membership: OrganizationMembership = {
  id: 'membership_1',
  organizationId: 'org_1',
  organizationName: 'Test',
  organizationType: 'yard_care_company',
  userId: 'cognito-user-123',
  displayName: 'Jordan Grover',
  role: 'CrewLead',
  status: 'active',
  scopeType: 'organization',
  scopeId: 'org_1',
};

describe('crew lead option labels', () => {
  it('prefers the readable member display name', () => {
    expect(crewLeadOptionLabel(membership)).toBe('Jordan Grover · crew lead');
  });

  it('falls back to the immutable identity when a label is unavailable', () => {
    expect(crewLeadOptionLabel({
      ...membership,
      displayName: undefined,
      role: 'OrganizationOwner',
    })).toBe('cognito-user-123 · owner');
  });
});
