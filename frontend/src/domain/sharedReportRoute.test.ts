import { describe, expect, it } from 'vitest';
import { sharedReportTokenFromPath } from './sharedReportRoute';

describe('shared report route', () => {
  it('extracts the customer report token', () => {
    expect(sharedReportTokenFromPath('/report-view/share-report-1001')).toBe('share-report-1001');
    expect(sharedReportTokenFromPath('/report-view/share%201/')).toBe('share 1');
  });

  it('ignores unrelated or malformed paths', () => {
    expect(sharedReportTokenFromPath('/')).toBeNull();
    expect(sharedReportTokenFromPath('/reports/share-report-1001')).toBeNull();
    expect(sharedReportTokenFromPath('/report-view/')).toBeNull();
    expect(sharedReportTokenFromPath('/report-view/%E0%A4%A')).toBeNull();
  });
});
