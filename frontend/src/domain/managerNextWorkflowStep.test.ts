import { describe, expect, it } from 'vitest';
import { getManagerNextWorkflowStep } from './managerNextWorkflowStep';

describe('manager next workflow step helper', () => {
  it('starts by creating a plan', () => {
    expect(getManagerNextWorkflowStep(false, false, false)).toBe('create_plan');
  });

  it('asks for stops after a draft exists', () => {
    expect(getManagerNextWorkflowStep(true, false, false)).toBe('add_stops');
  });

  it('asks for review when a draft has stops but cannot publish', () => {
    expect(getManagerNextWorkflowStep(true, true, false)).toBe('review_route');
  });

  it('allows publishing when the draft is ready', () => {
    expect(getManagerNextWorkflowStep(true, true, true)).toBe('publish_plan');
  });
});
