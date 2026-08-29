# Frontend Dependency Security

## Phase 6A13 audit triage

The Node 22 production-image install reported two high-severity npm findings:

| Package | Installed | Finding | Applicability |
| --- | ---: | --- | --- |
| `postcss` | 8.5.15 | GHSA-r28c-9q8g-f849 and GHSA-fxqj-rqcc-2cmp | Direct development dependency used to process repository-controlled CSS during builds; not shipped as browser runtime code |
| `nanoid` | 3.3.12 | GHSA-28wg-ghj8-5hjv and GHSA-2v37-7h3g-55p8 | Transitive PostCSS build dependency; the application does not call its custom/non-secure generators |

The current application did not expose attacker-controlled PostCSS source-map
input or nanoid generator sizes. The findings were still remediated because the
affected tooling runs in CI and developer environments and compatible patched
versions are available.

## Compatible remediation

The direct PostCSS floor moves from `^8.4.49` to `^8.5.26`. The lockfile now
resolves PostCSS 8.5.26 and nanoid 3.3.18. Both updates remain within the
existing major-version lines; no React, Vite, Tailwind, TypeScript, Vitest, or
Playwright upgrade is included.

Validation on 2026-08-29:

- clean `npm ci` succeeds;
- `npm audit --audit-level=high` reports zero vulnerabilities;
- TypeScript passes;
- all 481 Vitest tests pass;
- the production build passes with identical asset hashes and every chunk below
  500 kB; and
- the Node 22 production image reports zero vulnerabilities during `npm ci`,
  builds in 76.41 seconds with cached backend/runtime layers, and retains the
  same runtime image manifest and config digest.

## Phase 6A14 regression gate

The frontend CI job now runs two dependency-security steps immediately after a
clean install and before type checking, tests, or the production build:

1. `npm run test:audit-security` proves the policy against clean,
   moderate-only, high, critical, malformed-report, and audit-process-failure
   cases.
2. `npm run audit:security` runs `npm audit --audit-level=high --json` against
   the complete frontend dependency graph, including build dependencies.

High or critical findings block the job. Missing or malformed vulnerability
metadata and a nonzero audit-process result without a reported finding also
fail closed. Informational, low, and moderate findings remain visible in the
summary but do not block this gate.

## Update and exception policy

- Prefer the smallest compatible patched release and retain the current major
  version when that closes the advisory.
- Validate clean install, the live audit, type checking, tests, and the
  production build in proportion to the changed dependency.
- Do not add advisory suppression, an allowlist, or an automatic major upgrade
  to keep routine CI green.
- If a compatible fix is unavailable, record applicability, exposure,
  compensating controls, an owner, and an expiry date for an explicitly
  approved exception before changing the gate. No exception mechanism is
  currently implemented.
- Treat registry or audit-service failure as an unavailable security check,
  not as a clean report; retry the CI job after service recovery.

Validation on 2026-08-29 proves all eight policy cases and the live zero-finding
Node 22/npm 10 audit.
