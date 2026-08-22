# Grover Frontend

The frontend is a responsive React 18 and TypeScript application built with
Vite and Tailwind CSS. It contains the public marketing site, authenticated
multi-persona workspace, Yard Owner acquisition, provider invitation entry,
customer-safe report and bid pages, and mobile diagnostics.

## Application entry points

| Path | Experience |
| --- | --- |
| `/` and `/for-*` | Persona-specific public landing journeys |
| `/app` | Authenticated role-aware workspace |
| `/app/yard-owner` | Private Yard Owner acquisition |
| `/app/provider-invitation` | Verified-recipient provider connection entry; bearer token is consumed from the URL fragment |
| `/organization-invitations/{token}` | Organization invitation acceptance |
| `/report-view/{token}` | Customer-safe completion report |
| `/bid-review/{token}` | Customer-safe project-bid decision |
| `/diagnostics` | Local/mobile runtime diagnostics |

Path selection is intentionally lightweight and source-controlled in
[`src/main.tsx`](src/main.tsx) and the `src/domain/*Route.ts` helpers; the app does
not currently depend on React Router.

## Delivered interface areas

- Prototype-aligned public theme, persona journeys, direct yard/company signup,
  first-party lead flow, and interactive “Today’s operation” product tour
- Cognito, disabled, and production-rejected local-review authentication modes
- Role-filtered Home, field, customer, manager, and support destinations
- Shared outlined SVG workspace icons with phone bottom navigation, a fixed
  tablet rail, and a persistent role-filtered desktop rail
- Single-destination desktop rendering with a compact Home hero and operational
  summary/action grid rather than an all-authorized-surfaces stack
- Shared semantic notice and status-pill primitives for neutral, information,
  success, warning, and dangerous authenticated workflow feedback
- Mobile route, jobs, checklist, photos, completion, offline queue, replay, and
  diagnostics behavior
- Prototype-aligned field Route hierarchy with accessible progress, Current
  stop, Up next, bounded route expansion, and lower-priority amendment controls
- Compact ordered Assigned Jobs with lifecycle/readiness context, search,
  status filters, counts, and no-match recovery
- Responsive Job execution with persistent target context and guarded primary
  actions plus one semantic Overview, Checklist, Photos, Add-ons, or Report panel
  at a time
- Manager scheduling, dispatch, reports, recovery queues, customer onboarding,
  privacy operations, team/organization controls, marketing leads, and conversion
  reporting
- Yard Owner private property and brief intake, guided media, provider connection
  progress, disclosure consent/history/revocation, assessment collaboration,
  immutable proposal review/decisions, and version-specific questions/change
  requests, followed by separate owner-confirmed provider activation and
  authoritative setup status, then exact-version first-visit confirmation or a
  customer-safe request for another window
- Provider recipient progress, disclosure-limited assessment workspace, and
  separate customer-safe versus provider-private notes, proposal
  authoring/revision, exact-message proposal responses, and activated provider
  setup status with separate bounded first-visit window proposal/replacement
  controls and no implied crew, route, work-order, or payment authority
- Customer-safe completion-report and bid review links

The [prototype adoption tracker](../project-planning/PROTOTYPE_ADOPTION.md) records
which approved designs are fully adopted and which interface phases remain.

## Local development

The preferred local workflow is the repository Compose stack:

```bash
docker compose up --build
```

Open <http://localhost:5173>. In `/app`, use the `Review as` selector to switch
among the seven local personas without AWS. Each tab keeps its own reviewer.
See [`../docs/local-development-without-cloud.md`](../docs/local-development-without-cloud.md).

Host-only frontend fallback is also supported:

```bash
cd frontend
npm install
npm run dev
```

When the API is unavailable, supported surfaces use explicit seeded or browser-
local fallbacks. A fallback is never meant to imply that a production write was
persisted.

The Yard Owner and recipient-provider acquisition routes are persistence-backed.
After a completed assessment, the provider workspace can publish or revise a
customer-safe initial-service proposal and reload its latest immutable version.
The Yard Owner workspace presents neutral proposal history and requires an
exact-version confirmation to accept or decline; acceptance does not schedule a
visit, collect payment, or assign a crew. Both workspaces expose a separate,
version-aware proposal conversation whose messages never imply a decision.

## Validation

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e:mobile
npm run test:e2e:chromium
npm run test:e2e:cross-browser
```

When Node is unavailable on the host, prefix each command with
`docker compose exec -T frontend`. Firefox and WebKit projects require their
Playwright browser executables; Chromium-only checks remain the compatible local
baseline when those executables are unavailable.

## Implementation conventions

- Preserve the distinction between persisted, queued, local-only, unavailable,
  conflict, and completed states.
- Keep persona and route authorization server-derived; hiding a destination is
  not an authorization control.
- Keep customer-safe projections separate from provider-private operational data.
- Reuse the canonical theme, wordmark, focus, controls, and shell materials in
  `src/index.css` and shared components, including `WorkspaceIcon` for
  authenticated navigation and `WorkspaceStatus` for operational feedback.
- Treat `design/prototypes/` as review code, not a second production component
  library; adopt approved behavior deliberately in React.
- Add responsive browser coverage for workflow/navigation changes and focused
  unit coverage for domain or request-state changes.
