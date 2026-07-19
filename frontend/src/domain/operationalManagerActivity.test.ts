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

  it('shows authenticated route mutation actors', () => {
    expect(operationalToManagerActivity({
      id: 'audit_route_stop_1001',
      organizationId: 'org_1001',
      eventKind: 'route_stop_assigned',
      targetId: 'plan_1001',
      actorUserId: 'manager_1001',
      actorLabel: 'Maria Manager',
      occurredAt: '2026-07-19T17:01:00Z',
      metadata: {
        stop_id: 'stop_1001',
        job_id: 'job_1001',
      },
    })).toMatchObject({
      title: 'Route stop assigned',
      message: 'plan_1001 · recorded by Maria Manager. Assigned job_1001 as stop_1001.',
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

  it('maps bid and photo audit events to their operational sources', () => {
    expect(operationalToManagerActivity({
      id: 'audit_bid_1001',
      organizationId: 'org_1001',
      eventKind: 'bid_approved',
      targetId: 'bid_1001',
      actorUserId: 'customer_1001',
      occurredAt: '2026-07-19T17:10:00Z',
    })).toMatchObject({
      title: 'Project bid approved',
      tone: 'success',
      source: 'job',
    });
    expect(operationalToManagerActivity({
      id: 'audit_photo_1001',
      organizationId: 'org_1001',
      eventKind: 'photo_processing_retried',
      targetId: 'photo_1001',
      actorUserId: 'manager_1001',
      occurredAt: '2026-07-19T17:11:00Z',
    })).toMatchObject({
      title: 'Photo processing retried',
      tone: 'info',
      source: 'photo',
    });
  });
});
