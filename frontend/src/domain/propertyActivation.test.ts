import { describe, expect, it } from 'vitest';
import { getPropertyActivationReadiness } from './propertyActivation';

describe('property activation readiness', () => {
  it('requires both an active operational profile and crew assignment', () => {
    expect(getPropertyActivationReadiness(true, true)).toEqual({
      profileReady: true,
      crewReady: true,
      ready: true,
    });
    expect(getPropertyActivationReadiness(false, true).ready).toBe(false);
    expect(getPropertyActivationReadiness(true, false).ready).toBe(false);
    expect(getPropertyActivationReadiness(false, false).ready).toBe(false);
  });
});
