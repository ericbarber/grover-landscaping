# Secondary and recovery perspectives

Status: task hypotheses for later Modern Grover rounds. These do not add
backend roles or permissions. The first study focuses on the five
[first-wave perspectives](README.md); retain these to expose boundaries that
the core service thread could otherwise hide.

| Perspective | First useful answer and task | Boundary and design question |
| --- | --- | --- |
| Crew Member | “Which assigned task is mine at this stop?” Complete own checklist/evidence and ask the lead about a blocker. | No route release or broad crew recovery. Can they distinguish own device-held work from the lead's or server's state? |
| Dispatcher | “Which assignment blocks a publishable day?” Compare capacity and exact plan state, then hand a change to the accountable manager. | A separate dispatcher authority and API contract are product gated. Does this need its own role or a Company Manager responsibility? |
| Billing Administrator | “Which delivered service lacks context for a downstream handoff?” Identify the gap and owner. | Invoices, payments, refunds, and ledger are gated. Can they distinguish proof readiness from financial authority? |
| Support Administrator | “Which incident is assigned to me, for what purpose, and until when?” Resolve from minimized context or request scoped help. | No general browse of customer/provider records. Is temporary access truly necessary, and who ends it? |
| Signed-in person without an active role | “Why can't I enter, and who can fix it?” Resolve invitation or membership state from a safe screen. | Show no protected property or company data. Can they distinguish absent role, ended access, and temporary read failure? |

The prior [extended profiles](../../design/personas/README.md) give additional
candidate wording. Validate each task and authority boundary against current
routes and participant observation before expanding a workspace prototype.
