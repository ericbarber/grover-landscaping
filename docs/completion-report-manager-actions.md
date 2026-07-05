# Completion Report Manager Actions

This note describes when manager-facing completion report actions should appear in dashboards and future route handlers.

## Lifecycle action matrix

| Current status | Primary action | Next status | Notes |
| --- | --- | --- | --- |
| `draft` | Submit from crew workflow | `submitted` | Draft reports are not ready for manager review yet. |
| `submitted` | Start review | `in_review` | The manager can begin review when persisted evidence is ready. |
| `in_review` | Request changes | `changes_requested` | Used when evidence or wording needs crew follow-up before delivery. |
| `changes_requested` | Resubmit | `submitted` | Crew follow-up returns the report to manager review intake. |
| `in_review` | Deliver | `delivered` | Delivery requires review metadata and passing quality checks. |
| `delivered` | View history | `delivered` | Delivered reports should not return to manager review states. |

## Dashboard behavior

Manager dashboards can use active queue status and queue priority helpers to show attention items before delivered history.

Recommended active queue order:

1. `changes_requested`
2. `submitted`
3. `in_review`
4. `draft`

Delivered reports should appear in history or customer-delivery views rather than the active manager queue.

## Delivery action requirements

The delivery action should appear only when:

- the report status is `in_review`,
- manager review metadata is present,
- failed quality-check count is zero,
- the lifecycle transition from `in_review` to `delivered` is allowed.

## Guardrails

Manager actions should update report lifecycle records and status history, not property ownership, portfolio grouping, customer account ownership, or crew service history.

Customer portal reads should continue to depend on delivered status and delivery metadata, not on manager queue visibility.
