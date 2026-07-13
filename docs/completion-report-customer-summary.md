# Completion Report Customer Summary

This note describes how customer-facing completion report summaries should be selected for delivered report views.

## Purpose

Customer summaries should explain the completed yard work in clear customer-friendly language while keeping manager review details separate.

Delivered report views should use persisted summary versions rather than rebuilding text from live job state.

Delivered report links now prefer the JSON snapshot stored when a manager approves the report for delivery. If an older delivered link has no stored snapshot, the API can still fall back to rebuilding the report from the delivered share token.

## Summary source

Customer-facing views should read the latest approved summary version for the delivered report.

The selected summary should be tied to the completion report and service-company organization.

Older summary versions should remain available for manager audit history, but customer views should show only the approved delivered wording.

## Customer-visible usage

The approved summary can appear in:

- the customer portal timeline,
- the delivered report card,
- the delivered report detail view,
- customer-facing evidence views when summary context is helpful.

## Hidden review wording

Customer-facing summary areas should not show:

- earlier draft wording,
- manager review notes,
- failed quality-check details,
- internal lifecycle history,
- manager queue labels or priority.

## Guardrails

Reading the customer summary must not change summary versions, lifecycle status, evidence snapshots, property ownership, portfolio grouping, customer ownership, or crew service history.
