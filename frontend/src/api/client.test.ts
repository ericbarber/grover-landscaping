import { describe, expect, it } from 'vitest';
import { toCompletionReport, toJobAddOn, type ApiCompletionReport } from './client';

describe('core API client mapping', () => {
  it('maps completion report responses with attached photo evidence', () => {
    const apiReport: ApiCompletionReport = {
      report_id: 'report_job_1001',
      job_id: 'job_1001',
      report_status: 'ready',
      persisted: true,
      ready_for_customer: true,
      checklist_progress: 100,
      before_photos: 1,
      after_photos: 1,
      issue_photos: 0,
      share_url: '/reports/share_report_job_1001',
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
        },
      ],
    };

    expect(toCompletionReport(apiReport)).toMatchObject({
      reportId: 'report_job_1001',
      jobId: 'job_1001',
      reportStatus: 'ready',
      persisted: true,
      readyForCustomer: true,
      checklistProgress: 100,
      beforePhotos: 1,
      afterPhotos: 1,
      shareUrl: 'http://localhost:8080/reports/share_report_job_1001',
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
        },
      ],
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
