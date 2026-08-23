import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ProviderInvitationConnectionPanel } from './ProviderInvitationConnectionPanel';

describe('ProviderInvitationConnectionPanel', () => {
  it('keeps response authorization separate from organization and private-yard access', () => {
    const markup = renderToStaticMarkup(<ProviderInvitationConnectionPanel
      token="not-rendered"
      progress={{
        invitationId: 'invitation_1', organizationClaimId: 'claim_1',
        organizationClaimStatus: 'relationship_checked', organizationClaimVersion: 1,
        progressStage: 'response_authorization_required',
        statusLabel: 'Limited response acknowledgement required',
        nextAction: 'acknowledge_withheld_data', recipientEmailChecked: true,
        organizationRelationshipChecked: true, opportunityResponseCapability: false,
        closed: false,
      }}
      onReload={async () => undefined}
    />);

    expect(markup).toContain('Open a bounded response path');
    expect(markup).toContain('Exact address, photos, owner contact');
    expect(markup).toContain('does not select my company or authorize work');
    expect(markup).not.toContain('not-rendered');
  });
});
