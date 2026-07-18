# Authentication and Authorization

## Runtime Flow

1. The React application loads public configuration from `GET /auth/config`.
2. An unauthenticated user starts Cognito managed login.
3. Cognito returns an authorization code to `/auth/callback`.
4. The browser exchanges the code with PKCE and keeps the resulting session in session storage.
5. API clients attach the Cognito access token as `Authorization: Bearer <token>`.
6. The Rust API verifies the RS256 signature with Cognito JWKS, issuer, app client ID, expiration, and `token_use=access`.
7. The API maps `cognito:groups` to application roles and applies route-level authorization.

Frontend assets, health probes, `GET /auth/config`, tokenized shared-report reads, and tokenized shared-bid reads/decisions remain public. Job, crew, day-plan, and manager bid APIs are protected.

## Environments

Development and production use separate Cognito user pools and app clients:

- Development callback: `http://localhost:5173/auth/callback`
- Development logout: `http://localhost:5173/`
- Production callback and logout: derived from the final HTTPS application URL
- Development MFA: optional
- Production MFA: required
- Production deletion protection: enabled

Terraform definitions live under `infra/terraform/environments/dev` and `infra/terraform/environments/prod`.

## Roles

Cognito groups provide coarse application roles:

- `OrganizationOwner`
- `Manager`
- `CrewLead`
- `CrewMember`
- `PropertyOwner`
- `PropertyManager`
- `SupportAdmin`

Manager/owner/support roles can change day-plan structure. Crew roles can read assigned operational data and update stop progress. Customer roles are denied access to unscoped operational APIs until organization and property scoping is persisted.

## Local Authenticated Runtime

Read the development outputs:

```bash
terraform -chdir=infra/terraform/environments/dev output
```

Start the API with:

```bash
AUTH_MODE=cognito \
COGNITO_ISSUER_URL='<issuer_url output>' \
COGNITO_CLIENT_ID='<app_client_id output>' \
COGNITO_LOGIN_DOMAIN='<login_domain output>' \
CORS_ALLOWED_ORIGIN=http://localhost:5173 \
cargo run --manifest-path backend/Cargo.toml
```

Then start the frontend with `npm run dev --prefix frontend` and open <http://localhost:5173>.

`AUTH_MODE=disabled` remains available outside production for automated tests and explicit seed-data development. The UI displays an `AUTH DISABLED` warning whenever that mode is active. Production startup rejects disabled authentication.

## Remaining Tenant Boundary

Cognito proves identity and supplies coarse roles. Active PostgreSQL membership
roles are merged into the request's effective role set after token verification,
so an accepted invite can authorize its role without requiring an immediate
Cognito group mutation. The original token roles remain separately available in
`/me/access` as `claim_roles`. Repository queries and organization membership
checks remain the tenant boundary; an effective role from one organization does
not grant access to another organization.
