# Data Model

## Initial Tables

```text
companies
users
crews
crew_members
customers
properties
service_jobs
job_checklists
job_photos
job_completion_reports
audit_events
notifications
```

## service_jobs

Suggested fields:

```text
id
company_id
property_id
assigned_crew_id
scheduled_date
status
service_type
notes
started_at
completed_at
created_at
updated_at
```

## job_photos

Suggested fields:

```text
id
job_id
property_id
uploaded_by_user_id
s3_bucket
s3_key_original
s3_key_thumbnail
photo_type
captured_at
uploaded_at
latitude
longitude
device_id
content_hash
status
created_at
updated_at
```

Valid `photo_type` values:

```text
before
after
issue
extra
```

Valid `status` values:

```text
pending
uploaded
processed
rejected
```

## audit_events

Suggested fields:

```text
id
company_id
actor_user_id
entity_type
entity_id
event_type
event_payload
created_at
```
