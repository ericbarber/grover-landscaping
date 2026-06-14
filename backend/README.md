# Backend

The backend will be implemented in Rust using Axum, Tokio, SQLx, and PostgreSQL.

## Planned Structure

```text
backend/
  Cargo.toml
  crates/
    api/
    domain/
    db/
    auth/
    jobs/
    photos/
    completions/
    notifications/
```

## First API Endpoints

```text
GET  /health
GET  /jobs
GET  /jobs/:id
POST /jobs/:id/start
POST /jobs/:id/photos/presign
POST /jobs/:id/photos/complete
POST /jobs/:id/complete
GET  /jobs/:id/report
```
