import { describe, expect, it } from 'vitest';
import { providerAssessmentAction } from './ProviderAssessmentWorkspace';

describe('provider assessment workspace lifecycle', () => {
  it('starts only authorized remote reviews or owner-confirmed visits', () => {
    expect(providerAssessmentAction('remote_review')).toBe('begin');
    expect(providerAssessmentAction('owner_confirmed')).toBe('begin');
    expect(providerAssessmentAction('window_proposed')).toBe('wait');
    expect(providerAssessmentAction('window_change_requested')).toBe('wait');
  });

  it('separates active completion from terminal assessment states', () => {
    expect(providerAssessmentAction('in_progress')).toBe('complete');
    expect(providerAssessmentAction('completed')).toBe('closed');
    expect(providerAssessmentAction('cannot_assess')).toBe('closed');
    expect(providerAssessmentAction('cancelled')).toBe('closed');
  });
});
