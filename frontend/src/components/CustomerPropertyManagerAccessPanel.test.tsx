import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CustomerPropertyManagerAccessPanel } from './CustomerPropertyManagerAccessPanel';
import { PropertyManagerInvitationInbox } from './PropertyManagerInvitationInbox';

describe('customer property manager access surfaces', () => {
  it('explains the owner-controlled one-property boundary', () => {
    const markup = renderToStaticMarkup(createElement(CustomerPropertyManagerAccessPanel, {
      propertyId: 'property_1', activationId: 'activation_1',
    }));
    expect(markup).toContain('Share this yard with a property manager');
    expect(markup).toContain('limited to this yard');
    expect(markup).toContain('does not share another property');
    expect(markup).toContain('Checking property access');
  });

  it('withholds property details before recipient acceptance', () => {
    const markup = renderToStaticMarkup(createElement(PropertyManagerInvitationInbox, {
      onAccepted: () => undefined,
    }));
    expect(markup).toContain('before property details are shown');
    expect(markup).toContain('contains no property details');
    expect(markup).toContain('one exact property');
    expect(markup).not.toContain('property_1');
  });
});
