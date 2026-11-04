# Dispatcher

**Situation:** A specialized coordinator may eventually own crew capacity and
day-plan publication as provider operations scale.

**First answer:** Is today's plan publishable, and which assignment blocks it?

**Primary job:** Compare workload and crew fit, publish an exact plan version,
and handle change requests through a versioned correction.

**UI needs:** Day-plan confidence, capacity warnings tied to exact assignments,
draft-versus-published labels, and a clear manager handoff.

**Boundary:** This is a design-only role until the backend role and API contract
are explicitly approved. Field execution and customer decisions are separate.

**Research prompt:** Which coordination decisions truly require a distinct
dispatcher rather than the Company Manager?
