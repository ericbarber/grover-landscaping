# PostgreSQL Persistence

## Current Status

The repository now has the first persistence foundation in place:

```text
backend/migrations/0001_create_jobs.sql
backend/src/db.rs
backend/src/postgres_read.rs
backend/src/postgres_write.rs
scripts/apply-local-migrations.sh
```

The migration creates the first operational tables:

```text
service_jobs
job_checklist_items
job_photos
job_completion_reports
```

It also seeds the two sample jobs currently used by the API and frontend.

## Implemented

- SQLx dependency added to the backend manifest.
- PostgreSQL connection and migration seam added in `JobRepository`.
- Read-query helpers added for job lists and job detail.
- Write-query helpers added for job status changes and local photo upload tickets.
- Local migration runner added for Docker Compose PostgreSQL.

## Current Runtime Behavior

The public API contract is unchanged and still uses the seed-backed repository behavior at runtime. This keeps the current `main.rs` handlers and CI build stable while the PostgreSQL query modules are staged in the codebase.

## Target Backend Flow

The next handler switch should route the existing API methods through the SQL-backed repository:

```text
GET  /jobs
  -> SELECT service job summaries from service_jobs

GET  /jobs/{id}
  -> SELECT service job detail from service_jobs
  -> SELECT checklist rows from job_checklist_items

POST /jobs/{id}/start
  -> UPDATE service_jobs SET status = 'in_progress'
  -> UPDATE checklist item for yard service where appropriate

POST /jobs/{id}/complete
  -> UPDATE service_jobs SET status = 'completed'
  -> mark completion checklist rows complete

POST /jobs/{id}/photos/presign
  -> validate file name, supported photo type, and supported image content type
  -> INSERT job_photos row with pending status
  -> return local placeholder ticket by default
  -> return S3 presigned PUT URLs for original and browser-generated thumbnail when PHOTO_STORAGE_MODE=s3
  -> define thumbnail normalization policy as JPEG with a bounded max pixel dimension for S3 tickets

POST /jobs/{id}/photos/complete
  -> UPDATE job_photos SET status = 'uploaded' or 'processed', uploaded_at = now()
  -> attempt S3 HEAD plus bounded ranged GET metadata extraction for file size and PNG, GIF, JPEG, or WebP dimensions
  -> attempt bounded server-side JPEG thumbnail generation for S3-backed originals with a stored thumbnail object key
  -> enqueue durable thumbnail-generation retry work when S3 inspection or thumbnail generation cannot finish synchronously
  -> quarantine successfully fetched but unparseable S3 objects as rejected with reason and timestamp metadata
  -> fall back to validated client-reported file size and image dimensions when server extraction is unavailable
  -> increment before_photos or after_photos counters when appropriate
  -> GET /jobs/{id}/photos returns uploaded or processed evidence only, with expiring original and thumbnail display URLs plus persisted metadata when object storage is configured

photo_processing_jobs
  -> stores retryable photo processing tasks keyed by photo and task type
  -> supports queued, processing, completed, failed, and dead_letter states
  -> claim helpers use row locks, retry availability, bounded attempts, and stale processing recovery
```

## Local Development Database

The existing Docker Compose stack already includes PostgreSQL:

```text
localhost:5432
database: grover_landscaping
user: grover
password: grover
```

The local connection string is captured in `.env.example`:

```text
DATABASE_URL=postgres://grover:grover@localhost:5432/grover_landscaping
```

Apply migrations locally with:

```bash
bash scripts/apply-local-migrations.sh
```

## CI Direction

The GitHub Actions backend job should add a PostgreSQL service and run migrations before backend tests once the runtime handler switch is completed.

## Next Code Change

Switch `backend/src/main.rs` to initialize `JobRepository::connect()` when `DATABASE_URL` is present and return API errors cleanly when database operations fail. The frontend should not need to change because the API response shapes are preserved.
