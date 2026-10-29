# Application Identity and Compatibility Boundary

Grover is the temporary customer-facing display name. It is deliberately
separate from the application's technical namespace so another naming decision
does not require a repository-wide identifier migration or put saved work at
risk.

## Display-name boundary

Customer-facing React copy reads the current name from
`frontend/src/appIdentity.ts`. The module owns the application display name,
Field app label, API status label, and browser-title suffix. The Rust backend
uses the matching constant in `backend/src/application_identity.rs` for
server-rendered titles and authentication challenges.

Static surfaces that cannot import either module must remain synchronized:

- `frontend/index.html` application, Open Graph, Twitter, and document metadata
- `frontend/public/manifest.webmanifest` installed-app name and short name
- `frontend/public/app-icon.svg` accessible icon title
- email/SMS templates, public URLs, screenshots, policy text, and deployment
  documentation after the final name and origin are approved

The local and CI `quality:brand` gate verifies both application-identity
constants agree, rejects hard-coded display names in frontend runtime code, and
checks the static metadata, PWA, icon, and server-title composition boundaries.

## Compatibility namespace

The stable technical namespace remains `yardfolio`. It is not the current
customer-facing name. Do not mechanically rename it when the display name
changes. Compatibility-sensitive identifiers include:

- CSS variables, reusable classes, visual assets, and test instrumentation
- browser-storage keys, IndexedDB databases, service-worker caches, and events
- Rust crate/binary and frontend package names, health-service labels, and log
  targets
- local-review headers, session keys, fixture databases, and study tooling
- database, container, image, infrastructure, deployment, and environment
  identifiers
- applied migration history and already-created external resources

Changing those identifiers requires an explicit, data-preserving migration.
Installed sessions, queued field changes, offline photos, deployed services,
and infrastructure state must never be invalidated merely because the display
name changes.

The independent research/review track retains the Yardfolio Study name. That
track, its routes, fixtures, and artifacts are separate from the application's
temporary display name.

## Future display-name change

For a future naming decision:

1. Change the frontend and backend `APP_DISPLAY_NAME` constants.
2. Synchronize the three static frontend surfaces listed above.
3. Update current customer-facing tests, policies, screenshots, and operator
   documentation without renaming compatibility identifiers.
4. Run the brand consistency gate, frontend tests/build, and backend tests.
5. Treat domains, installed-app identity, external resources, and redirects as
   separately reviewed rollout work.

Before any name is presented as a cleared public brand, complete professional
trademark review, domain and app-store checks, wordmark approval, public-origin
validation, and customer/operator rollout planning. Grover is a temporary
display value, not a claim of legal clearance.
