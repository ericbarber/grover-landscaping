import { describe, expect, it } from 'vitest';
import {
  completionReportsPath,
  customerPhotoErasurePath,
  customerPrivacyExportPath,
  notificationHistoryPath,
  notificationResolvePath,
  notificationRetryPath,
  organizationInvitationsPath,
  organizationInvitationPath,
  organizationMembershipRolePath,
  organizationMembershipsPath,
  photoErasureDeletionHistoryPath,
  photoProcessingHistoryPath,
  photoProcessingResolvePath,
  photoProcessingRetryPath,
  propertyOnboardingPath,
  propertyCompletionReportsPath,
  toCompletionReport,
  toCompletionReportAction,
  toCompletionReportDeliveryNotification,
  toCustomerPhotoErasureSummary,
  toCustomerAccountOnboardingProgress,
  toCustomerPropertyPortfolioRecord,
  toCustomerPrivacyExport,
  toJobAddOn,
  toNotificationHistoryItem,
  toOrganizationInvitation,
  toOrganizationInvitationSummary,
  toPhotoErasureDeletionHistoryItem,
  toPhotoProcessingHistoryItem,
  toPropertyOnboardingProfile,
  toPrincipalAccessSummary,
  toPropertyCompletionReportSummary,
  type ApiCompletionReport,
  type ApiCompletionReportAction,
  type ApiCustomerPrivacyExport,
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

  it('builds and maps organization invitations', () => {
    expect(organizationInvitationsPath('org/demo')).toBe(
      '/organizations/org%2Fdemo/invitations',
    );
    expect(organizationInvitationPath('org/demo', 'invite/1')).toBe(
      '/organizations/org%2Fdemo/invitations/invite%2F1',
    );
    expect(toOrganizationInvitation({
      id: 'invitation_1',
      organization_id: 'org_1',
      invitee_email: 'crew@example.com',
      role: 'crew_member',
      status: 'pending',
      scope_type: 'organization',
      scope_id: 'org_1',
      token: 'invite_token',
      membership_id: 'membership_1',
      invited_by_user_id: 'owner_1',
      accepted_by_user_id: null,
      expires_at: null,
      persisted: true,
    })).toEqual({
      id: 'invitation_1',
      organizationId: 'org_1',
      inviteeEmail: 'crew@example.com',
      role: 'crew_member',
      status: 'pending',
      scopeType: 'organization',
      scopeId: 'org_1',
      token: 'invite_token',
      membershipId: 'membership_1',
      expiresAt: null,
      persisted: true,
    });
    expect(toOrganizationInvitationSummary({
      id: 'invitation_1',
      organization_id: 'org_1',
      invitee_email: 'crew@example.com',
      role: 'crew_member',
      status: 'accepted',
      scope_type: 'organization',
      scope_id: 'org_1',
      membership_id: 'membership_1',
      expires_at: null,
      persisted: true,
    })).toEqual({
      id: 'invitation_1',
      organizationId: 'org_1',
      inviteeEmail: 'crew@example.com',
      role: 'crew_member',
      status: 'accepted',
      scopeType: 'organization',
      scopeId: 'org_1',
      membershipId: 'membership_1',
      expiresAt: null,
      persisted: true,
    });
  });

  it('builds organization membership administration paths', () => {
    expect(organizationMembershipsPath('org/demo')).toBe(
      '/organizations/org%2Fdemo/memberships',
    );
    expect(organizationMembershipRolePath('org/demo', 'member/1')).toBe(
      '/organizations/org%2Fdemo/memberships/member%2F1/role',
    );
  });

  it('builds photo processing recovery paths with optional filters', () => {
    expect(photoProcessingHistoryPath()).toBe('/photo-processing-jobs');
    expect(photoProcessingHistoryPath({
      taskType: 'thumbnail_generation',
      status: 'dead_letter',
      limit: 10,
    })).toBe('/photo-processing-jobs?task_type=thumbnail_generation&status=dead_letter&limit=10');
    expect(photoProcessingRetryPath('photo/processing/1001')).toBe(
      '/photo-processing-jobs/photo%2Fprocessing%2F1001/retry',
    );
    expect(photoProcessingResolvePath('photo/processing/1001')).toBe(
      '/photo-processing-jobs/photo%2Fprocessing%2F1001/resolve',
    );
  });

  it('builds and maps photo erasure deletion recovery data', () => {
    expect(photoErasureDeletionHistoryPath()).toBe('/photo-erasure-deletion-jobs?limit=25');
    expect(photoErasureDeletionHistoryPath('dead_letter')).toBe(
      '/photo-erasure-deletion-jobs?status=dead_letter&limit=25',
    );
    expect(toPhotoErasureDeletionHistoryItem({
      id: 'photo_erasure_deletion_1001',
      account_id: 'acct_1001',
      organization_id: 'org_demo_landscaping',
      object_key: 'jobs/job_1001/photos/before.jpg',
      status: 'dead_letter',
      attempt_count: 5,
      available_at: '2026-07-18 08:00:00+00',
      last_attempt_at: '2026-07-18 07:00:00+00',
      completed_at: null,
      resolved_at: null,
      last_error: 'photo_object_deletion_failed',
      resolution_note: null,
      created_at: '2026-07-18 06:00:00+00',
      updated_at: '2026-07-18 07:00:00+00',
    })).toMatchObject({
      id: 'photo_erasure_deletion_1001',
      accountId: 'acct_1001',
      objectKey: 'jobs/job_1001/photos/before.jpg',
      status: 'dead_letter',
      attemptCount: 5,
    });
  });

  it('builds customer privacy paths with encoded account ids', () => {
    expect(customerPrivacyExportPath('acct_1001')).toBe('/accounts/acct_1001/privacy-export');
    expect(customerPrivacyExportPath('acct/1001')).toBe('/accounts/acct%2F1001/privacy-export');
    expect(customerPhotoErasurePath('acct/1001')).toBe('/accounts/acct%2F1001/photo-erasure');
  });

  it('builds customer property completion report paths with encoded ids', () => {
    expect(propertyCompletionReportsPath('property_1001')).toBe('/properties/property_1001/completion-reports');
    expect(propertyCompletionReportsPath('property/1001')).toBe('/properties/property%2F1001/completion-reports');
  });

  it('builds and maps property onboarding profiles', () => {
    expect(propertyOnboardingPath('property/1001')).toBe(
      '/properties/property%2F1001/onboarding',
    );
    expect(toPropertyOnboardingProfile({
      property_id: 'property_1001',
      account_id: 'acct_1001',
      organization_id: 'org_demo_landscaping',
      service_address: '123 Oak Street',
      access_notes: null,
      billing_contact_name: 'Sample Customer',
      billing_contact_email: 'billing@example.com',
      notification_contact_name: 'Sample Customer',
      notification_email: 'notify@example.com',
      notification_phone: null,
      onboarding_status: 'active',
      persisted: true,
    })).toMatchObject({
      propertyId: 'property_1001',
      accountId: 'acct_1001',
      accessNotes: '',
      notificationPhone: '',
      onboardingStatus: 'active',
      persisted: true,
    });
  });

  it('maps current-user organization access', () => {
    expect(toPrincipalAccessSummary({
      user_id: 'cognito-sub-1',
      username: 'owner@example.com',
      claim_roles: ['OrganizationOwner'],
      memberships: [{
        id: 'membership_1',
        organization_id: 'org_1',
        organization_name: 'Grover Landscaping',
        organization_type: 'yard_care_company',
        user_id: 'cognito-sub-1',
        role: 'OrganizationOwner',
        status: 'active',
        scope_type: 'organization',
        scope_id: 'org_1',
      }],
    })).toMatchObject({
      userId: 'cognito-sub-1',
      claimRoles: ['OrganizationOwner'],
      memberships: [{
        organizationId: 'org_1',
        organizationName: 'Grover Landscaping',
        role: 'OrganizationOwner',
      }],
    });
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
          file_size_bytes: 24576,
          image_width_px: 1600,
          image_height_px: 900,
          metadata_source: 'client_reported',
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
      snapshot_metadata: {
        snapshot_version: 1,
        report_id: 'report_job_1001',
        job_id: 'job_1001',
        captured_at_epoch_seconds: 1_783_920_000,
        evidence: {
          before_photos: 1,
          after_photos: 1,
          issue_photos: 0,
          total_photo_evidence: 1,
          completed_add_ons: 1,
        },
      },
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
          fileSizeBytes: 24576,
          imageWidthPx: 1600,
          imageHeightPx: 900,
          metadataSource: 'client_reported',
        },
      ],
      completedAddOns: [
        {
          id: 'add_on_1001',
          status: 'completed',
        },
      ],
      snapshotMetadata: {
        snapshotVersion: 1,
        reportId: 'report_job_1001',
        jobId: 'job_1001',
        capturedAtEpochSeconds: 1_783_920_000,
        evidence: {
          beforePhotos: 1,
          afterPhotos: 1,
          issuePhotos: 0,
          totalPhotoEvidence: 1,
          completedAddOns: 1,
        },
      },
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

  it('maps customer property completion report summaries', () => {
    expect(toPropertyCompletionReportSummary({
      report_id: 'report_job_1001',
      job_id: 'job_1001',
      property_id: 'property_1001',
      organization_id: 'org_demo_landscaping',
      customer_name: 'Sample Customer',
      property_address: '123 Oak Street',
      delivered_at: '2026-07-13 10:00:00+00',
      share_url: '/report-view/share_report_job_1001',
    })).toEqual({
      reportId: 'report_job_1001',
      jobId: 'job_1001',
      propertyId: 'property_1001',
      organizationId: 'org_demo_landscaping',
      customerName: 'Sample Customer',
      propertyAddress: '123 Oak Street',
      deliveredAt: '2026-07-13 10:00:00+00',
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

  it('maps photo processing history responses', () => {
    expect(toPhotoProcessingHistoryItem({
      id: 'photo_processing_1001',
      photo_id: 'photo_1001',
      job_id: 'job_1001',
      organization_id: 'org_demo_landscaping',
      photo_type: 'after',
      file_name: 'after.jpg',
      task_type: 'thumbnail_generation',
      status: 'dead_letter',
      attempt_count: 5,
      available_at: '2026-07-13 10:00:00+00',
      last_attempt_at: '2026-07-13 09:00:00+00',
      completed_at: null,
      resolved_at: null,
      last_error: 'thumbnail_generation_failed',
      failure_reason: 'thumbnail_generation_unavailable',
      resolution_note: null,
      created_at: '2026-07-13 08:00:00+00',
      updated_at: '2026-07-13 09:00:00+00',
    })).toMatchObject({
      id: 'photo_processing_1001',
      photoId: 'photo_1001',
      jobId: 'job_1001',
      fileName: 'after.jpg',
      status: 'dead_letter',
      attemptCount: 5,
      lastError: 'thumbnail_generation_failed',
    });
  });

  it('maps customer privacy export and erasure responses', () => {
    const apiExport: ApiCustomerPrivacyExport = {
      account: {
        account_id: 'acct_1001',
        customer_name: 'Sample Customer',
        billing_model: 'per_job',
        payment_status: 'paid',
        service_approval_status: 'approved',
        contracted_services_per_period: 1,
        completed_services_this_period: 1,
        period_start: '2026-07-01',
        period_end: null,
        billing_notes: null,
        organization_ids: ['org_demo_landscaping'],
        created_at: '2026-07-13 08:00:00+00',
        updated_at: '2026-07-13 08:00:00+00',
      },
      jobs: [{
        job_id: 'job_1001',
        organization_id: 'org_demo_landscaping',
        customer_name: 'Sample Customer',
        property_address: '123 Oak Street',
        status: 'completed',
        scheduled_date: '2026-07-13',
        before_photos: 1,
        after_photos: 1,
        created_at: '2026-07-13 08:00:00+00',
        updated_at: '2026-07-13 09:00:00+00',
      }],
      photo_evidence: [{
        photo_id: 'photo_1001',
        job_id: 'job_1001',
        organization_id: 'org_demo_landscaping',
        photo_type: 'before',
        file_name: null,
        content_type: null,
        object_key: null,
        thumbnail_object_key: null,
        status: 'erased',
        upload_mode: 's3-presigned',
        file_size_bytes: null,
        image_width_px: null,
        image_height_px: null,
        metadata_source: 'erased',
        uploaded_at: '2026-07-13 08:30:00+00',
        erased_at: '2026-07-13 09:30:00+00',
        erasure_reason: 'Customer request',
      }],
      completion_reports: [{
        report_id: 'report_job_1001',
        job_id: 'job_1001',
        report_status: 'delivered',
        ready_for_customer: true,
        sent_at: null,
        delivered_at: '2026-07-13 09:00:00+00',
        delivered_snapshot_at: '2026-07-13 09:00:00+00',
        delivered_snapshot_photo_count: 0,
        created_at: '2026-07-13 08:00:00+00',
        updated_at: '2026-07-13 09:30:00+00',
      }],
      generated_at: '2026-07-13 10:00:00+00',
    };

    expect(toCustomerPrivacyExport(apiExport)).toMatchObject({
      account: {
        accountId: 'acct_1001',
        customerName: 'Sample Customer',
      },
      jobs: [{ jobId: 'job_1001' }],
      photoEvidence: [{
        photoId: 'photo_1001',
        status: 'erased',
        objectKey: null,
        erasureReason: 'Customer request',
      }],
      completionReports: [{
        reportId: 'report_job_1001',
        deliveredSnapshotPhotoCount: 0,
      }],
    });

    expect(toCustomerPhotoErasureSummary({
      account_id: 'acct_1001',
      status: 'erased',
      erased_photo_count: 2,
      affected_job_count: 1,
      redacted_completion_report_count: 1,
      deleted_object_key_count: 1,
      failed_object_key_count: 1,
      object_keys_pending_deletion: ['photos/job_1001/after.jpg'],
    })).toEqual({
      accountId: 'acct_1001',
      status: 'erased',
      erasedPhotoCount: 2,
      affectedJobCount: 1,
      redactedCompletionReportCount: 1,
      deletedObjectKeyCount: 1,
      failedObjectKeyCount: 1,
      objectKeysPendingDeletion: ['photos/job_1001/after.jpg'],
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

  it('maps account onboarding progress counts', () => {
    expect(toCustomerAccountOnboardingProgress({
      account_id: 'acct_1001',
      customer_details_ready: true,
      property_count: 2,
      service_ready_property_count: 1,
      active_property_count: 1,
      properties_needing_attention: [{
        property_id: 'property_1002',
        display_name: 'Back yard',
        status: 'onboarding',
        reasons: ['crew_unassigned'],
      }],
      complete: false,
      persisted: true,
    })).toEqual({
      accountId: 'acct_1001',
      customerDetailsReady: true,
      propertyCount: 2,
      serviceReadyPropertyCount: 1,
      activePropertyCount: 1,
      propertiesNeedingAttention: [{
        propertyId: 'property_1002',
        displayName: 'Back yard',
        status: 'onboarding',
        reasons: ['crew_unassigned'],
      }],
      complete: false,
      persisted: true,
    });
  });

  it('maps persisted customer portfolio membership for property setup', () => {
    expect(toCustomerPropertyPortfolioRecord({
      account_id: 'acct_1001',
      organization_ids: ['org_1001'],
      portfolios: [{
        id: 'portfolio_1001',
        account_id: 'acct_1001',
        organization_id: 'org_1001',
        display_name: 'North Phoenix homes',
        portfolio_type: 'property_management_company',
        property_count: 1,
        properties: [{
          id: 'property_1001',
          account_id: 'acct_1001',
          organization_id: 'org_1001',
          display_name: 'Desert Ridge',
          address: '100 Desert Ridge Way',
          last_service_date: '2026-07-17',
          persisted: true,
        }],
        persisted: true,
      }],
      ungrouped_properties: [],
      persisted: true,
    })).toEqual({
      accountId: 'acct_1001',
      organizationIds: ['org_1001'],
      portfolios: [{
        id: 'portfolio_1001',
        accountId: 'acct_1001',
        organizationId: 'org_1001',
        displayName: 'North Phoenix homes',
        portfolioType: 'property_management_company',
        propertyCount: 1,
        properties: [{
          id: 'property_1001',
          accountId: 'acct_1001',
          organizationId: 'org_1001',
          displayName: 'Desert Ridge',
          address: '100 Desert Ridge Way',
          lastServiceDate: '2026-07-17',
          persisted: true,
        }],
        persisted: true,
      }],
      ungroupedProperties: [],
      persisted: true,
    });
  });
});
