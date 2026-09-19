import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MarketingProductTour } from './MarketingProductTour';

describe('MarketingProductTour', () => {
  it.each([
    ['owner', 'Follow your yard from upcoming care to completed proof.', 'Tuesday · 8:00–10:00 AM'],
    ['property-manager', 'Move from portfolio readiness to owner-ready reporting.', '14 of 16 properties ready'],
    ['crew', 'Move from the first route stop to one clean handoff.', '8 ordered stops'],
  ] as const)('renders a dedicated %s tour without company operations', (persona, title, preview) => {
    const markup = renderToStaticMarkup(<MarketingProductTour persona={persona} />);

    expect(markup).toContain(title);
    expect(markup).toContain(preview);
    expect(markup).not.toContain('Today’s operation');
    expect(markup).not.toContain('marketing-tour-operations-planner-title');
    expect(markup).toContain('aria-label="Product tour steps"');
  });

  it('retains the interactive operations planner only for the company tour', () => {
    const markup = renderToStaticMarkup(<MarketingProductTour persona="company" />);

    expect(markup).toContain('Follow one workday from plan to completed revenue.');
    expect(markup).toContain('Today’s operation');
    expect(markup).toContain('marketing-tour-operations-planner-title');
    expect(markup).toContain('Today&#x27;s operations summary');
    expect(markup).toContain('Illustrative planning only. Live counts are sample data; no route or schedule is saved.');
    expect(markup).toContain('Balance routes, crews, commitments, and operational risk.');
    expect(markup).toContain('aria-label="Product tour steps"');
  });
});
