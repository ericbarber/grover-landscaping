import { describe, expect, it, vi } from 'vitest';
import type { PropertyCompletionReportSummary } from '../../../api/client';
import { readCustomerPropertyReportHistory } from './useCustomerPropertyReportHistory';

const report = {
  reportId: 'report-1',
  propertyId: 'property-1',
} as PropertyCompletionReportSummary;

describe('customer property report history coordination', () => {
  it('indexes successful property histories', async () => {
    const readReports = vi.fn(async (propertyId: string) => (
      propertyId === 'property-1' ? [report] : []
    ));

    await expect(readCustomerPropertyReportHistory(
      ['property-1', 'property-2'],
      readReports,
    )).resolves.toEqual({
      reportsByProperty: {
        'property-1': [report],
        'property-2': [],
      },
      partial: false,
    });
  });

  it('preserves successful histories when one property read fails', async () => {
    const readReports = vi.fn(async (propertyId: string) => {
      if (propertyId === 'property-2') throw new Error('Unavailable');
      return [report];
    });

    await expect(readCustomerPropertyReportHistory(
      ['property-1', 'property-2'],
      readReports,
    )).resolves.toEqual({
      reportsByProperty: { 'property-1': [report] },
      partial: true,
    });
  });

  it('returns an empty complete result for an empty property scope', async () => {
    const readReports = vi.fn(async () => [report]);
    await expect(readCustomerPropertyReportHistory([], readReports)).resolves.toEqual({
      reportsByProperty: {},
      partial: false,
    });
    expect(readReports).not.toHaveBeenCalled();
  });
});
