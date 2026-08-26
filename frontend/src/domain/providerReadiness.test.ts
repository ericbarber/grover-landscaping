import { describe, expect, it } from 'vitest';
import { providerReadinessFacts, providerSuppliedFactProgress } from './providerReadiness';

describe('provider readiness', () => {
  it('keeps supplied, operational, unchecked, and missing facts distinct', () => {
    const facts = providerReadinessFacts({
      displayName: 'Desert Bloom',
      contactEmail: 'office@example.test',
      contactPhone: '',
      websiteUrl: '',
      timeZone: 'America/Phoenix',
      serviceAreaLabel: 'Phoenix metro',
      defaultDailyStopCapacity: 12,
      supportedServiceCategories: ['routine_maintenance'],
      supportedLanguages: ['en', 'es'],
      setupProgress: {
        organizationId: 'org_1', organizationProfileComplete: false,
        teamInvitationCreated: false, crewConfigured: true, firstRoutePublished: false,
        completedSteps: 1, totalSteps: 4, persisted: true,
      },
    });

    expect(facts.find(({ id }) => id === 'identity')?.state).toBe('supplied');
    expect(facts.find(({ id }) => id === 'website')?.state).toBe('missing');
    expect(facts.find(({ id }) => id === 'operations')?.state).toBe('recorded');
    expect(facts.find(({ id }) => id === 'crew')?.state).toBe('operational');
    expect(facts.find(({ id }) => id === 'credentials')?.state).toBe('not_collected');
    expect(facts.find(({ id }) => id === 'eligibility')?.state).toBe('not_evaluated');
    expect(facts.find(({ id }) => id === 'services')?.state).toBe('supplied');
    expect(facts.find(({ id }) => id === 'languages')?.detail).toContain('Spanish');
    expect(providerSuppliedFactProgress(facts)).toEqual({ completed: 7, total: 8 });
  });
});
