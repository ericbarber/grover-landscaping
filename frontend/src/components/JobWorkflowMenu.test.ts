import { describe, expect, it } from 'vitest';
import { jobWorkflowItems } from './JobWorkflowMenu';

describe('job workflow menu', () => {
  it('summarizes each secondary workflow without opening it', () => {
    expect(jobWorkflowItems({
      checklistComplete: 2,
      checklistTotal: 4,
      photoCount: 3,
      addOnCount: 1,
      reportReady: false,
    })).toEqual([
      { id: 'overview', label: 'Overview', context: 'Primary actions' },
      { id: 'checklist', label: 'Checklist', context: '2/4' },
      { id: 'photos', label: 'Photos', context: '3' },
      { id: 'addons', label: 'Add-ons', context: '1' },
      { id: 'report', label: 'Report', context: 'Draft' },
    ]);
  });
});
