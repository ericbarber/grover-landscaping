export type MarketingPersonaId = 'owner' | 'property-manager' | 'company' | 'crew';

const personaByPath: Record<string, MarketingPersonaId> = {
  '/for-yard-owners': 'owner',
  '/for-property-managers': 'property-manager',
  '/for-landscaping-companies': 'company',
  '/for-crew-leads': 'crew',
};

export function marketingPersonaFromPath(pathname: string): MarketingPersonaId {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return personaByPath[normalized] ?? 'owner';
}

export function marketingPathForPersona(persona: MarketingPersonaId): string {
  return Object.entries(personaByPath)
    .find(([, candidate]) => candidate === persona)?.[0] ?? '/';
}

export function marketingCanonicalPath(
  currentPathname: string,
  persona: MarketingPersonaId,
): string {
  const normalized = currentPathname.replace(/\/+$/, '') || '/';
  if (normalized === '/' && persona === 'owner') return '/';
  return marketingPathForPersona(persona);
}
