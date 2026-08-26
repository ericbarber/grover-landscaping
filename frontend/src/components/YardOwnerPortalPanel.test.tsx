import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { YardOwnerPortalPanel } from './YardOwnerPortalPanel';

const commonProps = {
  customerDisplayName: 'Morgan',
  properties: [],
  visits: [],
  isLoadingVisits: false,
  visitReadError: null,
  onRetryVisits: vi.fn(),
  completionReportsByProperty: {},
  isLoadingReportHistory: false,
  hasReportHistoryError: false,
};

describe('Yard Owner persisted visit states', () => {
  it('shows protected loading without illustrative visit content', () => {
    const markup = renderToStaticMarkup(
      <YardOwnerPortalPanel {...commonProps} isLoadingVisits />,
    );

    expect(markup).toContain('Loading your yard');
    expect(markup).not.toContain('Weekly yard care');
    expect(markup).not.toContain('August 27');
  });

  it('keeps inconsistent access closed with a retry action', () => {
    const markup = renderToStaticMarkup(
      <YardOwnerPortalPanel {...commonProps} visitReadError="inconsistent" />,
    );

    expect(markup).toContain('needs provider review');
    expect(markup).toContain('Try again');
    expect(markup).not.toContain('Weekly yard care');
  });

  it('distinguishes missing access from a temporary outage', () => {
    const accessMarkup = renderToStaticMarkup(
      <YardOwnerPortalPanel {...commonProps} visitReadError="access_required" />,
    );
    const unavailableMarkup = renderToStaticMarkup(
      <YardOwnerPortalPanel {...commonProps} visitReadError="unavailable" />,
    );

    expect(accessMarkup).toContain('No active customer portal access');
    expect(accessMarkup).not.toContain('temporarily unavailable');
    expect(unavailableMarkup).toContain('temporarily unavailable');
    expect(unavailableMarkup).not.toContain('No active customer portal access');
  });

  it('distinguishes a valid empty property collection from an outage', () => {
    const markup = renderToStaticMarkup(<YardOwnerPortalPanel {...commonProps} />);

    expect(markup).toContain('No active property is connected yet');
    expect(markup).not.toContain('temporarily unavailable');
  });

  it('renders only the authorized persisted property and visit', () => {
    const markup = renderToStaticMarkup(
      <YardOwnerPortalPanel
        {...commonProps}
        properties={[{
          id: 'property_1',
          customerId: 'account_1',
          organizationId: 'org_1',
          displayName: 'Home',
        }]}
        visits={[{
          id: 'visit_1',
          customerId: 'account_1',
          organizationId: 'org_1',
          propertyId: 'property_1',
          scheduledDate: '2026-08-29',
          arrivalWindow: '8:00 AM–10:00 AM',
          serviceTitle: 'Initial yard care',
          scope: ['Mow and edge turf'],
          status: 'confirmed',
          preparationMessage: 'Unlock the side gate.',
          nextUpdateMessage: 'Your provider will share an update here.',
        }]}
      />,
    );

    expect(markup).toContain('Initial yard care');
    expect(markup).toContain('August 29');
    expect(markup).toContain('8:00 AM–10:00 AM');
    expect(markup).toContain('Unlock the side gate.');
    expect(markup).not.toContain('Weekly yard care');
  });
});
