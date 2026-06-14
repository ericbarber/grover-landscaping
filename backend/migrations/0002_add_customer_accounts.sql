CREATE TABLE IF NOT EXISTS customer_accounts (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    billing_model TEXT NOT NULL CHECK (billing_model IN ('per_job', 'monthly_plan', 'prepaid_package', 'manual_account')),
    payment_status TEXT NOT NULL CHECK (payment_status IN ('not_required', 'pending', 'paid', 'past_due', 'waived', 'manager_review')),
    service_approval_status TEXT NOT NULL CHECK (service_approval_status IN ('approved', 'blocked', 'manager_review')),
    contracted_services_per_period INTEGER NOT NULL DEFAULT 0,
    completed_services_this_period INTEGER NOT NULL DEFAULT 0,
    period_start TEXT,
    period_end TEXT,
    billing_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE service_jobs
ADD COLUMN IF NOT EXISTS customer_account_id TEXT REFERENCES customer_accounts(id);

INSERT INTO customer_accounts (
    id,
    customer_name,
    billing_model,
    payment_status,
    service_approval_status,
    contracted_services_per_period,
    completed_services_this_period,
    period_start,
    period_end,
    billing_notes
)
VALUES
    ('acct_1001', 'Sample Customer', 'per_job', 'pending', 'approved', 1, 0, '2026-06-01', '2026-06-30', 'Payment can be marked complete after service.'),
    ('acct_1002', 'Demo Property Owner', 'monthly_plan', 'paid', 'approved', 4, 2, '2026-06-01', '2026-06-30', 'Monthly plan is current.')
ON CONFLICT (id) DO NOTHING;

UPDATE service_jobs
SET customer_account_id = 'acct_1001'
WHERE id = 'job_1001' AND customer_account_id IS NULL;

UPDATE service_jobs
SET customer_account_id = 'acct_1002'
WHERE id = 'job_1002' AND customer_account_id IS NULL;
