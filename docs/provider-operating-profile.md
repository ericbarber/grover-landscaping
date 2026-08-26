# Provider Operating Profile

## Purpose

Company setup records a small set of provider-supplied operating facts without
turning them into marketplace eligibility, credential verification, or an
availability promise. The profile supports honest internal preparation while
the curated-opportunity product and operating contracts remain gated.

## Persisted contract

`GET /organizations/{organization_id}` and
`PUT /organizations/{organization_id}` include:

- `supported_service_categories`: a duplicate-free list of up to eight
  allowlisted service identifiers;
- `supported_languages`: a duplicate-free list of up to five allowlisted
  customer-communication language identifiers.

Current service identifiers are `routine_maintenance`, `seasonal_cleanup`,
`turf_care`, `shrub_care`, `irrigation_checks`, and
`desert_landscape_care`. Current language identifiers are `en` and `es`.
Unknown or duplicate values fail validation. Older clients may omit both fields;
the API treats omission as an empty list.

Migration `202608220004_provider_operating_profile.sql` adds non-null empty-array
defaults and database count constraints. Application validation remains the
authority for the allowlists and duplicate rules.

## Interface meaning

Organization Owners edit these facts in Company setup. The readiness view labels
them **Supplied by provider** when present and **Needs information** when absent.
They contribute only to the collected-preparation-facts count.

These fields do not:

- publish a customer-facing provider profile;
- prove capability, quality, licensure, insurance, or certification;
- establish territory or opportunity eligibility;
- rank or match the provider;
- represent real-time capacity, pause state, or customer availability.

Provider-facing availability remains coupled to the curated-opportunity
projection and its provenance, suppression, support, and regional-density
decisions. Credential checking requires a separate governed evidence, review,
expiry, correction, and appeal contract.

## Validation

- Rust request validation covers accepted facts, duplicates, and unsupported
  values.
- API-client tests cover current and legacy profile responses.
- Readiness domain and component tests cover the new fact states and progress.
- Responsive provider-entry browser coverage checks the rendered service and
  language facts.
