import { describe, expect, it } from 'vitest';
import {
  filterManagerActivityItems,
  getLatestManagerActivityTimestamp,
  seedManagerActivityItems,
} from './managerActivity';
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

describe('manager activity filter helper', () => {
  it('keeps all activity when both filters are all', () => {
    expect(filterManagerActivityItems(seedManagerActivityItems, { source: 'all', tone: 'all' })).toEqual(
      seedManagerActivityItems,
    );
  });

  it('filters activity by source', () => {
    const routeItems = filterManagerActivityItems(seedManagerActivityItems, { source: 'route', tone: 'all' });

    expect(routeItems).toHaveLength(1);
    expect(routeItems[0].source).toBe('route');
  });

  it('filters activity by tone', () => {
    const successItems = filterManagerActivityItems(seedManagerActivityItems, { source: 'all', tone: 'success' });

    expect(successItems).toHaveLength(1);
    expect(successItems[0].tone).toBe('success');
  });

  it('filters activity by source and tone together', () => {
    const matchingItems = filterManagerActivityItems(seedManagerActivityItems, {
      source: 'sync',
      tone: 'info',
    });

    expect(matchingItems).toHaveLength(1);
    expect(matchingItems[0].id).toBe('sync-fallback-active');
  });
});

describe('manager activity latest timestamp helper', () => {
  it('returns the newest activity timestamp from the first item', () => {
    expect(getLatestManagerActivityTimestamp(seedManagerActivityItems)).toBe('Today 8:15 AM');
  });

  it('returns the empty label when activity history is empty', () => {
    expect(getLatestManagerActivityTimestamp([])).toBe('No activity yet');
    expect(getLatestManagerActivityTimestamp([], 'Nothing recorded')).toBe('Nothing recorded');
  });
});
