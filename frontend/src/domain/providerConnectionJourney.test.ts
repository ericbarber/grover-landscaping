import { describe, expect, it } from 'vitest';
import { providerConnectionJourney } from './providerConnectionJourney';

describe('provider connection journey', () => {
  it('moves from organization connection into owner-controlled disclosure', () => {
    const organization = providerConnectionJourney({
      invitationId: 'invitation_1', progressStage: 'organization_check_required',
      statusLabel: 'Organization required', nextAction: 'complete_organization_check',
      recipientEmailChecked: true, organizationRelationshipChecked: false,
      opportunityResponseCapability: false, closed: false,
    }, null, null);
    expect(organization.map(({ status }) => status)).toEqual([
      'complete', 'current', 'upcoming', 'upcoming', 'upcoming', 'upcoming',
    ]);

    const waiting = providerConnectionJourney({
      invitationId: 'invitation_1', progressStage: 'response_recorded',
      statusLabel: 'Waiting for owner', nextAction: 'wait_for_owner',
      recipientEmailChecked: true, organizationRelationshipChecked: true,
      opportunityResponseCapability: true, closed: false,
    }, null, null);
    expect(waiting[1].status).toBe('complete');
    expect(waiting[2]).toMatchObject({ status: 'current', detail: 'Waiting for owner' });
  });

  it('keeps activation and first-visit confirmation as separate stages', () => {
    const stages = providerConnectionJourney({
      invitationId: 'invitation_1', activationId: 'activation_1',
      progressStage: 'relationship_activated', statusLabel: 'Relationship active',
      nextAction: 'complete_provider_setup', recipientEmailChecked: true,
      organizationRelationshipChecked: false, opportunityResponseCapability: false,
      closed: true,
    }, null, {
      activationId: 'activation_1', ownerPropertyId: 'property_1', invitationId: 'invitation_1',
      organizationId: 'org_1', organizationName: 'Desert Green', customerAccountId: 'account_1',
      customerPropertyId: 'customer_property_1', status: 'awaiting_provider', currentVersion: 0,
      persisted: true,
    });
    expect(stages[4].status).toBe('complete');
    expect(stages[5]).toMatchObject({ status: 'current', detail: 'awaiting provider' });
  });
});
