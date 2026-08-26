import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ProviderIdentityReadinessPanel } from './ProviderIdentityReadinessPanel';

describe('ProviderIdentityReadinessPanel', () => {
  it('renders precise fact states and eligibility boundaries', () => {
    const markup = renderToStaticMarkup(<ProviderIdentityReadinessPanel
      displayName="Desert Bloom"
      contactEmail="office@example.test"
      contactPhone=""
      websiteUrl=""
      timeZone="America/Phoenix"
      serviceAreaLabel="Phoenix metro"
      defaultDailyStopCapacity={12}
      setupProgress={null}
      supportedServiceCategories={['routine_maintenance']}
      supportedLanguages={['en', 'es']}
      onEditProfile={() => undefined}
    />);

    expect(markup).toContain('Supplied by provider');
    expect(markup).toContain('Operating preference recorded');
    expect(markup).toContain('Not collected');
    expect(markup).toContain('Not evaluated');
    expect(markup).toContain('do not publish this provider');
    expect(markup).not.toContain('Verified provider');
  });
});
