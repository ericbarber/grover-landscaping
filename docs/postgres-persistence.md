# PostgreSQL Persistence

## Current Status

The first database migration has been added at:

```text
backend/migrations/0001_create_jobs.sql
```

It creates the first operational tables:

```text
service_jobs
job_checklist_items
job_photos
```

It also seeds the two sample jobs currently used by the API and frontend.

## Target Backend Flow

The Rust API should move from hard-coded seed data to database-backed handlers:

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
  -> return local placeholder ticket now
  -> return S3 presigned URL later

POST /jobs/{id}/photos/complete
  -> UPDATE job_photos SET status = 'uploaded', uploaded_at = now()
  -> increment before_photos or after_photos counters when appropriate
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

## CI Direction

The GitHub Actions backend job should add a PostgreSQL service and run migrations before backend tests once the Rust database client is wired in.

## Implementation Note

The next code change should add a Rust PostgreSQL client dependency and then refactor `backend/src/main.rs` into:

```text
backend/src/main.rs
backend/src/db.rs
backend/src/jobs.rs
backend/src/photos.rs
```

The application should keep the same API contract so the frontend does not need to change when persistence is introduced.
