# Current Delivery Handoff

## Restart point

- Branch: `main`
- Current branch tip: use `git log -1`; this handoff tracks delivery state rather
  than pinning a pre-Phase-4 commit.
- Canonical status: [`../PLAN.md`](../PLAN.md), Yard Owner Phase 3E/4 entries only
- Active roadmap item: Yard Owner Phase 4 assessment lifecycle
- Phase 3D is complete in `98fcfc2`, `1d234d0`, `234ac7a`, and `3afae52`.
- Phase 3E0 hardening planning is complete in `73545a4`; Phase 3E1 retry-safe
  disclosure decisions, Phase 3E2 server authorization/concurrency regression,
  Phase 3E3 browser/accessibility automation, and Phase 3E4 minimized monitoring,
  runbook validation, and synthetic rehearsal are delivered. Repository-owned
  Phase 3E automation is complete; Phase 3E5 external assurance is launch-
  blocking.
- Phase 4A1 assessment persistence is delivered with provider authorization,
  exact replay, bounded remote/on-site states, owner isolation, and minimized
  audit. Phase 4A2a exposes verified-provider start and owner-scoped history
  APIs with route and outage coverage. Phase 4A2b lifecycle transitions and
  conversation/private-note separation are next.

Preserve the unrelated existing changes in `.gitignore`,
`frontend/e2e/mobile-offline-recovery.spec.ts`, `localdev/`, and `prompts/`.

## Read first

1. [`../docs/yard-owner-acquisition-production-plan.md`](../docs/yard-owner-acquisition-production-plan.md)
2. [`../docs/owner-provider-disclosure-grant-design.md`](../docs/owner-provider-disclosure-grant-design.md)
3. [`ROADMAP.md`](ROADMAP.md), only where it describes Yard Owner Phase 3E/4
4. [`../design/review/yard-owner-acquisition-professional-assurance.md`](../design/review/yard-owner-acquisition-professional-assurance.md)
5. [`../design/review/yard-owner-acquisition-human-validation-protocol.md`](../design/review/yard-owner-acquisition-human-validation-protocol.md)
6. [`../docs/yard-owner-acquisition-pilot-operations-runbook.md`](../docs/yard-owner-acquisition-pilot-operations-runbook.md)
7. [`../docs/yard-owner-acquisition-pilot-monitoring-contract.md`](../docs/yard-owner-acquisition-pilot-monitoring-contract.md)
8. [`../docs/yard-owner-acquisition-pilot-assurance.json`](../docs/yard-owner-acquisition-pilot-assurance.json)
9. [`../docs/owner-provider-assessment-design.md`](../docs/owner-provider-assessment-design.md)

## Delivered boundary

Phase 3D delivers provider-specific disclosure review, immutable receipts,
revocable current grants, category-filtered provider reads, owner history and
revocation, production owner/provider interfaces, and passing automated client,
frontend unit, type, production-build, and four-journey compatible-Chromium
validation. Phases 3E1–3E4 add retry/concurrency hardening, the four-project
browser matrix, minimized monitoring/alert contracts, machine-checked runbook
mappings, and synthetic rehearsal evidence.

Phase 4A1 authorizes only creation of a remote review or proposed on-site
assessment window after the current disclosure boundary is rechecked. It does
not authorize a proposal, pricing, service activation, scheduling, crew
assignment, a work order, or broader provider access. Preserve the existing
owner/property/provider/actor/mailbox/capability checks and default-withheld
privacy behavior throughout hardening.

## Next delivery work

Do not mark the pilot ready until Phase 3E5 live delivery/monitoring integration,
named staffing, human usability/assistive-technology/device work,
Privacy/Security review, and go/no-go are signed. The machine-readable assurance
manifest must continue to list those items as external or unsigned. Phase 4A2b
assessment lifecycle transitions and conversation separation are the next product-
development slice; it does not remove or bypass the Phase 3E5 pilot launch
blockers. Keep
[`../PLAN.md`](../PLAN.md) canonical when work resumes.

Automated evidence may cover regression suites, conflict and outage behavior,
cross-browser checks available in the environment, monitoring contracts,
runbook validation, and launch-rehearsal tooling. Do not label automated or
simulated results as signed human evidence.

Stop only where completion genuinely requires a person or unavailable external
infrastructure: real assistive-technology use, physical-device checks, privacy
and security approval, operational ownership/signature, vendor selection, or a
live pilot decision.
