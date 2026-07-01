ALTER TABLE day_plan_amendment_requests
    DROP CONSTRAINT IF EXISTS day_plan_amendment_requests_status_check;

ALTER TABLE day_plan_amendment_requests
    ADD CONSTRAINT day_plan_amendment_requests_status_check
    CHECK (status IN ('draft', 'submitted', 'bid_review', 'approved', 'rejected'));

ALTER TABLE day_plan_amendment_requests
    ADD COLUMN IF NOT EXISTS manager_note TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
