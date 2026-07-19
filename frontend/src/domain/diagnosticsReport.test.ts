import { describe, expect, it } from 'vitest';
import { buildDiagnosticsReport } from './diagnosticsReport';

describe('mobile diagnostics support report', () => {
  it('formats safe operational state without a route path or query', () => {
    const report = buildDiagnosticsReport({
      checkedAt: new Date('2026-07-19T20:00:00.000Z'),
      origin: 'https://field.example.com',
      apiBaseUrl: 'https://api.example.com',
      online: true,
      apiReady: false,
      apiLatencyMs: 842,
      secureContext: true,
      workerSupported: true,
      workerControlsPage: false,
      installedMode: false,
      userAgent: 'Mobile Browser',
    });

    expect(report).toContain('App origin: https://field.example.com');
    expect(report).toContain('API: unavailable');
    expect(report).toContain('API response time: 842 ms');
    expect(report).toContain('Display mode: browser');
    expect(report).not.toContain('/reports/');
    expect(report).not.toContain('?token=');
  });
});
