ALTER TABLE access_audit_events
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE access_audit_events audit
SET metadata = jsonb_build_object(
    'crew_id', plan.crew_id,
    'service_date', plan.service_date::text
)
FROM day_plans plan
WHERE audit.target_id = plan.id
  AND audit.event_kind IN (
      'route_draft_saved',
      'route_published',
      'route_completed',
      'route_stop_assigned',
      'route_stop_removed',
      'route_stops_reordered'
  )
  AND audit.metadata = '{}'::jsonb;
