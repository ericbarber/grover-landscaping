import { describe, expect, it } from 'vitest';
import { canReviseProviderProposal } from './ProviderInitialServiceProposalPanel';
import type { InitialServiceProposal } from '../domain/initialServiceProposals';

describe('provider proposal authoring boundary', () => {
  it('locks an accepted proposal but permits revision of nonaccepted current versions', () => {
    expect(canReviseProviderProposal()).toBe(true);
    expect(canReviseProviderProposal({ status: 'sent' } as InitialServiceProposal)).toBe(true);
    expect(canReviseProviderProposal({ status: 'declined' } as InitialServiceProposal)).toBe(true);
    expect(canReviseProviderProposal({ status: 'expired' } as InitialServiceProposal)).toBe(true);
    expect(canReviseProviderProposal({ status: 'accepted' } as InitialServiceProposal)).toBe(false);
  });
});
