import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { OwnerProviderInvitationPanel } from './OwnerProviderInvitationPanel';
import type {
  OwnerProperty,
  OwnerProviderConnectionProgress,
  OwnerWorkspace,
  OwnerYardBrief,
} from '../api/ownerAcquisitionClient';

const workspace: OwnerWorkspace = {
  ownerUserId: 'owner_1',
  verifiedEmail: 'owner@example.test',
  displayName: 'Morgan',
  status: 'active',
  persisted: true,
};

const property: OwnerProperty = {
  propertyId: 'property_1', ownerUserId: 'owner_1', displayName: 'Home',
  addressLine1: 'Private', addressLine2: '', city: 'Phoenix', region: 'AZ',
  postalCode: '85004', countryCode: 'US', coarseArea: 'Central Phoenix',
  addressStatus: 'owner_confirmed', authorityAttested: true, status: 'active',
  version: 1, persisted: true,
};

const brief: OwnerYardBrief = {
  briefId: 'brief_1', ownerUserId: 'owner_1', propertyId: 'property_1', version: 2,
  status: 'ready', yardAreas: ['Front yard'], careGoals: ['Routine upkeep'],
  cadencePreference: 'every_two_weeks', considerations: 'Private access note',
  authorSource: 'yard_owner', persisted: true,
};

function connection(
  progressStage: OwnerProviderConnectionProgress['progressStage'],
): OwnerProviderConnectionProgress {
  return {
    invitationId: 'invitation_1', providerName: 'Desert Bloom Yard Care',
    invitationStatus: progressStage === 'expired' ? 'expired' : 'delivered',
    deliveryStatus: 'delivered', progressStage,
    statusLabel: progressStage === 'expired' ? 'Invitation expired' : 'Invitation delivered',
    ownerActionRequired: false,
    nextAction: progressStage === 'expired' ? 'start_new_invitation' : 'wait_or_withdraw',
    expiresAtEpochSeconds: 1_800_000_000, persisted: true,
  };
}

describe('OwnerProviderInvitationPanel', () => {
  it('offers one self-service action when no invitation exists', () => {
    const markup = renderToStaticMarkup(
      <OwnerProviderInvitationPanel brief={brief} connections={[]} onChanged={async () => undefined} property={property} workspace={workspace} />,
    );

    expect(markup).toContain('Connect the yard to a company you already know');
    expect(markup).toContain('Invite a company you know');
    expect(markup).toContain('saved private brief remains available');
  });

  it('offers an appropriate restart after an expired invitation', () => {
    const markup = renderToStaticMarkup(
      <OwnerProviderInvitationPanel brief={brief} connections={[connection('expired')]} onChanged={async () => undefined} property={property} workspace={workspace} />,
    );

    expect(markup).toContain('Desert Bloom Yard Care: Invitation expired');
    expect(markup).toContain('Invite a company again');
  });

  it('does not offer another invitation while a current one is active', () => {
    const markup = renderToStaticMarkup(
      <OwnerProviderInvitationPanel brief={brief} connections={[connection('awaiting_open')]} onChanged={async () => undefined} property={property} workspace={workspace} />,
    );

    expect(markup).toBe('');
  });
});
