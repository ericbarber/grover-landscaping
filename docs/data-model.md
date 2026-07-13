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
organization_id
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

Job-scoped API routes use `organization_id` as the tenant boundary. Job list/detail, account, report, add-on, photo, job lifecycle, and completion-report action endpoints resolve this organization before returning or mutating data.

## crews and day_plans

Implemented crew ownership fields:

```text
id
organization_id
name
created_at
updated_at
```

Crews belong to a service-company organization. Day plans inherit their tenant boundary through the assigned crew, and manager/crew route APIs resolve that organization before returning or mutating day-plan, stop, amendment, or manager bid data. Requests for a crew or day plan outside the signed-in principal's active organization memberships are rejected before local fallback responses are used.

## organization_invitations and organization_memberships

Implemented organization invitation fields:

```text
id
organization_id
invitee_email
role
status
scope_type
scope_id
token
membership_id
invited_by_user_id
accepted_by_user_id
expires_at
accepted_at
created_at
updated_at
```

Invitations create a pending `organization_memberships` row with status `invited` and queue an `organization_invitation` email record in `notification_outbox` when PostgreSQL persistence is available. Accepting a pending, unexpired token activates that membership for the signed-in user and writes an `invite_accepted` audit event. Organization-owner and support-admin role changes update the membership role and write a `role_changed` audit event. Cognito groups remain coarse application roles; PostgreSQL memberships remain the tenant boundary.

## property_portfolios and portfolio_property_links

Implemented property portfolio fields:

```text
id
account_id
organization_id
display_name
portfolio_type
created_at
```

Portfolio membership is stored separately in `portfolio_property_links` with `portfolio_id`, `property_id`, and `organization_id`. Portfolio create, list, and property-link APIs require active organization membership and do not change customer ownership, property ownership, or crew assignment history. Persisted portfolio create and property-link changes write `portfolio_changed` audit events.

The customer property portfolio read model returns grouped portfolio properties plus `ungrouped_properties` for customer-owned yards that do not yet have a portfolio link. Until a dedicated property table exists, persisted customer property reads are materialized from service jobs, using completion-report property identifiers when available and stable job-derived property identifiers otherwise.

## property_crew_assignments

Implemented property crew-assignment fields:

```text
id
property_id
crew_id
organization_id
active
assigned_at
ended_at
created_at
```

Assigning a crew to a property ends the current active assignment for that property and service organization, then creates a new active assignment. Assignment APIs require active organization membership, verify that the crew belongs to the requested service organization, and do not change customer ownership, property ownership, portfolio grouping, or job completion history. Persisted assignment changes write `crew_assignment_changed` audit events.

## property_onboarding_profiles

Implemented property onboarding fields:

```text
property_id
account_id
organization_id
service_address
access_notes
billing_contact_name
billing_contact_email
notification_contact_name
notification_email
notification_phone
onboarding_status
created_at
updated_at
```

Property onboarding profiles are keyed by `property_id` and `organization_id`. Save operations validate service address, access note length, billing contact email, at least one customer notification destination, E.164 SMS formatting when a phone is provided, and supported onboarding statuses. These profiles capture scheduling readiness details without changing customer ownership, portfolio grouping, crew assignment history, or job state.

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
delivered_snapshot
delivered_snapshot_at
created_at
updated_at
```

The current report endpoint materializes the latest computed report state into this table when PostgreSQL is available. Once a report enters manager review, later refreshes preserve the review snapshot fields and lifecycle status. Delivery assigns or reuses a stable `share_token`, sets delivery metadata, stores an immutable `delivered_snapshot` JSON document, backs `GET /reports/{share_token}` only after delivery, and returns `/report-view/{share_token}` as the customer-facing browser link.

Delivered snapshots include a `snapshot_metadata` object with a schema version, report ID, job ID, capture timestamp, and evidence counts for before photos, after photos, issue photos, total photo evidence, and completed add-ons.

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

`project_bid_line_items` stores the ordered service name, description, quantity, unit price, and manager note used to calculate the bid total. Customer ownership is derived from the amendment's route stop rather than accepted from the browser. Draft saves are idempotent by `source_amendment_id`. Sending a bid assigns a random seven-day share token and atomically queues a notification. A token can record one approved or rejected response, writes a `bid_approved` or `bid_rejected` audit event for that customer decision, can be revoked by a manager, and can be securely reissued.

## notification_outbox

Implemented delivery-boundary fields:

```text
id
organization_id
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

Project-bid sends create `queued` email or SMS records in the same transaction as token issuance. Delivered completion reports can also queue customer share-link notifications, with the outbox row inheriting the service job's organization ownership. Revoking a review link marks pending delivery records `skipped` in the same transaction so a worker cannot later deliver a dead link. The in-process dispatcher claims work safely across service instances, retries with bounded backoff, recovers abandoned claims, moves exhausted work to `dead_letter`, and stores provider response codes and message IDs.

Manager notification history reads use this table directly with optional entity-type and status filters and are constrained to the principal's active organization memberships. Supported history entity filters include `project_bid`, `completion_report`, and `organization_invitation`. Failed and dead-letter rows can be explicitly retried within those same organization boundaries, which resets attempt metadata, returns the row to `queued` for the dispatcher, and writes a `notification_retried` audit event. They can also be manually resolved, which marks the row `skipped` with a resolution note and writes a `notification_resolved` audit event so managers can clear work handled outside the provider retry flow.

## project_bid_conversions and service_job_add_ons

An approved amendment-sourced bid converts into its source route stop's service job. `project_bid_conversions` records the one-to-one bid/job conversion and conversion timestamp. Each bid line item creates one `service_job_add_ons` row containing the approved service, quantity, unit price, note, and execution status.

Conversion locks the bid row and uses unique bid and line-item constraints, so retries return the existing conversion without duplicating scheduled work. The same transaction marks the bid `converted`, marks its source amendment `approved`, and writes a `bid_converted` audit event when the conversion is first created.

Route workload reads add the source amendment's service duration once after conversion. Bid line-item quantity does not multiply route time because line items may separately represent labor, materials, or pricing details for the same requested service.

## access_audit_events

Implemented fields:

```text
id
actor_user_id
organization_id
event_kind
target_id
occurred_at
created_at
```

Current `event_kind` values include login and access events plus business-sensitive changes such as `invite_accepted`, `role_changed`, `account_viewed`, `portfolio_changed`, `crew_assignment_changed`, `bid_approved`, `bid_rejected`, `bid_converted`, `notification_retried`, `notification_resolved`, and `report_delivered`. Persisted job account-summary reads write `account_viewed` audit rows after organization access is authorized. Completion report delivery writes a `report_delivered` audit row in the same transaction as the lifecycle transition so customer-visible report exposure is traceable by actor, organization, and report ID. Shared customer bid approvals/rejections, manager bid conversions, and notification recovery actions write audit rows in the same transactions as their persisted status changes. Invitation acceptance, role administration, portfolio grouping, and crew assignment changes also write audit rows in the same transaction as their persisted changes.
