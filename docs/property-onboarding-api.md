# Property Onboarding API Contract

This document defines the implemented API contract for property onboarding profiles.

## Purpose

Property onboarding captures the operational details needed before a yard can be scheduled reliably: service address, access notes, billing contact, notification contact, and onboarding status. It does not change customer ownership, portfolio membership, crew assignment, or job history.

## Storage

`property_onboarding_profiles` stores one profile per `property_id` and service `organization_id`.

Implemented fields:

- `property_id`
- `account_id`
- `organization_id`
- `service_address`
- `access_notes`
- `billing_contact_name`
- `billing_contact_email`
- `notification_contact_name`
- `notification_email`
- `notification_phone`
- `onboarding_status`

Supported onboarding statuses are `incomplete`, `active`, `blocked`, and `archived`.

## Endpoints

### Read property onboarding

`GET /properties/{property_id}/onboarding`

Expected behavior:

- The caller must be an organization owner, manager, support admin, property owner, or property manager.
- Return the onboarding profile only inside the caller's active organization memberships.
- Return `404` when no scoped onboarding profile exists.

### Save property onboarding

`PUT /properties/{property_id}/onboarding`

Required fields:

- `account_id`
- `organization_id`
- `service_address`
- `billing_contact_name`
- `billing_contact_email`
- `notification_contact_name`
- `onboarding_status`

Optional fields:

- `access_notes`
- `notification_email`
- `notification_phone`

Validation rules:

- The caller must be a manager, organization owner, support admin, or property manager.
- The caller must have an active membership in the requested service organization.
- `service_address` must be between 5 and 240 characters after trimming.
- `access_notes` cannot exceed 1000 characters after trimming.
- `billing_contact_email` must be a valid email destination.
- At least one customer notification destination, email or E.164 SMS phone, is required.
- `notification_email`, when present, must be a valid email destination.
- `notification_phone`, when present, must use E.164 format.
- `onboarding_status` must be one of `incomplete`, `active`, `blocked`, or `archived`.

## Guardrails

- Saving onboarding data must not change portfolio grouping.
- Saving onboarding data must not assign or reassign crews.
- Saving onboarding data must not create, reschedule, start, or complete jobs.
- Saving onboarding data must not enqueue customer notifications.
