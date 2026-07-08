import { describe, expect, it } from 'vitest';
import {
  canCreateManagerDayPlanDraft,
  normalizeManagerDayPlanDraftTarget,
} from './managerDayPlanDraftTarget';

describe('manager day plan draft target', () => {
  it('normalizes crew and service date input', () => {
    expect(normalizeManagerDayPlanDraftTarget({ crewId: ' crew_1001 ', serviceDate: ' 2026-06-16 ' })).toEqual({
      crewId: 'crew_1001',
      serviceDate: '2026-06-16',
    });
  });

  it('allows draft creation for a complete target', () => {
    expect(canCreateManagerDayPlanDraft({ crewId: 'crew_1001', serviceDate: '2026-06-16' })).toBe(true);
  });

  it('blocks draft creation with blank crew or service date values', () => {
    expect(canCreateManagerDayPlanDraft({ crewId: '   ', serviceDate: '2026-06-16' })).toBe(false);
    expect(canCreateManagerDayPlanDraft({ crewId: 'crew_1001', serviceDate: '   ' })).toBe(false);
  });
});
