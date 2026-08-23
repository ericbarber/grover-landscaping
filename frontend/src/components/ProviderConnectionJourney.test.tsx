import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ProviderConnectionJourney } from './ProviderConnectionJourney';

describe('ProviderConnectionJourney', () => {
  it('renders a linked current stage without collapsing customer and provider authority', () => {
    const markup = renderToStaticMarkup(<ProviderConnectionJourney
      disclosure={null}
      firstVisit={null}
      progress={{
        invitationId: 'invitation_1', progressStage: 'response_recorded',
        statusLabel: 'Waiting for owner', nextAction: 'wait_for_owner',
        recipientEmailChecked: true, organizationRelationshipChecked: true,
        opportunityResponseCapability: true, closed: false,
      }}
    />);
    expect(markup).toContain('Current: Disclosure');
    expect(markup).toContain('href="#provider-connection-step"');
    expect(markup).toContain('Customer approval and provider operations remain separate.');
    expect(markup).toContain('After activation');
  });
});
