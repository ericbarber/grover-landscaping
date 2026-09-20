const sharedPlan = '../../review/all-persona-minimal-rollout-plan.md';

const personas = {
  owner: {
    name: 'Yard Owner', identity: 'Jamie — Property Owner', shortName: 'Jamie', role: 'Yard owner', identityAction: 'Account', plan: '../../review/yard-owner-minimal-rollout-plan.md', panel: 'owner',
    summary: 'Know what happens next, follow the visit, and review delivered care.',
    units: {
      u1: { option: 'U1 · Care visibility — minimum launch', label: 'Minimum launch', title: 'Care visibility', copy: 'A complete read-only answer to “What happens next?”', intro: 'Here is what is next for your yard.', nav: ['Home'], capabilities: ['Protected account and property access', 'Next confirmed visit', 'Preparation and next update', 'Empty and recovery states'] },
      u2: { option: 'U2 · Visit tracking', label: 'Functional unit 2', title: 'Visit tracking', copy: 'Add service-day progress only after provider status publishing is operational.', intro: 'Follow upcoming and customer-visible service updates.', nav: ['Home', 'Visits'], capabilities: ['Everything in U1', 'Visit chronology', 'Six explicit service-day states', 'Past/current date context'] },
      u3: { option: 'U3 · Delivered proof', label: 'Functional unit 3', title: 'Delivered proof', copy: 'Add immutable reviewed outcomes without exposing unpublished evidence.', intro: 'Follow care and review delivered results.', nav: ['Home', 'Visits', 'Proof'], capabilities: ['Everything in U2', 'Exact-visit delivered proof', 'Completed checklist and reviewed photos', 'Pending, missing, and unavailable distinctions'] },
      u4: { option: 'U4 · Questions and decisions', label: 'Functional unit 4', title: 'Questions and decisions', copy: 'Enable writes only with provider response ownership and recovery in place.', intro: 'Follow care, review proof, and respond in context.', nav: ['Home', 'Visits', 'Proof'], capabilities: ['Everything in U3', 'Visit-specific questions and replies', 'Versioned recommendation history', 'Affirmed owner decisions and receipts'] },
    },
  },
  'property-manager': {
    name: 'Property Manager', identity: 'Morgan — Property Manager', shortName: 'Morgan', role: 'Property manager', identityAction: 'Account', plan: `${sharedPlan}#property-manager`, panel: 'generic', context: 'Desert Vista portfolio', heading: 'Start with portfolio readiness.', confidence: '12 properties current',
    summary: 'See service readiness across properties, then add proof, approvals, and bounded management tools.',
    primary: { eyebrow: 'Portfolio attention', title: '2 properties need review', copy: 'One access instruction is missing. One approved visit moved because of weather.', facts: ['10 properties ready', '2 need a decision', 'No provider-private route data'] },
    units: {
      p1: { option: 'P1 · Portfolio readiness — minimum launch', label: 'Minimum launch', title: 'Portfolio readiness', copy: 'One truthful read-only view of coverage, next service, and exceptions.', intro: 'See which properties are ready and which need attention.', nav: ['Home', 'Portfolio'], active: 'Portfolio', capabilities: ['Exact portfolio/property authorization', 'Coverage and next service', 'Customer-safe exceptions', 'Empty, partial, and unavailable states'] },
      p2: { option: 'P2 · Property coverage and proof', label: 'Functional unit 2', title: 'Property coverage and proof', copy: 'Add exact-property service history and immutable delivered outcomes.', intro: 'Verify coverage and delivered work across the portfolio.', nav: ['Home', 'Portfolio'], active: 'Portfolio', capabilities: ['Everything in P1', 'Property search and coverage', 'Exact-visit delivered proof', 'Pending versus unavailable evidence'], card: ['Delivered proof', 'Review completed visits without exposing draft evidence.'] },
      p3: { option: 'P3 · Approvals and questions', label: 'Functional unit 3', title: 'Approvals and questions', copy: 'Enable contextual decisions only when ownership and version history are complete.', intro: 'Resolve portfolio questions and exact-version approvals.', nav: ['Home', 'Portfolio'], active: 'Portfolio', capabilities: ['Everything in P2', 'Visit-specific questions', 'Version-bound approvals', 'Decision receipts and history'], card: ['Decision queue', 'Three exact-property approvals retain their terms and audit history.'] },
      p4: { option: 'P4 · Portfolio administration', label: 'Functional unit 4', title: 'Portfolio administration', copy: 'Expose only the authorized Customer view and Portfolios management tools.', intro: 'Review service and maintain the authorized portfolio boundary.', nav: ['Home', 'Portfolio', 'Manage'], active: 'Manage', capabilities: ['Everything in P3', 'Customer view tool', 'Portfolio grouping tool', 'No team, route, billing, or recovery tools'], card: ['Bounded management', 'Manage contains only Customer view and Portfolios for this role.'] },
    },
  },
  crew: {
    name: 'Crew Lead', identity: 'Leah — Crew Lead', shortName: 'Leah', role: 'Crew lead', identityAction: 'Account', plan: '../../review/crew-lead-minimal-rollout-plan.md', panel: 'crew',
    summary: 'See the assigned day, execute stops, submit proof, and coordinate route changes.',
    units: {
      c1: { option: 'C1 · Day plan visibility — minimum launch', label: 'Minimum launch', title: 'Day plan visibility', copy: 'A reliable read-only route replaces paper and office check-ins.', intro: 'See today’s route and property context before leaving the yard.', nav: ['Home', 'Route'], active: 'Route', capabilities: ['Verified crew membership', 'Assigned day plan and ordered stops', 'Customer-safe service/access context', 'Current sync and unavailable states'] },
      c2: { option: 'C2 · Stop execution', label: 'Functional unit 2', title: 'Stop execution', copy: 'Add progress writes only after durable offline replay and conflict recovery pass.', intro: 'Move through each assigned stop with resilient progress.', nav: ['Home', 'Route', 'Jobs', 'Job'], active: 'Route', capabilities: ['Everything in C1', 'Start, arrive, pause, and complete', 'Durable offline progress queue', 'Replay, stale, and conflict recovery'] },
      c3: { option: 'C3 · Field proof', label: 'Functional unit 3', title: 'Field proof', copy: 'Add checklist, photos, and report handoff when evidence operations are ready.', intro: 'Complete the work and return reviewable evidence together.', nav: ['Home', 'Route', 'Jobs', 'Job'], active: 'Route', capabilities: ['Everything in C2', 'Checklist completion', 'Offline-safe photo capture', 'Quality rejection and retry', 'Completion report handoff'] },
      c4: { option: 'C4 · Changes and recovery', label: 'Functional unit 4', title: 'Changes and recovery', copy: 'Add route requests and exceptional recovery without mutating the published plan silently.', intro: 'Execute the day and coordinate changes with the office.', nav: ['Home', 'Route', 'Jobs', 'Job'], active: 'Route', capabilities: ['Everything in C3', 'Skip and added-service requests', 'Queued amendment replay', 'Conflict resolution', 'Manager-visible completion handoff'] },
    },
  },
  'crew-member': {
    name: 'Crew Member', identity: 'Mateo — Crew Member', shortName: 'Mateo', role: 'Crew member', identityAction: 'Account', plan: `${sharedPlan}#crew-member`, panel: 'generic', context: 'North Route Crew', heading: 'Start with your assigned stop.', confidence: 'Synced',
    summary: 'See assigned work, record job progress, submit evidence, and recover device-held changes.',
    primary: { eyebrow: 'Assigned work', title: 'Oak Street residence', copy: 'Front and back lawn · Edges and hardscape cleanup', facts: ['Stop 1 of 4', 'Gate code confirmed', 'Crew Lead: Leah'] },
    units: {
      cm1: { option: 'CM1 · Assigned work — minimum launch', label: 'Minimum launch', title: 'Assigned work', copy: 'A read-only route and job brief with no crew-level planning authority.', intro: 'Confirm today’s route, stop order, and safe work context.', nav: ['Home', 'Route'], active: 'Route', capabilities: ['Verified crew and assignment', 'Ordered assigned stops', 'Service and access context', 'Current, stale, and unavailable states'] },
      cm2: { option: 'CM2 · Job execution', label: 'Functional unit 2', title: 'Job execution', copy: 'Add assigned-job progress after offline replay and conflict recovery pass.', intro: 'Record progress on assigned work even through weak signal.', nav: ['Home', 'Route', 'Jobs', 'Job'], active: 'Job', capabilities: ['Everything in CM1', 'Assigned-job progress only', 'Durable device queue', 'Retry and unknown-outcome recovery'], card: ['Safe execution', 'Actions apply only to the assigned job; route publication stays with operations.'] },
      cm3: { option: 'CM3 · Field evidence', label: 'Functional unit 3', title: 'Field evidence', copy: 'Add checklist and photo submission with clear quality recovery.', intro: 'Return complete evidence with the work.', nav: ['Home', 'Route', 'Jobs', 'Job'], active: 'Job', capabilities: ['Everything in CM2', 'Checklist completion', 'Offline-safe photos', 'Quality rejection and retry'], card: ['Evidence checklist', '4 of 6 tasks complete · 2 required photographs remain.'] },
      cm4: { option: 'CM4 · Personal recovery', label: 'Functional unit 4', title: 'Personal recovery', copy: 'Resolve this member’s queued work without granting route-change authority.', intro: 'Finish assigned work and recover changes held on this device.', nav: ['Home', 'Route', 'Jobs', 'Job'], active: 'Job', capabilities: ['Everything in CM3', 'Personal queued-work review', 'Conflict and permission-loss handling', 'Crew Lead escalation handoff'], card: ['Device recovery', 'One change is saved on this device and awaiting confirmation.'] },
    },
  },
  'company-owner': {
    name: 'Yard-care Company Owner', identity: 'Avery — Company Owner', shortName: 'Avery', role: 'Company owner', identityAction: 'Organization', plan: `${sharedPlan}#yard-care-company-owner`, panel: 'generic', context: 'Grover Yard Care', heading: 'Start with company readiness.', confidence: 'Operational',
    summary: 'Establish the company, run today’s work, add customer and team administration, then enable recovery.',
    primary: { eyebrow: 'Company readiness', title: '4 crews ready for today', copy: 'One invitation is pending. All published day plans have assigned crews.', facts: ['26 active customers', '4 published routes', '1 onboarding action'] },
    units: {
      o1: { option: 'O1 · Company readiness — minimum launch', label: 'Minimum launch', title: 'Company readiness', copy: 'A bounded setup and readiness view before daily operations depend on the workspace.', intro: 'Confirm organization, crew, and access readiness.', nav: ['Home', 'Manage'], active: 'Manage', capabilities: ['Exact organization ownership', 'Company setup and summary', 'Crew/access readiness', 'Audited empty and unavailable states'] },
      o2: { option: 'O2 · Daily operations', label: 'Functional unit 2', title: 'Daily operations', copy: 'Add schedule, dispatch, route, and job oversight as one operating loop.', intro: 'Publish and follow today’s assigned work.', nav: ['Home', 'Manage', 'Route', 'Jobs', 'Job'], active: 'Manage', capabilities: ['Everything in O1', 'Day plans and dispatch structure', 'Workload and field oversight', 'Publish/change audit history'], card: ['Today’s operation', 'Four routes published · one workload risk needs review.'] },
      o3: { option: 'O3 · Customers and team', label: 'Functional unit 3', title: 'Customers and team', copy: 'Add account, property, portfolio, membership, and invitation administration.', intro: 'Operate the customer and team relationships behind the schedule.', nav: ['Home', 'Manage', 'Route', 'Jobs', 'Job'], active: 'Manage', capabilities: ['Everything in O2', 'Customer and property tools', 'Team membership and invitations', 'Least-privilege access review'], card: ['People and properties', 'Customer, property, portfolio, team, and invitation tools are enabled.'] },
      o4: { option: 'O4 · Reports and recovery', label: 'Functional unit 4', title: 'Reports and recovery', copy: 'Complete the owner workspace with evidence, activity, exception, privacy, and retry tools.', intro: 'Review outcomes and recover operational exceptions.', nav: ['Home', 'Manage', 'Route', 'Jobs', 'Job'], active: 'Manage', capabilities: ['Everything in O3', 'Operations and completion reports', 'Questions and delivery status', 'Photo, exception, privacy, and erasure recovery'], card: ['Accountable recovery', 'Every recovery action retains actor, outcome, and customer-safe boundaries.'] },
    },
  },
  'company-manager': {
    name: 'Yard-care Company Manager', identity: 'Riley — Company Manager', shortName: 'Riley', role: 'Company manager', identityAction: 'Organization', plan: `${sharedPlan}#yard-care-company-manager`, panel: 'generic', context: 'Today’s operation', heading: 'Start with schedule confidence.', confidence: '1 risk',
    summary: 'See company readiness, coordinate daily work, manage customers and team members, then recover exceptions.',
    primary: { eyebrow: 'Operations attention', title: 'West route needs balancing', copy: 'A long stop risks the final arrival window. No customer update has been published.', facts: ['4 routes published', '17 of 18 stops assigned', '1 workload risk'] },
    units: {
      m1: { option: 'M1 · Operating readiness — minimum launch', label: 'Minimum launch', title: 'Operating readiness', copy: 'Read-only company and day-plan confidence with one clear risk queue.', intro: 'Confirm today’s work is staffed, assigned, and current.', nav: ['Home', 'Manage'], active: 'Manage', capabilities: ['Current company summary', 'Day-plan visibility', 'Workload risk', 'Empty, stale, and unavailable states'] },
      m2: { option: 'M2 · Schedule and field coordination', label: 'Functional unit 2', title: 'Schedule and field coordination', copy: 'Add day-plan writes and field oversight with audited correction paths.', intro: 'Coordinate published work and follow field progress.', nav: ['Home', 'Manage', 'Route', 'Jobs', 'Job'], active: 'Manage', capabilities: ['Everything in M1', 'Day-plan publishing', 'Workload assignment', 'Route and job oversight'], card: ['Schedule coordination', 'Publish and correction actions retain route version and actor.'] },
      m3: { option: 'M3 · Customers and team', label: 'Functional unit 3', title: 'Customers and team', copy: 'Add only manager-authorized customer and membership operations.', intro: 'Keep properties, accounts, portfolios, and team access ready.', nav: ['Home', 'Manage', 'Route', 'Jobs', 'Job'], active: 'Manage', capabilities: ['Everything in M2', 'Property and customer tools', 'Member and activity tools', 'No owner-only setup or invitations'], card: ['Bounded administration', 'Manager scope omits owner setup, dispatch hierarchy, and invitations.'] },
      m4: { option: 'M4 · Reports and operational recovery', label: 'Functional unit 4', title: 'Reports and operational recovery', copy: 'Add completion, notification, evidence, and exception recovery within manager authority.', intro: 'Review outcomes and recover day-to-day failures.', nav: ['Home', 'Manage', 'Route', 'Jobs', 'Job'], active: 'Manage', capabilities: ['Everything in M3', 'Operations/completion reports', 'Visit questions and notification status', 'Photo and operational-exception recovery'], card: ['Operations recovery', 'Customer privacy and erasure remain outside manager authority.'] },
    },
  },
  dispatcher: {
    name: 'Dispatcher', identity: 'Drew — Dispatcher', shortName: 'Drew', role: 'Dispatcher', identityAction: 'Organization', plan: `${sharedPlan}#dispatcher`, panel: 'generic', context: 'Thursday dispatch', heading: 'Start with the publishable day plan.', confidence: '1 unassigned stop',
    summary: 'See schedule risk, publish crew assignments, follow the route, and recover scheduling conflicts.',
    primary: { eyebrow: 'Dispatch queue', title: '17 of 18 stops assigned', copy: 'The West route has capacity for one short stop before its final arrival window.', facts: ['4 crews available', '3 routes ready', '1 stop unassigned'] },
    units: {
      d1: { option: 'D1 · Schedule visibility — minimum launch', label: 'Minimum launch', title: 'Schedule visibility', copy: 'A read-only day plan and workload view with no implied publish authority.', intro: 'See crew workload, assignments, and schedule risk.', nav: ['Home', 'Manage'], active: 'Manage', capabilities: ['Exact organization/dispatcher role', 'Day-plan visibility', 'Crew workload and risk', 'Current, stale, and unavailable states'] },
      d2: { option: 'D2 · Dispatch publishing', label: 'Functional unit 2', title: 'Dispatch publishing', copy: 'Add assignment and publish writes with version, replay, and correction history.', intro: 'Assign crews and publish an exact day-plan version.', nav: ['Home', 'Manage'], active: 'Manage', capabilities: ['Everything in D1', 'Crew assignments', 'Versioned day-plan publish', 'Retry and conflict recovery'], card: ['Ready to publish', 'Three routes are ready; one unassigned stop blocks the West route.'] },
      d3: { option: 'D3 · Field follow-through', label: 'Functional unit 3', title: 'Field follow-through', copy: 'Expose route and job status after field reporting and date confidence are reliable.', intro: 'Follow the published plan without gaining job-execution authority.', nav: ['Home', 'Manage', 'Route', 'Jobs', 'Job'], active: 'Route', capabilities: ['Everything in D2', 'Route and stop progress', 'Job status context', 'No field execution controls'], card: ['Live follow-through', 'Route status is observational; crews retain assigned-job execution.'] },
      d4: { option: 'D4 · Schedule change recovery', label: 'Functional unit 4', title: 'Schedule change recovery', copy: 'Resolve conflicts through a new published version, never a silent route mutation.', intro: 'Review field requests and recover schedule conflicts.', nav: ['Home', 'Manage', 'Route', 'Jobs', 'Job'], active: 'Manage', capabilities: ['Everything in D3', 'Route-request review', 'Republish with exact history', 'Conflict and unknown-outcome recovery'], card: ['One change queue', 'Skip and added-service requests resolve through the day-plan workflow.'] },
    },
  },
  'billing-admin': {
    name: 'Billing Administrator', identity: 'Blair — Billing Administrator', shortName: 'Blair', role: 'Billing administrator', identityAction: 'Account', plan: `${sharedPlan}#billing-administrator`, panel: 'generic', context: 'Account readiness', heading: 'Start with complete customer records.', confidence: '3 need review',
    summary: 'Verify accounts, review delivered-work readiness, and hand exceptions off without implying payments or invoicing.',
    primary: { eyebrow: 'Billing-readiness queue', title: '3 accounts need review', copy: 'Two completed visits need report confirmation. One account is missing a billing contact.', facts: ['26 active accounts', '23 records ready', 'No invoice or payment controls'] },
    units: {
      b1: { option: 'B1 · Account records — minimum launch', label: 'Minimum launch', title: 'Account records', copy: 'A read-only customer account view with explicit missing and unavailable states.', intro: 'Verify customer, contact, and account context.', nav: ['Home', 'Accounts'], active: 'Accounts', capabilities: ['Exact organization/account authorization', 'Customer account records', 'Customer-safe portal context', 'Missing and unavailable distinctions'] },
      b2: { option: 'B2 · Completion readiness', label: 'Functional unit 2', title: 'Completion readiness', copy: 'Add immutable completion reports as billing input, not an invoice claim.', intro: 'Match delivered work to the correct account and visit.', nav: ['Home', 'Billing', 'Accounts'], active: 'Billing', capabilities: ['Everything in B1', 'Exact-visit completion reports', 'Pending versus delivered status', 'Correction handoff'], card: ['Ready for downstream billing', 'Completion is evidence for billing; Grover does not claim an invoice exists.'] },
      b3: { option: 'B3 · Account exception handoff', label: 'Functional unit 3', title: 'Account exception handoff', copy: 'Complete the current role boundary with traceable exceptions and no unsupported revenue tools.', intro: 'Resolve account and completion gaps with the owning operator.', nav: ['Home', 'Billing', 'Accounts'], active: 'Billing', capabilities: ['Everything in B2', 'Account-readiness queue', 'Named operational handoff', 'Audited resolution receipt'], card: ['Bounded role', 'Bids may be viewed in customer context; invoice, payment, refund, and ledger actions stay absent.'] },
    },
  },
  support: {
    name: 'Support Administrator', identity: 'Sage — Support Administrator', shortName: 'Sage', role: 'Support administrator', identityAction: 'Support access', plan: `${sharedPlan}#support-administrator`, panel: 'generic', context: 'Platform support', heading: 'Start with safe issue triage.', confidence: '2 active incidents',
    summary: 'Triage support, review auditable activity, recover operational failures, and perform guarded privacy work.',
    primary: { eyebrow: 'Support attention', title: '2 incidents need an owner', copy: 'A notification retry and a photo-processing failure have customer-visible impact.', facts: ['Tenant context required', 'Customer content minimized', 'All support actions audited'] },
    units: {
      s1: { option: 'S1 · Support triage — minimum launch', label: 'Minimum launch', title: 'Support triage', copy: 'Read-only tenant-scoped diagnostics before any recovery action is exposed.', intro: 'Confirm scope, impact, and the owning operational team.', nav: ['Home', 'Support'], active: 'Support', capabilities: ['Explicit support role and tenant context', 'Minimized diagnostic summary', 'Incident ownership', 'Access-ended and unavailable states'] },
      s2: { option: 'S2 · Access and delivery support', label: 'Functional unit 2', title: 'Access and delivery support', copy: 'Add team, invitation, activity, and notification tools with audit history.', intro: 'Resolve access and message-delivery issues in exact context.', nav: ['Home', 'Support'], active: 'Support', capabilities: ['Everything in S1', 'Member/invitation support', 'Team and operations activity', 'Notification delivery and retry'], card: ['Audited support', 'Support sees the minimum facts needed and records every recovery action.'] },
      s3: { option: 'S3 · Evidence and exception recovery', label: 'Functional unit 3', title: 'Evidence and exception recovery', copy: 'Add photo-processing and operational recovery after retry safety is proven.', intro: 'Recover failed evidence and operational exceptions.', nav: ['Home', 'Support'], active: 'Support', capabilities: ['Everything in S2', 'Completion and conversion reports', 'Photo-processing recovery', 'Operational exception resolution'], card: ['Recovery queue', 'Retry actions are idempotent and preserve the original failure evidence.'] },
      s4: { option: 'S4 · Privacy and erasure recovery', label: 'Functional unit 4', title: 'Privacy and erasure recovery', copy: 'Enable the highest-risk tools only with dual control and immutable audit evidence.', intro: 'Complete authorized privacy work without broad browsing authority.', nav: ['Home', 'Support'], active: 'Support', capabilities: ['Everything in S3', 'Customer privacy workflow', 'Photo-erasure recovery', 'Dual-control and immutable audit'], card: ['Guarded privacy work', 'Purpose, tenant, target, actor, and outcome are required for every action.'] },
    },
  },
  general: {
    name: 'Team Member', identity: 'Taylor — Access Pending', shortName: 'Taylor', role: 'No active organization role', identityAction: 'Sign out', plan: `${sharedPlan}#team-member-fallback`, panel: 'generic', context: 'Workspace access', heading: 'Finish access before work appears.', confidence: 'Action needed',
    summary: 'Explain the missing-role state and offer safe invitation or administrator recovery without exposing product data.',
    primary: { eyebrow: 'No active role', title: 'Your account is signed in', copy: 'No active organization role is assigned, so customer, field, billing, and support data remain unavailable.', facts: ['No workspace data loaded', 'Invitation can be checked safely', 'Sign out is always available'] },
    units: {
      g1: { option: 'G1 · Access resolution — complete fallback', label: 'Fallback experience', title: 'Access resolution', copy: 'A truthful, useful dead-end recovery state—not a partially authorized workspace.', intro: 'Check an invitation, contact an organization administrator, or sign out.', nav: ['Home'], active: 'Home', capabilities: ['Authenticated account identity only', 'No active-role explanation', 'Invitation/administrator recovery guidance', 'No protected workspace reads or writes'] },
    },
  },
};

const aliases = { 'yard-owner': 'owner', 'crew-lead': 'crew' };
const personaPicker = document.querySelector('#persona-picker');
const unitPicker = document.querySelector('#unit-picker');
const navIcon = { Home: '⌂', Route: '⌁', Jobs: '▤', Job: '✓', Visits: '▤', Proof: '✓', Portfolio: '▦', Manage: '⚙', Billing: '$', Accounts: '▦', Support: '!' };

function navMarkup(items, active = items.includes('Route') ? 'Route' : 'Home') {
  return items.map((item) => `<button type="button"${item === active ? ' class="active" aria-current="page"' : ''}><span aria-hidden="true">${navIcon[item] ?? '•'}</span><strong>${item}</strong></button>`).join('');
}

function unitOptions(persona, selected) {
  return Object.entries(persona.units).map(([key, unit]) => `<option value="${key}"${key === selected ? ' selected' : ''}>${unit.option}</option>`).join('');
}

function renderMap() {
  document.querySelector('#persona-map').innerHTML = Object.entries(personas).map(([key, persona]) => {
    const units = Object.entries(persona.units);
    const [firstKey, first] = units[0];
    const final = units.at(-1)[1];
    return `<button type="button" data-open-persona="${key}"><span class="eyebrow">${units.length} ${units.length === 1 ? 'complete unit' : 'cumulative units'}</span><strong>${persona.name}</strong><p>${persona.summary}</p><small><b>${firstKey.toUpperCase()}</b> ${first.title}</small>${units.length > 1 ? `<small><b>Final</b> ${final.title}</small>` : ''}</button>`;
  }).join('');
  document.querySelectorAll('[data-open-persona]').forEach((button) => button.addEventListener('click', () => {
    const key = button.dataset.openPersona;
    setUnit(key, Object.keys(personas[key].units)[0]);
    document.querySelector('#main-content').focus();
  }));
}

function renderGeneric(persona, unitKey, unit) {
  document.querySelector('#generic-kicker').textContent = persona.context;
  document.querySelector('#generic-title').textContent = persona.name;
  document.querySelector('#generic-promise').textContent = persona.summary;
  document.querySelector('#generic-confidence').textContent = persona.confidence;
  document.querySelector('#generic-context').textContent = persona.context;
  document.querySelector('#generic-heading').textContent = persona.heading;
  document.querySelector('#generic-primary').innerHTML = `<span class="eyebrow">${persona.primary.eyebrow}</span><h3>${persona.primary.title}</h3><p>${persona.primary.copy}</p><ul>${persona.primary.facts.map((fact) => `<li>${fact}</li>`).join('')}</ul>`;
  const keys = Object.keys(persona.units);
  const firstKey = keys[0];
  document.querySelector('#generic-boundary').hidden = unitKey !== firstKey;
  document.querySelector('#generic-boundary').innerHTML = `<span class="eyebrow">${keys.length === 1 ? 'Complete fallback boundary' : 'Minimum launch boundary'}</span><h3>One useful promise</h3><p>${unit.copy}</p><a href="${persona.plan}">Review dependencies and rollback →</a>`;
  const enabledCards = Object.entries(persona.units).filter(([key, candidate]) => key !== firstKey && candidate.card && keys.indexOf(key) <= keys.indexOf(unitKey));
  document.querySelector('#generic-cumulative').innerHTML = enabledCards.map(([key, candidate]) => `<article><span class="eyebrow">${key.toUpperCase()}</span><h3>${candidate.card[0]}</h3><p>${candidate.card[1]}</p></article>`).join('');
}

function showOnly(panel) {
  document.querySelector('#overview-experience').hidden = panel !== 'overview';
  document.querySelector('#owner-experience').hidden = panel !== 'owner';
  document.querySelector('#crew-experience').hidden = panel !== 'crew';
  document.querySelector('#generic-experience').hidden = panel !== 'generic';
}

function showOverview(announce = true) {
  document.body.dataset.persona = 'overview';
  document.body.dataset.unit = 'map';
  personaPicker.value = 'overview';
  unitPicker.innerHTML = '<option value="map">10 persona rollout contracts</option>';
  unitPicker.disabled = true;
  showOnly('overview');
  document.querySelector('#identity-name').textContent = 'Rollout design review';
  document.querySelector('#identity-action').textContent = 'Prototype';
  document.querySelector('#rail-persona').textContent = 'Rollout map';
  document.querySelector('#rail-name').textContent = '10 personas';
  document.querySelector('#rail-role').textContent = 'Functional units';
  document.querySelector('#brand-home').href = '#overview/map';
  document.querySelector('#rollout-plan-link').href = sharedPlan;
  const nav = navMarkup(['Home']);
  document.querySelector('#rail-nav').innerHTML = nav;
  const mobileNav = document.querySelector('#mobile-nav');
  mobileNav.innerHTML = nav;
  mobileNav.setAttribute('aria-label', 'Rollout map mobile navigation');
  if (location.hash !== '#overview/map') history.replaceState(null, '', '#overview/map');
  document.title = 'All-persona functional rollout · Grover';
  if (announce) document.querySelector('#announcer').textContent = 'Showing the all-persona rollout map';
}

function setUnit(personaKey, unitKey, announce = true) {
  const resolvedKey = aliases[personaKey] ?? personaKey;
  if (resolvedKey === 'overview') return showOverview(announce);
  const persona = personas[resolvedKey] ?? personas.owner;
  const fallback = Object.keys(persona.units)[0];
  const key = persona.units[unitKey] ? unitKey : fallback;
  const unit = persona.units[key];
  document.body.dataset.persona = resolvedKey;
  document.body.dataset.unit = key;
  personaPicker.value = resolvedKey;
  unitPicker.disabled = false;
  unitPicker.innerHTML = unitOptions(persona, key);
  showOnly(persona.panel);
  document.querySelector('#identity-name').textContent = persona.identity;
  document.querySelector('#identity-action').textContent = persona.identityAction;
  document.querySelector('#rail-persona').textContent = persona.role;
  document.querySelector('#rail-name').textContent = persona.shortName;
  document.querySelector('#rail-role').textContent = persona.role;
  document.querySelector('#brand-home').href = `#${resolvedKey}/${fallback}`;
  document.querySelector('#rollout-plan-link').href = persona.plan;
  document.querySelectorAll('[data-unit-label]').forEach((element) => { element.textContent = unit.label; });
  document.querySelectorAll('[data-unit-title]').forEach((element) => { element.textContent = unit.title; });
  document.querySelectorAll('[data-unit-copy]').forEach((element) => { element.textContent = unit.copy; });
  document.querySelectorAll('[data-unit-intro]').forEach((element) => { element.textContent = unit.intro; });
  const nav = navMarkup(unit.nav, unit.active);
  document.querySelector('#rail-nav').innerHTML = nav;
  const mobileNav = document.querySelector('#mobile-nav');
  mobileNav.innerHTML = nav;
  mobileNav.setAttribute('aria-label', `${persona.name} mobile navigation`);
  const innerNav = persona.panel === 'owner' ? '#portal-tabs' : persona.panel === 'crew' ? '#crew-tabs' : '#generic-tabs';
  document.querySelector(innerNav).innerHTML = nav;
  document.querySelectorAll('[data-capabilities]').forEach((element) => { element.innerHTML = unit.capabilities.map((capability) => `<span><b aria-hidden="true">✓</b>${capability}</span>`).join(''); });
  if (persona.panel === 'generic') renderGeneric(persona, key, unit);
  const hash = `#${resolvedKey}/${key}`;
  if (location.hash !== hash) history.replaceState(null, '', hash);
  document.title = `${persona.name} ${unit.title} · Grover rollout`;
  if (announce) document.querySelector('#announcer').textContent = `Showing ${persona.name}, ${unit.label}: ${unit.title}`;
}

function applyHash(announce = false) {
  const [personaRaw, unitRaw] = location.hash.slice(1).split('/');
  const resolved = aliases[personaRaw] ?? personaRaw;
  if (resolved === 'overview') return showOverview(announce);
  if (personas[resolved]) return setUnit(resolved, unitRaw, announce);
  setUnit('owner', personaRaw || 'u1', announce);
}

personaPicker.addEventListener('change', () => {
  const selected = personaPicker.value;
  if (selected === 'overview') return showOverview();
  setUnit(selected, Object.keys(personas[selected].units)[0]);
});
unitPicker.addEventListener('change', () => setUnit(personaPicker.value, unitPicker.value));
window.addEventListener('hashchange', () => applyHash());
renderMap();
applyHash();
