import { describe, expect, it } from 'vitest';
import { isDiagnosticsPath } from './diagnosticsRoute';

describe('diagnostics route', () => {
  it('matches the diagnostics path with an optional trailing slash', () => {
    expect(isDiagnosticsPath('/diagnostics')).toBe(true);
    expect(isDiagnosticsPath('/diagnostics/')).toBe(true);
  });

  it('does not capture other public or authenticated routes', () => {
    expect(isDiagnosticsPath('/')).toBe(false);
    expect(isDiagnosticsPath('/diagnostics/history')).toBe(false);
    expect(isDiagnosticsPath('/reports/token')).toBe(false);
  });
});
