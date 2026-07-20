import { describe, expect, it } from 'vitest';
import { marketingCallToAction } from './MarketingLeadDialog';

describe('marketing calls to action', () => {
  it('matches the conversion goal to each audience', () => {
    expect(marketingCallToAction('landscaping_company')).toMatchObject({
      intent: 'demo',
      label: 'Request a demo',
    });
    expect(marketingCallToAction('property_manager')).toMatchObject({
      intent: 'portfolio_discussion',
      label: 'Discuss my portfolio',
    });
    expect(marketingCallToAction('yard_owner')).toMatchObject({
      intent: 'early_access',
      label: 'Join early access',
    });
  });
});
