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
  isProtectedProofWithheld: false,
};

function renderVisit(overrides: Partial<Parameters<typeof YardOwnerPortalPanel>[0]['visits'][number]>) {
  return renderToStaticMarkup(
    <YardOwnerPortalPanel
      {...commonProps}
      properties={[{
        id: 'property_1', customerId: 'account_1', organizationId: 'org_1', displayName: 'Home',
      }]}
      visits={[{
        id: 'visit_1', customerId: 'account_1', organizationId: 'org_1',
        propertyId: 'property_1', scheduledDate: '2026-08-30',
        arrivalWindow: '8:00 AM–10:00 AM', serviceTitle: 'Initial yard care',
        scope: ['Mow and edge turf'], status: 'confirmed',
        preparationMessage: 'Unlock the side gate.',
        nextUpdateMessage: 'Your provider will share an update here.',
        ...overrides,
      }]}
    />,
  );
}

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

  it('keeps legacy property-report history out of the protected owner workspace', () => {
    const markup = renderVisit({});
    const withheldMarkup = renderToStaticMarkup(
      <YardOwnerPortalPanel
        {...commonProps}
        isProtectedProofWithheld
        properties={[{
          id: 'property_1', customerId: 'account_1', organizationId: 'org_1', displayName: 'Home',
        }]}
        visits={[]}
      />,
    );

    expect(markup).not.toContain('Protected proof is not available');
    expect(withheldMarkup).toContain('Protected proof is not available in this workspace yet.');
    expect(withheldMarkup).toContain('Existing shared report links remain separate.');
  });

  it('offers visit questions only after a customer-safe reference exists', () => {
    const available = renderVisit({
      customerVisitReference: 'customer_visit_0123456789abcdef0123456789abcdef',
    });
    const unreleased = renderVisit({ customerVisitReference: undefined });

    expect(available).toContain('Ask about this visit');
    expect(available).not.toContain('release_id');
    expect(unreleased).toContain('questions become available after your provider finishes preparing');
    expect(unreleased).not.toContain('Ask about this visit');
  });

  it('presents explicit en-route, care, and weather states on the shared progress rail', () => {
    const enRouteMarkup = renderVisit({
      status: 'en_route', nextUpdateMessage: 'Arrival is expected soon.',
    });
    const careMarkup = renderVisit({
      status: 'care_in_progress', nextUpdateMessage: 'Proof follows provider review.',
    });
    const weatherMarkup = renderVisit({
      status: 'weather_delay', statusReason: 'Lightning is nearby.',
      nextUpdateMessage: 'We will share another update in 30 minutes.',
    });

    expect(enRouteMarkup).toContain('On the way');
    expect(enRouteMarkup).toContain('Prepare for arrival');
    expect(enRouteMarkup).toContain('aria-label="Service progress"');
    expect(careMarkup).toContain('Care in progress');
    expect(careMarkup).toContain('Recorded preparation');
    expect(weatherMarkup).toContain('Weather update:');
    expect(weatherMarkup).toContain('Lightning is nearby.');
    expect(weatherMarkup).toContain('We will share another update in 30 minutes.');
    expect(weatherMarkup).not.toContain('crew');
    expect(weatherMarkup).not.toContain('route');
  });

  it('names the original and replacement windows for an explicit reschedule', () => {
    const markup = renderVisit({
      status: 'rescheduled',
      scheduledDate: '2026-08-30',
      arrivalWindow: '10:00 AM–12:00 PM',
      originalScheduledDate: '2026-08-29',
      originalArrivalWindow: '8:00 AM–10:00 AM',
      nextUpdateMessage: 'Your replacement window is confirmed.',
    });

    expect(markup).toContain('New date confirmed.');
    expect(markup).toContain('Saturday, August 29, 2026, 8:00 AM–10:00 AM');
    expect(markup).toContain('Sunday, August 30, 2026, 10:00 AM–12:00 PM');
  });

  it('keeps completed care separate from delivered proof', () => {
    const markup = renderVisit({
      status: 'complete_proof_pending',
      nextUpdateMessage: 'Delivered proof will appear after provider review.',
    });

    expect(markup).toContain('Visit complete · proof pending');
    expect(markup).toContain('Unpublished evidence remains private.');
    expect(markup).not.toContain('Open delivered proof');
  });
});
