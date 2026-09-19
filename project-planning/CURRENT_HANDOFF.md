# Current Delivery Handoff

This is the short restart document. Execution order lives in
[`DELIVERY_BOARD.md`](DELIVERY_BOARD.md); detailed delivery state lives in
[`../PLAN.md`](../PLAN.md).

## Restart point

- Branch: `main`
- Resolve the current commit with `git log -1 --oneline`; do not pin a stale hash
  here.
- Phase 6B8 is published and the latest main-branch CI gate passes.
- Private review is available at `http://100.88.21.105:5173/` through Tailscale.
- The private-review API reports PostgreSQL readiness and intentionally uses
  `AUTH_MODE=local_review`; it is not production evidence.
- The public Render readiness route currently returns `404`, so protected
  hosting is not deployed or healthy.
- Preserve unrelated local changes in `.gitignore`,
  `frontend/e2e/mobile-offline-recovery.spec.ts`, `localdev/`, and `prompts/`.

## Active and next work

### Delivered: F2 fast feedback orchestration

Branch-scoped CI concurrency now cancels superseded work. Run
`bash scripts/validate-changes.sh` to classify current changes and execute the
smallest complete local package gates; use `--dry-run` to inspect the choice.
The complete `main` gate remains unchanged, and its existing timing markers
remain the basis for future bottleneck work.

### Delivered: R1 release preflight

Run `bash scripts/release-preflight.sh --repository-only` for the repository
contract or the complete command from an operator shell. The repository checks
pass; the current environment reports seven external prerequisites and prints
only their names. The script distinguishes ready, external-only, and failed
outcomes with exit statuses 0, 2, and 1.

### Active: P1 operational exception activity integration

Add exception creation and lifecycle audits to manager activity with readable
actor/state/assignment/resolution context and a link back to the exact Recovery
item. Preserve tenant scoping, unknown-event fallback, and mobile handoff.

### Parallel external lane: R2 and R3

Protected provisioning requires resources that are unavailable in the current
environment:

- Render account access and a created/reconciled Blueprint plus private
  PostgreSQL database;
- AWS credentials and the production Terraform state/backend decision;
- a final HTTPS application URL;
- an approved first-owner email and a current hosted access token.

Once supplied through the owning systems, provision Cognito and Render, then run
readiness and authenticated smoke. Do not substitute CI or private-review
results for these gates.

## Current validation baseline

The latest published main gate includes:

- repository layout checks;
- zero-finding frontend high/critical dependency audit;
- TypeScript, all 484 frontend tests, and the production frontend build;
- all 122 SQLx migrations, Rust formatting, strict all-target/all-feature
  Clippy on Rust 1.98, and all 417 backend tests;
- Terraform formatting and development/production module validation;
- all 68 Chromium mobile/desktop, Firefox desktop, and WebKit mobile journeys;
- the Yard Owner assurance contract and its failure-policy tests; and
- the cached, unprivileged production image build.

WebKit reflow validation waits for the post-resize layout cycle while retaining
the exact no-horizontal-overflow condition. It passed ten consecutive focused
WebKit repetitions and the complete hosted browser matrix.

## Fast validation choices

Use the smallest gate that can disprove the current change, then widen before
the slice is committed:

| Change | Inner loop | Slice gate |
| --- | --- | --- |
| Frontend component/client | TypeScript and focused Vitest | All frontend tests and production build |
| Browser behavior/layout | Focused Playwright project/spec | Relevant browser matrix; full matrix on `main` |
| Backend logic/API | Rust format/check and focused target | Strict Clippy and all backend tests |
| Persistence/migration | Focused repository test | Fresh/repeat migration plus live PostgreSQL fixture |
| Terraform/deployment config | Format and module validate | Release preflight and production image |
| Documentation only | Link/status/diff checks | No unrelated package suite locally; full `main` gate remains authoritative |

## Read next

1. [`DELIVERY_BOARD.md`](DELIVERY_BOARD.md)
2. [`../docs/backend-build-performance.md`](../docs/backend-build-performance.md)
3. [`../docs/frontend-build-performance.md`](../docs/frontend-build-performance.md)
4. [`../docs/production-image-performance.md`](../docs/production-image-performance.md)
5. [`../docs/production-deployment.md`](../docs/production-deployment.md)
6. [`../docs/hosted-pilot-runbook.md`](../docs/hosted-pilot-runbook.md)
7. [`../docs/local-validation-sequence.md`](../docs/local-validation-sequence.md)

Read product contracts only when their owning slice becomes active. Do not load
the entire historical plan into an implementation task by default.

## Stop conditions

Continue through safe repository-owned slices. Pause only for a material product
choice, new authority, unavailable external infrastructure, or evidence that
must come from a real person or live service. Never represent a simulation,
fallback, private reviewer, or CI result as protected production evidence.
