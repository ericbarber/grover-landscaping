import { describe, expect, it } from 'vitest';
import { ownerAssessmentStatus } from './OwnerProviderAssessmentPanel';

describe('Yard Owner assessment workspace', () => {
  it('keeps proposed windows actionable without implying service acceptance', () => {
    expect(ownerAssessmentStatus('window_proposed')).toEqual(expect.objectContaining({
      label: 'Assessment time needs your review',
      tone: 'attention',
      terminal: false,
    }));
    expect(ownerAssessmentStatus('owner_confirmed').detail).toContain('not ongoing service');
  });

  it('separates completed and closed assessment outcomes', () => {
    expect(ownerAssessmentStatus('completed')).toEqual(expect.objectContaining({
      tone: 'complete',
      terminal: true,
    }));
    expect(ownerAssessmentStatus('cannot_assess')).toEqual(expect.objectContaining({
      tone: 'closed',
      terminal: true,
    }));
    expect(ownerAssessmentStatus('cancelled').detail).toContain('No service was accepted');
  });
});
