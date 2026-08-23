import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ProviderEntryPage } from './ProviderEntryPage';

describe('ProviderEntryPage', () => {
  it('routes each provider audience without implying marketplace access', () => {
    const markup = renderToStaticMarkup(<ProviderEntryPage />);

    expect(markup).toContain('Start owner-operator setup');
    expect(markup).toContain('/app?provider-entry=owner-operator');
    expect(markup).toContain('Start company setup');
    expect(markup).toContain('/app?provider-entry=company-owner');
    expect(markup).toContain('Sign in with your invitation');
    expect(markup).toContain('/app/provider-invitation');
    expect(markup).toContain('Creating a provider profile does not publish your business');
    expect(markup).toContain('A single “verified” badge cannot stand in for those facts.');
  });
});
