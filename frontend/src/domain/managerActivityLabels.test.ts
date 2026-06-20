import { describe, expect, it } from 'vitest';
import {
  managerActivityFilterSummary,
  managerActivitySourceLabel,
  managerActivityToneLabel,
} from './managerActivityLabels';

describe('manager activity label helpers', () => {
  it('labels manager activity sources', () => {
    expect(managerActivitySourceLabel('route')).toBe('Route');
    expect(managerActivitySourceLabel('job')).toBe('Job');
    expect(managerActivitySourceLabel('photo')).toBe('Photo');
    expect(managerActivitySourceLabel('sync')).toBe('Sync');
  });

  it('labels manager activity tones', () => {
    expect(managerActivityToneLabel('warning')).toBe('Warning');
    expect(managerActivityToneLabel('success')).toBe('Success');
    expect(managerActivityToneLabel('info')).toBe('Info');
  });

  it('summarizes all filters', () => {
    expect(managerActivityFilterSummary('all', 'all')).toBe('All sources · all tones');
  });

  it('summarizes selected source and tone filters', () => {
    expect(managerActivityFilterSummary('route', 'warning')).toBe('Route source · Warning tone');
    expect(managerActivityFilterSummary('photo', 'success')).toBe('Photo source · Success tone');
    expect(managerActivityFilterSummary('sync', 'info')).toBe('Sync source · Info tone');
  });
});
