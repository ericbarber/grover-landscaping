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
  -> INSERT job_photos row with pending status
  -> return local placeholder ticket by default
  -> return S3 presigned PUT URLs for original and browser-generated thumbnail when PHOTO_STORAGE_MODE=s3

POST /jobs/{id}/photos/complete
  -> UPDATE job_photos SET status = 'uploaded', uploaded_at = now()
  -> store validated client-reported file size and image dimensions when provided
  -> increment before_photos or after_photos counters when appropriate
  -> GET /jobs/{id}/photos returns expiring original and thumbnail display URLs plus persisted metadata when object storage is configured
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
