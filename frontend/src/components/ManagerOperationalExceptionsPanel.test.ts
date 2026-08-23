import { describe, expect, it } from 'vitest';
import type { OperationalException } from '../api/operationalExceptionsClient';
import { exceptionLabel, summarizeOperationalExceptions } from './ManagerOperationalExceptionsPanel';
import { managerWorkspaceTools } from './ManagerWorkspaceMenu';

describe('manager operational exceptions', () => {
  it('uses readable lifecycle labels', () => {
    expect(exceptionLabel('customer_escalation')).toBe('Customer escalation');
    expect(exceptionLabel('in_progress')).toBe('In progress');
  });

  it('is available from the focused recovery menu', () => {
    expect(managerWorkspaceTools.recovery.some((tool) => tool.id === 'operational-exceptions')).toBe(true);
  });

  it('summarizes ownership, urgency, and same-day resolution', () => {
    const item = (overrides: Partial<OperationalException>): OperationalException => ({
      id: 'exception_1',
      organizationId: 'org_demo',
      category: 'delay',
      priority: 'medium',
      status: 'open',
      title: 'Route delay',
      description: null,
      affectedResourceType: 'route',
      affectedResourceId: 'day_plan_1',
      assignedUserId: null,
      reportedByUserId: 'manager_1',
      resolvedByUserId: null,
      resolutionNote: null,
      resolvedAt: null,
      createdAt: '2026-08-22T08:00:00Z',
      updatedAt: '2026-08-22T08:00:00Z',
      ...overrides,
    });

    expect(summarizeOperationalExceptions([
      item({ id: 'open_urgent', priority: 'critical', assignedUserId: 'manager_2' }),
      item({ id: 'open_unassigned' }),
      item({
        id: 'resolved_today',
        status: 'resolved',
        resolvedAt: '2026-08-22T10:30:00Z',
      }),
    ], '2026-08-22')).toEqual({
      open: 2,
      assigned: 1,
      urgent: 1,
      resolvedToday: 1,
    });
  });
});
