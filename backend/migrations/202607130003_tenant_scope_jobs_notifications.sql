ALTER TABLE service_jobs
    ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'org_demo_landscaping';

CREATE INDEX IF NOT EXISTS idx_service_jobs_organization
    ON service_jobs (organization_id, scheduled_date, id);

ALTER TABLE notification_outbox
    ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT 'org_demo_landscaping';

CREATE INDEX IF NOT EXISTS idx_notification_outbox_organization
    ON notification_outbox (organization_id, status, created_at DESC);
