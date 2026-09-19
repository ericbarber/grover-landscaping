import { describe, expect, it } from 'vitest';
import {
  operationalToManagerActivity,
  operationsToManagerActivity,
} from './operationalManagerActivity';

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

  it('maps photo erasure recovery events without crashing the activity feed', () => {
    expect(operationalToManagerActivity({
      id: 'audit_photo_erasure_retry_1001',
      organizationId: 'org_1001',
      eventKind: 'photo_erasure_deletion_retried',
      targetId: 'photo_erasure_1001',
      actorUserId: 'manager_1001',
      occurredAt: '2026-07-19T17:12:00Z',
    })).toMatchObject({
      title: 'Photo erasure deletion retried',
      tone: 'info',
      source: 'photo',
    });
  });

  it('maps operational exception creation and lifecycle context back to Recovery', () => {
    expect(operationalToManagerActivity({
      id: 'audit_exception_created_1001',
      organizationId: 'org_1001',
      eventKind: 'operational_exception_created',
      targetId: 'exception_1001',
      actorUserId: 'manager_1001',
      actorLabel: 'Maria Manager',
      occurredAt: '2026-07-19T17:12:00Z',
      metadata: {
        title: 'Blocked gate access',
        category: 'access',
        priority: 'high',
        status: 'open',
        assigned_user_id: null,
      },
    })).toMatchObject({
      title: 'Operational exception created',
      message: 'Blocked gate access (exception_1001) · recorded by Maria Manager. Access · High priority · Open · unassigned.',
      tone: 'warning',
      source: 'recovery',
      actionKind: 'open_operational_exception',
      actionTargetId: 'exception_1001',
    });

    expect(operationalToManagerActivity({
      id: 'audit_exception_assign_1001',
      organizationId: 'org_1001',
      eventKind: 'operational_exception_assign',
      targetId: 'exception_1001',
      actorUserId: 'manager_1001',
      occurredAt: '2026-07-19T17:13:00Z',
      metadata: {
        title: 'Blocked gate access',
        previous_assigned_user_id: null,
        assigned_user_id: 'manager_2002',
      },
    })).toMatchObject({
      message: 'Blocked gate access (exception_1001) · recorded by manager_1001. Assignment unassigned → manager_2002.',
      tone: 'info',
      source: 'recovery',
    });

    expect(operationalToManagerActivity({
      id: 'audit_exception_resolve_1001',
      organizationId: 'org_1001',
      eventKind: 'operational_exception_resolve',
      targetId: 'exception_1001',
      actorUserId: 'manager_2002',
      occurredAt: '2026-07-19T17:14:00Z',
      metadata: {
        title: 'Blocked gate access',
        previous_status: 'in_progress',
        status: 'resolved',
        resolution_note: 'Customer supplied a working code.',
      },
    })).toMatchObject({
      message: 'Blocked gate access (exception_1001) · recorded by manager_2002. Status In progress → Resolved. Resolution: Customer supplied a working code.',
      tone: 'success',
      source: 'recovery',
    });
  });

  it('falls back safely when the API adds an activity kind before the UI presentation', () => {
    expect(operationalToManagerActivity({
      id: 'audit_future_1001',
      organizationId: 'org_1001',
      eventKind: 'future_operational_event' as never,
      targetId: 'job_1001',
      actorUserId: 'manager_1001',
      occurredAt: '2026-07-19T17:13:00Z',
    })).toMatchObject({
      title: 'Operational activity recorded',
      tone: 'info',
      source: 'job',
    });
  });

  it('surfaces customer follow-up for a schedule-changing dispatch move', () => {
    expect(operationalToManagerActivity({
      id: 'audit_move_1001',
      organizationId: 'org_1001',
      eventKind: 'job_reassigned',
      targetId: 'job_1001',
      actorUserId: 'manager_1001',
      actorLabel: 'Maria Manager',
      occurredAt: '2026-07-19T17:20:00Z',
      metadata: {
        old_crew_id: 'crew_1001',
        new_crew_id: 'crew_2002',
        old_scheduled_date: '2026-07-19',
        new_scheduled_date: '2026-07-20',
        customer_notification_required: true,
      },
    })).toMatchObject({
      title: 'Scheduled job moved',
      message: 'job_1001 · recorded by Maria Manager. Moved crew_1001 → crew_2002 · 2026-07-19 → 2026-07-20.',
      tone: 'warning',
      source: 'route',
      recommendedAction: 'Notify the customer about the changed service schedule and record delivery follow-up.',
    });
  });

  it('clears the linked move action after customer notification is recorded', () => {
    const items = operationsToManagerActivity([
      {
        id: 'audit_notified_1001',
        organizationId: 'org_1001',
        eventKind: 'dispatch_customer_notified',
        targetId: 'job_1001',
        actorUserId: 'manager_1001',
        occurredAt: '2026-07-19T17:25:00Z',
        metadata: {
          channel: 'phone',
          reassignment_audit_id: 'audit_move_1001',
        },
      },
      {
        id: 'audit_move_1001',
        organizationId: 'org_1001',
        eventKind: 'job_reassigned',
        targetId: 'job_1001',
        actorUserId: 'manager_1001',
        occurredAt: '2026-07-19T17:20:00Z',
        metadata: { customer_notification_required: true },
      },
    ]);
    expect(items[0]).toMatchObject({
      title: 'Dispatch customer notified',
      message: 'job_1001 · recorded by manager_1001. Customer contacted by phone.',
    });
    expect(items[1].actionKind).toBeUndefined();
  });
});
