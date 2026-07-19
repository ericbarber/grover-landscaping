UPDATE crews crew
SET daily_stop_capacity = organization.default_daily_stop_capacity
FROM organizations organization
WHERE organization.id = crew.organization_id;
