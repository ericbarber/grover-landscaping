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

## job_completion_reports

Implemented MVP fields:

```text
id
job_id
report_status
ready_for_customer
checklist_progress
before_photos
after_photos
issue_photos
share_token
submitted_at
reviewed_by_user_id
reviewed_at
delivered_by_user_id
delivered_at
last_generated_at
sent_at
created_at
updated_at
```

The current report endpoint materializes the latest computed report state into this table when PostgreSQL is available. Once a report enters manager review, later refreshes preserve the review snapshot fields and lifecycle status. Delivery assigns or reuses a stable `share_token`, sets delivery metadata, backs `GET /reports/{share_token}` only after delivery, and returns `/report-view/{share_token}` as the customer-facing browser link. Future work should add immutable customer-delivery snapshot child tables before email/SMS sending.

## project_bids

Implemented MVP fields:

```text
id
day_plan_id
customer_account_id
source_amendment_id
status
customer_message
share_token
sent_at
responded_at
share_expires_at
share_revoked_at
created_at
updated_at
```

`project_bid_line_items` stores the ordered service name, description, quantity, unit price, and manager note used to calculate the bid total. Customer ownership is derived from the amendment's route stop rather than accepted from the browser. Draft saves are idempotent by `source_amendment_id`. Sending a bid assigns a random seven-day share token and atomically queues a notification. A token can record one approved or rejected response, can be revoked by a manager, and can be securely reissued.

## notification_outbox

Implemented delivery-boundary fields:

```text
id
entity_type
entity_id
channel
recipient
template_key
payload
status
attempt_count
available_at
last_attempt_at
sent_at
last_error
provider_message_id
provider_response_code
created_at
updated_at
```

Project-bid sends create `queued` email or SMS records in the same transaction as token issuance. Revoking a review link marks pending delivery records `skipped` in the same transaction so a worker cannot later deliver a dead link. The in-process dispatcher claims work safely across service instances, retries with bounded backoff, recovers abandoned claims, moves exhausted work to `dead_letter`, and stores provider response codes and message IDs.

Manager notification history reads use this table directly with optional entity-type and status filters. Failed and dead-letter rows can be explicitly retried, which resets attempt metadata and returns the row to `queued` for the dispatcher. They can also be manually resolved, which marks the row `skipped` with a resolution note so managers can clear work handled outside the provider retry flow.

## project_bid_conversions and service_job_add_ons

An approved amendment-sourced bid converts into its source route stop's service job. `project_bid_conversions` records the one-to-one bid/job conversion and conversion timestamp. Each bid line item creates one `service_job_add_ons` row containing the approved service, quantity, unit price, note, and execution status.

Conversion locks the bid row and uses unique bid and line-item constraints, so retries return the existing conversion without duplicating scheduled work. The same transaction marks the bid `converted` and its source amendment `approved`.

Route workload reads add the source amendment's service duration once after conversion. Bid line-item quantity does not multiply route time because line items may separately represent labor, materials, or pricing details for the same requested service.

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
