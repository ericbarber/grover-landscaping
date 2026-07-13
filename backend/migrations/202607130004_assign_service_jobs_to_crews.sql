ALTER TABLE service_jobs
    ADD COLUMN IF NOT EXISTS assigned_crew_id TEXT;

UPDATE service_jobs job
SET assigned_crew_id = assignment.crew_id
FROM (
    SELECT DISTINCT ON (stop.job_id)
        stop.job_id,
        plan.crew_id
    FROM day_plan_stops stop
    JOIN day_plans plan ON plan.id = stop.day_plan_id
    ORDER BY stop.job_id, plan.service_date DESC, plan.updated_at DESC, plan.id DESC
) assignment
WHERE job.id = assignment.job_id
  AND job.assigned_crew_id IS NULL;

UPDATE service_jobs
SET assigned_crew_id = 'crew_1001'
WHERE assigned_crew_id IS NULL
  AND id IN ('job_1001', 'job_1002', 'job_1003');

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'service_jobs_assigned_crew_id_fkey'
    ) THEN
        ALTER TABLE service_jobs
            ADD CONSTRAINT service_jobs_assigned_crew_id_fkey
            FOREIGN KEY (assigned_crew_id) REFERENCES crews(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_service_jobs_assigned_crew
    ON service_jobs (assigned_crew_id, scheduled_date, id);
