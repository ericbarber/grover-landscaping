import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MarketingProductTour } from './MarketingProductTour';

describe('MarketingProductTour', () => {
  it('renders an inspectable workflow and persona-specific outcome', () => {
    const markup = renderToStaticMarkup(<MarketingProductTour persona="property-manager" />);

    expect(markup).toContain('Follow one day from promise to proof.');
    expect(markup).toContain('Today’s operation');
    expect(markup).toContain('marketing-tour-operations-planner-title');
    expect(markup).toContain('Today&#x27;s operations summary');
    expect(markup).toContain('Illustrative planning only. Live counts are sample data; no route or schedule is saved.');
    expect(markup).toContain('Coordinate service expectations across every property.');
    expect(markup).toContain('aria-label="Product tour steps"');
  });
});
