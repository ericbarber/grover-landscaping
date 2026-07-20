import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MarketingProductTour } from './MarketingProductTour';

describe('MarketingProductTour', () => {
  it('renders an inspectable workflow and persona-specific outcome', () => {
    const markup = renderToStaticMarkup(<MarketingProductTour persona="property-manager" />);

    expect(markup).toContain('Follow one day from promise to proof.');
    expect(markup).toContain('Monday route');
    expect(markup).toContain('Coordinate service expectations across every property.');
    expect(markup).toContain('aria-label="Product tour steps"');
  });
});
