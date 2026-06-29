# Property Portfolio API Contract

This document defines the API contract for property portfolio management before route handlers are added.

## Purpose

Property portfolios group yards for a customer account, property management company, HOA, or commercial client. They do not own the customer account, yard, crew, route, or job.

## Existing backend foundation

- `property_portfolios` stores portfolio records.
- `portfolio_property_links` stores membership between a portfolio and a yard/property.
- `PropertyPortfolio` and `PortfolioPropertyLink` provide backend domain response shapes.
- `CreatePropertyPortfolioRequest` validates future create-portfolio payloads.

## Planned endpoints

### Create portfolio

`POST /property-portfolios`

Required fields:

- `account_id`
- `organization_id`
- `display_name`
- `portfolio_type`

Validation rules:

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

- `property_id` must not be blank.
- `organization_id` must not be blank.
- The property and portfolio must belong to the same service organization.
- Adding a property to a portfolio must not change customer ownership.
- Adding a property to a portfolio must not change crew assignment.

### List portfolios for account

`GET /accounts/{account_id}/property-portfolios`

Expected behavior:

- Return only portfolios owned by the requested account.
- Scope results to the current service organization.
- Include yard/property counts when available.

## Guardrails

- Crews service properties; they do not own portfolios.
- Customers or property-management accounts own portfolios.
- Properties stay attached to their customer account and service organization.
- Crew assignment history should remain separate from portfolio membership history.
