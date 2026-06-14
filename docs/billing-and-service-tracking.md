# Billing and Service Tracking

## Goal

Track whether a customer account is current enough for a crew to perform service, without requiring full payment processing in the MVP.

## MVP Billing Scope

The MVP should support lightweight account tracking:

- Customer account status
- Number of contracted services
- Number of completed services in the current period
- Payment status for the current period or job
- Crew-visible payment/service indicator
- Manager override notes

The MVP should not process cards or ACH payments directly. Payment collection can be added later through an external provider such as Stripe, Square, QuickBooks, or another invoicing platform.

## Recommended Crew Experience

Crew members should see a simple account indicator on each job:

```text
Account current
Payment due
Prepaid service
Included in monthly plan
Manager review required
```

The crew should not need to manage invoices. They only need enough information to know whether the service is approved and whether payment has been marked complete.

## Recommended Admin Experience

Admins or managers should be able to:

- Set an account billing model
- Set the current payment status
- Record the number of contracted services
- See completed services for the current period
- Mark payment complete
- Add billing notes
- Override service approval when needed

## Billing Models

```text
per_job
monthly_plan
prepaid_package
manual_account
```

## Payment Status Values

```text
not_required
pending
paid
past_due
waived
manager_review
```

## Service Approval Values

```text
approved
blocked
manager_review
```

## Initial Data Model

```text
customer_accounts
  id
  customer_name
  billing_model
  payment_status
  service_approval_status
  contracted_services_per_period
  completed_services_this_period
  period_start
  period_end
  billing_notes
  created_at
  updated_at
```

Jobs should reference a customer account:

```text
service_jobs.customer_account_id -> customer_accounts.id
```

## MVP Rule

A job can still be completed even if payment is not marked paid, but the completion report should show whether the account was current at the time of service.

This keeps the crew workflow simple while preserving billing context for office follow-up.
