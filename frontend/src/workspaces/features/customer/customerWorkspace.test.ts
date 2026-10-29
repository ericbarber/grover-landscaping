import { describe, expect, it } from 'vitest';
import type { CustomerPortalVisitSummary } from '../../../domain/customerPortalVisits';
import type { YardCareJob } from '../../../domain/jobs';
import {
  customerHomeWorkSummary,
  customerWorkspaceModeForPersona,
  personaUsesAuthorizedCustomerRead,
  personaUsesManagerCustomerPreview,
} from './customerWorkspace';

const visits = [
  { status: 'confirmed', deliveredProofAvailable: false },
  { status: 'complete_proof_pending', deliveredProofAvailable: false },
  { status: 'confirmed', deliveredProofAvailable: true },
] as CustomerPortalVisitSummary[];

const jobs = [
  { status: 'scheduled' },
  { status: 'completed' },
] as YardCareJob[];

describe('customer workspace policy', () => {
  it('assigns distinct customer experiences to supported personas', () => {
    expect(customerWorkspaceModeForPersona('yard-owner')).toBe('yard');
    expect(customerWorkspaceModeForPersona('property-manager')).toBe('portfolio');
    expect(customerWorkspaceModeForPersona('billing-admin')).toBe('unavailable');
  });

  it('limits the authorized portal read to its customer personas', () => {
    expect(personaUsesAuthorizedCustomerRead('yard-owner')).toBe(true);
    expect(personaUsesAuthorizedCustomerRead('property-manager')).toBe(true);
    expect(personaUsesAuthorizedCustomerRead('company-owner')).toBe(false);
  });

  it('keeps manager previews separate from signed-in customer reads', () => {
    expect(personaUsesManagerCustomerPreview('company-owner', true)).toBe(true);
    expect(personaUsesManagerCustomerPreview('property-manager', true)).toBe(false);
    expect(personaUsesManagerCustomerPreview('company-owner', false)).toBe(false);
  });

  it('uses protected visits for customer progress and jobs for other workspaces', () => {
    expect(customerHomeWorkSummary('yard-owner', visits, jobs)).toEqual({
      assigned: 3,
      completed: 2,
    });
    expect(customerHomeWorkSummary('company-owner', visits, jobs)).toEqual({
      assigned: 2,
      completed: 1,
    });
  });
});
