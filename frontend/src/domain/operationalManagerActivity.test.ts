import { describe, expect, it } from 'vitest';
import { operationalToManagerActivity } from './operationalManagerActivity';

describe('persisted operational manager activity', () => {
  it('maps route publications to successful route activity', () => {
    expect(operationalToManagerActivity({
      id: 'route_plan_1001_published',
      organizationId: 'org_1001',
      eventKind: 'route_published',
      targetId: 'plan_1001',
      actorUserId: 'system',
      occurredAt: '2026-07-19T17:00:00Z',
    })).toMatchObject({
      title: 'Route published',
      tone: 'success',
      source: 'route',
    });
  });

  it('maps report change requests to warning activity with guidance', () => {
    expect(operationalToManagerActivity({
      id: 'audit_1001',
      organizationId: 'org_1001',
      eventKind: 'report_changes_requested',
      targetId: 'report_1001',
      actorUserId: 'manager_1001',
      occurredAt: '2026-07-19T17:05:00Z',
    })).toMatchObject({
      title: 'Completion report changes requested',
      tone: 'warning',
      source: 'job',
      recommendedAction: 'Track the report until the crew resubmits the requested corrections.',
    });
  });
});
