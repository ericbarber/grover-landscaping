# Offline Photo Capture Boundary

Phase 2 photo reliability stores captured image bytes separately from mutation
metadata in the existing `grover-field-offline` IndexedDB database.

## Storage model

- Upgrade the database schema and add a `photo_blobs` object store keyed by the
  client mutation UUID.
- Store tenant, actor, job, photo category, file name, MIME type, size, creation
  time, ordering, and retry state in the existing `mutations` store.
- Store the browser `Blob` only in `photo_blobs`; do not serialize image bytes
  into JSON, local storage, cache storage, or service-worker shell caches.
- Write metadata and its blob in one IndexedDB transaction. A photo is not
  described as queued unless both writes commit.
- Remove both records only after ticket creation, object upload, thumbnail work,
  and upload completion have all succeeded.

## Validation and privacy

- Accept only the backend-supported `image/jpeg`, `image/png`, `image/gif`, and
  `image/webp` content types.
- Apply a 20 MiB per-photo offline limit before writing the blob. Larger images
  remain unqueued and receive explicit guidance to reconnect.
- Use the loaded job's server-owned organization and the authenticated actor.
- Never store access tokens, presigned URLs, share tokens, object keys, or
  generated object URLs. Create preview object URLs only in memory and revoke
  them when the preview unmounts.
- Request persistent browser storage and report quota or persistence failures
  without claiming durability.

## Replay

Replay is oldest-first within a tenant and actor. It uses the existing flow:

1. request a fresh upload ticket;
2. upload the original and generated thumbnail when required;
3. send measured upload metadata to the completion endpoint;
4. remove the metadata and blob atomically after server confirmation.

Ticket URLs are always requested at replay time because they expire and may
contain storage credentials. Failed uploads retain the original blob and safe
error classification. Validation or ownership responses become conflicts and
block later photo replay until reviewed. Network and provider failures remain
retryable.

The client mutation UUID is sent only when creating a replay ticket. The backend
derives the pending photo ID and storage nonce from that UUID, so an interrupted
replay requests the same ticket identity instead of creating duplicate evidence.
The browser now runs this flow on app load, network recovery, and manual retry,
refreshes job photo counts after confirmed uploads, and leaves the blob queued
when any step fails.

The service worker does not intercept this flow. Background Sync may be added
later as an accelerator, but visible in-app replay remains the required path
because iOS support and browser execution budgets vary.

Schema version 3 now adds the `photo_blobs` store. Photo metadata validation
enforces the documented types and 20 MiB limit before writing. Blob and mutation
metadata enqueue in one transaction, reads return only browser `Blob` values,
and mutation removal also removes any matching blob in the same transaction.
Failed photo workflows now keep the existing in-memory preview and attempt the
atomic blob/metadata transaction using the loaded job tenant and current actor.
Only a committed transaction receives durable-queue messaging and contributes to
the mobile pending-photo count. Pending feedback distinguishes retryable failures
from review-blocking conflicts and disables blind replay while a conflict is
present.
