# Infrastructure

Infrastructure definitions will live here.

## Recommended Starting Layout

```text
infra/
  terraform/
    environments/
      dev/
      prod/
    modules/
      networking/
      ecs-api/
      rds/
      s3-photos/
      cognito/
      eventing/
```

## Deployment Direction

Use GitHub Actions with AWS OIDC to deploy without long-lived AWS access keys.
