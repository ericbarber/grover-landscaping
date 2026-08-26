import type { FirstOwnerSetupProgress } from '../api/client';

export type ProviderReadinessFactState = 'supplied' | 'recorded' | 'operational' | 'missing' | 'not_collected' | 'not_evaluated';

export interface ProviderReadinessFact {
  id: string;
  label: string;
  detail: string;
  state: ProviderReadinessFactState;
}

export interface ProviderReadinessInput {
  displayName: string;
  contactEmail: string;
  contactPhone: string;
  websiteUrl: string;
  timeZone: string;
  serviceAreaLabel: string;
  defaultDailyStopCapacity: number;
  setupProgress: FirstOwnerSetupProgress | null;
  supportedServiceCategories: string[];
  supportedLanguages: string[];
}

export function providerReadinessStateLabel(state: ProviderReadinessFactState): string {
  return {
    supplied: 'Supplied by provider',
    recorded: 'Operating preference recorded',
    operational: 'Operational setup recorded',
    missing: 'Needs information',
    not_collected: 'Not collected',
    not_evaluated: 'Not evaluated',
  }[state];
}

export function providerReadinessFacts(input: ProviderReadinessInput): ProviderReadinessFact[] {
  const hasContact = Boolean(input.contactEmail.trim() || input.contactPhone.trim());
  return [
    {
      id: 'identity',
      label: 'Business identity',
      detail: input.displayName.trim() || 'Add the provider organization name.',
      state: input.displayName.trim() ? 'supplied' : 'missing',
    },
    {
      id: 'contact',
      label: 'Business contact',
      detail: hasContact ? [input.contactEmail, input.contactPhone].filter(Boolean).join(' · ') : 'Add a customer-facing email or phone number.',
      state: hasContact ? 'supplied' : 'missing',
    },
    {
      id: 'website',
      label: 'Website',
      detail: input.websiteUrl.trim() || 'Optional public website has not been supplied.',
      state: input.websiteUrl.trim() ? 'supplied' : 'missing',
    },
    {
      id: 'service-area',
      label: 'Service area',
      detail: input.serviceAreaLabel.trim() || 'Add a coarse operating-area label.',
      state: input.serviceAreaLabel.trim() ? 'supplied' : 'missing',
    },
    {
      id: 'operations',
      label: 'Operating basis',
      detail: `${input.timeZone || 'Timezone missing'} · ${input.defaultDailyStopCapacity || 0} default stops per day`,
      state: input.timeZone && input.defaultDailyStopCapacity > 0 ? 'recorded' : 'missing',
    },
    {
      id: 'services',
      label: 'Service categories',
      detail: input.supportedServiceCategories.length > 0
        ? input.supportedServiceCategories.map((value) => value.split('_').join(' ')).join(' · ')
        : 'Choose the services this provider currently offers.',
      state: input.supportedServiceCategories.length > 0 ? 'supplied' : 'missing',
    },
    {
      id: 'languages',
      label: 'Customer communication languages',
      detail: input.supportedLanguages.length > 0
        ? input.supportedLanguages.map((value) => value === 'en' ? 'English' : value === 'es' ? 'Spanish' : value).join(' · ')
        : 'Choose the languages this provider can use with customers.',
      state: input.supportedLanguages.length > 0 ? 'supplied' : 'missing',
    },
    {
      id: 'crew',
      label: 'Crew setup',
      detail: input.setupProgress?.crewConfigured ? 'At least one crew is configured.' : 'Configure the first crew before route planning.',
      state: input.setupProgress?.crewConfigured ? 'operational' : 'missing',
    },
    {
      id: 'credentials',
      label: 'Insurance, license, and certification facts',
      detail: 'Grover does not collect or check provider credentials in this release.',
      state: 'not_collected',
    },
    {
      id: 'eligibility',
      label: 'Opportunity eligibility',
      detail: 'Marketplace publication, ranking, and opportunity eligibility are not evaluated.',
      state: 'not_evaluated',
    },
  ];
}

export function providerSuppliedFactProgress(facts: ProviderReadinessFact[]): { completed: number; total: number } {
  const preparationFacts = facts.filter(({ state }) => state !== 'not_collected' && state !== 'not_evaluated');
  return {
    completed: preparationFacts.filter(({ state }) => state !== 'missing').length,
    total: preparationFacts.length,
  };
}
