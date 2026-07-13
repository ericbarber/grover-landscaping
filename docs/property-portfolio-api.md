# Property Portfolio API Contract

This document defines the implemented API contract for property portfolio management.

## Purpose

Property portfolios group yards for a customer account, property management company, HOA, or commercial client. They do not own the customer account, yard, crew, route, or job.

## Existing backend foundation

- `property_portfolios` stores portfolio records.
- `portfolio_property_links` stores membership between a portfolio and a yard/property.
- `PropertyPortfolioResponse` and `PortfolioPropertyLinkResponse` provide backend response shapes with `persisted` status and property counts where relevant.
- `CustomerPropertyPortfolioReadResponse` returns customer-scoped portfolio groups, grouped properties, and customer-owned ungrouped properties for portal reads.
- `CreatePropertyPortfolioRequest` and `AddPropertyToPortfolioRequest` validate write payloads.

## Endpoints

### Create portfolio

`POST /property-portfolios`

Required fields:

- `account_id`
- `organization_id`
- `display_name`
- `portfolio_type`

Validation rules:

- The caller must be a manager, organization owner, support admin, or property manager.
- The caller must have an active membership in the requested service organization.
- `account_id` must not be blank.
- `organization_id` must not be blank.
- `display_name` must not be blank.
- `portfolio_type` must be one of `individual_owner`, `property_management_company`, `hoa`, or `commercial_client`.

### Add property to portfolio

`POST /property-portfolios/{portfolio_id}/properties`

Required fields:

- `property_id`
- `organization_id`

Validation rules:

- The caller must be a manager, organization owner, support admin, or property manager.
- The caller must have an active membership in the requested service organization.
- `property_id` must not be blank.
- `organization_id` must not be blank.
- The property and portfolio must belong to the same service organization.
- Adding a property to a portfolio must not change customer ownership.
- Adding a property to a portfolio must not change crew assignment.

### List portfolios for account

`GET /accounts/{account_id}/property-portfolios`

Expected behavior:

- The caller must be a manager, organization owner, support admin, or property manager.
- Return only portfolios owned by the requested account.
- Scope results to the signed-in principal's active organization memberships.
- Include yard/property counts.

### Read customer portfolio and properties

`GET /accounts/{account_id}/customer-property-portfolio`

Expected behavior:

- The caller must be an organization owner, manager, support admin, property owner, or property manager.
- Scope results to the signed-in principal's active organization memberships.
- Return portfolio groups for the requested account.
- Return properties inside each portfolio group.
- Return customer-owned properties without a portfolio link in `ungrouped_properties`.
- Derive current property reads from persisted service jobs and completion-report property identifiers when a dedicated property record is not available yet.
- Reading the endpoint must not change portfolio membership, customer ownership, crew assignment, route state, report status, or job state.

## Guardrails

- Crews service properties; they do not own portfolios.
- Customers or property-management accounts own portfolios.
- Properties stay attached to their customer account and service organization.
- Crew assignment history should remain separate from portfolio membership history.
