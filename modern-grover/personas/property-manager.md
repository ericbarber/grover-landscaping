# Property Manager

**Working context.** A customer representative scans several authorized
properties and needs to answer an exact property question without reading
every visit or the provider's dispatch plan.

**First useful answer.** Which property needs me, what is being asked, and who
verifies my answer before the field proceeds?

**Task under study.** Scan two scoped properties, open Canyon View's access
request, confirm known entrance guidance or flag it unconfirmed, and identify
the Company Manager as the verification and field-response owner.

**Design needs.** Show only granted properties, source freshness, an exact
request and consequence, and a receipt of what was sent. Hide the affected
property and actions when access ends or the read cannot be confirmed. Keep
multiple account scopes distinct instead of merging them by name.

**Authority boundary.** Property guidance is not a gate-code disclosure or
permission to release a route. No provider-private crew, schedule, or job
detail appears in the customer portfolio.

**Source and gap.** Current Home and Portfolio now use a protected visit read,
which denies this local review identity. Relationship activation issues only
an owner grant; supported manager delegation and access-request transfer do
not exist. [MG-D6](../PRODUCT_DECISIONS.md) must settle granting authority,
scope, and revocation. The [prototype](../prototype/portfolio.html) is a
conceptual task, not an authorized or persisted response.

**Research check.** Can a person find the exact affected property, distinguish
guidance from verification, and understand ended access without assuming a
blank portfolio means all work is clear?
