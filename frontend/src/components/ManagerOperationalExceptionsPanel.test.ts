import { describe, expect, it } from 'vitest';
import { exceptionLabel } from './ManagerOperationalExceptionsPanel';
import { managerWorkspaceTools } from './ManagerWorkspaceMenu';

describe('manager operational exceptions', () => {
  it('uses readable lifecycle labels', () => {
    expect(exceptionLabel('customer_escalation')).toBe('Customer escalation');
    expect(exceptionLabel('in_progress')).toBe('In progress');
  });

  it('is available from the focused recovery menu', () => {
    expect(managerWorkspaceTools.recovery.some((tool) => tool.id === 'operational-exceptions')).toBe(true);
  });
});
