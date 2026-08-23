# Completion Report Customer Portal Query

This note describes the query shape implemented customer-portal report routes
follow and the authorization decision still required for persisted Yard Owner
visit reads.

## Query starting point

Customer report queries should start from the signed-in customer account, then resolve the properties available to that account.

The query should not start from a crew, route, or report share token alone because those records do not define customer ownership.

## Required filters

Customer portal report lists should filter by:

- property IDs available to the signed-in customer account,
- lifecycle status `delivered`,
- delivery timestamp present,
- organization boundary for the service company that produced the report.

## Returned report summary

A list response should include enough information for the portal timeline without exposing manager-only review state:

- report ID,
- property ID,
- job ID,
- delivered timestamp,
- share link when available,
- customer-safe customer/property identity.

The public share-token detail route has a stricter contract: it omits report,
job, account, property, organization, crew, photo, add-on, bid, line-item, and
service identifiers and returns only safe service/checklist/photo/completed-
recommendation content.

## Guardrails

The customer query should not return draft, submitted, in-review, or change-requested reports.

The customer query should not expose manager review notes, quality-check failure details, internal status history, or manager queue fields.

Persisted signed-in Yard Owner visit/history reads must not expand beyond the
current authorization model until customer-account inheritance for owners versus
per-property grants is explicitly decided.
