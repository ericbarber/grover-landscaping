import { describe, expect, it } from 'vitest';
import {
  marketingCanonicalPath,
  marketingPathForPersona,
  marketingPersonaFromPath,
} from './marketingRoute';

describe('marketing routes', () => {
  it('selects the audience from stable campaign paths', () => {
    expect(marketingPersonaFromPath('/for-yard-owners')).toBe('owner');
    expect(marketingPersonaFromPath('/for-property-managers/')).toBe('property-manager');
    expect(marketingPersonaFromPath('/for-landscaping-companies')).toBe('company');
    expect(marketingPersonaFromPath('/for-crew-leads')).toBe('crew');
  });

  it('uses the single-property Yard Owner story as the homepage default', () => {
    expect(marketingPersonaFromPath('/')).toBe('owner');
    expect(marketingPersonaFromPath('/unrecognized')).toBe('owner');
  });

  it('returns a shareable path for every audience', () => {
    expect(marketingPathForPersona('owner')).toBe('/for-yard-owners');
    expect(marketingPathForPersona('property-manager')).toBe('/for-property-managers');
    expect(marketingPathForPersona('company')).toBe('/for-landscaping-companies');
    expect(marketingPathForPersona('crew')).toBe('/for-crew-leads');
  });

  it('keeps the Yard Owner homepage canonical at the root route', () => {
    expect(marketingCanonicalPath('/', 'owner')).toBe('/');
    expect(marketingCanonicalPath('/for-landscaping-companies', 'company'))
      .toBe('/for-landscaping-companies');
    expect(marketingCanonicalPath('/', 'company')).toBe('/for-landscaping-companies');
  });
});
