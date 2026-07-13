import { describe, expect, it } from 'vitest';
import {
  completionReportsPath,
  notificationHistoryPath,
  notificationResolvePath,
  notificationRetryPath,
  toCompletionReport,
  toCompletionReportAction,
  toCompletionReportDeliveryNotification,
  toJobAddOn,
  toNotificationHistoryItem,
  type ApiCompletionReport,
  type ApiCompletionReportAction,
} from './client';

describe('core API client mapping', () => {
  it('builds completion report list paths with optional filters', () => {
    expect(completionReportsPath()).toBe('/completion-reports');
    expect(completionReportsPath({ status: 'active', readiness: 'blocked' })).toBe(
      '/completion-reports?status=active&readiness=blocked',
    );
    expect(completionReportsPath({ status: 'all', readiness: 'ready' })).toBe(
      '/completion-reports?readiness=ready',
    );
    expect(completionReportsPath({ readinessBlocker: 'before_photos' })).toBe(
      '/completion-reports?readiness_blocker=before_photos',
    );
    expect(completionReportsPath({ crewId: 'crew_1001' })).toBe(
      '/completion-reports?crew_id=crew_1001',
    );
    expect(completionReportsPath({
      customer: 'Demo Owner',
      property: 'Maple',
      scheduledFrom: '2026-06-15',
      scheduledTo: '2026-06-16',
    })).toBe(
      '/completion-reports?customer=Demo+Owner&property=Maple&scheduled_from=2026-06-15&scheduled_to=2026-06-16',
    );
  });

  it('builds notification history paths with optional filters', () => {
    expect(notificationHistoryPath()).toBe('/notifications');
    expect(notificationHistoryPath({
      entityType: 'completion_report',
      status: 'failed',
      limit: 10,
    })).toBe('/notifications?entity_type=completion_report&status=failed&limit=10');
    expect(notificationRetryPath('notification/1001')).toBe('/notifications/notification%2F1001/retry');
    expect(notificationResolvePath('notification/1001')).toBe('/notifications/notification%2F1001/resolve');
  });

  it('maps completion report responses with attached photo evidence', () => {
    const apiReport: ApiCompletionReport = {
      report_id: 'report_job_1001',
      job_id: 'job_1001',
      report_status: 'submitted',
      persisted: true,
      ready_for_customer: true,
      checklist_progress: 100,
      before_photos: 1,
      after_photos: 1,
      issue_photos: 0,
      share_url: '/report-view/share_report_job_1001',
      job: {
        id: 'job_1001',
        customer_name: 'Sample Customer',
        property_address: '123 Oak Street',
        status: 'completed',
        scheduled_date: '2026-06-15',
        before_photos: 1,
        after_photos: 1,
        checklist_items: 4,
        completed_checklist_items: 4,
        checklist: [
          {
            id: 'completion-notes',
            label: 'Submit completion notes',
            completed: true,
          },
        ],
      },
      account: {
        job_id: 'job_1001',
        account_id: 'acct_1001',
        customer_name: 'Sample Customer',
        billing_model: 'per_job',
        payment_status: 'paid',
        service_approval_status: 'approved',
        contracted_services_per_period: 1,
        completed_services_this_period: 1,
        billing_notes: 'Ready for delivery.',
      },
      photo_evidence: [
        {
          id: 'photo_1',
          job_id: 'job_1001',
          photo_type: 'before',
          file_name: 'before.jpg',
          content_type: 'image/jpeg',
          object_key: 'local/jobs/job_1001/before/before.jpg',
          status: 'uploaded',
          upload_mode: 'local-placeholder',
          display_url: 'local://local/jobs/job_1001/before/before.jpg',
          thumbnail_url: 'local://local/jobs/job_1001/before/thumb-before.jpg',
        },
      ],
      completed_add_ons: [
        {
          id: 'add_on_1001',
          job_id: 'job_1001',
          service_name: 'Sprinkler repair',
          service_description: null,
          quantity: 1,
          unit_price_cents: 8500,
          note: null,
          status: 'completed',
        },
      ],
    };

    expect(toCompletionReport(apiReport)).toMatchObject({
      reportId: 'report_job_1001',
      jobId: 'job_1001',
      reportStatus: 'submitted',
      persisted: true,
      readyForCustomer: true,
      checklistProgress: 100,
      beforePhotos: 1,
      afterPhotos: 1,
      shareUrl: 'http://localhost:5173/report-view/share_report_job_1001',
      job: {
        customerName: 'Sample Customer',
      },
      account: {
        accountId: 'acct_1001',
      },
      photoEvidence: [
        {
          photoId: 'photo_1',
          photoType: 'before',
          fileName: 'before.jpg',
          thumbnailUrl: 'local://local/jobs/job_1001/before/thumb-before.jpg',
        },
      ],
      completedAddOns: [
        {
          id: 'add_on_1001',
          status: 'completed',
        },
      ],
    });
  });

  it('maps completion report lifecycle action responses', () => {
    const action: ApiCompletionReportAction = {
      report_id: 'report_job_1001',
      job_id: 'job_1001',
      report_status: 'delivered',
      persisted: true,
      share_url: '/report-view/share_report_job_1001',
    };

    expect(toCompletionReportAction(action)).toEqual({
      reportId: 'report_job_1001',
      jobId: 'job_1001',
      reportStatus: 'delivered',
      persisted: true,
      shareUrl: 'http://localhost:5173/report-view/share_report_job_1001',
    });
  });

  it('maps completion report delivery notification responses', () => {
    expect(toCompletionReportDeliveryNotification({
      report_id: 'report_job_1001',
      notification_id: 'notification_1001',
      channel: 'email',
      recipient: 'customer@example.com',
      delivery_status: 'queued',
      share_url: '/report-view/share_report_job_1001',
    })).toEqual({
      reportId: 'report_job_1001',
      notificationId: 'notification_1001',
      channel: 'email',
      recipient: 'customer@example.com',
      deliveryStatus: 'queued',
      shareUrl: 'http://localhost:5173/report-view/share_report_job_1001',
    });
  });

  it('maps notification history responses', () => {
    expect(toNotificationHistoryItem({
      id: 'notification_1001',
      entity_type: 'completion_report',
      entity_id: 'report_job_1001',
      channel: 'email',
      recipient: 'customer@example.com',
      template_key: 'completion_report_delivery',
      status: 'failed',
      attempt_count: 2,
      available_at: '2026-07-13 10:00:00+00',
      last_attempt_at: '2026-07-13 09:00:00+00',
      sent_at: null,
      last_error: 'provider unavailable',
      provider_response_code: 503,
      provider_message_id: null,
      created_at: '2026-07-13 08:00:00+00',
      updated_at: '2026-07-13 09:00:00+00',
    })).toMatchObject({
      id: 'notification_1001',
      entityType: 'completion_report',
      status: 'failed',
      attemptCount: 2,
      lastError: 'provider unavailable',
      providerResponseCode: 503,
    });
  });

  it('maps scheduled job add-ons for crew execution', () => {
    expect(toJobAddOn({
      id: 'add_on_1001',
      job_id: 'job_1001',
      service_name: 'Sprinkler repair',
      service_description: 'Replace damaged sprinkler heads',
      quantity: 2,
      unit_price_cents: 8500,
      note: 'Approved by customer',
      status: 'scheduled',
    })).toEqual({
      id: 'add_on_1001',
      jobId: 'job_1001',
      serviceName: 'Sprinkler repair',
      serviceDescription: 'Replace damaged sprinkler heads',
      quantity: 2,
      unitPriceCents: 8500,
      note: 'Approved by customer',
      status: 'scheduled',
    });
  });
});
