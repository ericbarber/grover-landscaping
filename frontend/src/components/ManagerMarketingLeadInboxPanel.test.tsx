import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  ManagerMarketingLeadInboxPanel,
  shouldShowEmptyMarketingLeadInbox,
} from './ManagerMarketingLeadInboxPanel';

describe('ManagerMarketingLeadInboxPanel', () => {
  it('presents a platform operations inbox without exposing data in initial markup', () => {
    const markup = renderToStaticMarkup(<ManagerMarketingLeadInboxPanel />);
    expect(markup).toContain('Marketing lead inbox');
    expect(markup).toContain('Support-admin access only');
    expect(markup).toContain('Loading leads');
  });

  it('does not present unavailable persistence as an empty inbox', () => {
    expect(shouldShowEmptyMarketingLeadInbox(false, true, 0)).toBe(false);
    expect(shouldShowEmptyMarketingLeadInbox(false, false, 0)).toBe(true);
  });
});
