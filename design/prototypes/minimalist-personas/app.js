const personas = {
  owner: {
    name: 'Yard Owner', identity: 'Jamie R.', initials: 'JR', family: 'customer', familyLabel: 'Customer workspace', context: 'Sonoran House',
    title: 'Know what happens next.', promise: 'Your next visit and anything you need to do—nothing else competing for attention.', confidence: 'Visit confirmed',
    boundary: 'Routes, crew assignments, provider notes, billing, and broad support tools stay outside this customer view.',
    why: 'Owners usually need confidence before controls. The next visit, preparation, and next update answer the immediate question without exposing provider operations.',
    nav: [
      { id: 'today', label: 'Today', title: 'What is next for my yard?', copy: 'One current service answer and one preparation action.' },
      { id: 'visits', label: 'Visits', title: 'Upcoming and recent visits', copy: 'A short service history with status and date.' },
      { id: 'proof', label: 'Proof', title: 'Delivered care', copy: 'Only reviewed, customer-safe completion evidence.' },
    ],
    scenarios: {
      attention: { label: 'Next visit', title: 'Tuesday, September 8', status: 'Confirmed', copy: 'Routine yard care is scheduled for 8:00–10:00 AM.', facts: ['Unlock the side gate', 'Bring pets inside', 'Next update comes from your provider'], action: 'Review preparation', steps: ['Confirm the visit window.', 'Review the access note.', 'Mark preparation understood.'], queue: [['Preparation', 'Two items before arrival'], ['Latest proof', 'August 25 · Delivered']] },
      ready: { label: 'Today’s care', title: 'Your crew is on the way', status: 'On the way', copy: 'Arrival is expected between 8:20 and 8:40 AM.', facts: ['Preparation complete', 'Side gate access confirmed', 'No action required'], action: 'View visit', steps: ['Review the current arrival update.', 'Confirm the planned care.', 'Return to the live status.'], queue: [['Visit status', 'Updated 4 minutes ago'], ['Preparation', 'Complete']] },
      empty: { label: 'Current schedule', title: 'No visit is scheduled yet', status: 'Clear', copy: 'There is no current service date to prepare for.', facts: ['No action required', 'Past proof remains available', 'No schedule has been invented'], action: 'Review past visits', steps: ['Open recent visits.', 'Choose a completed visit.', 'Review delivered proof if available.'], queue: [['Recent visit', 'August 25 · Complete']] },
    },
  },
  'property-manager': {
    name: 'Property Manager', identity: 'Morgan L.', initials: 'ML', family: 'customer', familyLabel: 'Portfolio workspace', context: 'Desert Vista · 12 properties',
    title: 'Start with the property that needs you.', promise: 'Portfolio confidence is reduced to the exceptions that require a decision.', confidence: '2 need review',
    boundary: 'Provider-private routes, crew details, internal recovery notes, and unrelated properties remain hidden.',
    why: 'A property manager needs exception-first awareness across a portfolio, not a wall of equal-weight property cards.',
    nav: [
      { id: 'overview', label: 'Overview', title: 'Portfolio attention', copy: 'Coverage confidence and the next decision.' },
      { id: 'properties', label: 'Properties', title: 'Authorized properties', copy: 'Searchable readiness without provider-private operations.' },
      { id: 'proof', label: 'Proof', title: 'Delivered proof', copy: 'Reviewed outcomes grouped by property.' },
      { id: 'approvals', label: 'Approvals', title: 'Decisions', copy: 'Exact-property questions and versioned approvals.' },
    ],
    scenarios: {
      attention: { label: 'Highest priority', title: 'Mesa Court needs an access decision', status: 'Action needed', copy: 'Tomorrow’s approved visit cannot proceed until the gate instruction is confirmed.', facts: ['Visit: tomorrow, 9:00–11:00 AM', 'One missing access instruction', 'Provider is waiting for a response'], action: 'Resolve access', steps: ['Review the exact property and visit.', 'Confirm the current access instruction.', 'Send the bounded response.'], queue: [['Mesa Court', 'Access decision'], ['Juniper Row', 'Weather change to review']] },
      ready: { label: 'Portfolio status', title: 'All 12 properties are service-ready', status: 'On track', copy: 'Every upcoming visit has current coverage and access information.', facts: ['12 properties ready', '4 visits this week', 'No overdue decisions'], action: 'Review schedule', steps: ['Scan upcoming visits.', 'Open a property if needed.', 'Return to portfolio status.'], queue: [['This week', '4 confirmed visits'], ['Newest proof', '3 delivered reports']] },
      empty: { label: 'Portfolio status', title: 'No properties are assigned', status: 'No access', copy: 'This account has no active property grants.', facts: ['No customer data loaded', 'Invitation status can be checked', 'Administrator guidance is available'], action: 'Check access', steps: ['Review the signed-in account.', 'Check for a pending invitation.', 'Contact the named administrator if needed.'], queue: [['Access', 'No active property grants']] },
    },
  },
  crew: {
    name: 'Crew Lead', identity: 'Leah M.', initials: 'LM', family: 'field', familyLabel: 'Field workspace', context: 'North Route · Thursday, September 4',
    title: 'Start with the current stop.', promise: 'Route progress, safe property context, and the next field action stay visible in one glance.', confidence: 'Synced',
    boundary: 'Customer history, company administration, billing, and silent route changes do not enter the field workspace.',
    why: 'The Crew Lead coordinates a moving day. Current work and crew-safe context matter more than full schedules or company reporting.',
    nav: [
      { id: 'route', label: 'Route', title: 'Today’s ordered route', copy: 'Current stop first; the rest stays compact.' },
      { id: 'jobs', label: 'Jobs', title: 'Assigned jobs', copy: 'Only work assigned to this crew and date.' },
      { id: 'recovery', label: 'Recovery', title: 'Device-held work', copy: 'Queued changes and conflicts beside the affected stop.' },
    ],
    scenarios: {
      attention: { label: 'Current stop · 1 of 4', title: 'Oak Street residence', status: 'Ready', copy: 'Front and back lawn · Edges and hardscape cleanup.', facts: ['Gate code confirmed', 'Pets must remain inside', 'Estimated time: 55 minutes'], action: 'Start stop', steps: ['Confirm the property and scope.', 'Check access and safety notes.', 'Start the assigned stop.'], queue: [['Up next', 'Juniper Lane · 10:05 AM'], ['Route change', 'One office request']] },
      ready: { label: 'Current stop · 3 of 4', title: 'Palm Avenue complete', status: 'Saved', copy: 'Checklist and required photos are ready for the next sync.', facts: ['6 tasks complete', '3 photos queued', 'Next stop: 12 minutes away'], action: 'Continue route', steps: ['Confirm completion evidence.', 'Review the next stop.', 'Continue the route.'], queue: [['Next stop', 'Cactus Way · 1:10 PM'], ['Device', '3 photos saved']] },
      empty: { label: 'Today’s route', title: 'No route is assigned', status: 'Clear day', copy: 'There is no published work for this crew today.', facts: ['No stops loaded', 'No device-held changes', 'Office contact remains available'], action: 'Check another date', steps: ['Open the date selector.', 'Choose an available service date.', 'Review its published status.'], queue: [['Schedule', 'No published route today']] },
    },
  },
  'crew-member': {
    name: 'Crew Member', identity: 'Mateo S.', initials: 'MS', family: 'field', familyLabel: 'Assigned-work workspace', context: 'North Route Crew · Today',
    title: 'Focus on your assigned work.', promise: 'The current job and the next safe action appear without crew-level planning controls.', confidence: 'Synced',
    boundary: 'Route publishing, stop reassignment, crew changes, customer history, and company controls stay with the Crew Lead or office.',
    why: 'Crew Members need a smaller execution view than Crew Leads. Removing coordination controls makes assignment authority unmistakable.',
    nav: [
      { id: 'work', label: 'My work', title: 'Assigned work', copy: 'Only the current member’s tasks.' },
      { id: 'route', label: 'Route', title: 'Crew route', copy: 'Read-only order and current location context.' },
      { id: 'saved', label: 'Saved', title: 'Saved on this device', copy: 'Personal queued work and recovery.' },
    ],
    scenarios: {
      attention: { label: 'Your current task', title: 'Trim front hedges', status: 'Not started', copy: 'Oak Street residence · Stop 1 of 4.', facts: ['Expected: 20 minutes', 'Keep 18-inch clearance from walkway', 'Crew Lead: Leah'], action: 'Start task', steps: ['Confirm this is your assignment.', 'Review the task instruction.', 'Start your progress record.'], queue: [['After this', 'Hardscape cleanup'], ['Evidence', 'One after photo required']] },
      ready: { label: 'Your current task', title: 'Front hedges complete', status: 'Recorded', copy: 'Progress is saved and the required photo is attached.', facts: ['20 minutes recorded', 'Photo attached', 'Crew Lead can review'], action: 'Open next task', steps: ['Confirm saved progress.', 'Review the next assigned task.', 'Continue when ready.'], queue: [['Next task', 'Hardscape cleanup'], ['Saved work', 'All changes synced']] },
      empty: { label: 'Assigned work', title: 'No task is assigned', status: 'Waiting', copy: 'The crew route exists, but no individual task is assigned to you.', facts: ['No work controls shown', 'Route remains read only', 'Crew Lead owns reassignment'], action: 'View crew route', steps: ['Review the current crew stop.', 'Confirm there is no personal assignment.', 'Ask the Crew Lead if work is expected.'], queue: [['Crew route', 'Stop 1 of 4 · Read only']] },
    },
  },
  'company-owner': {
    name: 'Company Owner', identity: 'Avery K.', initials: 'AK', family: 'operations', familyLabel: 'Business workspace', context: 'Grover Yard Care',
    title: 'Know whether the business is ready.', promise: 'Company readiness and the most consequential blocker come before day-to-day detail.', confidence: '1 setup action',
    boundary: 'Platform support, customer-private content, accounting, payments, and low-level field controls stay outside this owner overview.',
    why: 'The owner needs business readiness and exceptions. Dispatch detail belongs to the team unless it creates an owner-level risk.',
    nav: [
      { id: 'home', label: 'Home', title: 'Business readiness', copy: 'The one issue most likely to affect operation.' },
      { id: 'operations', label: 'Operations', title: 'Today’s service', copy: 'High-level route and workload confidence.' },
      { id: 'customers', label: 'Customers', title: 'Customer readiness', copy: 'Accounts needing owner-level attention.' },
      { id: 'team', label: 'Team', title: 'Team access', copy: 'Invitations, staffing, and role safety.' },
    ],
    scenarios: {
      attention: { label: 'Business blocker', title: 'One crew lead invitation is pending', status: 'Action needed', copy: 'Tomorrow’s fourth route cannot publish without an active lead.', facts: ['Invite sent September 2', 'Route affects 5 customers', 'No access granted until acceptance'], action: 'Review invitation', steps: ['Confirm the intended recipient and role.', 'Review the affected route.', 'Reissue or revoke the invitation.'], queue: [['Tomorrow', '1 route not ready'], ['Today', '4 routes operating normally']] },
      ready: { label: 'Business readiness', title: 'The company is ready for today', status: 'Operational', copy: 'Crews, customer access, and published work have no owner-level blockers.', facts: ['4 crews active', '18 stops published', 'No access issues'], action: 'Review operations', steps: ['Review the operating summary.', 'Open any route-level exception.', 'Return to owner readiness.'], queue: [['Today', '18 stops · 4 crews'], ['Customer care', 'No overdue owner decisions']] },
      empty: { label: 'Company setup', title: 'Finish the operating foundation', status: 'Setup needed', copy: 'No crew can be scheduled until the first team members are invited.', facts: ['Organization created', 'No active crews', 'No customer work published'], action: 'Invite first teammate', steps: ['Choose the least-privilege role.', 'Confirm the recipient.', 'Send the invitation.'], queue: [['Setup', 'Create the first crew'], ['Access', 'Invite a team member']] },
    },
  },
  'company-manager': {
    name: 'Company Manager', identity: 'Riley T.', initials: 'RT', family: 'operations', familyLabel: 'Operations workspace', context: 'Today’s operation · 18 stops',
    title: 'Resolve what threatens today’s service.', promise: 'The highest service risk, its impact, and the next coordinating action lead the workspace.', confidence: '1 route risk',
    boundary: 'Owner-only setup, invitations, privacy administration, platform support, and unrelated reports stay outside daily operations.',
    why: 'Managers need exception-driven coordination. Showing every metric equally hides the one decision that protects today’s service.',
    nav: [
      { id: 'today', label: 'Today', title: 'Today’s operation', copy: 'Current risk and service confidence.' },
      { id: 'schedule', label: 'Schedule', title: 'Day plans', copy: 'Draft, publish, and correction history.' },
      { id: 'customers', label: 'Customers', title: 'Customer handoffs', copy: 'Only service readiness and active questions.' },
      { id: 'recovery', label: 'Recovery', title: 'Operational recovery', copy: 'Owned exceptions linked to affected work.' },
    ],
    scenarios: {
      attention: { label: 'Highest service risk', title: 'West route needs balancing', status: 'At risk', copy: 'A long stop puts the final arrival window 35 minutes late.', facts: ['5 stops on West route', 'One movable 30-minute stop', 'Customer update not sent'], action: 'Balance route', steps: ['Review capacity and travel impact.', 'Choose the safe destination route.', 'Publish the corrected plan.'], queue: [['West route', '35-minute risk'], ['Recovery', '1 photo retry owned']] },
      ready: { label: 'Today’s operation', title: 'All routes are on track', status: 'On track', copy: 'Crews are assigned and current arrival windows remain achievable.', facts: ['18 of 18 stops assigned', '4 routes published', 'No unresolved field requests'], action: 'Review live progress', steps: ['Scan route progress.', 'Open a stop if its state changes.', 'Return to the current operation.'], queue: [['In progress', '7 of 18 stops complete'], ['Recovery', 'No urgent exceptions']] },
      empty: { label: 'Today’s operation', title: 'No day plan exists', status: 'Not planned', copy: 'No routes or assignments have been published for this date.', facts: ['18 approved visits waiting', '4 crews available', 'No customer update sent'], action: 'Build day plan', steps: ['Review approved visits.', 'Assign crews within capacity.', 'Publish an exact plan version.'], queue: [['Approved work', '18 visits'], ['Crew capacity', '4 crews available']] },
    },
  },
  dispatcher: {
    name: 'Dispatcher', identity: 'Drew P.', initials: 'DP', family: 'operations', familyLabel: 'Dispatch workspace', context: 'Thursday dispatch · 4 routes',
    title: 'Make the day publishable.', promise: 'Assignments and capacity blockers lead; broader company administration disappears.', confidence: '1 unassigned stop',
    boundary: 'Job execution, customer administration, team invitations, billing, and owner-only controls remain outside dispatch.',
    why: 'Dispatch is a plan-quality role. The first screen should answer what blocks publication and provide the correction in context.',
    nav: [
      { id: 'plan', label: 'Day plan', title: 'Publishability', copy: 'Unassigned work and capacity blockers.' },
      { id: 'crews', label: 'Crews', title: 'Crew workload', copy: 'Availability and route capacity.' },
      { id: 'changes', label: 'Changes', title: 'Field requests', copy: 'Requests resolved through a new plan version.' },
    ],
    scenarios: {
      attention: { label: 'Publish blocker', title: 'One stop is unassigned', status: 'Blocked', copy: 'The West route has capacity for the 30-minute Cactus Way visit.', facts: ['3 routes ready', '4 crews available', 'West route has 45 minutes capacity'], action: 'Assign stop', steps: ['Review stop requirements.', 'Confirm crew capacity and travel.', 'Assign and publish the new plan version.'], queue: [['Cactus Way', '30 minutes · Unassigned'], ['West route', '45 minutes available']] },
      ready: { label: 'Day plan', title: 'All routes are ready to publish', status: 'Ready', copy: 'Every stop has a crew and no capacity limit is exceeded.', facts: ['18 of 18 stops assigned', '4 crews staffed', 'No overlapping windows'], action: 'Publish day plan', steps: ['Review the exact plan version.', 'Confirm assignments and warnings.', 'Publish to the field teams.'], queue: [['North route', '5 stops · Ready'], ['West route', '4 stops · Ready']] },
      empty: { label: 'Day plan', title: 'No approved visits for this date', status: 'Clear', copy: 'There is nothing to assign or publish.', facts: ['No draft plan', 'Crew availability unchanged', 'No customer messages needed'], action: 'Choose another date', steps: ['Open the date selector.', 'Choose a date with approved visits.', 'Review its publishability.'], queue: [['Next active date', 'Friday · 14 visits']] },
    },
  },
  'billing-admin': {
    name: 'Billing Administrator', identity: 'Blair N.', initials: 'BN', family: 'admin', familyLabel: 'Billing-readiness workspace', context: 'Completion readiness · September',
    title: 'Start with incomplete billing evidence.', promise: 'Delivered-work readiness is actionable without pretending Grover creates invoices or takes payment.', confidence: '3 need review',
    boundary: 'Invoice creation, payment collection, refunds, tax, ledger, profitability, and provider-private field notes are absent.',
    why: 'The supported role verifies that completed service records are ready for downstream billing. Unsupported financial operations must not fill the screen.',
    nav: [
      { id: 'readiness', label: 'Readiness', title: 'Completion readiness', copy: 'Records missing verified completion context.' },
      { id: 'accounts', label: 'Accounts', title: 'Account records', copy: 'Customer and billing-contact readiness.' },
      { id: 'handoffs', label: 'Handoffs', title: 'Exception handoffs', copy: 'Traceable requests to the owning operator.' },
    ],
    scenarios: {
      attention: { label: 'Next incomplete record', title: 'Mesa Court · September 3', status: 'Needs proof', copy: 'The visit is complete, but the delivered report has not been confirmed.', facts: ['Account contact is current', 'Completion time recorded', 'Manager review is pending'], action: 'Request confirmation', steps: ['Review the exact account and visit.', 'Confirm which evidence is missing.', 'Send a traceable handoff to the manager.'], queue: [['Mesa Court', 'Report confirmation'], ['Juniper Row', 'Billing contact missing']] },
      ready: { label: 'Billing readiness', title: 'All completed visits are ready', status: 'Ready', copy: 'Every September completion record has the required customer and proof context.', facts: ['23 records ready', '0 missing reports', '0 missing contacts'], action: 'Review ready records', steps: ['Open the readiness list.', 'Choose an exact completion record.', 'Confirm its immutable evidence.'], queue: [['September', '23 ready records'], ['Handoffs', 'No unresolved requests']] },
      empty: { label: 'Billing readiness', title: 'No completed visits yet', status: 'No records', copy: 'There are no completion records in the selected period.', facts: ['No billing-readiness work', 'Account records remain available', 'No invoice state implied'], action: 'Choose another period', steps: ['Open the period selector.', 'Choose a period with completed work.', 'Review readiness records.'], queue: [['Previous period', 'August · 31 records']] },
    },
  },
  support: {
    name: 'Support Administrator', identity: 'Sage V.', initials: 'SV', family: 'admin', familyLabel: 'Scoped support workspace', context: 'Platform support · Exact tenant required',
    title: 'Own the incident before opening tools.', promise: 'Impact, tenant scope, and the next safe recovery action appear without broad customer browsing.', confidence: '2 active incidents',
    boundary: 'Cross-tenant search, casual customer browsing, unlogged recovery, and high-risk privacy tools without dual control stay absent.',
    why: 'Support access is exceptional. Requiring an owned incident and exact context before tools prevents a generic administrator console.',
    nav: [
      { id: 'incidents', label: 'Incidents', title: 'Owned incidents', copy: 'Impact and accountable next action.' },
      { id: 'activity', label: 'Activity', title: 'Scoped activity', copy: 'Minimized history for the selected incident.' },
      { id: 'access', label: 'Access', title: 'Temporary access', copy: 'Purpose-bound support scope and expiry.' },
    ],
    scenarios: {
      attention: { label: 'Highest impact', title: 'Owner update delivery failed', status: 'Unowned', copy: 'One customer-visible service update exhausted automatic retries.', facts: ['Tenant: Grover Yard Care', 'Visit: opaque support reference', 'Original event remains immutable'], action: 'Take ownership', steps: ['Confirm tenant, purpose, and impact.', 'Accept incident ownership.', 'Open the bounded retry evidence.'], queue: [['Delivery failure', 'Customer-visible · Unowned'], ['Photo processing', 'Provider-visible · Owned']] },
      ready: { label: 'Support queue', title: 'Every active incident has an owner', status: 'Covered', copy: 'Two incidents are progressing within their response expectations.', facts: ['2 active incidents', '2 named owners', 'No expired support access'], action: 'Review owned work', steps: ['Open the assigned incident.', 'Review its last audited action.', 'Confirm the next response time.'], queue: [['Delivery failure', 'Owned by Sage'], ['Photo processing', 'Owned by Kai']] },
      empty: { label: 'Support queue', title: 'No active incidents', status: 'Clear', copy: 'There is no current support work in the selected scope.', facts: ['No tenant data opened', 'No temporary access active', 'Audit history remains available'], action: 'Review recent activity', steps: ['Open minimized recent activity.', 'Choose an incident reference if needed.', 'Return without opening tenant data.'], queue: [['Recent resolution', 'Notification retry · Closed']] },
    },
  },
  general: {
    name: 'Team Member', identity: 'Taylor J.', initials: 'TJ', family: 'access', familyLabel: 'Access workspace', context: 'Signed in · No active role',
    title: 'Finish access before work appears.', promise: 'A useful, truthful dead end explains the account state without exposing a partial workspace.', confidence: 'Action needed',
    boundary: 'Customer, field, company, billing, and support data never load while no active role is assigned.',
    why: 'A no-role account should not resemble a broken dashboard. The safest experience explains the state and offers only valid recovery paths.',
    nav: [{ id: 'home', label: 'Home', title: 'Access resolution', copy: 'Invitation and administrator guidance only.' }],
    scenarios: {
      attention: { label: 'Workspace access', title: 'Your account has no active role', status: 'No role', copy: 'Check an invitation or contact your organization administrator.', facts: ['Signed in as Taylor J.', 'No workspace data loaded', 'Sign out is always available'], action: 'Check invitation', steps: ['Review pending invitations for this account.', 'Accept a valid invitation or note its status.', 'Contact the named administrator if none exists.'], queue: [['Invitation', 'No accepted invitation'], ['Account', 'Signed in successfully']] },
      ready: { label: 'Invitation', title: 'An invitation is ready to review', status: 'Pending', copy: 'Grover Yard Care invited this account to a Crew Member role.', facts: ['Organization shown before acceptance', 'Role and access summary available', 'No access granted yet'], action: 'Review invitation', steps: ['Confirm the organization.', 'Review the proposed role and access.', 'Accept or decline deliberately.'], queue: [['Grover Yard Care', 'Crew Member · Pending']] },
      empty: { label: 'Workspace access', title: 'No invitations were found', status: 'No access', copy: 'Ask an organization administrator to invite this exact account.', facts: ['No protected reads attempted', 'Account identity is valid', 'Safe sign out available'], action: 'View guidance', steps: ['Confirm the account email outside this prototype.', 'Share it with the organization administrator.', 'Return after an invitation is sent.'], queue: [['Next step', 'Contact an administrator']] },
    },
  },
};

const personaViews = {
  owner: {
    visits: {
      attention: { label: 'Next and recent', title: 'Two visits tell the whole story', status: 'One upcoming', copy: 'The next confirmed visit stays first; completed care stays available without a calendar dashboard.', facts: ['Sep 8 · Confirmed', 'Aug 25 · Complete', 'Aug 11 · Complete'], action: 'Open September 8 visit', steps: ['Review the confirmed arrival window.', 'Confirm planned care and preparation.', 'Continue to delivered proof when ready.'], queueTitle: 'Visits in useful order', queue: [['September 8', 'Confirmed · 8:00–10:00 AM'], ['August 25', 'Complete · Proof delivered']], nextView: 'proof', nextLabel: 'Continue to proof' },
      ready: { label: 'Today’s visit', title: 'Care is underway at Sonoran House', status: 'In progress', copy: 'The current visit is separated from history so the live update stays easy to find.', facts: ['Arrived at 8:26 AM', 'Routine care in progress', 'Completion update comes next'], action: 'Follow today’s visit', steps: ['Review the latest provider update.', 'Confirm what work is underway.', 'Return for delivered proof after completion.'], queueTitle: 'Current, then history', queue: [['Today', 'Care in progress'], ['August 25', 'Complete · Proof delivered']], nextView: 'today', nextLabel: 'Return to today' },
      empty: { label: 'Visit history', title: 'No upcoming visit is scheduled', status: 'History only', copy: 'Completed visits remain available without suggesting that future service exists.', facts: ['Aug 25 · Complete', 'Aug 11 · Complete', 'No upcoming date'], action: 'Open August 25 visit', steps: ['Open the completed visit.', 'Review its service summary.', 'Continue to delivered proof.'], queueTitle: 'Completed visits', queue: [['August 25', 'Routine care · Complete'], ['August 11', 'Routine care · Complete']], nextView: 'proof', nextLabel: 'Review its proof' },
    },
    proof: {
      attention: { label: 'Latest delivered proof', title: 'August 25 care is ready to review', status: 'Delivered', copy: 'Only the provider-reviewed completion snapshot appears here.', facts: ['6 checklist items complete', '3 reviewed photos', 'No owner decision required'], action: 'Review delivered proof', steps: ['Confirm the completed service and date.', 'Review the customer-safe checklist.', 'Inspect the reviewed before-and-after evidence.'], queueTitle: 'Delivered, not draft', queue: [['August 25', '3 photos · 6 tasks'], ['August 11', '2 photos · 6 tasks']], optionsLabel: 'Was this proof understandable?', options: ['Yes, the completed care is clear', 'I need to ask about this visit'], confirmLabel: 'Record prototype response' },
      ready: { label: 'Proof reviewed', title: 'Latest care is clear', status: 'Reviewed', copy: 'The delivered snapshot remains available as immutable service history.', facts: ['Reviewed today', 'August 25 service', 'No open decision'], action: 'Review again', steps: ['Open the delivered snapshot.', 'Compare the checklist and photos.', 'Return to proof history.'], queueTitle: 'Recent proof', queue: [['August 25', 'Reviewed'], ['August 11', 'Delivered']] },
      empty: { label: 'Delivered proof', title: 'No proof has been delivered yet', status: 'Not available', copy: 'Draft work and unpublished photos stay hidden until a completed visit is reviewed and delivered.', facts: ['No published snapshot', 'No draft evidence exposed', 'Visit history remains available'], action: 'Return to visits', steps: ['Open visit history.', 'Review the current visit state.', 'Return when proof is delivered.'], queueTitle: 'What is available', queue: [['Visits', 'Service history only']], nextView: 'visits', nextLabel: 'Open visits' },
    },
  },
  'property-manager': {
    properties: {
      attention: { label: 'Property readiness', title: 'Mesa Court is blocked by access', status: 'Needs decision', copy: 'The property view keeps the exact visit, access gap, and customer-safe response together.', facts: ['Tomorrow · 9:00–11:00 AM', 'Gate instruction missing', '11 other properties ready'], action: 'Update access instruction', steps: ['Confirm the Mesa Court property.', 'Review the instruction currently on file.', 'Choose the customer-safe access response.'], queueTitle: 'Only exceptions first', queue: [['Mesa Court', 'Access blocks tomorrow'], ['Juniper Row', 'Weather change acknowledged']], optionsLabel: 'Access response', options: ['Use the on-site office call box', 'Hold the visit until access is confirmed', 'Ask the provider a visit-specific question'], confirmLabel: 'Preview response', nextView: 'overview', nextLabel: 'Return to overview' },
      ready: { label: 'Property readiness', title: 'All 12 properties are ready', status: 'Current', copy: 'Search and property detail remain available without crowding the overview with twelve equal cards.', facts: ['12 ready properties', '4 confirmed visits', '0 access blockers'], action: 'Review property list', steps: ['Scan authorized properties.', 'Open one exact property.', 'Return to portfolio readiness.'], queueTitle: 'Upcoming service', queue: [['Mesa Court', 'Tomorrow · Confirmed'], ['Juniper Row', 'Friday · Confirmed']] },
      empty: { label: 'Authorized properties', title: 'No properties are assigned', status: 'No access', copy: 'Property data stays withheld until an active portfolio or property grant exists.', facts: ['No records loaded', 'No search results invented', 'Access guidance remains available'], action: 'Review access guidance', steps: ['Confirm the signed-in account.', 'Check for a portfolio invitation.', 'Contact the named administrator.'], queueTitle: 'Safe recovery', queue: [['Account access', 'No active grants']] },
    },
    proof: {
      attention: { label: 'Newest delivered work', title: 'Three property reports are ready', status: 'Delivered', copy: 'Proof is grouped by property and date, with unpublished provider evidence excluded.', facts: ['Mesa Court · Sep 3', 'Juniper Row · Sep 2', 'Ocotillo Place · Aug 30'], action: 'Review Mesa Court proof', steps: ['Confirm the exact property and visit.', 'Review the delivered checklist.', 'Inspect only customer-safe evidence.'], queueTitle: 'Delivered reports', queue: [['Mesa Court', 'Sep 3 · 4 photos'], ['Juniper Row', 'Sep 2 · 3 photos'], ['Ocotillo Place', 'Aug 30 · 2 photos']], nextView: 'approvals', nextLabel: 'Continue to decisions' },
      ready: { label: 'Proof status', title: 'All new reports have been reviewed', status: 'Current', copy: 'Delivered evidence remains searchable by property without creating an attention state.', facts: ['3 reviewed this week', '12 properties covered', '0 missing reports'], action: 'Browse proof history', steps: ['Choose an authorized property.', 'Open a delivered report.', 'Return to the current portfolio.'], queueTitle: 'Recently reviewed', queue: [['Mesa Court', 'Reviewed today'], ['Juniper Row', 'Reviewed yesterday']] },
      empty: { label: 'Delivered proof', title: 'No reports are available', status: 'No proof', copy: 'The portfolio can remain valid even when no completed service has produced delivered proof.', facts: ['No delivered reports', 'No draft evidence shown', 'Properties remain available'], action: 'Return to properties', steps: ['Open authorized properties.', 'Review upcoming service.', 'Return after a report is delivered.'], queueTitle: 'Available now', queue: [['Properties', '12 authorized records']], nextView: 'properties', nextLabel: 'Open properties' },
    },
    approvals: {
      attention: { label: 'Decision queue', title: 'Mesa Court recommendation needs a response', status: 'Due Friday', copy: 'The exact recommendation version and property context stay together before any decision is recorded.', facts: ['Irrigation repair · Version 2', '$285 approved scope', 'No work scheduled by a decision'], action: 'Review recommendation', steps: ['Confirm property, scope, price, and version.', 'Choose approve, ask a question, or decide later.', 'Review the non-scheduling consequence.'], queueTitle: 'Decisions, not notifications', queue: [['Mesa Court', 'Recommendation · Due Friday'], ['Juniper Row', 'Question answered']], optionsLabel: 'Response to version 2', options: ['Approve this exact recommendation', 'Ask a question before deciding', 'Decide later'], confirmLabel: 'Preview decision', nextView: 'overview', nextLabel: 'Return to overview' },
      ready: { label: 'Decision history', title: 'No portfolio decisions are waiting', status: 'Clear', copy: 'Past receipts remain available without turning completed decisions into active work.', facts: ['2 decisions this month', 'Both receipts retained', 'No overdue questions'], action: 'Review decision history', steps: ['Choose a property decision.', 'Review the exact version and response.', 'Return to the clear queue.'], queueTitle: 'Recent outcomes', queue: [['Mesa Court', 'Approved · Version 1'], ['Ocotillo Place', 'Declined · Version 3']] },
      empty: { label: 'Decision queue', title: 'No questions or approvals exist', status: 'No decisions', copy: 'An empty decision queue does not imply missing property or service access.', facts: ['No recommendations waiting', 'No unanswered questions', 'Portfolio remains current'], action: 'Return to overview', steps: ['Open portfolio readiness.', 'Review any service exceptions.', 'Return when a decision is published.'], queueTitle: 'Portfolio state', queue: [['Overview', '12 properties current']], nextView: 'overview', nextLabel: 'Open overview' },
    },
  },
  crew: {
    jobs: {
      attention: { label: 'Assigned jobs', title: 'Four stops, one route decision', status: 'Current plan', copy: 'The crew sees ordered work while the active stop and office request remain unmistakable.', facts: ['Oak Street · Current', 'Juniper Lane · Up next', 'Cactus Way · Office request'], action: 'Open Oak Street job', steps: ['Confirm the exact property and planned scope.', 'Review crew-safe access and safety notes.', 'Continue into field evidence or route recovery.'], queueTitle: 'Ordered for this crew', queue: [['1 · Oak Street', 'Current · 55 minutes'], ['2 · Juniper Lane', 'Ready · 45 minutes'], ['3 · Cactus Way', 'Change requested']], nextView: 'recovery', nextLabel: 'Review route request' },
      ready: { label: 'Assigned jobs', title: 'Three stops complete, one remains', status: 'On track', copy: 'Completed work is compact while the next assigned stop stays first.', facts: ['3 of 4 complete', 'Cactus Way · Next', 'All saved work synced'], action: 'Open Cactus Way job', steps: ['Confirm the next property.', 'Review its assigned scope.', 'Continue to the stop when the crew is ready.'], queueTitle: 'Current order', queue: [['4 · Cactus Way', 'Ready · 35 minutes'], ['Completed', '3 stops']] },
      empty: { label: 'Assigned jobs', title: 'No jobs are published today', status: 'Clear day', copy: 'The crew receives no placeholder stops or execution controls.', facts: ['No assigned jobs', 'No published route', 'No device-held changes'], action: 'Return to route', steps: ['Open the route view.', 'Confirm the selected service date.', 'Contact the office only if work was expected.'], queueTitle: 'Available now', queue: [['Route', 'No published work']], nextView: 'route', nextLabel: 'Open route' },
    },
    recovery: {
      attention: { label: 'Route request', title: 'Cactus Way access changed', status: 'Office review', copy: 'The published stop remains unchanged until the Crew Lead sends a request and the office responds.', facts: ['Stop 3 of 4', 'Gate access unavailable', 'No silent route mutation'], action: 'Review route options', steps: ['Confirm the affected stop and access change.', 'Choose a request without rewriting the plan.', 'Send the request for office review.'], queueTitle: 'Recovery beside the route', queue: [['Cactus Way', 'Access change · Needs response'], ['Device queue', 'No unsynced progress']], optionsLabel: 'Crew Lead request', options: ['Request a skip for office review', 'Keep the stop and ask an access question', 'Wait and decide after the current stop'], confirmLabel: 'Preview route request', nextView: 'route', nextLabel: 'Return to route' },
      ready: { label: 'Field recovery', title: 'No route issue needs attention', status: 'Clear', copy: 'Resolved requests and synchronized field work stay available as concise history.', facts: ['0 open route requests', '0 progress conflicts', 'Last sync 2 minutes ago'], action: 'Review recovery history', steps: ['Open the latest resolved request.', 'Review its published-plan outcome.', 'Return to the active route.'], queueTitle: 'Recent outcomes', queue: [['Palm Avenue', 'Request resolved · Kept stop']] },
      empty: { label: 'Field recovery', title: 'Nothing is saved on this device', status: 'Clear', copy: 'No recovery controls appear when there is no queued work, conflict, or route request.', facts: ['0 queued changes', '0 conflicts', 'No active route'], action: 'Return to route', steps: ['Open the route view.', 'Confirm no work is assigned.', 'Return when a plan is published.'], queueTitle: 'Available now', queue: [['Route', 'No published work']], nextView: 'route', nextLabel: 'Open route' },
    },
  },
  'crew-member': {
    route: {
      attention: { label: 'Crew route · Read only', title: 'You are at stop 1 of 4', status: 'Current stop', copy: 'The route provides location and sequence context without exposing publish or reassignment controls.', facts: ['Oak Street · Current', 'Juniper Lane · Up next', 'Crew Lead coordinates changes'], action: 'Review current stop', steps: ['Confirm the crew’s current property.', 'Review the next stop for context.', 'Return to your assigned task.'], queueTitle: 'Context, not authority', queue: [['Current', 'Oak Street · Stop 1'], ['Up next', 'Juniper Lane · Stop 2']], nextView: 'work', nextLabel: 'Return to my work' },
      ready: { label: 'Crew route · Read only', title: 'The crew is on stop 3 of 4', status: 'On track', copy: 'Sequence and progress remain visible while coordination stays with the Crew Lead.', facts: ['Palm Avenue · Current', 'Cactus Way · Final stop', 'No route action available'], action: 'Return to my work', steps: ['Review the current crew stop.', 'Confirm your active assignment.', 'Return to the task view.'], queueTitle: 'Crew position', queue: [['Current', 'Palm Avenue · Stop 3'], ['Final', 'Cactus Way · Stop 4']], nextView: 'work', nextLabel: 'Open my work' },
      empty: { label: 'Crew route · Read only', title: 'No route is assigned today', status: 'Clear day', copy: 'No customer or route detail loads when this crew has no published plan.', facts: ['No stops loaded', 'No assignment controls', 'Crew Lead contact available'], action: 'Return to my work', steps: ['Confirm the selected date.', 'Review personal assignment state.', 'Ask the Crew Lead only if work was expected.'], queueTitle: 'Available now', queue: [['My work', 'No assigned task']], nextView: 'work', nextLabel: 'Open my work' },
    },
    saved: {
      attention: { label: 'Saved on this device', title: 'One photo is waiting to upload', status: 'Needs signal', copy: 'The photo remains attached to the exact task and is never described as persisted before server confirmation.', facts: ['Oak Street · Front hedges', 'Saved at 9:18 AM', 'Original remains on this device'], action: 'Choose recovery', steps: ['Confirm the task and saved evidence.', 'Choose retry or Crew Lead handoff.', 'Keep the original until confirmation.'], queueTitle: 'Only your saved work', queue: [['Photo upload', 'Oak Street · Waiting'], ['Progress', 'All other changes synced']], optionsLabel: 'Recovery choice', options: ['Retry when a connection is available', 'Keep safely on device and tell the Crew Lead'], confirmLabel: 'Preview recovery', nextView: 'work', nextLabel: 'Return to my work' },
      ready: { label: 'Personal recovery', title: 'All your changes are synced', status: 'Synced', copy: 'Confirmed work stays out of the recovery queue.', facts: ['0 waiting uploads', '0 progress conflicts', 'Last sync 2 minutes ago'], action: 'Return to my work', steps: ['Confirm the empty recovery queue.', 'Open the active assignment.', 'Continue the current task.'], queueTitle: 'Device state', queue: [['Changes', 'All confirmed']], nextView: 'work', nextLabel: 'Open my work' },
      empty: { label: 'Personal recovery', title: 'Nothing is saved on this device', status: 'Clear', copy: 'There is no personal queued work to retry or hand off.', facts: ['0 queued changes', '0 conflicts', 'No assigned task'], action: 'Return to my work', steps: ['Confirm no saved work exists.', 'Open personal assignments.', 'Return when work is assigned.'], queueTitle: 'Available now', queue: [['My work', 'No assigned task']], nextView: 'work', nextLabel: 'Open my work' },
    },
  },
};

const personaConnections = {
  owner: { today: { attention: { nextView: 'visits', nextLabel: 'Continue to visits', optionType: 'checkbox', optionsLabel: 'Preparation check', options: ['Side gate will be unlocked', 'Pets will be inside'], confirmLabel: 'Confirm preparation' } } },
  'property-manager': { overview: { attention: { nextView: 'properties', nextLabel: 'Open Mesa Court', optionsLabel: 'Access response', options: ['Use the on-site office call box', 'Hold until access is confirmed', 'Ask a visit-specific question'], confirmLabel: 'Preview response' } } },
  crew: { route: { attention: { nextView: 'jobs', nextLabel: 'Continue to jobs', optionType: 'checkbox', optionsLabel: 'Field readiness check', options: ['Property and scope confirmed', 'Access and safety notes reviewed'], confirmLabel: 'Confirm crew ready' } } },
  'crew-member': { work: { attention: { nextView: 'saved', nextLabel: 'Continue to saved work', optionType: 'checkbox', optionsLabel: 'Task readiness check', options: ['Assignment confirmed', 'Task instruction reviewed'], confirmLabel: 'Start task in prototype' } } },
};

const icons = { today: '⌂', visits: '▤', proof: '✓', overview: '⌂', properties: '▦', approvals: '✓', route: '⌁', jobs: '▤', recovery: '↻', work: '✓', saved: '↻', home: '⌂', operations: '▦', customers: '◇', team: '◎', schedule: '▦', plan: '▦', crews: '◎', changes: '↻', readiness: '✓', accounts: '◇', handoffs: '↗', incidents: '!', activity: '▤', access: '◇' };
const personaPicker = document.querySelector('#persona-picker');
const scenarioPicker = document.querySelector('#scenario-picker');
const main = document.querySelector('#main-content');
const detail = document.querySelector('#task-detail');
const completion = document.querySelector('#completion');
let state = { persona: 'owner', scenario: 'attention', view: 'today' };
let lastTrigger = null;
let completionTarget = null;

personaPicker.innerHTML = Object.entries(personas).map(([key, persona]) => `<option value="${key}">${persona.name}</option>`).join('');

function navMarkup(persona, view) {
  return persona.nav.map((item) => `<button type="button" data-view="${item.id}"${item.id === view ? ' class="active" aria-current="page"' : ''}><span aria-hidden="true">${icons[item.id] ?? '•'}</span><strong>${item.label}</strong></button>`).join('');
}

function scenarioFor(persona) {
  return persona.scenarios[state.scenario] ?? persona.scenarios.attention;
}

function render(announce = true) {
  const persona = personas[state.persona] ?? personas.owner;
  const availableView = persona.nav.find((item) => item.id === state.view) ?? persona.nav[0];
  state.view = availableView.id;
  const scenario = scenarioFor(persona);
  const isPrimaryView = state.view === persona.nav[0].id;
  const designedView = personaViews[state.persona]?.[state.view]?.[state.scenario];
  const baseFocus = isPrimaryView ? scenario : designedView ?? {
    label: availableView.label,
    title: availableView.title,
    status: state.scenario === 'empty' ? 'No current work' : 'Focused view',
    copy: availableView.copy,
    facts: scenario.queue.map(([title, value]) => `${title}: ${value}`).slice(0, 3),
    action: `Open ${availableView.label.toLowerCase()}`,
    steps: [`Review the ${availableView.label.toLowerCase()} context.`, 'Open one exact record.', 'Return to the priority view when finished.'],
    queue: scenario.queue,
  };
  const focus = { ...baseFocus, ...(personaConnections[state.persona]?.[state.view]?.[state.scenario] ?? {}) };

  document.body.dataset.persona = state.persona;
  document.body.dataset.family = persona.family;
  document.body.dataset.scenario = state.scenario;
  personaPicker.value = state.persona;
  scenarioPicker.value = state.scenario;
  document.querySelector('#rail-family').textContent = persona.familyLabel;
  document.querySelector('#rail-role').textContent = persona.name;
  document.querySelector('#rail-identity').textContent = persona.identity;
  document.querySelector('#mobile-initials').textContent = persona.initials;
  document.querySelector('#page-context').textContent = `${persona.context} · ${availableView.label}`;
  document.querySelector('#page-title').textContent = isPrimaryView ? persona.title : availableView.title;
  document.querySelector('#page-promise').textContent = isPrimaryView ? persona.promise : availableView.copy;
  document.querySelector('#confidence').textContent = state.scenario === 'attention' ? persona.confidence : focus.status;
  document.querySelector('#focus-label').textContent = focus.label;
  document.querySelector('#focus-title').textContent = focus.title;
  document.querySelector('#focus-status').textContent = focus.status;
  document.querySelector('#focus-copy').textContent = focus.copy;
  document.querySelector('#focus-facts').innerHTML = focus.facts.map((fact) => `<span>${fact}</span>`).join('');
  document.querySelector('#primary-action').textContent = focus.action;
  document.querySelector('#why-copy').textContent = persona.why;
  document.querySelector('#boundary-copy').textContent = persona.boundary;
  document.querySelector('#support-title').textContent = focus.queueTitle ?? 'A short, useful queue';
  document.querySelector('#task-list').innerHTML = focus.queue.map(([title, value], index) => `<button type="button" data-queue-index="${index}"><span>${title}</span><strong>${value}</strong><i aria-hidden="true">→</i></button>`).join('');
  document.querySelector('#desktop-nav').innerHTML = navMarkup(persona, state.view);
  document.querySelector('#mobile-nav').innerHTML = navMarkup(persona, state.view);
  document.querySelector('#why-button').setAttribute('aria-expanded', 'false');
  document.querySelector('#why-panel').hidden = true;
  detail.hidden = true;
  completion.hidden = true;
  document.title = `${persona.name} · ${availableView.label} · Grover minimalist prototype`;
  history.replaceState(null, '', `#${state.persona}/${state.scenario}/${state.view}`);
  bindDynamicControls(focus, persona);
  if (announce) document.querySelector('#announcer').textContent = `Showing ${persona.name}, ${scenarioPicker.selectedOptions[0].text}, ${availableView.label}`;
}

function bindDynamicControls(focus, persona) {
  document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => {
    state.view = button.dataset.view;
    render();
    main.focus({ preventScroll: true });
  }));
  document.querySelectorAll('[data-queue-index]').forEach((button) => button.addEventListener('click', () => {
    const [title, value] = focus.queue[Number(button.dataset.queueIndex)];
    openDetail(button, { title: `Review ${title.toLowerCase()}`, copy: value, steps: [`Confirm this ${title.toLowerCase()} belongs to ${persona.context}.`, 'Review the current status and owner.', 'Return to the priority task.'] });
  }));
  document.querySelector('#primary-action').onclick = (event) => openDetail(event.currentTarget, { ...focus, title: focus.action });
}

function openDetail(trigger, task) {
  lastTrigger = trigger;
  completionTarget = task.nextView ? { view: task.nextView, label: task.nextLabel } : null;
  document.querySelector('#detail-title').textContent = task.title;
  document.querySelector('#detail-copy').textContent = task.copy;
  document.querySelector('#detail-steps').innerHTML = task.steps.map((step) => `<li>${step}</li>`).join('');
  const options = document.querySelector('#detail-options');
  const optionList = document.querySelector('#detail-option-list');
  const completeButton = document.querySelector('#complete-action');
  if (task.options?.length) {
    document.querySelector('#detail-options-label').textContent = task.optionsLabel ?? 'Choose a response';
    const type = task.optionType ?? 'radio';
    optionList.innerHTML = task.options.map((option, index) => `<label><input type="${type}" name="detail-response" value="${index}"><span>${option}</span></label>`).join('');
    options.hidden = false;
    completeButton.disabled = true;
    completeButton.textContent = task.confirmLabel ?? 'Preview response';
    optionList.querySelectorAll('input').forEach((input) => input.addEventListener('change', () => {
      const selected = optionList.querySelectorAll('input:checked').length;
      completeButton.disabled = type === 'checkbox' ? selected < task.options.length : selected === 0;
    }));
  } else {
    options.hidden = true;
    optionList.innerHTML = '';
    completeButton.disabled = false;
    completeButton.textContent = task.confirmLabel ?? 'Done';
  }
  detail.hidden = false;
  completion.hidden = true;
  detail.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  document.querySelector('#close-detail').focus({ preventScroll: true });
  document.querySelector('#announcer').textContent = `${task.title} detail opened`;
}

function closeDetail() {
  detail.hidden = true;
  lastTrigger?.focus({ preventScroll: true });
  document.querySelector('#announcer').textContent = 'Task detail closed';
}

document.querySelector('#why-button').addEventListener('click', (event) => {
  const panel = document.querySelector('#why-panel');
  panel.hidden = !panel.hidden;
  event.currentTarget.setAttribute('aria-expanded', String(!panel.hidden));
});
document.querySelector('#close-detail').addEventListener('click', closeDetail);
document.querySelector('#cancel-action').addEventListener('click', closeDetail);
document.querySelector('#complete-action').addEventListener('click', () => {
  const action = document.querySelector('#detail-title').textContent;
  detail.hidden = true;
  document.querySelector('#completion-title').textContent = `${action} recorded in this prototype`;
  document.querySelector('#completion-copy').textContent = 'This confirms the interaction design only. No production data was changed.';
  document.querySelector('#reset-action').textContent = completionTarget?.label ?? 'Return to workspace';
  completion.hidden = false;
  document.querySelector('#reset-action').focus({ preventScroll: true });
});
document.querySelector('#reset-action').addEventListener('click', () => {
  completion.hidden = true;
  if (completionTarget) {
    state.view = completionTarget.view;
    completionTarget = null;
    render();
    main.focus({ preventScroll: true });
    return;
  }
  lastTrigger?.focus({ preventScroll: true });
  document.querySelector('#announcer').textContent = 'Returned to workspace';
});
personaPicker.addEventListener('change', () => {
  state.persona = personaPicker.value;
  state.view = personas[state.persona].nav[0].id;
  render();
  main.focus({ preventScroll: true });
});
scenarioPicker.addEventListener('change', () => {
  state.scenario = scenarioPicker.value;
  render();
  main.focus({ preventScroll: true });
});

function restoreFromHash() {
  const [personaKey, scenarioKey, viewKey] = location.hash.slice(1).split('/');
  const persona = personas[personaKey] ? personaKey : 'owner';
  const scenario = ['attention', 'ready', 'empty'].includes(scenarioKey) ? scenarioKey : 'attention';
  const view = personas[persona].nav.some((item) => item.id === viewKey) ? viewKey : personas[persona].nav[0].id;
  state = { persona, scenario, view };
  render(false);
}

window.addEventListener('hashchange', restoreFromHash);
restoreFromHash();
