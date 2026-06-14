# Architecture

Grover Landscaping should use a mobile-first, event-driven AWS architecture.

## System Overview

```text
Crew Web/PWA
  -> Cognito authentication
  -> Rust API on ECS Fargate
  -> PostgreSQL for operational data
  -> S3 for direct photo uploads
  -> EventBridge/SQS for async workflows
  -> Lambda or ECS workers for image processing
```

## Initial Application Boundary

Start as a modular monolith in Rust, then split into microservices when the service boundaries are proven.

Initial modules:

- auth
- companies
- crews
- customers
- properties
- jobs
- photos
- completions
- notifications
- audit

## Photo Upload Flow

Photos should not be streamed through the backend API. The backend should issue presigned S3 upload URLs.

```text
1. Crew member opens job.
2. Frontend requests a presigned upload URL.
3. API validates job and crew access.
4. API returns S3 object key and presigned URL.
5. Frontend uploads the photo directly to S3.
6. Frontend confirms upload with the API.
7. API records metadata and emits PhotoUploaded.
8. Worker generates thumbnails and extracts metadata.
```

## AWS Services

| Concern | AWS Service |
| --- | --- |
| Auth | Amazon Cognito |
| API runtime | ECS Fargate |
| Database | RDS PostgreSQL or Aurora PostgreSQL |
| Object storage | S3 |
| CDN | CloudFront |
| Events | EventBridge |
| Queueing | SQS |
| Image workers | Lambda or ECS workers |
| Email | SES |
| SMS | SNS or Twilio |
| Secrets | Secrets Manager |
| Logs | CloudWatch |
| Infrastructure | Terraform or CDK |
