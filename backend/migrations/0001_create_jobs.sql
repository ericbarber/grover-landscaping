CREATE TABLE IF NOT EXISTS service_jobs (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    property_address TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed')),
    scheduled_date TEXT NOT NULL,
    before_photos INTEGER NOT NULL DEFAULT 0,
    after_photos INTEGER NOT NULL DEFAULT 0,
    checklist_items INTEGER NOT NULL DEFAULT 4,
    completed_checklist_items INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_checklist_items (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL REFERENCES service_jobs(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS job_photos (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL REFERENCES service_jobs(id) ON DELETE CASCADE,
    photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'after', 'issue', 'extra')),
    file_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    object_key TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    uploaded_at TIMESTAMPTZ
);

INSERT INTO service_jobs (
    id,
    customer_name,
    property_address,
    status,
    scheduled_date,
    before_photos,
    after_photos,
    checklist_items,
    completed_checklist_items
)
VALUES
    ('job_1001', 'Sample Customer', '123 Oak Street', 'scheduled', '2026-06-15', 0, 0, 4, 0),
    ('job_1002', 'Demo Property Owner', '456 Maple Avenue', 'in_progress', '2026-06-15', 3, 1, 4, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO job_checklist_items (id, job_id, label, completed, sort_order)
VALUES
    ('job_1001_before_photos', 'job_1001', 'Capture before photos', false, 1),
    ('job_1001_yard_service', 'job_1001', 'Complete yard service', false, 2),
    ('job_1001_after_photos', 'job_1001', 'Capture after photos', false, 3),
    ('job_1001_completion_notes', 'job_1001', 'Submit completion notes', false, 4),
    ('job_1002_before_photos', 'job_1002', 'Capture before photos', true, 1),
    ('job_1002_yard_service', 'job_1002', 'Complete yard service', true, 2),
    ('job_1002_after_photos', 'job_1002', 'Capture after photos', false, 3),
    ('job_1002_completion_notes', 'job_1002', 'Submit completion notes', false, 4)
ON CONFLICT (id) DO NOTHING;
