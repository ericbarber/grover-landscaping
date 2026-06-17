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
    ('job_1003', 'Route Planning Demo Customer', '789 Pine Road', 'scheduled', '2026-06-16', 0, 0, 4, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO job_checklist_items (id, job_id, label, completed, sort_order)
VALUES
    ('job_1003_before_photos', 'job_1003', 'Capture before photos', false, 1),
    ('job_1003_yard_service', 'job_1003', 'Complete yard service', false, 2),
    ('job_1003_after_photos', 'job_1003', 'Capture after photos', false, 3),
    ('job_1003_completion_notes', 'job_1003', 'Submit completion notes', false, 4)
ON CONFLICT (id) DO NOTHING;
