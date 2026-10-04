# Search and sharing readiness contract

Status: B8 repository implementation delivered in the working tree; deployed
publication evidence remains gated. Updated 2026-10-01.

## Public routes

The intended indexable routes are:

- `/`
- `/for-landscaping-companies`
- `/for-yard-owners`
- `/for-property-managers`
- `/for-crew-leads`

The company page remains the default public buyer path. Audience pages may use
distinct approved titles, descriptions, canonicals, and share copy, but must not
invent pricing, billing/payment, marketplace, vendor-governance, customer
outcome, certification, or protected-hosting claims.

## Delivered repository contract

`frontend/public/robots.txt` allows public discovery and excludes the
authenticated application, auth callback, diagnostics, organization invitation,
shared bid/report token, design-review, and Modern Grover review routes. The
dependency-free `scripts/validate-crawler-policy.mjs` contract runs locally and
in CI. It rejects missing protected/review exclusions, exclusions that hide a
public audience path, query/fragment-bearing rules, and a future sitemap URL
that is not absolute HTTPS.

The production Rust server now allowlists only the five public routes and the
known `/app`, callback, diagnostics, organization-invitation, shared-bid, and
shared-report frontend entries. Existing built assets continue through the
static-file service; unknown paths, invalid nested marketing paths, missing
assets, and unshipped `/design` or `/modern-grover` review paths return HTTP 404
instead of duplicate company-page HTML. The server test covers each entry and
denial group.

For each public route, the server now emits route-specific title, description,
canonical, Open Graph, Twitter, headline, and summary content in the initial
HTML response. This content does not depend on client effects. The immutable
frontend template and robots policy are validated and cached at startup.

`PUBLIC_APP_URL` is the single origin input for public URLs. Production startup
fails unless it is an exact HTTPS origin with no credentials, path, query, or
fragment. The same validated origin generates canonical URLs, absolute share
image URLs, the five-route `sitemap.xml`, and the sitemap declaration appended
to `robots.txt`. The client preserves `/` as the home-page canonical while
keeping the explicit audience URLs stable.

Robots policy is crawler guidance, not authorization. Every protected and
tokenized route must continue to enforce its server-side identity, grant,
expiry, scope, and resource checks even if a crawler ignores the file.

## Remaining evidence boundary

The repository contract is complete, but this is not yet full B8 production
evidence:

- the final `PUBLIC_APP_URL` value has not been proven by B4 protected-release
  evidence;
- link-preview fetchers and production crawlers have not been tested against a
  final deployment;
- accessibility and performance browser evidence cannot run in the current
  sandbox because loopback binding is denied; and
- approved product captures and public trust-center facts remain B5/B6 gates.

Approved UTM attribution continues into company setup through an allowlist.
Structured organization/product data remains intentionally absent until every
fact and accountable owner has approval; absence is preferable to unsupported
schema claims.

## Completion sequence

1. Verify the final HTTPS origin and emitted initial HTML through B4
   protected-release evidence.
2. Preserve the delivered runtime rendering strategy and keep authenticated and
   tokenized routes out of generated content.
3. Confirm the exact absolute canonical, Open Graph, Twitter-image, sitemap,
   and robots URLs against the deployed `PUBLIC_APP_URL`. Do not infer
   production origin from an untrusted request host.
4. Preserve the delivered durable 404 allowlist and add redirects only for
   approved normalized campaign routes.
5. Include only the five public routes in `sitemap.xml`; never include `/app`,
   callbacks, invitations, shared tokens, diagnostics, design/review content, or
   API records.
6. Validate built HTML before client effects, robots/sitemap consistency,
   canonical uniqueness, link previews, structured data, keyboard/accessibility,
   quality budgets, and UTM-to-first-value continuity in the final environment.
7. Record approval for every structured-data fact and public capture against
   the claim inventory, protected configuration, source commit, and review date.

Until those gates pass, the repository may claim tested initial HTML, absolute
metadata generation, crawler exclusions, sitemap generation, and durable
unknown-route 404 behavior—not deployed indexing, share-preview, or production
SEO readiness.
