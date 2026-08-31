# Version History

- 2026-08-31: Completed the Phase 6B frontend and pilot-assurance gates on Node
  22. Clean install and live dependency audit report zero vulnerabilities; all
  eight audit-policy tests, TypeScript, all 484 frontend tests, and the
  production build pass. The assurance rehearsal validates 11 minimized
  metrics, 14 alerts, and seven scenarios, with all seven failure-policy tests
  passing and external live/staffing evidence still explicitly pending.
- 2026-08-31: Closed the clean backend validation gate. Cargo now rebuilds the
  embedded migrator when migration files change; migration 122 permits only the
  exact delivered-proof photo/count redaction required by customer-photo erasure
  while rejecting unrelated snapshot rewrites; and photo queue integration
  tests no longer race each other's claims. Clean migrations, formatting, strict
  all-target Clippy, and all 417 backend tests pass.
- 2026-08-31: Replaced hosted CI's permissive raw SQL migration loop with the
  tracked backend migrator. The backend gate now fails on migration or checksum
  errors, records migration timing, and avoids installing a separate PostgreSQL
  client; clean-database and repeat-run validation apply all 121 versions.
- 2026-08-31: Hardened local migration validation for Phase 6B1. The Compose
  helper now runs the application's embedded SQLx migrator, sharing production's
  applied-version ledger and checksum validation instead of replaying every SQL
  file through a non-failing `psql` loop. Two consecutive runs retain all 121
  successful migrations, malformed database configuration exits nonzero, and
  formatting plus strict Clippy for the runner pass.
- 2026-08-30: Completed the Phase 6A persistence-hardening development delivery by classifying retained job, scheduling, bid, placeholder-photo, invitation-review, owner-acquisition, and public-ingestion substitutes as explicit non-production compatibility behavior. Production startup requires PostgreSQL, rejects disabled/local-review authentication, and the Render blueprint binds Cognito plus private PostgreSQL. The production auth guard regression passes; hosted validation is the next delivery stage.
- 2026-08-30: Made property operational-onboarding profiles fail closed. Profile reads and saves now return stable unavailable `503` errors without PostgreSQL instead of a seeded profile or an unsaved success response; empty authorization scopes remain a valid not-found result. Focused repository and route cases, strict Clippy, and all 416 backend tests pass.
- 2026-08-30: Made active customer-account and property manager workflows fail closed. Active account/property lists, account creation and updates, property create/identity/lifecycle changes, activation readiness, and account onboarding progress now return stable unavailable outcomes without PostgreSQL instead of seeded or unsaved state. Empty authorization scopes and the explicit demo job-account summary remain separate contracts. Focused repository and route cases, strict Clippy, and all 416 backend tests pass.
- 2026-08-30: Made property portfolio and crew-assignment workflows fail closed. Scoped portfolio/grouping and assignment-history reads now return stable unavailable `503` errors without PostgreSQL, and portfolio creation, property linking, and crew assignment no longer return unsaved success objects. Empty authorization scopes remain valid empty results. Focused repository and route cases, strict Clippy, and all 415 backend tests pass.
- 2026-08-30: Separated persisted membership availability from explicit local review. Active-user and organization-team membership reads now return unavailable without PostgreSQL unless the repository is deliberately configured with the local-review/test identities, so ordinary authorization fails closed while the review harness retains its virtual team. Focused repository, authorization, and route cases, strict Clippy, and all 417 backend tests pass.
- 2026-08-30: Made organization profile and onboarding state fail closed. Profile reads, first-owner setup progress, and profile updates now return their stable unavailable `503` errors without PostgreSQL instead of a local profile, a fabricated complete checklist, or an unsaved update. Persisted missing and invalid outcomes remain distinct. Focused repository and route cases, strict Clippy, and all 417 backend tests pass.
- 2026-08-30: Made membership administration mutations fail closed. Role, profile, and status updates now return their stable unavailable `503` errors without PostgreSQL instead of reporting a false last-owner conflict or an unsaved local success. Input validation and persisted last-owner protection remain unchanged. Focused repository and route cases, strict Clippy, and all 417 backend tests pass.
- 2026-08-30: Closed invitation recovery and login-audit no-pool outcomes. Invitation revoke and reissue now return their stable unavailable `503` errors instead of false missing/conflict results, and membership-backed principal access summaries require their login audit writes instead of succeeding unaudited. Explicit `persisted: false` local invitation creation remains a separate review-mode contract. Focused repository and route cases, strict Clippy, and all 417 backend tests pass.
- 2026-08-29: Made persisted organization collections fail closed. Team administration activity, cross-workflow operational activity, and organization invitation history no longer return loaded-empty without PostgreSQL; their stable `503` responses now reach manager UIs that already distinguish unavailable from empty. Focused repository and route cases, strict Clippy, and all 417 backend tests pass.
- 2026-08-29: Made archived customer-account and lifecycle operations fail closed. Archived lists now return unavailable without PostgreSQL; archive, reactivate, and relationship changes return their existing unavailable responses instead of false business outcomes. The delivered archive `DELETE` route is now authorized for portfolio managers. Focused repository, authorization, and route cases, strict Clippy, and all 417 backend tests pass.
- 2026-08-29: Closed the dispatch hierarchy no-pool boundary. Organization branch and service-territory reads now return unavailable instead of loaded-empty when PostgreSQL is absent, their APIs expose the existing stable `503` codes, and the manager hierarchy already presents that state explicitly. Focused repository and route cases cover both resources; strict Clippy and all 416 backend tests pass.
- 2026-08-29: Made the SupportAdmin marketing-lead workflow fail closed. A persistence outage now returns the stable inbox `503` instead of `200 []`, workflow updates return unavailable instead of a false missing-lead result, post-update history reloads require the established pool, and the inbox UI withholds zero totals and empty-state copy while unavailable. Focused outage cases, strict Clippy, all 416 backend tests, all 484 frontend tests, and the production frontend build pass.
- 2026-08-29: Closed the notification recovery-history false-empty boundary. The repository distinguishes loaded history from unavailable persistence, the list API returns its stable `503`, retry and resolve reload failures stay unavailable instead of becoming not-found, and the manager panel identifies unavailable persisted history rather than claiming an empty queue. Focused backend and frontend cases, strict Clippy, all 414 backend tests, all 483 frontend tests, and the production frontend build pass.
- 2026-08-29: Hardened both photo recovery-history reads: an absent or failed PostgreSQL pool can no longer appear as `200 []` for photo-processing or privacy-erasure object-deletion queues. Repository contracts distinguish loaded-empty from unavailable, both APIs return their stable `503` errors, focused handler and outage cases pass, and formatting, strict Clippy, and all 414 backend tests remain green. Notification recovery history is the next matching audit target.
- 2026-08-29: Completed the next authenticated mobile-navigation slice: Yard Owner Home now derives progress from protected visits instead of provider seed jobs, persona status uses matching work language and opens the relevant destination, and Visits keeps only one full service record open at a time. Containerized Chromium and WebKit journeys prove the 390 px iPhone flow, 48 px bottom-navigation targets, safe bottom placement, no horizontal overflow, Home-to-yard action, and exclusive visit disclosure; all 482 frontend tests and the production build pass.
- 2026-08-29: Added a fail-closed frontend dependency-security gate before type checking, tests, builds, browser journeys, and the production image. Eight deterministic cases prove clean and moderate-only passage plus high, critical, malformed-report, invalid-metadata, and audit-process failure; the live complete-graph Node 22/npm 10 audit reports zero findings. The documented policy prefers compatible patches and adds no advisory suppression, automatic major upgrade, or unapproved exception path.
- 2026-08-29: Remediated both high-severity npm findings without major upgrades: PostCSS moves from 8.5.15 to 8.5.26 and transitive nanoid from 3.3.12 to 3.3.18. Clean install/audit reports zero vulnerabilities; TypeScript, all 481 tests, the production build, and the Node 22 image build pass with identical frontend asset hashes and runtime image digest. An explicit CI audit regression gate is next.
- 2026-08-29: Added a deferred Yard Owner appreciation and external-review roadmap boundary: exact completed visits may eventually receive private company/service-team thanks or feedback, while concerns remain separate and individual workers are not publicly rated by default. Future Google review links must be neutral, universal, and unincentivized; Yelp remains a business-profile link without review solicitation; cross-posting, scraping, imported ratings, or in-product third-party review display require a separate approved integration and policy contract. The active next phase remains dependency-security triage, not review implementation.
- 2026-08-29: Made the production frontend context deterministic by excluding host TypeScript build metadata, Playwright inputs, source tests/specs, reports, and frontend documentation while retaining full prerequisite frontend/browser gates. A clean-context rebuild took 71.34 seconds, produced the same asset hashes, and retained the same runtime image manifest/config digest with backend/dependency/runtime layers cached.
- 2026-08-29: Restored and accelerated the production-image gate by deferring development-only design-path resolution to Vite's serve hook, adding npm/Cargo registry/release-target BuildKit mounts, and exporting a scoped max-mode Buildx cache in CI. The corrected unprivileged image passes PostgreSQL-backed health/readiness/frontend smoke checks; first local cache population took 783.12 seconds and an identical rebuild took 28.66 seconds, a 96.3% reduction.
- 2026-08-29: Restored the frontend production chunk boundary by partitioning the authenticated manager workspace graph from the shared application graph while preserving React and OIDC vendor chunks. The former 510.18 kB application chunk is now a 248.49 kB app chunk plus a 300.09 kB manager chunk, the Vite warning is gone, the measured build completes in 10.50 seconds, and all 481 unit tests pass.
- 2026-08-29: Removed repeat frontend CI work by restoring npm's lockfile-keyed package cache in both Node jobs, reusing incremental no-emit TypeScript metadata between typecheck and production build, and adding resource/timing markers for dependency, unit, build, browser-install, and cross-browser stages. A clean local typecheck and all 481 tests pass, and graph reuse reduced the measured build stage from 30.40 to 11.34 seconds; Playwright binaries remain uncached pending hosted evidence.
- 2026-08-29: Tuned the measured backend build bottleneck with CI Cargo dependency/build caching, test-only debuginfo removal, and per-gate elapsed/user/system/peak-RSS markers. An isolated cold strict-Clippy run took 324.06 seconds and exposed the bounded temporary-filesystem cost of default test artifacts; formatting, strict Clippy, and all 414 tests pass, with a repeat warm 0.50-second Clippy and 15.65-second test sample. Hosted cold/cache-hit comparison remains explicit follow-up evidence.
- 2026-08-27: Completed backend module convergence by moving completion reports, the core job repository, photo processing, photo storage, shared job/photo types, and upload validation onto the library boundary. The binary now contains only 145 route tests, down from 233, eliminating all 88 duplicate module-test executions; strict Clippy and all 414 backend tests pass.
- 2026-08-27: Moved day-plan validation, routing, amendment, crew, and hierarchy logic from binary redeclaration to the library crate. The binary test target drops from 210 to 185 tests, bringing the cumulative duplicate-test reduction to 48; strict Clippy and all 454 backend tests pass.
- 2026-08-27: Continued backend build convergence by routing account validation and persistence through the library crate. The binary test target drops from 215 to 210 tests, bringing the cumulative duplicate-test reduction to 23; strict Clippy and all 479 backend tests pass.
- 2026-08-27: Started backend build/test convergence by routing marketing events, marketing leads, notifications, project bids, and stop progress through the library crate instead of recompiling them in the API binary. The binary test target drops from 233 to 215 tests, eliminating 18 duplicate executions while strict Clippy and all 484 backend tests remain green.
- 2026-08-27: Restored the backend CI quality gate during Pilot Readiness. Mechanical lint findings are fixed, intentional large by-value result enums and SQL boundary signatures retain narrow item-level exceptions, duplicated binary-only dead-code findings are explicit, and formatting plus strict all-target/all-feature Clippy and all 502 backend tests pass.
- 2026-08-27: Hardened photo-worker persistence during Pilot Readiness. Worker cycles now separate claimed, exactly finalized, and stale/missing outcomes, fail the cycle when finalization persistence is unavailable, reclaim privacy-deletion claims abandoned for ten minutes, and dead-letter exhausted stale cleanup work with live PostgreSQL regression coverage.
- 2026-08-27: Contained legacy authenticated customer reads during the Pilot Readiness tenant-boundary audit. Property Owners can no longer call organization-membership-only account portfolio, property onboarding, or property report-history routes with caller-supplied sibling IDs; provider/property-management roles retain those operational routes, while Yard Owners use owner-scoped acquisition and hybrid-authorized exact-visit portal projections.
- 2026-08-27: Started Pilot Readiness persistence hardening with notification delivery finalization. Provider success/failure writes now require exactly one current `sending` claim, distinguish stale/missing claims from unavailable storage, stop a dispatcher cycle when an outcome cannot be persisted, and retain explicit warning/error telemetry. The live PostgreSQL fixture covers applied, duplicate, missing, unavailable, retry, dead-letter, receipt, tenant-isolation, audit, and cleanup behavior.
- 2026-08-27: Completed signed-in Yard Owner adoption for D-062: exact-visit current recommendations and immutable history now appear in Home/Visits; exact-version approval requires a one-time scope/total affirmation while decline and revision retain separate semantics; retry, replay, conflict refresh, closed-state, and receipt recovery are explicit. Corrected the private-VPN launcher to verify `local_review`, published the direct `/app` route, and passed live Tailscale HTTP checks plus a Pixel 7 Chromium recommendation/approval journey.
- 2026-08-26: Delivered D-062 authenticated customer decisions: the exact recommendation route accepts bounded approve, decline, or revision request against the current unexpired version; repeats hybrid and exact-visit authorization; enforces affirmation or revision context; atomically writes immutable decision/event/lifecycle state; replays the exact actor key; and conflicts on changed content, stale versions, or closed state. Live validation now exercises the real affirmed approval path instead of direct fixture SQL.
- 2026-08-26: Delivered D-062 authenticated recommendation reads: exact-visit list and immutable-history detail routes repeat the hybrid portal grant, membership, active organization/account/property relationship, release, and visit checks; strictly allowlist stored snapshots; recompute totals; omit internal lineage, notes, recipients, and tokens; fail closed without mutable-bid fallback; and durably reconcile server expiration. Live coverage proves exact-owner history, cross-owner isolation, revoked/inconsistent authorization, and response privacy.
- 2026-08-26: Delivered D-062 immutable provider revisions and explicit transitional decision reconciliation: expected-version, full-scope, actor-key revision writes preserve prior snapshots, record exact supersession/publication, refresh bounded public delivery with quiet-hours handling, and replay without duplicate publications or notifications. Legacy bearer answers now atomically close the signed-in surface as `withdrawn` without fabricating an authenticated decision or affirmation. Added the provider revision API/editor flow and advanced the next slice to minimized hybrid customer reads and actor-scoped decisions.
- 2026-08-26: Bridged exact initial project-bid delivery into D-062 atomically: provider sends now carry a retained actor retry key; the transaction revalidates active visit/release/job/stop/amendment/account/provider provenance and writes one minimized hash-addressed USD publication, event, pending series, share delivery, and notification. Exact replay rolls back without duplicates, changed/already-published sends conflict, and non-exact legacy bids create no portal publication. Revision publication and bearer-decision reconciliation remain next before customer APIs.
- 2026-08-26: Delivered the D-062 recommendation persistence foundation: composite foreign keys preserve exact visit/release/job/stop/amendment/bid provenance; immutable hash-addressed publications, supersession and lifecycle events guard sequential versions; current unexpired decisions require affirmation or revision context; exact-version questions accept one exact response; and live PostgreSQL validation rejects rewrites and post-approval revision. Corrected the existing hybrid property resolver's reserved `grant` SQL alias while exercising the full fixture.
- 2026-08-26: Accepted active-recommendation decision D-062 after auditing the legacy project-bid flow: provider-authored bids have useful amendment/job lineage and conversion outcomes, but the account history lacks hybrid property authority and exact visit provenance while bearer decisions lack version, revision, affirmation, and actor replay semantics. Adopted immutable exact-chain customer publications, contained the account-bid route from Yard Owner in middleware and the browser, and queued the constrained persistence foundation before any signed-in approval UI.
- 2026-08-26: Delivered D-061 protected proof end to end: the visit list derives availability only from a structurally valid immutable snapshot on the exact released job; the authenticated exact-reference route repeats hybrid grant and active-relationship checks and omits internal IDs/share tokens; Yard Owner Home, Visits, and Proof load minimized checklist/photo/completed-outcome evidence on demand with fail-closed retry and no live-data fallback.
- 2026-08-26: Made completion-report publication atomic for D-061: delivery now validates a persisted identity/readiness-matched snapshot before one transaction writes delivered status, share token, delivery and snapshot timestamps, immutable content, history, and audit. Database triggers reject incomplete delivery and snapshot rewrites, and public reads no longer rebuild missing proof from mutable live job state.
- 2026-08-26: Accepted D-061 after auditing delivered-proof continuity: the legacy property-report list uses organization membership, exposes internal IDs/share links, and can infer property provenance, while report delivery can precede snapshot storage and public reads can rebuild missing proof from live state. Adopted the exact visit/release/job/delivered-snapshot chain with hybrid reads, withheld the legacy route from Yard Owner, and queued atomic snapshot delivery before authenticated proof adoption.
- 2026-08-26: Adopted the D-060 provider response experience in manager Reports: company owners/managers receive the minimized unanswered-first visit queue, exact authoritative conversation, and exact-question bounded response with retained retry identity and post-write/conflict recovery; other personas receive no UI authority and the experience makes no alert or response-time claim.
- 2026-08-26: Adopted contextual visit questions in Yard Owner Home and Visits: released visits open the exact authoritative thread and submit allowlisted bounded questions with retry-key retention and post-write/conflict reload, while unreleased, loading, access, inconsistency, and unavailable states remain explicit and the UI makes no alert, read-receipt, or response-time claim.
- 2026-08-26: Exposed D-060 visit questions through a random reference added only to hybrid-authorized released visits, customer thread read/question routes, and an unanswered-first organization-owner/manager provider queue with exact read/response routes. Middleware roles remain backed by current database membership and relationship checks; minimized responses omit actor and operational IDs, preserve replay/conflict/outage recovery, and make no notification or response-time claim.
- 2026-08-26: Implemented D-060 visit-question persistence: every service release atomically receives one random non-bearer customer reference and versioned thread; immutable bounded questions and exact provider replies revalidate hybrid customer grants or organization-owner/manager membership on every operation, enforce one response per question and exact actor-scoped replay, fail closed after relationship closure, and retain cross-property isolation without notifications, SLA claims, operational exceptions, or concern state.
- 2026-08-26: Accepted customer visit communication decision D-060: deliver questions first through a dedicated immutable hybrid-authorized customer/provider thread with a random non-bearer visit reference and organization-owner/manager provider queue, while making no notification or response-time claim and retaining concerns as a separately approved workflow.
- 2026-08-26: Audited Yard Owner contextual-question and concern sources and found assessment/proposal messages, service-day publications, notification outbox, operational exceptions, report notes, and project-bid messages unsafe to reuse. Proposed D-060: a question-first immutable hybrid-authorized thread with a random non-bearer visit reference and owner/manager provider queue, while concerns, attachments, notifications, and response-time commitments remain separately gated.
- 2026-08-26: Adopted the explicit service-day lifecycle in Yard Owner Home and Visits with a shared accessible progress rail, distinct confirmed/on-the-way/care/weather/rescheduled/complete-proof-pending presentation, bounded weather reason and next update, original/replacement reschedule windows, recorded preparation, and an explicit unpublished-proof privacy boundary.
- 2026-08-26: Extended the hybrid-authorized customer visit read over exact immutable service releases and explicit customer events: status/reason/update copy now advances only through publication, explicit reschedules control the effective window, requests accept no scope/operational IDs, responses expose no release/event/job IDs, and proof remains unavailable pending separate authorization.
- 2026-08-26: Exposed provider service mobilization through organization-owner/manager release reload, idempotent exact-first-visit work release, and versioned customer-safe status publication APIs; every operation revalidates exact active membership and relationship scope, preserves explicit recovery semantics, prevents implicit job-state publication, and omits organization/customer identifiers from provider responses.
- 2026-08-26: Implemented decision D-059's immutable service-release and customer-status persistence: an active organization-scoped provider owner/manager can atomically release the exact confirmed first visit into one scheduled job with accepted-scope/property provenance and exact replay, while versioned customer publications revalidate the relationship/property, enforce allowlisted and operationally gated transitions, reject cross-property writes, and create no route, day plan, crew assignment, payment, recurring schedule, or proof publication.
- 2026-08-26: Accepted service-mobilization decision D-059: an immutable, idempotent provider-authorized work-release record must link the exact confirmed first visit, customer property, accepted scope, and resulting service job before customer-visible service-day state advances beyond confirmed.
- 2026-08-26: Audited the next customer service-day projection and found no exact first-visit-to-property-job authority: first-visit confirmation deliberately creates no operational work, jobs lack exact customer-property/visit provenance, and route/report state cannot authorize customer publication. Documented the recommended immutable provider-authorized mobilization/work-release relation and paused states beyond confirmed for product/operations/security approval.
- 2026-08-26: Adopted the minimized persisted customer visit read in Yard Owner Home and Visits, formatting the authorized confirmed window in its recorded timezone, loading proof only for authorized properties, distinguishing loading, valid-empty, missing-access, inconsistent-access, unavailable, and retry states, withholding recommendations pending their own contract, and removing illustrative visit/portfolio fallback from the customer surface.
- 2026-08-26: Added the minimized persisted customer portal visit read through hybrid authorization, returning authorized property identity and exactly confirmed customer-safe first-visit windows and accepted service scope while distinguishing empty, missing-grant, inconsistent-authorization, and unavailable states and excluding actor, token, activation, proposal, route, crew, billing, provider-note, and unpublished-proof data.
- 2026-08-25: Delivered the hybrid customer portal authorization foundation: activation now issues customer-account-scoped owner membership and grants, constrained migration widens only exact active activation provenance, property-scoped delegates remain isolated, and one resolver fails closed unless the current organization, account, property, membership, role, scope, and grant all agree.
- 2026-08-25: Accepted hybrid customer portal authorization: verified owners inherit current and future properties through a provider-tenant customer-account grant, delegates remain explicitly property-scoped, membership alone never authorizes reads, and migration/backfill must prove activation provenance before the minimized persisted visit projection begins.
- 2026-08-22: Persisted provider-supplied service categories and customer communication languages in Company setup, projected them as precise readiness facts, retained backward-compatible empty defaults and bounded allowlists, and explicitly kept capability proof, eligibility, ranking, real-time availability, and credential verification outside the contract.
- 2026-08-22: Added stable responsive lifecycle orientation to the known-owner provider route across Invitation, Organization, Disclosure, Assessment, Proposal & setup, and First visit, with precise current/completed/upcoming/closed states and links only to available workspaces.
- 2026-08-22: Connected the first-time known-owner provider journey from recipient confirmation through actor-scoped organization selection or duplicate-safe bootstrap, explicit withheld-data acknowledgement, resumable bounded inbox authority, and controlled question/interest/decline response; capability identifiers remain non-bearer and every action retains server-side recipient, mailbox, token, organization, membership, scope, version, and expiry checks.
- 2026-08-22: Added provider identity/readiness to Company setup using current organization-profile and setup-progress reads; the UI distinguishes provider-supplied identity/contact/website/service area, recorded timezone/capacity, operational crew setup, missing facts, credentials not collected, and marketplace eligibility not evaluated without a broad verified badge.
- 2026-08-22: Adopted Yard Crew public fit and entry routing: landscaping-company signup now separates owner-operators, company owners, invited workers, and known-owner recipients; allowlisted entry context opens authenticated Company setup while claims/memberships remain authoritative; no publication/opportunity promise is explicit; and domain/component/build plus six phone/desktop browser checks pass.
- 2026-08-22: Adopted the property-manager portfolio command center in React: the PropertyManager persona now receives responsive Overview/Properties/Proof/Approvals navigation, scoped portfolio and property search, labeled local-review readiness, exception and decision hierarchy, protected proof/bid history with partial-source isolation, customer-safe provider accountability, three focused unit checks, and phone/desktop browser coverage.
- 2026-08-22: Completed the connected property-manager portfolio V1 working design and production handoff with responsive Overview/Properties/Proof/Approvals navigation, readiness and exception hierarchy, property search, customer-safe provider accountability, all-clear/new/loading/partial/unavailable states, privacy boundaries, desktop/mobile validation, and gallery review captures.
- 2026-08-22: Completed core Access/Home convergence: protected navigation now waits for active-access verification, storage failure fails closed with an in-place retry, active membership roles govern personas with explicit Support and first-owner bootstrap exceptions, unscoped claims receive Home-only restoration guidance, and all seven local identities are covered across phone and desktop.
- 2026-08-22: Completed core recommendation/add-on continuity in shared completion proof: bid-derived completed add-ons are presented as approved recommendations delivered, the public API now returns a purpose-built customer-safe service/checklist/photo/outcome projection, internal IDs/notes/object keys/pricing/billing/operating context are excluded at serialization rather than merely hidden by the UI, and phone/desktop shared-proof regression passes.
- 2026-08-22: Completed Phase 6 core access safety and production handoff: signed-in memberships are labeled, self-role and self-suspension reviews explain immediate access impact, last-owner protection remains authoritative, unavailable membership persistence no longer also claims an empty team, keyboard recovery transfers focus correctly, and the component/API/authorization/state/test map is documented.
- 2026-08-22: Added Team overview partial-read isolation and direct staffing recovery: independently available counts remain visible, missing membership/invitation/crew/territory sources are named without false zeroes, crew-lead gaps open crew administration, and unstaffed territories open dispatch hierarchy on phone and desktop.
- 2026-08-22: Adopted the Team and access command center for Organization Owners with live active-member, pending-invitation, active-crew, and unstaffed-territory summaries; explicit unavailable recovery; staffing attention; direct member, invitation, crew, and audit paths; focused unit coverage; and phone/desktop Chromium validation.
- 2026-08-22: Adopted the first Yard Owner portal production slice with stable Home/Visits/Proof/Account navigation, portal-wide property selection, an explicit customer-safe local-review visit model, next-visit confidence hierarchy, delivered-proof archive, recommendation history, and responsive property-context coverage; persisted customer visit reads remain planned.
- 2026-08-22: Adopted secure customer proposal decisions with the shared public visual hierarchy, responsive scope and pricing, explicit approval/decline confirmation, recorded outcomes, closed-link recovery, and a narrowed public API projection that omits internal bid/line-item/service IDs, manager notes, and delivery metadata.
- 2026-08-22: Adopted the customer-safe shared completion-proof hierarchy with Grover service identity, immutable snapshot context, responsive photo/checklist/add-on evidence, explicit retry recovery, and a trust boundary that omits internal billing notes and operating identifiers.
- 2026-08-22: Connected manager completion review to the exact selected Job Report workflow across desktop and mobile, and adopted the branded Reports and communication command-center hierarchy plus a denser responsive review board without changing report lifecycle or delivery contracts.
- 2026-08-22: Adopted the manager Recovery queue/detail hierarchy with open/assigned/urgent/resolved-today summaries, responsive filtered queue and selected inspector, shared status feedback, preserved optimistic lifecycle actions, and direct routing back to affected Job, property, or Schedule work.
- 2026-08-22: Adopted the first authenticated manager Schedule command-center slice with Today’s operation, service-date crew/work/risk summaries, compact route-target controls, a desktop route board plus selected-route planning inspector, responsive stacking, shared status feedback, and preserved draft/capacity/publish/amendment behavior.
- 2026-08-22: Completed the core field-execution hierarchy adoption by keeping selected Job context and guarded primary actions visible while Overview, Checklist, Photos, Add-ons, and Report open one at a time; added semantic workflow tabs, evidence-gap and next-action guidance, responsive coverage, shared availability notices, and immediate selected-record lifecycle updates.
- 2026-08-22: Adopted the compact Assigned Jobs direction with route-order markers, lifecycle pills, checklist/photo readiness, customer/address search, status filtering, result counts, and an explicit no-match state while preserving the underlying assignment order and selected-job workflow.
- 2026-08-22: Adopted Crew Route V1 hierarchy into the responsive field route with a high-contrast accessible progress summary, planned/remaining time, explicit Current stop and Up next cards, two-stop focus before full-route expansion, shared status pills, route changes after immediate work, and correct advancement from server-provided in-progress state.
- 2026-08-22: Completed the core authenticated desktop-shell convergence with a persistent role-filtered forest rail, single-destination rendering, a shorter editorial Home hero, and a dense responsive summary/action grid; retained phone bottom and tablet rail compositions and expanded local-role browser coverage across all personas and breakpoints.
- 2026-08-22: Added shared neutral/info/success/warning/danger notice and bounded status-pill primitives with common outlined icons and semantic live-region defaults; adopted them for authenticated Home sync/priority feedback, field job states, persisted-job failures, and crew-route storage/availability recovery.
- 2026-08-22: Replaced shared authenticated-shell navigation and Home status Unicode symbols with one reusable outlined SVG icon family; added a fixed role-filtered tablet rail between the phone bottom bar and existing desktop shell; and covered icon contracts, phone geometry, tablet geometry/padding/overflow, and desktop handoff.
- 2026-08-22: Adopted first-visit planning into both responsive workspaces: verified providers can propose or replace a bounded customer-safe window with retry-stable recovery, owners can confirm the exact version or request another window, confirmed state links into the Yard Owner portal, and four mobile/desktop Chromium journeys preserve the separate crew/route/work-order/payment boundary.
- 2026-08-22: Exposed first-visit planning through verified-provider status/propose and property-owner-scoped status/decision routes with token-in-body handling, exact-version validation, created/replayed responses, missing/not-ready/conflict/outage recovery, route policy coverage, and fail-closed no-persistence tests.
- 2026-08-22: Delivered the separate first-visit persistence lifecycle with post-activation verified-provider authority, immutable bounded window versions, exact-version owner confirmation/change requests, actor-scoped replay, concurrent confirmation recovery, minimized events, owner/provider isolation, and PostgreSQL proof that no job, day plan, route, work order, payment, crew, or assignment is created.
- 2026-08-22: Defined the separate first-visit contract after relationship activation, including provider-proposed customer-safe windows, exact-version owner confirmation/change requests, immutable history, privacy boundaries, recovery semantics, and strict separation from mobilization, crew assignment, work-order release, routing, billing, and recurring scheduling.
- 2026-08-22: Adopted explicit activation into both responsive acquisition workspaces: owners separately affirm provider setup after acceptance with retry-stable writes and authoritative status reload, providers see activated onboarding status through their verified progress view, and mobile/desktop journeys preserve that no first visit, payment, schedule, route, or crew assignment was created.
- 2026-08-22: Exposed explicit relationship activation through verified-owner, property/proposal-scoped status and create routes with server-derived provider/operational identifiers, current-statement validation, created-versus-replayed responses, explicit missing/not-ready/conflict/outage recovery, route-policy coverage, and fail-closed persistence tests.
- 2026-08-22: Delivered the owner-confirmed activation repository transaction with accepted-snapshot digest and exact-version validation, atomic provider customer/account/property projection, property-scoped membership and portal grant, same-property competing-invitation closure, activated owner/provider progress, exact concurrent replay, and PostgreSQL proof that no job, day plan, route, crew, or assignment is created.
- 2026-08-22: Added the explicit activation persistence foundation with immutable accepted-snapshot-to-customer/property provenance, property-scoped portal access grants, a separate current-relationship projection, minimized activation events, and a terminal activated invitation state, while retaining jobs, routes, payments, recurring schedules, crews, and first visits outside activation.
- 2026-08-22: Defined the explicit owner–provider activation contract with a second owner affirmation, atomic server-derived customer/property projection, property-scoped membership and portal allow-list, immutable accepted-snapshot provenance, same-property competing-request closure, exact replay and rollback rules, and strict separation from jobs, routes, payments, recurring schedules, crew assignment, and first-visit confirmation.
- 2026-08-22: Completed proposal collaboration in both responsive acquisition workspaces: Yard Owners can ask a version-specific question or request a change without deciding, providers can reload and answer the exact owner message, newer immutable revisions are linked explicitly, retry-safe client mapping is covered, and desktop/mobile journeys preserve no-decision and no-activation meaning.
- 2026-08-22: Exposed proposal collaboration through authenticated owner message list/create and verified-provider response routes, explicit authorization and fail-closed status mapping, and provider disclosure reload containing the complete version-aware conversation.
- 2026-08-22: Added the separate proposal-conversation persistence boundary with immutable owner questions/change requests and provider responses, exact subject/current-series version snapshots, explicit revised-proposal reply linkage, actor-scoped replay, owner/provider authority isolation, and PostgreSQL proof that messages neither decide proposals nor enter minimized lifecycle audit or operational activation.
- 2026-08-22: Adopted initial-service proposals into the production acquisition workspaces: providers can author/revise customer-safe offers after completed assessments and recover the latest immutable version on reload; Yard Owners can review neutral version history and explicitly accept or decline one current version; client/domain/PostgreSQL/browser coverage preserves idempotency, expiry, private-note separation, and accepted-but-unactivated meaning.
- 2026-08-22: Reconciled every tracked README and the core architecture, MVP, local-development, authentication, deployment, Yard Owner production, design handoff, roadmap, and delivery records with the implemented codebase; added an explicit prototype-adoption matrix and ordered repository queue; and identified Yard Owner proposal interfaces as the next safe production slice while preserving external, marketplace, billing, evidence, and launch gates.
- 2026-08-22: Replaced the public product tour’s abbreviated Plan route card with the reusable, interactive “Today’s operation” landscaping-company dashboard, isolated its hero and tour controls, retained persona-specific outcomes, and added responsive tour interaction coverage.
- 2026-08-22: Adapted the approved “Today’s operation” schedule concept into the landscaping-company hero with crews-active, route-progress, unassigned, and at-risk signals; crew workload/capacity; interactive dispatch assignment; suggested balancing; and an explicit non-persistent preview boundary.
- 2026-08-22: Made persona-specific public landing experiences the active UX priority and extended Yard Owner, property-manager, landscaping-company, and crew-lead views beyond the hero with tailored primary actions, previews, trust signals, outcome proof, capability sets, and final invitations while preserving both direct signup paths and adding route/switching/reflow coverage.
- 2026-08-22: Separated the production Yard Owner acquisition journey into four independently rendered screens, made its progress header navigate available steps for review and editing, added explicit back/continue controls, and covered step isolation plus backward navigation in the browser suite.
- 2026-08-22: Aligned the reciprocal provider-invitation entry with the production acquisition theme through the shared leaf lockup, editorial title, bone/paper/forest materials, controls, cards, data-boundary emphasis, and exact browser style checks without changing token removal, mailbox verification, disclosure, or assessment behavior.
- 2026-08-22: Extended production visual convergence into the authenticated Home shell with the shared leaf lockup, editorial greeting hierarchy, warm canvas and paper cards, canonical shadows, forest manager navigation, matching mobile header/bottom-nav materials, and exact shell-style browser regression coverage.
- 2026-08-22: Began production visual convergence by centralizing the validated prototype palette, editorial/interface font roles, focus and control primitives, leaf wordmark, and PWA chrome; rebuilt the responsive public hero around its split prototype composition and persona-specific product preview; aligned access and Yard Owner acquisition surfaces; and added exact computed-style regression coverage.
- 2026-08-22: Added authenticated acquisition-proposal lifecycle APIs for verified-provider publication/revision and owner-scoped history, detail, and exact-version decisions, with explicit route authorization and invalid/not-found/conflict/replay/outage mapping.
- 2026-08-22: Added acquisition-proposal repositories with completed-assessment provider authorization, immutable version publication, server-derived expiration, owner-scoped reads and exact-version decisions, replay-safe concurrency, hashed accepted-but-unactivated snapshots, minimized audit, and verified absence of customer/job/plan/crew side effects.
- 2026-08-22: Added persistent public-hero invitations for private Yard Owner signup and authenticated landscaping-company onboarding, with persona-aware visual emphasis and direct route coverage.
- 2026-08-20: Added the acquisition proposal schema foundation with immutable published versions, bounded scope/terms and price controls, one open/accepted proposal per assessment, actor-scoped replay keys, owner decision records, accepted-but-unactivated JSON/digest snapshots, minimized events, and successful clean replay of every migration.
- 2026-08-20: Defined the acquisition-specific initial-service proposal contract with completed-assessment authority, immutable revisions, structured scope/terms/price, exact-version owner decisions, accepted-but-unactivated snapshots, separate question/change requests, minimized audit, and an explicit boundary from existing-customer project bids.
- 2026-08-20: Closed on-site assessment scheduling recovery with verified-provider replacement windows after owner change requests, current-authority and expected-version checks, exact replay, changed/stale conflict, minimized schedule-free audit, fresh owner confirmation, retry-preserving provider controls, and browser coverage.
- 2026-08-20: Added the production verified-provider assessment workspace with remote/on-site start, owner-confirmation gating, controlled lifecycle outcomes, separate customer-safe and provider-private communication, authoritative disclosure-scoped reload, retry-safe writes, concurrent-start replay recovery, revocation handling, and responsive browser coverage.
- 2026-08-20: Added the production Yard Owner assessment workspace with property-scoped history, proposed-window confirmation/change requests, customer-safe owner/provider conversation, retry-safe decisions, authoritative conflict reload, terminal outcome summaries, provider-private note exclusion, and responsive browser coverage.
- 2026-08-20: Aligned desktop `/app` composition with the active role persona, hiding field execution from customer and support reviewers, exposing customer care to owner and property-manager reviewers, filtering management categories and tools by persona, and rendering only one selected office tool at a time across desktop and mobile.
- 2026-08-20: Added production-rejected local role-review authentication with seven fixed identities, backend-derived roles, virtual demo-organization memberships, unknown-profile rejection, per-tab frontend selection, an always-visible local-review banner, local-stack defaults, and focused backend/frontend tests without requiring AWS or adding reviewer rows to production databases.
- 2026-08-19: Exposed authenticated owner assessment-message list/create and verified-provider customer-safe-message/private-note create APIs with separate privacy-shaped routes and validators, explicit invalid/missing/ended/conflict/replay/unavailable mapping, route-policy coverage, and fail-closed persistence-outage tests.
- 2026-08-19: Added owner-scoped customer-safe assessment message writes, verified-provider customer-safe message and private-note writes with current authority/version checks, actor-scoped exact replay, changed-reuse conflict, status-only terminal recovery, minimized append-only events, and owner reads sourced exclusively from the shared projection with PostgreSQL isolation and private-data non-leakage coverage.
- 2026-08-19: Added provider-authorized assessment begin, completion, cannot-assess, and cancellation transitions with verified invitation identity, current capability/interest/organization/membership/grant/property/brief rechecks, optimistic concurrency, exact replay, controlled owner-visible outcomes, minimized append-only events, status-only invalid-state recovery, authenticated routing, and no service-activation side effect.
- 2026-08-19: Added owner-scoped, expected-version and replay-safe on-site assessment window confirmation/change requests with row locking, controlled actions, append-only minimized events, authoritative invalid-state recovery, authenticated routing, cross-owner and concurrent PostgreSQL coverage, and no service-activation side effect.
- 2026-08-19: Separated Yard Owner assessment communication persistence into constrained customer-safe messages and provider-private notes, added a shared-only owner projection and minimized append-only event kinds, and proved with PostgreSQL coverage that private crew-hour, disposal, and route assumptions cannot enter owner message reads or event payloads.
- 2026-08-19: Exposed authenticated Phase 4 assessment APIs for verified-provider remote/on-site assessment start and verified-owner property-scoped history, with controlled validation and explicit created/replayed/missing/changed/conflict/unavailable response mapping plus route-policy and fail-closed no-persistence tests.
- 2026-08-19: Began Yard Owner Phase 4 with authorized, replay-safe assessment persistence for remote review or bounded on-site windows, rechecking verified recipient, explicit interest, active provider organization membership, current owner/property/brief, and active disclosure grant; added one-assessment concurrency protection, owner-isolated history, append-only events, minimized audit, outage distinctions, and PostgreSQL coverage.
- 2026-08-19: Delivered automated Yard Owner pilot operations assurance with a machine-readable manifest covering 11 minimized metrics across 10 required families, 14 alert/runbook mappings, seven synthetic bounce/expiry/wrong-recipient/impersonation/unintended-disclosure/failed-revocation/outage scenarios, containment and rollback evidence, CI rehearsal, six negative validator tests, and external/live/human blockers that repository automation cannot mark passed.
- 2026-08-19: Added a CI-enforced Yard Owner acquisition browser matrix across mobile/desktop Chromium, desktop Firefox, and mobile WebKit with deterministic application startup, secure invitation-fragment refresh recovery, disclosure/revocation focus checks, post-revocation closure, 320/768/1366/1440 reflow, visible focus, reduced-motion and forced-colors production styles, and passing 24-journey, 8-profile, 397-unit, TypeScript, and isolated-build gates.
- 2026-08-19: Hardened owner/provider disclosure persistence with exact concurrent replay recovery, changed/stale conflict without partial receipts, valid PostgreSQL grant aliases, repeatable retained-evidence lifecycle fixtures, corrected checked-recipient claim-appeal actor migration, and passing backend formatting, focused/full tests, and clean migration replay; strict repository-wide Clippy remains pending on 19 existing warnings outside the slice.
- 2026-08-19: Hardened owner provider-disclosure decisions with stable per-decision approval and revocation idempotency keys across lost responses, preserved reviewed choices for safe retry, authoritative receipt/connection reload after stale conflicts, no false success claim, and passing frontend typecheck/full-unit/build/focused compatible-Chromium recovery validation.
- 2026-08-19: Defined Yard Owner Phase 3E pilot hardening with separate automated, external-technical, and signed-human evidence classes; reviewable retry/stale-tab, server authorization/concurrency, cross-browser, minimized-monitoring, runbook-validation, and synthetic-rehearsal slices; and explicit delivery-integration, usability, assistive-technology, physical-device, privacy/security, staffing, operational, and go/no-go launch blockers.
- 2026-08-19: Delivered the production provider-disclosure experience with default-withheld owner categories, individual photo selection, named-provider affirmation, explicit shared/withheld and assessment-only summaries, immutable receipt history, controlled future-access revocation, provider-only approved-field/photo rendering, honest withheld and work-authority boundaries, status-only ended-access recovery, and passing client/full-unit/type/build/four-journey compatible-Chromium validation.
- 2026-08-19: Delivered owner disclosure receipt history and revocation with property/owner isolation, provider and category visibility, selected-photo labels, preserved policy and grant versions, controlled reasons, explicit confirmation, optimistic concurrency, exact replay, append-only events, minimized audit, immediate status-only provider closure, and access-ended progress distinct from invitation closure.
- 2026-08-19: Delivered provider-specific disclosure reads with checked token/mailbox/actor binding, full current grant and relationship authority rechecks, independently omitted withheld categories, selected-ready-photo authorization bounded by grant expiry, cross-provider isolation, owner/provider approval progress, and automatic status-only expiry or suspension reconciliation.
- 2026-08-19: Delivered owner-approved provider disclosure creation with a server-derived property/provider/brief/category/photo review, explicit assessment-only and retention boundaries, exact review-version receipts, transactional recipient/claim/organization/membership/capability/interest/brief/media/suppression/expiry checks, complete approved/withheld partitioning, idempotent replay, stale-state conflict, owner isolation, and minimized audit.
- 2026-08-18: Added the provider disclosure persistence foundation with append-only receipts, separately revocable current grants, immutable event history, complete approved/withheld category partition constraints, selected-photo consistency, yard-assessment scope, lifecycle/version/replay rules, one active grant per invitation, and minimized grant audit event kinds.
- 2026-08-18: Defined the Phase 3D provider-specific disclosure contract with owner-only transactional prerequisites, five independently selected categories, explicit per-photo selection, no-default affirmation, complete approved/withheld partitioning, immutable receipts separated from revocable current grants, category-filtered provider reads, short-lived media authorization, honest versioned revocation, minimized audit, and fail-closed acceptance criteria.
- 2026-08-18: Added the authenticated provider invitation progress surface with one-time bearer-fragment consumption and immediate address removal, protected body-only progress lookup, verified-mailbox context, safe gate/own-response/closure states, fixed withheld-data clarity, route/client coverage, passing typecheck/build, and a browser scenario awaiting a compatible Chromium runtime.
- 2026-08-18: Adopted provider connection progress in the production Yard Owner property flow with independent brief/progress recovery, accessible loading, empty, unavailable, refresh, action-needed, limited-access, and interest-boundary states; client tests, TypeScript, and production build pass, while the updated browser scenario awaits a compatible Chromium runtime.
- 2026-08-18: Delivered the checked-recipient provider progress API with verified-mailbox body-token scoping, current invitation/relationship/organization/membership/capability/expiry checks, stale-authority reconciliation, safe gate recovery, own question/interest confirmation, status-only terminal responses, and exclusion of owner yard data, pre-grant choices, capability identifiers, other responses, and safety cases.
- 2026-08-18: Delivered the owner/property-scoped provider connection-progress API with derived invitation/delivery/response stages, safe question and interest mapping, generalized decline, indistinguishable opt-out/safety closure, controlled next actions, cross-owner isolation, sensitive-data exclusion, and outage-distinct handling.
- 2026-08-18: Defined the Phase 3C owner/provider connection-progress contract with separate least-visibility projections, deterministic terminal and response precedence, customer-safe question/interest/decline/contact-closure wording, controlled recovery actions, status-only provider closure, outage distinction, accessibility language, and isolation acceptance criteria.
- 2026-08-18: Delivered all four bounded known-provider opportunity responses with protected verified-mailbox access, transactional capability/version/invitation/claim/organization/membership rechecks, controlled response codes, replay and duplicate-action protection, non-terminal question/interest, invitation-only decline, safety-report revocation and durable suppression, minimized Trust & Safety intake, and privacy-safe audit.
- 2026-08-18: Delivered the authorized known-provider inbox with protected body-token access, effective recipient/capability/invitation/claim/organization/membership/expiry rechecks, limited snapshot and own-organization context, explicit withholding, automatic capability reconciliation, and status-only closure that removes owner, organization, yard, and action data.
- 2026-08-18: Delivered bounded known-provider response capability issuance with atomic invitation/mailbox/claim/organization/membership checks, explicit withheld-data acknowledgement, immutable brief and expiry scope, four fixed pre-disclosure actions, replay/conflict/outage handling, privacy-safe response/audit coverage, and automatic invitation revoke/opt-out/expiry reconciliation.
- 2026-08-18: Defined the known-provider opportunity-response capability contract with transactional recipient/organization prerequisites, immutable invitation and brief scope, four bounded pre-disclosure actions, explicit withheld categories, expiry/revocation reconciliation, authorized inbox boundaries, minimized audit, and phased persistence/UI/action delivery.
- 2026-08-18: Completed provider claim review operations with support-only identifier-free SLA metrics for queue states, due/overdue/priority counts and oldest age, explicit outage handling, privacy-safe serialization coverage, and a runbook for access, escalation, replay, correction, rollback, and live operational validation.
- 2026-08-18: Delivered independent provider claim appeal decisions with original-rejector exclusion, ordinary-disposition bypass prevention, controlled approval/rejection, append-only appeal linkage, idempotent replay, approval routed back through final duplicate rescan, and no opportunity-response authority.
- 2026-08-18: Delivered checked-recipient provider claim appeals for rejected claims with active invitation/mailbox binding, controlled appeal categories, restricted evidence references, append-only rejection linkage, version and replay safety, minimized general audit, outage handling, and response authority kept false.
- 2026-08-18: Delivered support-admin provider claim review with a minimized status/SLA queue, versioned and replay-safe review/clear/reject/pause transitions, append-only restricted-evidence references, controlled reason codes, persistence outage handling, and general audit that excludes evidence and duplicate-candidate data.
- 2026-08-18: Defined the provider organization claim operations contract for support-only minimized queues, restricted evidence references, append-only review events, legal disposition and appeal transitions, separation of duties, customer-safe reason codes, SLA aging, and identifier-free monitoring.
- 2026-08-18: Delivered versioned provider organization bootstrap with a normalized-name advisory lock, final in-transaction duplicate rescan, atomic yard-care organization and owner-membership creation, claim provenance, access audit, replay safety, late-match non-disclosing review, concurrent same-name coverage, and no opportunity-response authority.
- 2026-08-18: Delivered checked-recipient provider organization claim assessment with own-active-membership options, server-rechecked existing relationships, authority-attested new-provider readiness, normalized non-disclosing duplicate review, actor-scoped replay, fail-closed invitation and identity boundaries, minimized audit, PostgreSQL isolation coverage, and no opportunity-response authority.
- 2026-08-18: Defined the production provider-organization claim contract for invitation recipients, covering own-membership options, existing-relationship checks, normalized duplicate readiness, atomic bootstrap rescan, non-disclosing duplicate review, dispute/appeal states, minimized audit, concurrency coverage, and separation from opportunity-response capability.
- 2026-08-18: Added authenticated known-provider invitation recipient checks with invited-mailbox matching, one-account binding, idempotent replay, cross-account identity conflict, expiry/closed-state denial, minimized audit, and explicit separation from provider organization relationship and response capability.
- 2026-08-18: Added recipient-safe known-provider invitation preview as a public body-token operation with delivered/opened gating, a minimized limited snapshot, masked recipient hint, explicit withheld categories, one-time application-open audit, false identity/organization/capability flags, pending denial, status-only terminal links, and PostgreSQL coverage.
- 2026-08-18: Added verified-recipient invitation block/report with mailbox-matched body tokens, explicit block affirmation, controlled safety categories, minimized restricted case descriptions, S1/S2 Trust & Safety routing, idempotent replay, durable suppression, separated audit data, outage handling, and an owner/provider invitation API contract.
- 2026-08-18: Added verified-recipient known-provider invitation opt-out with a protected body-token endpoint, invited-mailbox matching, hashed lookup, terminal transition, durable future suppression, idempotent replay, minimized audit, outage handling, and cross-email rejection.
- 2026-08-18: Added the internal known-provider delivery lifecycle with delivered/failed outcome mapping, stale-attempt rejection, retry token rotation and hashing, per-attempt idempotency, durable batched expiry, pending-attempt closure, lifecycle audit, and PostgreSQL coverage while keeping delivery callbacks private until authenticated integration exists.
- 2026-08-18: Added verified-owner known-provider invitation APIs for validated create, replay, list, detail, and idempotent revoke behavior; kept tokens out of JSON, distinguished conflict/suppression/outage outcomes, and atomically suppressed pending delivery when owners withdraw.
- 2026-08-18: Began production Yard Owner Phase 3 with recipient-specific known-provider invitation persistence, server-derived limited disclosure snapshots, hashed bearer tokens, replay-safe idempotency, live-recipient duplicate and suppression boundaries, pending delivery attempts, expiry projection, minimized audit events, and PostgreSQL owner-isolation coverage without claiming email delivery.
- 2026-08-17: Completed repository-level professional assurance for Yard Owner acquisition, remediating question/decline, history, receipt, directory-consent, zero-photo, trust-language, session, focus, forced-colors, and resilience defects; added eight-viewport assurance validation, human usability/AT/device protocols, an operational pilot runbook, and five production Phase 3 implementation slices while retaining external signoffs as unsigned.
- 2026-08-17: Completed the Yard Owner acquisition V2 known-provider connection design with recipient-specific provider entry, separate email/organization/response authority, preliminary questions and bounded interest/decline/report actions, delivered/opened/failed/expired/declined/opt-out/revoked recovery, connection support, fully affirmative disclosure, versioned access receipts, responsive validation, reciprocal Yard Crew entry, gallery references, and production Phase 3 handoff.
- 2026-08-16: Completed private Yard Owner intake with owner-scoped guided photographs independent of provider jobs, ready-brief gating, upload and processing lifecycle, safe preview/replacement/deletion controls, hashed storage scope, verified-owner API isolation, responsive React recovery, and persistence/browser coverage.
- 2026-08-16: Delivered versioned private Yard Owner briefs with self-scoped persistence and API access, immutable revision history, minimized audit data, draft/ready validation, production React editing and recovery, and browser isolation coverage.
- 2026-08-16: Completed the Yard Crew acquisition V3 extension phases with preview-before-send first-service communication, delivery recovery and receipt, capability-based team authority and invitation lifecycle, capacity-aware saved opportunity alerts, known-owner pilot governance, responsive validation, and gallery references.
- 2026-08-15: Unified all working prototypes and the design gallery on one validated visual foundation for canonical color, typography roles, wordmark, review banners, navigation materials, controls, surfaces, and focus while preserving distinct public, acquisition-progress, and authenticated-destination navigation models.
- 2026-08-15: Completed the Yard Crew acquisition professional V2 review and implemented grouped lifecycle navigation, explicit readiness and capacity, richer privacy-safe opportunity facts, owner-response tracking, structured site assessment, and a provider-private production basis beside the owner proposal.
- 2026-08-15: Softened the Yard Crew acquisition voice from policy-heavy language to a warm, direct account-manager tone while preserving service opportunity, site assessment, scope of work, service cadence, proposal, crew assignment, work-order, credential, privacy, and safety distinctions.
- 2026-08-14: Applied a professional landscape-industry language system to Yard Crew acquisition, replacing generic marketplace terms with provider qualification, service opportunity, preliminary service brief, site assessment, scope of work, service proposal, mobilization, and work-order language while preserving plain-language accessibility and precise credential and specialty-service boundaries.
- 2026-08-14: Completed the validated Yard Crew acquisition working design for solo owner-operators, provider companies, and invited workers, spanning evidence-based marketing, provider readiness, owner-approved opportunity discovery, privacy-preserving disclosure, yard assessment, proposal and revision, accepted-but-unassigned handoff, first-visit confirmation, contextual support, responsive references, browser validation, and production handoff.
- 2026-08-12: Added the responsive production Yard Owner entry at `/app/yard-owner` with a direct public owner action, verified-email gating, private profile/property setup, address-change reconfirmation, authority attestation, explicit privacy boundaries, reload recovery, and mobile/desktop browser coverage.
- 2026-08-12: Added verified-identity Yard Owner self-service APIs that derive owner scope from authentication, require no provider role, validate property authority and structured addresses, and distinguish missing, duplicate, invalid, and unavailable outcomes.
- 2026-08-12: Added the production Yard Owner acquisition persistence foundation with authenticated-subject workspaces, private pre-provider properties outside organization tenants, per-owner address duplicate protection, minimized lifecycle audit events, fail-closed repository outcomes, and PostgreSQL isolation coverage.
- 2026-08-12: Completed the professional Yard Owner acquisition workflow, content, and accessibility review with explicit email verification, affirmative consent defaults, stale-address invalidation, accessible field errors and semantic progress, functional provider filtering and no-result guidance, directory-to-assessment continuity, neutral proposals with annualized cost language, and confirmed access-reducing actions.
- 2026-08-12: Completed the validated Yard Owner acquisition working design spanning private identity and property setup, guided yard briefs and optional photographs, known-provider invitations, curated provider discovery, per-provider disclosure, assessment, proposal comparison and recoverable decisions, explicit activation, relationship controls, gallery references, responsive browser validation, and production handoff.
- 2026-08-12: Defined the phased Yard Owner entry and provider-connection strategy covering independent owner identity, private address and guided photo intake, yard briefs, known-provider invitations, provider assessment and versioned proposals, relationship activation, curated discovery, privacy and trust controls, marketplace governance, and production acceptance gates.
- 2026-08-11: Completed the Yard Owner V2 working design with service-day lifecycle states, contextual questions, concern recovery, accessible proof comparison and feedback, recommendation collaboration and history, notification/access preferences, product-gated billing boundaries, expanded browser validation, V2 references, gallery entry, and production handoff.
- 2026-08-10: Completed the validated Yard Owner portal working design with responsive Home, Visits, Proof, and Account journeys; property-wide context; next-service confidence; delivered evidence; contextual bid recovery; customer-safe states; reference images; and production handoff.
- 2026-08-10: Exposed the live design gallery at the local development server's `/design/` path for remote VPN review without bundling design documents into production.
- 2026-08-08: Established the phased working-design delivery plan and seven-gate completion standard for the remaining current application.
- 2026-08-08: Completed a validated responsive V2 working homepage design with audience continuity, interactive Plan-Care-Proof workflow, capability credibility, conversion recovery and success states, review images, and implementation handoff.
- 2026-08-08: Added a professional V1 visual foundation, original Southwestern hero imagery, and high-fidelity homepage, crew route, and manager schedule concepts.
- 2026-08-07: Added a design-first review workspace with twenty deterministic SVG wireframes covering public, access, field, manager, customer, revenue, homeowner, and multi-vendor experiences.
- 2026-07-22: Added a mobile manager operational exception queue with persisted filters, creation, assignment, and lifecycle recovery controls.
- 2026-07-21: Added tenant-guarded operational exception assignment, start, resolution, and reopen transitions with optimistic conflicts and atomic lifecycle audits.
- 2026-07-21: Added tenant-scoped operational exception persistence, filtering, creation APIs, and atomic audit history.
- 2026-07-21: Added organization-invitation deliveries to unified manager notification history and recovery filters.
- 2026-07-21: Distinguished manually resolved notification failures from provider- and preference-skipped deliveries.
- 2026-07-21: Recovered actor-scoped offline job, checklist, and photo queues without requiring a fresh jobs response.
- 2026-07-21: Recovered actor-scoped stop-progress and route-amendment queues without requiring a fresh day-plan response.
- 2026-07-20: Added SupportAdmin conversion reporting with funnel, persona, campaign, failure, low-volume, and overdue-follow-up signals.
- 2026-07-20: Redesigned persona outcomes as a cohesive benefit narrative with contextual explanations instead of placeholder numbered blocks.
- 2026-07-20: Added a SupportAdmin-only platform lead inbox with assignment, follow-up scheduling, qualification states, and durable workflow history.
- 2026-07-20: Hardened marketing analytics startup for iPhone HTTP access and storage-restricted privacy modes so measurement cannot block page rendering.
- 2026-07-20: Added privacy-limited first-party marketing funnel measurement with durable event capture and no third-party tracker.
- 2026-07-20: Added an interactive persona-aware product tour and capability-backed credibility section without unverified customer claims.
- 2026-07-20: Added persona campaign landing paths with first-screen personalization, canonical search/social metadata, and crawler controls.
- 2026-07-20: Added persona-specific marketing conversion flows with consent, attribution, spam filtering, and durable production lead capture.
- 2026-07-20: Added an API-independent public persona-selectable Grover homepage with product narrative, preview, outcomes, and direct workspace routing.
- 2026-07-20: Added auditable photo-erasure recovery events and isolated durable photo recovery integration coverage.
- 2026-07-20: Aligned day-plan, amendment, and bid readiness tests with explicit persistence result contracts.
- 2026-07-20: Restored the full 160-test Rust library readiness suite after persistence contract hardening.
- 2026-07-20: Made photo-erasure redaction and durable object-deletion recovery transactional.
- 2026-07-20: Added Docker health checks and watchdog-driven frontend/backend runtime recovery.
- 2026-07-20: Failed sensitive job-account reads closed when account-view auditing fails.
- 2026-07-20: Failed principal access summaries closed when persisted login auditing fails.
- 2026-07-20: Distinguished missing route-stop mutation targets from capacity and lifecycle conflicts.
- 2026-07-20: Distinguished missing route draft targets from scheduling lifecycle conflicts.
- 2026-07-20: Distinguished missing amendment reviews from changed-request conflicts.
- 2026-07-20: Failed photo completion closed when required processing recovery work cannot be persisted.
- 2026-07-20: Distinguished unavailable property-onboarding reads and writes from missing profiles and conflicts.
- 2026-07-20: Failed completion-report assembly closed when assigned-route context is unavailable.
- 2026-07-20: Distinguished unavailable crew creation and updates from duplicate or missing crews.
- 2026-07-20: Distinguished unavailable dispatch crew, branch, and territory collections from valid empty setup.
- 2026-07-20: Made photo worker completion and failure writes report persistence outages explicitly.
- 2026-07-20: Distinguished unavailable photo worker claims from valid empty processing queues.
- 2026-07-20: Distinguished unavailable photo-upload creation and completion from accepted or missing uploads.
- 2026-07-20: Failed completion-report persistence and delivered-snapshot writes closed on storage errors.
- 2026-07-20: Distinguished unavailable shared completion reports and property report history from missing or empty results.
- 2026-07-20: Distinguished unavailable job lifecycle and checklist writes from missing records.
- 2026-07-20: Removed seeded-owner fallback from persisted active-membership and principal-access outages.
- 2026-07-20: Distinguished unavailable membership role, status, and profile writes from membership conflicts.
- 2026-07-20: Distinguished unavailable invitation lifecycle writes from invalid and conflicting invitations.
- 2026-07-20: Distinguished unavailable organization profile updates from invalid or missing organizations.
- 2026-07-20: Distinguished unavailable organization profile and first-owner setup reads from missing organizations.
- 2026-07-20: Distinguished unavailable team-administration and operational activity from valid empty audit history.
- 2026-07-20: Distinguished unavailable organization membership and invitation collections from valid empty lists.
- 2026-07-20: Distinguished unavailable property-portfolio writes from business conflicts.
- 2026-07-20: Distinguished unavailable property-crew assignment writes from invalid targets.
- 2026-07-20: Distinguished unavailable shared-bid storage from missing links and customer decision conflicts.
- 2026-07-20: Distinguished unavailable bid revocation and conversion from lifecycle conflicts.
- 2026-07-20: Failed project-bid draft creation closed when persisted storage is unavailable.
- 2026-07-20: Distinguished unavailable project-bid lists from valid empty bid history.
- 2026-07-20: Distinguished unavailable property-crew assignment lists from valid unassigned state.
- 2026-07-20: Distinguished unavailable property-portfolio reads from valid empty grouping.
- 2026-07-20: Distinguished unavailable customer-account creates and updates from missing records.
- 2026-07-19: Distinguished unavailable onboarding progress and property readiness from missing customer data.
- 2026-07-19: Distinguished unavailable customer-property lists from valid accounts with no properties.
- 2026-07-19: Distinguished unavailable active and archived customer-account lists from valid empty onboarding data.
- 2026-07-19: Loaded job billing and approval summaries from PostgreSQL and failed persisted completion reports closed.
- 2026-07-19: Scoped saved-review undo controls to the active session.
- 2026-07-19: Persisted undone saved activity reviews across reload.
- 2026-07-19: Added session undo for cleared saved activity reviews.
- 2026-07-19: Cleared saved activity reviews directly from restoration feedback.
- 2026-07-19: Verified non-destructive dismissal of saved-review feedback.
- 2026-07-19: Announced saved activity review restoration after reload.
- 2026-07-19: Persisted summary-driven newest-first activity ordering.
- 2026-07-19: Added one-tap newest-first restoration to activity summaries.
- 2026-07-19: Identified oldest-first ordering in activity review summaries.
- 2026-07-19: Verified restored recovery-review filter counts.
- 2026-07-19: Preserved complete owner review state after audit recovery.
- 2026-07-19: Returned recovered audits to full focused crew history.
- 2026-07-19: Added same-ID retry after transient audit recovery failure.
- 2026-07-19: Added actionable failure guidance to immutable-ID audit recovery.
- 2026-07-19: Confirmed successful immutable-ID audit recovery.
- 2026-07-19: Added audit-ID recovery for restored events outside loaded history.
- 2026-07-19: Cleared restored audit markers when refreshed results omit them.
- 2026-07-19: Preserved restored audit markers across same-review reloads.
- 2026-07-19: Scoped restored audit-row markers to their activity review.
- 2026-07-19: Visually identified audit rows restored after crew inspection.
- 2026-07-19: Returned focus to restored audit rows after message dismissal.
- 2026-07-19: Announced exact audit-row restoration after crew inspection.
- 2026-07-19: Returned crew inspections to their exact owner activity row.
- 2026-07-19: Added one-tap return to the latest move after focused pagination.
- 2026-07-19: Kept the semantic latest-move marker stable across pagination.
- 2026-07-19: Proved cursor-overlap deduplication in focused crew history.
- 2026-07-19: Confirmed complete focused crew move history after pagination.
- 2026-07-19: Flagged potentially older moves in focused crew history.
- 2026-07-19: Counted loaded moves in focused crew history.
- 2026-07-19: Announced focused latest-move review to assistive technology.
- 2026-07-19: Added non-destructive dismissal for restored-review feedback.
- 2026-07-19: Confirmed restored owner reviews after focused crew history.
- 2026-07-19: Restored prior owner activity review after focused crew history.
- 2026-07-19: Added a dedicated exit from focused crew move history.
- 2026-07-19: Preserved focused latest-move review across crew inspection.
- 2026-07-19: Compared latest crew moves with current hierarchy assignments.
- 2026-07-19: Highlighted the latest move in focused crew activity review.
- 2026-07-19: Linked stale crew inspections to their latest hierarchy activity.
- 2026-07-19: Included current crew hierarchy in stale-audit support handoffs.
- 2026-07-19: Added current hierarchy context to stale crew-move inspections.
- 2026-07-19: Flagged subsequent crew moves during audited hierarchy inspection.
- 2026-07-19: Added downloadable crew-move support summaries.
- 2026-07-19: Added native sharing with copy fallback for crew-move support.
- 2026-07-19: Added readable crew-move support summary copy.
- 2026-07-19: Added audit ID copy and mobile fallback to crew inspection.
- 2026-07-19: Added audit identity and timestamp to crew inspection context.
- 2026-07-19: Kept audited crew move context visible during crew inspection.
- 2026-07-19: Added focused return from crew inspection to owner activity.
- 2026-07-19: Linked crew hierarchy activity to affected crew administration.
- 2026-07-19: Added removable mobile chips for directional crew-move review.
- 2026-07-19: Restored directional crew-move review across mobile reloads.
- 2026-07-19: Added directional source and destination crew-move filtering.
- 2026-07-19: Added one-tap reset for persisted owner activity review state.
- 2026-07-19: Restored owner activity ordering with crew-move review state.
- 2026-07-19: Restored owner crew-move review filters across mobile reloads.
- 2026-07-19: Turned crew move summaries into one-tap owner activity filters.
- 2026-07-19: Summarized loaded owner activity by crew move scope.
- 2026-07-19: Added paginated owner activity filtering by crew move scope.
- 2026-07-19: Classified crew hierarchy activity by move scope.
- 2026-07-19: Added readable crew move paths to owner activity and CSV exports.
- 2026-07-19: Added non-polluting mobile smoke coverage for territory staffing.
- 2026-07-19: Linked completed crew moves back to refreshed hierarchy review.
- 2026-07-19: Closed prepared crew handoffs with durable move confirmation.
- 2026-07-19: Added source, destination, and cross-branch impact to crew move review.
- 2026-07-19: Prioritized same-branch crews in territory staffing choices.
- 2026-07-19: Added bounded hierarchy-aware search to territory crew choices.
- 2026-07-19: Added contextual active crew choices to each unstaffed territory.
- 2026-07-19: Added review and reset controls for prepared crew destinations.
- 2026-07-19: Carried unstaffed territory context into crew administration.
- 2026-07-19: Added contextual active crew choices to unstaffed hierarchy review.
- 2026-07-19: Linked active unstaffed hierarchy review to crew administration.
- 2026-07-19: Added active unstaffed hierarchy counts and quick filtering.
- 2026-07-19: Added staffed and unstaffed dispatch hierarchy filtering.
- 2026-07-19: Added assigned crew counts to branch and territory lifecycle records.
- 2026-07-19: Extended live hierarchy smoke through filter restoration and clearing.
- 2026-07-19: Restored owner hierarchy filters across mobile reloads.
- 2026-07-19: Added lifecycle status filters and clearing to hierarchy search.
- 2026-07-19: Added mobile search across branch and territory lifecycle lists.
- 2026-07-19: Added active and inactive dispatch hierarchy summary counts.
- 2026-07-19: Surfaced readable dispatch hierarchy events in owner activity.
- 2026-07-19: Added live mobile smoke coverage for dispatch hierarchy safety.
- 2026-07-19: Added guarded audited lifecycle controls for dispatch hierarchy.
- 2026-07-19: Added audited mobile branch and territory assignment for existing crews.
- 2026-07-19: Added mobile owner controls for creating dispatch branches and territories.
- 2026-07-19: Added tenant-scoped crew daily capacity and eligible crew-lead assignment controls.
- 2026-07-19: Applied crew-specific daily capacity snapshots to new draft route guards.
- 2026-07-19: Added crew capacity and leadership readiness to manager route selection.
- 2026-07-19: Added persisted customer contacts to onboarding readiness and repaired property lifecycle audit constraints.
- 2026-07-19: Added account email/SMS opt-ins and validated quiet-hour preferences.
- 2026-07-19: Enforced account channel, recipient, and quiet-hour preferences for report and bid deliveries.
- 2026-07-19: Added manager guidance for customer deliveries blocked by account preferences.
- 2026-07-19: Connected persisted customer notification events to manager activity history.
- 2026-07-19: Connected tenant-scoped route and report events to manager activity history.
- 2026-07-19: Added persisted bid and photo recovery events to manager activity history.
- 2026-07-19: Replaced demo manager activity seeds with persisted operational history.
- 2026-07-19: Added filtered cursor pagination for persisted operational activity.
- 2026-07-19: Added actor-attributed transactional audit events for schedule mutations.
- 2026-07-19: Added structured route mutation metadata to operational activity.
- 2026-07-19: Added readable organization-member identities to operational activity.
- 2026-07-19: Added audited owner-managed display names for organization members.
- 2026-07-19: Used readable member names in crew leadership and owner activity views.
- 2026-07-19: Added mobile team member search and role/status filters.
- 2026-07-19: Added actor and event filters to mobile owner activity.
- 2026-07-19: Added bounded pagination for persisted owner team activity.
- 2026-07-19: Applied owner team event filters across persisted history.
- 2026-07-19: Applied debounced owner actor search across persisted history.
- 2026-07-19: Added persisted affected-member and crew search to owner activity.
- 2026-07-19: Added active-filter summaries and clearing to mobile team administration.
- 2026-07-19: Added mobile team composition summary counts.
- 2026-07-19: Added mobile owner activity category summary counts.
- 2026-07-19: Added CSV export for filtered owner team activity.
- 2026-07-19: Added CSV export for the filtered owner member directory.
- 2026-07-19: Added name, role, and status sorting to mobile member administration.
- 2026-07-19: Added newest/oldest sorting to owner team activity.
- 2026-07-19: Added exact local timestamps to owner team activity.
- 2026-07-19: Added expandable immutable IDs to owner team activity.
- 2026-07-19: Added mobile copy controls for team activity IDs.
- 2026-07-19: Added mobile copy controls for member identities.
- 2026-07-19: Added expandable membership record IDs to mobile team administration.
- 2026-07-19: Added membership record IDs to team-directory CSV exports.
- 2026-07-19: Added audit event IDs to owner activity CSV exports.
- 2026-07-19: Added expandable, copyable audit event IDs to mobile activity.
- 2026-07-19: Added persisted audit event ID search to owner team activity.
- 2026-07-19: Split frontend framework and authentication vendor bundles for faster phone startup.
- 2026-07-19: Lazy-loaded public review, invitation, and authenticated dashboard routes.
- 2026-07-19: Deferred OIDC and authenticated dashboard code on public customer links.
- 2026-07-19: Added recoverable lazy-route failure UI for weak mobile connections.
- 2026-07-19: Added global mobile offline-state feedback.
- 2026-07-19: Added mobile network-recovery confirmation.
- 2026-07-19: Added global mobile API-readiness feedback and automatic retry.
- 2026-07-19: Added mobile API-recovery confirmation.
- 2026-07-19: Paused mobile API readiness checks while tabs are hidden.
- 2026-07-19: Added a manual mobile API readiness retry action.
- 2026-07-19: Added a production service worker for resilient mobile shell loading.
- 2026-07-19: Added controlled production service-worker update prompts.
- 2026-07-19: Added Android installation prompts and iPhone home-screen guidance.
- 2026-07-19: Added a public mobile connectivity and install-state diagnostics page.
- 2026-07-19: Added live mobile diagnostics and token-safe support-detail copying.
- 2026-07-19: Added native phone sharing for sanitized mobile diagnostics.
- 2026-07-19: Added downloadable sanitized mobile diagnostic reports.
- 2026-07-19: Added capability-specific mobile diagnostics recovery guidance.
- 2026-07-19: Added API readiness latency to mobile diagnostics and support reports.
- 2026-07-19: Added the Phase 2 IndexedDB offline mutation queue foundation.
- 2026-07-19: Queued failed stop-progress writes with durable mobile pending feedback.
- 2026-07-19: Added ordered tenant/actor-scoped replay for queued stop progress.
- 2026-07-19: Classified offline stop-progress conflicts separately from retryable failures.
- 2026-07-19: Added crew-readable offline stop-progress queue review.
- 2026-07-19: Added reviewed-conflict discard and ordered replay resumption.
- 2026-07-19: Bound offline progress tenancy to the loaded crew day plan.
- 2026-07-19: Added transactional server idempotency for offline stop-progress replay.
- 2026-07-19: Added mobile offline queue age and retry-state summaries.
- 2026-07-19: Added explicit durable-storage failure guidance for mobile field work.
- 2026-07-19: Requested persistent browser storage for durable field mutations.
- 2026-07-19: Extended the offline queue contract to job start and completion actions.
- 2026-07-19: Queued failed job lifecycle actions with durable mobile feedback.
- 2026-07-19: Added ordered idempotent replay for offline job lifecycle actions.
- 2026-07-19: Added crew job queue review and reviewed-conflict recovery.
- 2026-07-19: Extended the offline queue contract to checklist item mutations.
- 2026-07-19: Added persisted checklist controls with durable offline queue fallback.
- 2026-07-19: Added ordered idempotent replay for offline checklist mutations.
- 2026-07-19: Added crew checklist queue review and reviewed-conflict recovery.
- 2026-07-19: Defined secure IndexedDB boundaries for offline photo capture and replay.
- 2026-07-19: Added atomic IndexedDB metadata/blob storage for offline photos.
- 2026-07-19: Queued failed photo captures with durable blob feedback and local previews.
- 2026-07-19: Added deterministic ordered replay for queued offline photo captures.
- 2026-07-19: Added crew photo queue review and reviewed-conflict recovery.
- 2026-07-19: Added browser-compatible offline photo persistence and replay coverage.
- 2026-07-19: Added client photo quality checks and required before/after completion evidence.
- 2026-07-19: Added server-owned completion-report readiness blocker context.
- 2026-07-19: Added route-stop and unfinished add-on context to report readiness.
- 2026-07-19: Fixed Docker API routing and local CORS for Tailscale phone access.
- 2026-07-19: Added a passing Tailscale mobile interruption-and-recovery smoke test.
- 2026-07-19: Fixed cross-origin API preflight and HTTP-origin offline UUID generation.
- 2026-07-19: Extended the offline queue contract to day-plan amendment requests.
- 2026-07-19: Queued failed day-plan amendments with durable field feedback.
- 2026-07-19: Added ordered idempotent replay for offline day-plan amendments.
- 2026-07-19: Added crew amendment queue review and reviewed-conflict recovery.
- 2026-07-19: Extended the mobile recovery smoke to offline route amendments.
- 2026-07-19: Added persisted organization and crew filtering to the manager completion-report API.
- 2026-07-19: Connected manager organization and crew filters to persisted report loading.
- 2026-07-19: Added persisted customer, property, and scheduled-date manager report controls.
- 2026-07-19: Expanded report blocker filtering to add-on and route-stop readiness.
- 2026-07-19: Connected report lifecycle, readiness, and blocker controls to persisted loading.
- 2026-07-19: Added persisted report-filter summaries and one-action clearing.
- 2026-07-19: Restored manager report filters across mobile browser reloads.
- 2026-07-19: Added a live mobile smoke test for persisted manager report filtering.
- 2026-07-19: Added actionable report-blocker recovery guidance to the manager queue.
- 2026-07-19: Added a manager day-level crew workload and unassigned-work dispatch view.
- 2026-07-19: Added audited tenant-scoped scheduled-job reassignment.
- 2026-07-19: Connected scheduled-job move controls to the manager dispatch view.
- 2026-07-19: Added destination capacity impact and overload guards to dispatch moves.
- 2026-07-19: Enforced destination crew capacity transactionally during reassignment.
- 2026-07-19: Added source workload and customer-continuity impact to dispatch review.
- 2026-07-19: Audited explicit customer-notification intent for dispatch date changes.
- 2026-07-19: Surfaced dispatch moves and required customer follow-up in manager activity.
- 2026-07-19: Added a live mobile dispatch-move and customer-follow-up smoke test.
- 2026-07-19: Added audited completion for dispatch customer-notification follow-up.
- 2026-07-19: Connected dispatch notification completion to manager operational activity.
- 2026-07-19: Extended live mobile dispatch coverage through customer follow-up completion.
- 2026-07-19: Added tenant-safe branch and service-territory hierarchy foundations.
- 2026-07-19: Exposed crew branch and territory context in APIs and dispatch workload.
- 2026-07-19: Added protected tenant-scoped branch and territory discovery APIs.
- 2026-07-19: Added readable branch and territory filters to manager dispatch.
- 2026-07-19: Added audited owner-managed branch creation.
- 2026-07-19: Added audited owner-managed service territory creation.

The project did not use formal product version numbers during its initial
development. The entries below establish a milestone history from the repository's
delivery plan and commit history. Future deployable releases should add an explicit
version and release date.

## Unreleased — Pilot Readiness

- Tenant-scoped jobs, accounts, properties, portfolios, reports, bids,
  notifications, and recovery endpoints now fail closed when active-membership
  storage is unavailable while preserving legitimate empty membership scopes.
- Specific-resource tenant authorization now reports unavailable membership
  verification separately from genuine cross-organization or role-based denial.
- Added one-step mobile customer-account creation with validated primary contact,
  communication destination, and explicit notification consent.
- Added customer-account search across customer, contact, and property details,
  composed with onboarding status filters.
- Added duplicate-account warnings with direct existing-account review and an
  explicit separate-account continuation.
- Added audited tenant-scoped customer-account archival with current-property and
  unfinished-work safeguards.
- Added a separate archived-account review with tenant-scoped, audited two-step
  reactivation.
- Added persisted direct-owner, property-manager, and service-provider relationship
  types to customer-account creation and mobile summaries.
- Added tenant-scoped, audited relationship changes with two-step mobile impact
  confirmation and persisted classification across account lifecycle changes.
- Added organization-scoped customer relationship filters with active counts,
  composable onboarding search, and mobile reload persistence.
- Added filtered customer-onboarding CSV reviews with relationship, contact,
  property, activation, and attention readiness fields.

Current continuation work:

- PostgreSQL-backed crew route reads now return explicit missing or unavailable
  results instead of silently substituting seeded day plans, and the mobile route
  panel presents those states without demo stops.
- PostgreSQL-backed route-stop assignment, removal, and ordering now return
  explicit failure responses, while manager scheduling preserves the last synced
  route and offers retry guidance.
- PostgreSQL-backed draft creation and publication now return explicit failure
  responses; rejected creates no longer manufacture local drafts, failed publishes
  retain their synced draft, and new route stops receive publish-ready estimates.
- PostgreSQL-backed stop-progress writes now distinguish missing and unavailable
  persisted targets from no-database demo fallback, and first-attempt conflicts
  enter the durable manager-review queue immediately.
- PostgreSQL-backed route-request creation and manager review now return explicit
  failure responses, while idempotent replay still recovers saved requests and
  first-attempt conflicts enter durable review immediately.
- PostgreSQL-backed amendment-list failures now return an unavailable response
  instead of presenting an empty manager review queue; demo mode retains its
  intentionally empty queue.
- PostgreSQL-backed crew and day-plan ownership lookup failures now fail closed
  with an unavailable response instead of authorizing through seeded tenant IDs.
- PostgreSQL-backed job and completion-report ownership lookup failures now fail
  closed, and API-denied job detail remains hidden instead of using seeded detail.
- PostgreSQL-backed job list and detail failures now return explicit responses
  instead of seeded field work, and completion-report construction propagates
  unavailable job reads.
- PostgreSQL-backed job add-on failures now return an unavailable response
  instead of an empty list, and completion-report construction propagates them.
- PostgreSQL-backed photo-evidence failures now return an unavailable response
  instead of empty proof, and completion reports stop until evidence can be read.
- New day-plan drafts snapshot organization timezone, service-area, and daily stop-capacity defaults.
- Draft route planning now blocks stop assignments at the plan's snapshotted capacity.
- First-owner setup now reports persisted organization, crew, published-route, and team-invitation completion milestones.
- The mobile first-owner workspace now recommends the next incomplete launch action.
- First-owner launch progress now refreshes automatically after related manager actions.
- Organization owners can now create tenant-scoped crews from the mobile first-user workflow.
- Manager day-plan creation now selects from authorized tenant crews instead of a free-form crew ID.
- Owners can rename, deactivate, and reactivate crews with operational-work guards and audit events.
- Owner activity history now includes crew profile and lifecycle changes.
- Provision and validate the first production Cognito owner identity.
- Finish tenant-aware boundaries for remaining shared customer reads.
- Configure and validate the production email/SMS provider.
- Connect manager activity history to persisted events.
- Expand customer account onboarding and first-user administration.
- Continue replacing seeded or browser-only route behavior with persisted state.
- Complete authenticated customer-scoped bid history.
- Manager property onboarding now loads, validates, and saves operational profiles
  through the persisted API with explicit local-fallback feedback.
- First-owner onboarding can bootstrap a persisted organization and owner membership
  from the signed-in Cognito subject, then presents the first-route setup sequence.
- Customer-account onboarding can create and list organization-scoped accounts,
  with explicit organization relationships and manager-visible billing state.
- Managers can edit tenant-scoped customer account billing, payment, service
  approval, service-frequency, and notes fields.
- Local mobile review can start the seeded API and Vite frontend on a detected
  Tailscale address without requiring Docker or PostgreSQL.
- The dashboard now prioritizes route, assigned jobs, and job actions on phones,
  with manager tools collapsed into a separate workspace and touch-safe controls.
- A sticky phone navigation bar links the core workflow sections, and opening a
  job moves directly to its detail and field actions on narrow viewports.
- Mobile application metadata now supports standalone home-screen presentation,
  portrait orientation, safe-area viewports, and Grover Field branding.
- Mobile route cards now keep stop progress prominent while route changes,
  request history, and extra-service controls remain available on demand.
- Mobile job detail now presents lifecycle actions first and condenses the
  read-only checklist into an expandable completion summary.
- Customer accounts now own explicit persisted property records through
  tenant-scoped list and create APIs, independently of jobs and crew assignment.
- Manager account onboarding can list and create properties inline, then pass new
  properties directly into the operational onboarding workflow.
- Reloaded persisted properties also repopulate the operational onboarding
  selector, preserving the account-to-property workflow across sessions.
- Persisted operational onboarding now rejects mismatched or archived property
  ownership and does not return local fallback records from PostgreSQL runtimes.
- Portfolio reads now use explicit customer properties, while portfolio creation
  and links enforce active organization/account and same-account ownership.
- Manager property setup can create portfolios, group properties, and assign
  tenant-scoped crews as separate operations.
- Portfolio management remains usable for property managers when their role does
  not allow crew assignment.
- Manager property setup now shows each yard's current persisted portfolio and
  updates portfolio membership counts immediately after regrouping.
- Added audited property archive/reactivation controls; archiving atomically ends
  active crew service and removes the yard from operational onboarding choices.
- Added mobile property name/address editing with audited tenant boundaries and a
  case-insensitive duplicate identity constraint.
- Guarded first property activation on an active operational profile plus crew
  assignment, with distinct activation and reactivation audit events.
- Added a role-safe activation readiness endpoint and mobile checklist for
  operational-profile and crew prerequisites.
- Added account-level onboarding progress across service details, current
  properties, service readiness, and activation, with live mobile card refresh.
- Added mobile account filters for all, incomplete, and completed onboarding work.
- Added property-level onboarding attention reasons and mobile action labels for
  incomplete profiles, missing crews, blocked yards, and pending activation.
- Linked each property attention action to the matching mobile workspace while
  preserving the affected property selection.
- Added a mobile customer-detail readiness action that opens and focuses the
  affected account editor.
- Added a missing-property progress action that opens the affected account's
  property form and closes it after successful creation.
- Added a mobile team-invitation workflow with organization-scoped roles, queued
  delivery feedback, and local pilot-token visibility.
- Linked the first-owner readiness checklist to property, crew, route-planning,
  and team-administration workspaces.
- Added an owner-only invitation history endpoint and mobile pending-access list
  that omits invitation tokens and stays scoped to the active organization.
- Added guarded pending-invitation revocation with mobile confirmation, atomic
  membership archival, and a tenant-scoped audit event.
- Added active and suspended membership visibility plus two-step mobile role
  administration with a repository-enforced last-owner invariant.
- Added audited membership suspension and reactivation with two-step mobile
  confirmation and the same repository-enforced last-owner invariant.
- Added an owner-only recent team-access activity feed and a fresh-database
  migration for invitation and membership lifecycle audit event kinds.
- Added an authenticated recipient invitation page, safe post-sign-in return
  paths, explicit acceptance feedback, and notification acceptance paths.
- Merged active membership roles into request authorization after token
  verification and added refreshed role-aware workspace guidance.
- Added finite 7-, 14-, and 30-day mobile invitation windows, strict UTC
  expiration validation, effective expired-state visibility, and acceptance and
  revocation guards after expiration.
- Added guarded mobile reissue for expired and revoked invitations with a fresh
  token, queued delivery, restored invited membership, and tenant-scoped audit.
- Prevented concurrent, case-variant duplicate pending invitations per tenant and
  recipient, and added mobile guidance to existing history and reissue controls.
- Added latest invitation-email delivery status and attempt counts to owner
  history, with concise mobile failed-delivery retry guidance.
- Added a two-step owner retry action that safely returns failed or dead-letter
  invitation email to the existing audited notification queue.
- Bound invitation acceptance to the authenticated token's normalized verified
  email, with non-disclosing mismatch responses and recipient sign-in guidance.
- Added verified-email readiness to current-user access and disabled mobile
  invitation activation early when Cognito identity claims are unavailable.
- Added tenant-guarded, audited organization profile reads and updates plus a
  mobile owner editor for company name and organization type.
- Extended organization profiles with normalized contact email, readable phone,
  and HTTP(S) website fields plus mobile-first editing and validation.
- Added owner-managed timezone, service-area label, and daily stop-capacity
  defaults with database constraints and mobile numeric controls.
- Added tenant-scoped member display-name editing to mobile owner administration,
  while retaining immutable identity IDs and auditing each update.
- Applied member display names to crew-lead choices and resolved readable actor
  and target labels in the owner team-administration feed.
- Nested customer-account routes are now explicitly protected, and crew
  assignment requires an existing non-archived property in the crew organization.

## 2026-07-17 — Photo Erasure Recovery

- Added durable jobs for photo object deletions that fail during privacy erasure.
- Added retry, backoff, and dead-letter foundations to the photo-processing worker.
- Added organization-scoped manager history, retry, and manual-resolution APIs.
- Added manager visibility and recovery controls for failed and dead-lettered
  deletion jobs.

## 2026-07-13 — Hosted Pilot and Privacy Foundations

- Added customer photo privacy export and retained-evidence erasure workflows.
- Added manager privacy and photo-processing recovery panels.
- Added S3 photo lifecycle infrastructure and server-side thumbnail processing.
- Added durable photo-processing retries and rejected-evidence quarantine.
- Expanded production smoke coverage and notification webhook validation.
- Added customer bid-history visibility in the portal preview.

## Earlier MVP Foundation

- Established the Rust/Axum API, React/Tailwind frontend, PostgreSQL migrations,
  Docker Compose development stack, and CI validation.
- Delivered crew job, route, stop-progress, checklist, photo, and completion-report
  foundations with browser fallback behavior.
- Delivered manager draft-route planning, publishing, amendments, project bids,
  report review, notification recovery, and activity-history foundations.
- Added Cognito authentication, organization membership, invitations, role gates,
  tenant-aware access checks, and audit events.
- Added customer-safe report and bid links, immutable delivered report snapshots,
  notification outbox processing, and approved-bid conversion into job add-ons.
- Added property portfolios, crew assignment history, onboarding-profile APIs, and
  customer portal previews.

## Versioning Convention Going Forward

Use semantic versions for deployable product releases:

- **Major (`X.0.0`)**: incompatible API/data-contract changes or a materially new
  product mode.
- **Minor (`0.X.0`)**: backward-compatible user-facing capability or substantial
  operational feature.
- **Patch (`0.0.X`)**: backward-compatible fixes, security hardening, and small
  operational improvements.

During the pilot, versions may remain below `1.0.0`. Every release entry should
include:

- Release date and deployment environment
- User-visible capabilities
- API or schema changes
- Migration and rollback notes
- Security, privacy, or tenant-boundary changes
- Known limitations and next follow-up work
