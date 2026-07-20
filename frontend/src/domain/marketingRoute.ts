export type MarketingPersonaId = 'owner' | 'property-manager' | 'company' | 'crew';

const personaByPath: Record<string, MarketingPersonaId> = {
  '/for-yard-owners': 'owner',
  '/for-property-managers': 'property-manager',
  '/for-landscaping-companies': 'company',
  '/for-crew-leads': 'crew',
};

export function marketingPersonaFromPath(pathname: string): MarketingPersonaId {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return personaByPath[normalized] ?? 'company';
}

export function marketingPathForPersona(persona: MarketingPersonaId): string {
  return Object.entries(personaByPath)
    .find(([, candidate]) => candidate === persona)?.[0] ?? '/';
}
