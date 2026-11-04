# Crew Lead

**Working context.** A field lead uses a phone at a property with variable
coverage, sunlight, gloves, and interruptions. The next released stop and
safe access decision matter more than a broad office dashboard.

**First useful answer.** Is this the current assigned stop, what is safe to do,
and which changes have actually reached the office?

**Task under study.** Open the current released stop, record an access
question and a safe checklist change while offline, reconnect, and decide what
to do if the office has since changed the plan.

**Design needs.** Show service date, assignment, published state, access and
safety facts, large primary controls, and explicit device-held versus synced
status. Preserve local work through a conflict and provide a clear manager
handoff; an access question should not silently alter the route.

**Authority boundary.** The lead cannot approve customer price, publish an
office plan, treat an unsent question as a manager response, or continue unsafe
work merely because the phone has saved a draft.

**Source and gap.** Current Route can read a published day plan and queue some
offline changes, but the review route is historical. Its amendment API does
not carry the prototype's access question to the manager exception queue, and
the day plan has no Plan 8/9 version. The [field prototype](../prototype/field.html)
holds state only in its current tab.

**Research check.** In a phone and weak-coverage session, can the lead tell
what is saved locally, what the office knows, and who owns the changed-plan
decision? Check a conflict and a failed read after normal work.
