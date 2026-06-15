CREATE TABLE IF NOT EXISTS crews (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS day_plans (
    id TEXT PRIMARY KEY,
    crew_id TEXT NOT NULL REFERENCES crews(id),
    service_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'completed')),
    route_status TEXT NOT NULL CHECK (route_status IN ('manual', 'optimized')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS day_plan_stops (
    id TEXT PRIMARY KEY,
    day_plan_id TEXT NOT NULL REFERENCES day_plans(id) ON DELETE CASCADE,
    job_id TEXT NOT NULL REFERENCES service_jobs(id),
    stop_order INTEGER NOT NULL,
    stop_status TEXT NOT NULL DEFAULT 'pending' CHECK (stop_status IN ('pending', 'in_progress', 'finished')),
    estimated_drive_minutes INTEGER NOT NULL DEFAULT 0,
    estimated_service_minutes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (day_plan_id, stop_order),
    UNIQUE (day_plan_id, job_id)
);

INSERT INTO crews (id, name)
VALUES ('crew_1001', 'North Route Crew')
ON CONFLICT (id) DO NOTHING;

INSERT INTO day_plans (id, crew_id, service_date, status, route_status)
VALUES ('day_plan_2026_06_15_crew_1001', 'crew_1001', '2026-06-15', 'published', 'manual')
ON CONFLICT (id) DO NOTHING;

INSERT INTO day_plan_stops (
    id,
    day_plan_id,
    job_id,
    stop_order,
    stop_status,
    estimated_drive_minutes,
    estimated_service_minutes
)
VALUES
    ('stop_1001', 'day_plan_2026_06_15_crew_1001', 'job_1001', 1, 'pending', 12, 45),
    ('stop_1002', 'day_plan_2026_06_15_crew_1001', 'job_1002', 2, 'pending', 8, 60)
ON CONFLICT (id) DO NOTHING;
