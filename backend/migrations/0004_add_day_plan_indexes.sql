CREATE INDEX IF NOT EXISTS idx_day_plans_crew_service_date
ON day_plans (crew_id, service_date);

CREATE INDEX IF NOT EXISTS idx_day_plan_stops_day_plan_order
ON day_plan_stops (day_plan_id, stop_order);

CREATE INDEX IF NOT EXISTS idx_day_plan_stops_day_plan_stop
ON day_plan_stops (day_plan_id, id);
