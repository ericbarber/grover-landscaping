# Product Renaming Boundary

The current display name is temporary. A replacement must not use a family
name, and adopting one must not invalidate installed apps, authenticated
sessions, queued field changes, or offline photo records.

## Display name boundary

Runtime customer-facing React copy reads the current name from
`frontend/src/productBrand.ts`. That module owns the product name, field-app
name, API status label, and browser title suffix. Component and domain type
names such as `GroverBrand`, along with `grover-*` CSS classes, remain internal
implementation identifiers and do not control displayed text.

A final rename must also update the static and server-rendered surfaces that
cannot import the frontend module:

- `frontend/index.html` application, Open Graph, Twitter, and document metadata
- `frontend/public/manifest.webmanifest` installed-app name and short name
- `backend/src/public_site.rs` route-specific initial HTML titles
- email/SMS templates, public URLs, screenshots, policy text, and deployment
  documentation after the final name and origin are approved

## Compatibility identifiers

Do not mechanically rename identifiers beginning with `grover` in the same
release as the display brand. They include:

- local/session storage keys and the `grover-field-offline` IndexedDB database
- service-worker and other browser custom-event names
- local-review request headers
- database, container, package, infrastructure, and environment identifiers
- CSS classes, source filenames, image paths, test fixtures, and historical
  planning artifacts

These names are not customer-visible branding. Changing persistent browser
keys or IndexedDB names without a versioned copy-and-verify migration can make
saved field work appear lost. Changing headers or infrastructure identifiers
requires a coordinated compatibility window across clients, servers, CI, and
operations. They may retain a documented legacy namespace indefinitely.

## Rename release gate

Before changing the display name:

1. Complete professional trademark clearance in the intended jurisdictions;
   search results and domain availability are only preliminary screens.
2. Confirm primary domain, common misspellings, social handles, and relevant
   app-store names.
3. Approve the wordmark, pronunciation, capitalization, tagline, and any field
   app qualifier.
4. Update the runtime source plus every static/server-rendered surface above,
   then search the production source for old customer-visible copy.
5. Validate metadata, sitemap/canonical URLs, install/update behavior, customer
   links, notification templates, analytics continuity, and redirects.
6. Publish customer and operator communication before any URL or installed-app
   identity changes.

Until those gates pass, the repository keeps the current display name while
making the eventual change bounded and reviewable. The local and CI
`quality:brand` gate rejects new hard-coded runtime brand copy and fails when
the approved static metadata, PWA, icon, or server-rendered title surfaces drift
from `PRODUCT_NAME`.
