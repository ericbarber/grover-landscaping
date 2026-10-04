# Quality and performance budgets

`quality-budgets.json` is the versioned release-quality contract. The first
enforced slice covers production frontend artifacts because those measurements
are deterministic locally and in CI. Runtime/browser thresholds and privacy
rules are recorded in the same contract, but are not represented as protected
pilot evidence until their named environment gates run.

## Commands

Build and validate from the repository root:

```bash
cd frontend
npm run build
npm run quality:budgets
```

Machine-readable output is available with:

```bash
node scripts/validate-quality-budgets.mjs --json
```

The change-aware validator runs the budget check after every selected frontend
build. CI does the same in the frontend job, so a regression reports the exact
measured and allowed byte counts.

## 2026-10-01 artifact baseline

The initial baseline was measured from the validated B0/B1/B3 production build
on the available Node 24 workstation. CI remains pinned to Node 22; build output
must fit the same byte contract there before publication.

| Measurement | Baseline | Budget |
| --- | ---: | ---: |
| Largest JavaScript chunk | 320,948 B | 350,000 B |
| Total JavaScript | 1,102,522 B | 1,200,000 B |
| Total JavaScript, gzip | 281,616 B | 320,000 B |
| Total CSS | 63,970 B | 70,000 B |
| Total CSS, gzip | 11,606 B | 15,000 B |
| Total production `dist` | 1,274,669 B | 1,400,000 B |
| Largest public raster image | 104,616 B | 115,000 B |
| Authenticated `App` chunk | 265,496 B | 290,000 B |
| Manager workspace chunk | 320,948 B | 350,000 B |
| Public landing chunk | 58,102 B | 65,000 B |

The headroom is intentionally bounded near the measured build. A larger budget
requires a dated measurement, an explanation of the user-visible tradeoff, and
an update to both this record and `quality-budgets.json`. Renaming or removing a
required chunk boundary fails validation instead of silently dropping its gate.

## Browser and accessibility gates

The budget contract records the supported 320 px phone width, 200% text zoom,
one-pixel overflow tolerance, primary-content readiness, interaction response,
and layout-shift targets. Existing cross-browser journeys enforce keyboard
focus, landmarks, reduced motion, forced colors, responsive reflow, final-action
clearance, and protected-data fail-closed behavior. The prepared B1/B3 journeys
cannot execute in the active sandbox because loopback binding is prohibited;
hosted CI or another allowed browser runner remains the evidence source.

Timing and layout measurements must be reported separately for mobile and
desktop. Do not loosen a threshold to hide a flaky environment: first identify
whether the regression is application work, runner variance, or unavailable
infrastructure.

## API, worker, and offline indicators

Protected pilot dashboards should use bounded aggregates only:

- readiness success and latency;
- API request outcome and latency by route family, method, and status class;
- persistence-unavailable outcomes;
- notification and photo-worker queue age, retries, and dead letters;
- offline enqueue, replay success, conflict, reviewed discard, and durable
  completion by queue kind.

The operational owner is the Company Owner/Support operator responsible for the
protected pilot. Readiness or persistence-unavailable alerts route to that
operator; queue-age/dead-letter alerts route to the workflow owner documented in
the corresponding notification, photo recovery, or offline recovery runbook.
No alert or metric may carry tenant, organization, account, property, user,
token, request body, or mutation content.

Real-user measurement remains `not_approved`. It may not be enabled until the
product owner approves retention, sampling, notice/consent, access, deletion,
and response ownership. Synthetic and CI measurements are not a substitute for
claiming protected runtime performance.

## Release response

When a budget fails:

1. Confirm the production build and compare the named artifact measurement.
2. Remove accidental dependency, asset, or eager-loading growth when possible.
3. If growth is intentional, document the measured user outcome and obtain
   product/engineering approval before changing the budget.
4. Re-run frontend tests, production build, budget validation, and the relevant
   browser journeys.
5. Roll back the product slice when the regression cannot be justified or the
   protected behavior cannot be measured safely.

Missing protected dashboards, alerts, or runtime evidence remain release gates;
the repository contract does not claim they exist.
