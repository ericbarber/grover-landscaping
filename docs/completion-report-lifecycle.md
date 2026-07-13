# Completion Report Lifecycle Policy

This document defines the intended policy for proof-of-completion reports before dedicated report routes are added.

## Lifecycle states

- Draft: crew has started collecting notes, checklist progress, and photos.
- Submitted: crew has sent completion evidence for manager review.
- In review: manager is checking the work summary, checklist, notes, and photo evidence.
- Changes requested: manager has asked the crew to correct or add information before customer delivery.
- Delivered: manager has approved the report and made it visible to the customer portal.

## Role policy

- Crew leads and crew members may submit completion reports for work assigned to their route.
- Managers, organization owners, and support admins may review completion reports.
- Managers, organization owners, and support admins may request report changes before delivery.
- Managers, organization owners, and support admins may deliver approved reports to the customer portal.
- Property owners and property managers may view delivered reports through customer portal access rules.

## Boundaries

- Submission access does not grant review access.
- Review access does not change customer ownership, property ownership, portfolio grouping, or crew service assignment.
- Delivery writes a `report_delivered` audit event because it exposes completion evidence to the customer portal.
- Customer report viewing should remain scoped to the customer's own properties.
- Crew access should remain scoped to assigned route and work context.
