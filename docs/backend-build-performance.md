# Backend Build Performance

## Pilot Readiness baseline

The exact backend CI test command exposed two compilation units for several
feature modules: `lib.rs` exported them while `main.rs` redeclared the same
source files. Rust therefore compiled their code and unit tests into both the
library and binary test targets. Before convergence, the binary target ran 233
tests, including copies already exercised by the 209-test library target.

## Phase 6A4 convergence

The first behavior-neutral slice removes binary redeclarations for:

- marketing events;
- marketing leads;
- notification delivery;
- project bids; and
- stop progress.

The binary imports those modules from `grover_landscaping_api` exactly as it
already does for newer feature areas. Runtime repositories, request validation,
worker startup, and route handlers retain the same implementations. The binary
target now runs 215 tests, eliminating 18 duplicate unit-test executions, and
the full backend command runs 484 tests.

Validation after the boundary change:

- `cargo fmt --all -- --check` passes;
- `cargo clippy --all-targets --all-features -- -D warnings` passes;
- `cargo test --bin grover-landscaping-api` passes all 215 binary tests; and
- `cargo test --all` passes all 484 backend tests.

## Phase 6A5 account convergence

The account repository and its request validation are self-contained, so the
binary now imports `accounts` from the library as the next dependency-ordered
slice. Its five module unit tests remain covered by the library target without
being compiled and run again in the binary. The binary target drops from 215 to
210 tests, for a cumulative reduction of 23 duplicate executions, and the full
backend command runs 479 tests. Strict all-target/all-feature Clippy and the full
test command remain green.

## Next convergence boundary

`completion_reports`, `day_plans`, `db`, `photo_processing`, and `photo_storage`
remain redeclared by the binary. They share root data types or repository types
today, so the next slice should first move the binary onto the library-owned
job/photo request and response contracts, then remove those five declarations
in dependency order. Clean-build timing should be compared only
after that larger boundary is complete; incremental timings from different
artifact states are not an equivalent benchmark.
