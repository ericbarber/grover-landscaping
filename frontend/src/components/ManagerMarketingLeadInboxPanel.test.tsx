import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ManagerMarketingLeadInboxPanel } from './ManagerMarketingLeadInboxPanel';

describe('ManagerMarketingLeadInboxPanel', () => {
  it('presents a platform operations inbox without exposing data in initial markup', () => {
    const markup = renderToStaticMarkup(<ManagerMarketingLeadInboxPanel />);
    expect(markup).toContain('Marketing lead inbox');
    expect(markup).toContain('Support-admin access only');
    expect(markup).toContain('Loading leads');
  });
});
