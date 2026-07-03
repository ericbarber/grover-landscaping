# Completion Report Customer Portal Query

This note describes the query shape future customer-portal report routes should follow.

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
- crew ID,
- delivered timestamp,
- current approved summary text,
- share link when available,
- counts for before photos, after photos, issue photos, service steps, and completed add-ons.

## Guardrails

The customer query should not return draft, submitted, in-review, or change-requested reports.

The customer query should not expose manager review notes, quality-check failure details, internal status history, or manager queue fields.
