# Owner Private Intake Contract

## Purpose

The private intake API lets a verified Yard Owner prepare a yard brief and
optional guided photographs before choosing a landscape provider. It does not
create a provider customer, service property, job, route, crew assignment,
contract, public listing, or provider-access grant.

## Authorization and ownership

- Every route requires an authenticated subject with a verified email.
- The authenticated subject supplies `owner_user_id`; clients cannot submit or
  override it.
- Property, brief, media-list, completion, replacement, and deletion operations
  are scoped to that subject. A different owner receives a not-found result.
- A ready owner-authored yard brief is required before media can be created.
- Storage keys use a truncated SHA-256 owner scope. They never include the raw
  authentication subject and never use the provider job path.

## Yard brief routes

| Method | Route | Behavior |
| --- | --- | --- |
| `GET` | `/owner-properties/{property_id}/yard-brief` | Returns the latest owner-scoped version |
| `PUT` | `/owner-properties/{property_id}/yard-brief` | Appends a `draft` or `ready` version |

A ready brief requires at least one yard area and care goal. The owner-authored
content is a starting brief, not a measurement, diagnosis, price, work order, or
provider instruction.

## Guided media routes

| Method | Route | Behavior |
| --- | --- | --- |
| `GET` | `/owner-properties/{property_id}/intake-media` | Lists all non-deleted private media, including inactive replaced originals |
| `POST` | `/owner-properties/{property_id}/intake-media` | Creates an upload ticket and `pending_upload` record |
| `POST` | `/owner-properties/{property_id}/intake-media/{media_id}/complete` | Inspects and completes an uploaded object; safe to retry |
| `DELETE` | `/owner-properties/{property_id}/intake-media/{media_id}` | Deletes configured objects before marking the record deleted |

Create requests accept `file_name`, an image `content_type`, one of
`front_yard`, `back_yard`, `side_access`, `irrigation_or_concern`, or `other`,
and an optional owner-scoped ready `replaces_media_id`. Upload tickets support
the local placeholder and configured S3 presigned modes.

Completion accepts optional positive `file_size_bytes`, `image_width_px`, and
`image_height_px`. In configured object storage, server-side inspection is the
authority for extracted image metadata and rejection. A temporarily unavailable
inspection remains `processing`; unsupported or unsafe image content becomes
`rejected` and receives no display URL.

## Media lifecycle

```text
pending_upload -> processing -> ready -> replaced -> deleted
       |                         |
       +-------> rejected -------+-> deleted
```

- A replacement does not deactivate the original until the new upload becomes
  ready.
- After successful replacement, the original remains visible as `replaced`, is
  excluded from active use, and can be explicitly deleted by its owner.
- Only `ready` and `replaced` records receive private display URLs.
- Deletion is idempotent. If configured object deletion fails, the API leaves
  the record unchanged and returns an unavailable response so the interface can
  offer a safe retry.
- Lifecycle events contain minimized identifiers and state, not image bytes,
  addresses, or owner-authored notes.

## Interface and accessibility behavior

The production `/app/yard-owner` flow presents photographs only after a brief is
ready. It explains that photographs are optional and private, gives capture
guidance that avoids neighboring spaces and security details, validates type and
size before upload, exposes processing/rejected recovery, labels inactive
replacements, confirms destructive deletion, and supports completing intake
without adding any photograph.

Provider disclosure is deliberately absent from this contract. A later
provider-connection phase must show the exact provider and data snapshot, then
record separate owner approval before any access is granted.
