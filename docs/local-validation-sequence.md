# Local Validation Sequence

Use a hybrid sequence: obtain fast evidence while implementing, widen to the
affected package before committing, and reserve the complete matrix for
publication and release. Current execution rules live in
[`../project-planning/DELIVERY_BOARD.md`](../project-planning/DELIVERY_BOARD.md).

## 1. Classify the change

Choose every affected area: frontend, browser behavior, backend, persistence or
migrations, infrastructure/deployment, or documentation. Authorization,
privacy, queues, and cross-workflow behavior always include their integration
boundary.

The repository command classifies current working-tree changes automatically:

```bash
bash scripts/validate-changes.sh --dry-run
bash scripts/validate-changes.sh
```

Use `--base origin/main` for a committed branch diff, repeat `--scope` for an
explicit gate, or pass paths after `--` to inspect classification. Run
`bash scripts/validate-changes.sh --help` for the complete interface.

## 2. Run the inner loop

- Frontend: TypeScript plus focused Vitest files.
- Browser behavior: the focused Playwright project and specification.
- Backend: formatting/check plus the focused test target.
- Persistence: the focused repository test against PostgreSQL.
- Terraform: formatting and the changed module's backend-disabled validation.
- Documentation: diff, links, status language, and formatting checks.

Fix the first useful failure before widening the scope.

## 3. Close the feature slice

Before committing, run the full affected-package suite and production build.
Migration changes require fresh and repeat application plus their live
PostgreSQL fixture. Authentication, authorization, privacy, recovery, and queue
changes require explicit unavailable, conflict, and isolation cases.

Review the complete diff, include related tests and delivery records, and keep
unrelated working-tree changes out of the commit.

## 4. Publish through the main gate

`main` remains the full integration boundary. GitHub Actions must run repository
checks, frontend security/type/tests/build, Rust migrations/format/strict
Clippy/tests, Terraform validation, all browser projects, pilot assurance, and
the production image. Branch-scoped concurrency cancels an older run when a
newer commit supersedes it; it does not remove or skip any gate in the surviving
run. Existing `/usr/bin/time` markers remain the comparable evidence used to
identify a real bottleneck before changing CI structure.

A failed hosted check may be rerun once unchanged to classify runner variance.
If the same condition repeats, fix or explicitly quarantine the cause instead
of weakening the product invariant.

## 5. Validate a protected release

Before and after deployment, run the release preflight, database readiness,
Cognito configuration, authenticated smoke, tenant-isolation checks, and
rollback verification. CI or private-VPN local-review success does not satisfy
this gate.
