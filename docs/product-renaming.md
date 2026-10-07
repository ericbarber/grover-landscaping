# Yardfolio Rename and Compatibility Boundary

Yardfolio was adopted as the customer-facing working name on 2026-10-07. The
rename removes the family name from the product experience without invalidating
installed apps, authenticated sessions, queued field changes, or offline photo
records. Preliminary exact-name web searches found no obvious landscaping,
software, property, or trademark collision; professional clearance remains a
public-launch gate.

## Display name boundary

Runtime customer-facing React copy reads the current name from
`frontend/src/productBrand.ts`. That module owns the product name, field-app
name, API status label, and browser title suffix. Legacy `grover-*` CSS classes
remain internal implementation identifiers and do not control displayed text.

Static and server-rendered surfaces that cannot import the frontend module must
remain synchronized with it:

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

## Public-launch gate

Before presenting Yardfolio as a cleared public brand:

1. Complete professional trademark clearance in the intended jurisdictions;
   search results and domain availability are only preliminary screens.
2. Confirm primary domain, common misspellings, social handles, and relevant
   app-store names.
3. Approve the wordmark, pronunciation, capitalization, tagline, and any field
   app qualifier.
4. Search production source and built artifacts for former customer-visible
   copy while keeping allowlisted legacy technical identifiers intact.
5. Validate metadata, sitemap/canonical URLs, install/update behavior, customer
   links, notification templates, analytics continuity, and redirects.
6. Publish customer and operator communication before any URL or installed-app
   identity changes.

Until those gates pass, Yardfolio remains a working product name rather than a
claim of legal clearance. The local and CI `quality:brand` gate rejects new
hard-coded runtime brand copy, rejects the former display name in runtime
source, and fails when static metadata, PWA, icon, or server-rendered title
surfaces drift from `PRODUCT_NAME`.
