(() => {
  const body = document.body;
  const publicContent = document.querySelector('[data-public-content]');
  const publicHeader = document.querySelector('[data-public-header]');
  const appShell = document.querySelector('[data-app-shell]');
  const stageView = document.querySelector('[data-stage-view]');
  const stageMain = document.querySelector('#stage-content');
  const stageNav = document.querySelector('[data-stage-nav]');
  const contextRail = document.querySelector('[data-context-rail]');
  const live = document.querySelector('[data-live]');
  const mobileProgress = document.querySelector('[data-mobile-progress]');
  const providerName = document.querySelector('[data-provider-name]');
  const readinessLabel = document.querySelector('[data-readiness-label]');
  const reviewDialog = document.querySelector('[data-review-dialog]');
  const reviewStages = document.querySelector('[data-review-stages]');
  const confirmDialog = document.querySelector('[data-confirm-dialog]');
  const confirmContent = document.querySelector('[data-confirm-content]');
  const toast = document.querySelector('[data-toast]');

  const stages = [
    ['path', 'Select business role'],
    ['profile', 'Company profile'],
    ['readiness', 'Services & qualification'],
    ['opportunities', 'Service opportunities'],
    ['request', 'Disclosure request'],
    ['assessment', 'Site assessment'],
    ['proposal', 'Service proposal'],
    ['setup', 'Service mobilization'],
    ['support', 'Provider support'],
  ];

  const state = {
    stage: 'welcome',
    path: 'solo',
    completed: new Set(),
    providerName: 'Desert & Pine Landscape Services',
    services: new Set(['upkeep', 'cleanup']),
    opportunityState: 'ready',
    failInterest: false,
    interestFailed: false,
    interest: 'none',
    disclosed: false,
    assessmentMode: 'undecided',
    assessmentScheduled: false,
    proposal: 'draft',
    setup: 'unassigned',
    profileError: false,
    reportSent: false,
  };

  const escapeHtml = (value) => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  function heading(eyebrow, title, description) {
    return `<header class="stage-heading"><p class="eyebrow">${eyebrow}</p><h1 tabindex="-1" data-stage-title>${title}</h1><p>${description}</p></header>`;
  }

  function note(kind, title, text) {
    return `<aside class="stage-note ${kind}"><span aria-hidden="true">${kind === 'warning' ? '!' : 'i'}</span><div><strong>${title}</strong>${text}</div></aside>`;
  }

  const views = {
    path: () => `
      <div class="stage-view">
        ${heading('Provider onboarding · Step 1', 'What is your operating role?', 'Select the path that reflects your business authority and day-to-day responsibility. Review the resulting access before creating or joining an organization.')}
        <fieldset class="choice-grid" aria-describedby="path-help"><legend class="live-region">Provider path</legend>
          ${pathChoice('solo', '1', 'Owner-operator', 'Create a provider organization of one with company-administration and field-service permissions.', 'Provider organization · one operator')}
          ${pathChoice('company', '2+', 'Company principal or operations manager', 'Create or claim the provider organization, define operational ownership, and invite office and field personnel.', 'Provider organization · multiple roles')}
          ${pathChoice('invited', '↳', 'Crew leader or team member', 'Verify the invitation, offered role, and branch scope. You will not create or claim the business.', 'Invitation-only organization access')}
        </fieldset>
        <p class="stage-note private" id="path-help"><span aria-hidden="true">◉</span><span><strong>Owners engage the landscape service provider—not an individual employee.</strong> Estimating authority, crew assignment, and personnel access remain within the provider organization.</span></p>
        <div class="stage-actions"><button class="button button-primary" type="button" data-continue-path>Continue with this path</button><button class="button button-secondary" type="button" data-go-stage="welcome">Return to overview</button></div>
      </div>`,
    profile: () => `
      <div class="stage-view">
        ${heading('Provider onboarding · Step 2', state.path === 'company' ? 'Create or claim the provider organization' : 'Establish your owner-operator business profile', state.path === 'company' ? 'Use the legal or trade identity customers recognize. Grover checks for likely duplicates before creating another provider organization.' : 'An owner-operator uses a provider organization of one and holds both company-administration and field-service responsibilities.')}
        ${state.profileError ? '<div class="form-error" role="alert"><strong>Review the required company details.</strong> Enter a business name, verified contact, and authority attestation. Your entries have been preserved.</div>' : ''}
        <form class="stage-card form-grid" id="provider-profile-form" novalidate>
          <label class="field full"><span>Legal or customer-facing business name *</span><small>Use the legal name, registered trade name, or established business name customers should recognize.</small><input name="providerName" value="${escapeHtml(state.providerName)}" autocomplete="organization" required></label>
          <label class="field"><span>Business email *</span><small>Email verification is required before activation.</small><input name="email" value="hello@desertpine.example" type="email" autocomplete="email" required></label>
          <label class="field"><span>Business mobile number *</span><small>Phone verification is required before activation.</small><input name="phone" value="(602) 555-0148" type="tel" autocomplete="tel" required></label>
          <label class="field"><span>Business structure</span><select name="model"><option ${state.path === 'solo' ? 'selected' : ''}>Owner-operator</option><option ${state.path === 'company' ? 'selected' : ''}>Multi-crew provider</option></select></label>
          <label class="field"><span>Primary language</span><select><option>English</option><option>Spanish</option><option>English and Spanish</option></select></label>
          <label class="checkbox-row full"><input name="authority" type="checkbox" ${state.profileError ? '' : 'checked'}><span><strong>I attest that I am authorized to represent this business.</strong><br>I understand that profile creation does not establish licensing, insurance, certification, or eligibility for service opportunities.</span></label>
          <div class="stage-actions full"><button class="button button-primary" type="submit">Save company profile</button><button class="button button-secondary" type="button" data-show-duplicate>Review possible duplicate</button></div>
        </form>
        ${note('warning', 'Illustrative company information only', 'This prototype does not verify business identity, contact ownership, authority, license, insurance, certification, or registration status.')}
      </div>`,
    readiness: () => `
      <div class="stage-view">
        ${heading('Provider onboarding · Step 3', 'Define service capabilities and operating limits', 'Declared capabilities and service territory improve fit. They do not guarantee opportunity volume, contract award, route density, or territory exclusivity.')}
        <section class="stage-card"><h2>Landscape service categories</h2><p class="opportunity-meta">Select only services your business is equipped, qualified, and legally permitted to assess and perform. A category can be paused later.</p>
          <div class="chip-group" data-service-chips>${serviceChip('upkeep', 'Recurring landscape maintenance')}${serviceChip('cleanup', 'Seasonal cleanups')}${serviceChip('lawn', 'Turf maintenance')}${serviceChip('desert', 'Desert landscape maintenance')}${serviceChip('irrigation', 'Irrigation inspection & repair')}${serviceChip('trees', 'Ornamental tree & shrub maintenance')}</div>
        </section>
        <section class="stage-card form-grid"><h2 class="field full">Service territory and response standard</h2>
          <label class="field"><span>Primary service territory</span><input value="Central Phoenix" autocomplete="address-level2"></label>
          <label class="field"><span>Service radius</span><select><option>Approximately 12 miles</option><option>Selected postal codes</option><option>Define on service-area map</option></select></label>
          <label class="field"><span>Site assessment method</span><select><option>On site preferred</option><option>Desktop review first</option><option>Either method</option></select></label>
          <label class="field"><span>Standard response time</span><select><option>Within 1 business day</option><option>Within 2 business days</option><option>Within 3 business days</option></select></label>
        </section>
        <section class="stage-card"><div class="opportunity-top"><div><h2>Qualification and credential record</h2><p class="opportunity-meta">Each fact retains its source, scope, review status, effective date, expiration, and correction path.</p></div><span class="status status-pending">2 require review</span></div>
          <ul class="readiness-list"><li><span class="readiness-icon">✓</span><div><strong>Business identity submitted</strong><small>Legal or trade identity submitted Aug 14, 2026</small></div><span class="status status-info">Provider supplied</span></li><li><span class="readiness-icon">↻</span><div><strong>Certificate of insurance</strong><small>Document supplied; independent validation not simulated</small></div><span class="status status-pending">Validation pending</span></li><li><span class="readiness-icon">✓</span><div><strong>Opportunity response authority</strong><small>${state.path === 'company' ? 'Morgan Reyes · Operations manager' : 'Morgan Reyes · Owner-operator'}</small></div><span class="status status-ready">Assigned</span></li><li><span class="readiness-icon">!</span><div><strong>Tree-work service eligibility</strong><small>Jurisdiction and proposed scope require review</small></div><button class="text-action" type="button" data-open-correction>Review</button></li></ul>
        </section>
        <div class="stage-actions"><button class="button button-primary" type="button" data-complete-readiness>Complete qualification review</button><button class="button button-secondary" type="button" data-pause-profile>Pause new opportunities</button></div>
      </div>`,
    opportunities: () => opportunityView(),
    request: () => requestView(),
    assessment: () => assessmentView(),
    proposal: () => proposalView(),
    setup: () => setupView(),
    support: () => supportView(),
    invited: () => invitedView(),
  };

  function pathChoice(value, icon, title, description, result) {
    return `<label class="choice-card"><input type="radio" name="providerPath" value="${value}" ${state.path === value ? 'checked' : ''}><span class="choice-icon" aria-hidden="true">${icon}</span><strong>${title}</strong><p>${description}</p><small>${result}</small></label>`;
  }

  function serviceChip(id, label) {
    return `<button class="chip" type="button" aria-pressed="${state.services.has(id)}" data-service="${id}">${label}</button>`;
  }

  function opportunityView() {
    const headingBlock = heading('Service opportunity workspace', 'Review owner-authorized service opportunities', 'Previews contain an approximate service area and owner-authorized maintenance requirements. A statement of interest requests site-assessment access; it does not award, accept, assign, or schedule work.');
    if (state.opportunityState === 'unavailable') return `<div class="stage-view">${headingBlock}<div class="empty-state"><span class="empty-icon" aria-hidden="true">↻</span><h2>Service opportunities are temporarily unavailable</h2><p>Your qualification record and filters are preserved. Grover cannot confirm current service requests, so it will not display stale inventory or misrepresent an empty result.</p><button class="button button-primary" type="button" data-review-opportunities="ready">Retry opportunity search</button><button class="button button-secondary" type="button" data-go-stage="support">Contact provider support</button></div></div>`;
    if (state.opportunityState === 'paused') return `<div class="stage-view">${headingBlock}<div class="empty-state"><span class="empty-icon" aria-hidden="true">Ⅱ</span><h2>New service opportunities are paused</h2><p>Your business profile remains available where applicable, but no new opportunities will enter this workspace. Active owner conversations and approved service remain unchanged.</p><button class="button button-primary" type="button" data-resume-opportunities>Resume service opportunities</button><button class="button button-secondary" type="button" data-go-stage="support">Review capacity settings</button></div></div>`;
    if (state.opportunityState === 'empty') return `<div class="stage-view">${headingBlock}<div class="opportunity-toolbar"><input class="search-field" aria-label="Search service opportunities" value="tree removal"><button class="button button-secondary" type="button">Filters · 3</button></div><div class="filter-row"><button class="chip selected" type="button">Central Phoenix</button><button class="chip selected" type="button">Tree work</button><button class="chip selected" type="button">12-mile service radius</button></div><div class="empty-state"><span class="empty-icon" aria-hidden="true">⌕</span><h2>No suitable service opportunities match these filters</h2><p>Grover will not expand your declared service territory or disclose private owner requests to populate the list. Remove a filter, update a qualified capability, or return later.</p><button class="button button-primary" type="button" data-review-opportunities="ready">Remove tree-work filter</button><button class="button button-secondary" type="button" data-save-search>Save opportunity search</button></div></div>`;
    return `<div class="stage-view">${headingBlock}
      <div class="opportunity-toolbar"><label><span class="live-region">Search service opportunities</span><input class="search-field" aria-label="Search service opportunities" placeholder="Search service category or approximate area"></label><button class="button button-secondary" type="button" data-review-opportunities="empty">Filters · 2</button></div>
      <div class="filter-row"><button class="chip selected" type="button">Central Phoenix</button><button class="chip selected" type="button">Declared services</button><button class="chip" type="button" data-review-opportunities="empty">Tree removal</button></div>
      <div class="opportunity-list">
        ${opportunityCard('opp-1', 'Recurring desert landscape maintenance', 'Central Phoenix', 'Routine maintenance + cleanup', 'Provider to recommend', 'On-site assessment requested', 'Strong service alignment', true)}
        ${opportunityCard('opp-2', 'Initial landscape cleanup and reset', 'Encanto area', 'One-time cleanup', 'One-time service', 'Desktop review permitted', 'Review route impact', false)}
      </div>
      ${note('private', 'Preliminary service briefs protect both parties', 'Exact address, owner contact, photographs, site-access instructions, competing providers, ranking, and owner budget are excluded.')}
    </div>`;
  }

  function opportunityCard(id, title, area, care, cadence, assessment, fit, primary) {
    return `<article class="opportunity-card" data-opportunity-id="${id}"><div class="opportunity-top"><div><span class="status ${primary ? 'status-fit' : 'status-pending'}">${fit}</span><h2>${title}</h2><p class="opportunity-meta">${area} · Statement of interest due Aug ${primary ? '18' : '17'}, 2026</p></div><button class="button button-secondary" type="button" data-go-stage="request">Review service brief</button></div><div class="opportunity-facts"><div><span>Requested services</span><strong>${care}</strong></div><div><span>Service cadence</span><strong>${cadence}</strong></div><div><span>Assessment requirement</span><strong>${assessment}</strong></div></div><ul class="fit-list"><li>Aligns with ${primary ? '2' : '1'} declared service categories</li><li>${primary ? 'Approximately 4 miles inside' : 'Near the boundary of'} your service territory</li></ul></article>`;
  }

  function requestView() {
    if (state.disclosed) return `<div class="stage-view">${heading('Owner-authorized site disclosure', 'Morgan authorized site-assessment access', 'The disclosure receipt records the data categories available to this provider. Access is limited to assessment activity and may be withdrawn.')}
      <section class="stage-card"><div class="opportunity-top"><div><span class="status status-ready">Assessment access authorized</span><h2>Recurring desert landscape maintenance</h2><p class="opportunity-meta">Disclosure receipt · Aug 14, 2026 at 3:20 PM</p></div><button class="text-action" type="button" data-show-receipt>View disclosure receipt</button></div><div class="disclosure-table"><div class="disclosure-row"><div><strong>Exact service address</strong><small>Authorized for site assessment and arrival planning</small></div><span class="status status-ready">Shared</span></div><div class="disclosure-row"><div><strong>Owner contact channel</strong><small>In-app communication only; telephone remains private</small></div><span class="status status-info">Limited</span></div><div class="disclosure-row"><div><strong>Site photographs</strong><small>4 owner-selected intake photographs</small></div><span class="status status-ready">Shared</span></div><div class="disclosure-row"><div><strong>Gate and animal-control details</strong><small>Withheld until an on-site assessment is confirmed</small></div><span class="status status-pending">Withheld</span></div></div></section>
      <div class="stage-actions"><button class="button button-primary" type="button" data-go-stage="assessment">Begin site assessment</button><button class="button button-secondary" type="button" data-go-stage="support">Report concern or withdraw</button></div></div>`;
    const failed = state.interestFailed ? '<div class="form-error" role="alert"><strong>Your statement of interest was not submitted.</strong> The service opportunity remains available and your owner-visible note is preserved. Retry when ready.</div>' : '';
    const pending = state.interest === 'pending' ? `<div class="stage-note warning"><span aria-hidden="true">…</span><div><strong>Awaiting owner authorization</strong>Morgan may authorize individual disclosure categories, ask a question, select another provider, or allow the request to expire.</div></div><div class="stage-actions"><button class="button button-primary" type="button" data-owner-approve>Review disclosure status</button><button class="button button-secondary" type="button" data-withdraw-interest>Withdraw statement of interest</button></div>` : '';
    return `<div class="stage-view">${heading('Preliminary service brief', 'Recurring desert landscape maintenance', 'Evaluate whether to pursue a site assessment using only owner-authorized preview information. Do not infer property dimensions, site conditions, access, production cost, or price.')}
      ${failed}
      <section class="stage-card"><div class="opportunity-top"><div><span class="status status-fit">Strong service alignment</span><h2>Owner’s preliminary service brief</h2></div><span class="opportunity-meta">Service request SR-104 · Illustrative</span></div><div class="opportunity-facts"><div><span>Approximate service area</span><strong>Central Phoenix</strong></div><div><span>Landscape areas</span><strong>Front and rear yards</strong></div><div><span>Service objective</span><strong>Consistent routine maintenance</strong></div></div><p class="stage-note private"><span aria-hidden="true">◉</span><span><strong>Site details remain private</strong> Exact address, owner contact, 4 photographs, gate details, and animal information require provider-specific owner authorization.</span></p></section>
      <section class="stage-card"><h2>Statement of interest</h2><label class="field"><span>Optional owner-visible qualification note</span><small>Include only information needed to request an assessment. Do not request communication outside Grover.</small><textarea>We perform recurring desert landscape maintenance in Central Phoenix. We request site-assessment access to verify conditions, service areas, and whether an on-site visit is required.</textarea></label></section>
      ${state.interest === 'pending' ? pending : `<div class="stage-actions"><button class="button button-primary" type="button" data-interest>Submit interest and request assessment access</button><button class="button button-secondary" type="button" data-safe-question>Request clarification</button><button class="text-action" type="button" data-decline-request>Decline opportunity</button><button class="text-action" type="button" data-report-request>Report service request</button></div><p class="opportunity-meta">A statement of interest does not award work, disclose competing providers, create an agreement, or authorize service.</p>`}
    </div>`;
  }

  function assessmentView() {
    const scheduled = state.assessmentScheduled ? `<div class="stage-note private"><span aria-hidden="true">✓</span><div><strong>Site-assessment window confirmed</strong>Tuesday, Aug 18 · 9:00–11:00 AM. This appointment authorizes assessment only; it is not a service visit or work order.</div></div>` : '';
    return `<div class="stage-view">${heading('Site assessment', 'Document known conditions, constraints, and open items', 'Owner photographs and answers provide preliminary context. They do not establish measurements, diagnosis, safe access, production requirements, or a defensible service price.')}
      ${scheduled}
      <section class="assessment-grid"><article class="yard-zone"><span class="status status-info">Owner photograph · illustrative</span><h3>Front landscape area</h3><p>Desert planting, two ornamental beds, and visible leaf litter. Plant health, irrigation-system performance, and debris volume remain unverified.</p><button class="text-action" type="button">Review photograph details</button></article><article class="yard-zone"><span class="status status-pending">Field verification required</span><h3>Rear landscape area</h3><p>The owner marked irrigation condition “unknown” and disclosed a dog. Gate procedure and animal-control instructions remain withheld until the assessment visit is confirmed.</p><button class="text-action" type="button" data-safe-question>Request owner clarification</button></article></section>
      <section class="stage-card"><h2>Assessment method decision</h2><div class="choice-grid"><label class="choice-card"><input type="radio" name="assessment" value="remote" ${state.assessmentMode === 'remote' ? 'checked' : ''}><span class="choice-icon">⌂</span><strong>Desktop assessment is sufficient</strong><p>Proceed only when the disclosed information supports a defensible scope without field measurements or access verification.</p></label><label class="choice-card"><input type="radio" name="assessment" value="onsite" ${state.assessmentMode === 'onsite' ? 'checked' : ''}><span class="choice-icon">→</span><strong>On-site assessment is required</strong><p>Verify dimensions, site access, existing conditions, hazards, production requirements, and service feasibility in person.</p></label><label class="choice-card"><input type="radio" name="assessment" value="decline" ${state.assessmentMode === 'decline' ? 'checked' : ''}><span class="choice-icon">×</span><strong>Assessment cannot be completed responsibly</strong><p>Decline the opportunity without inventing a diagnosis or disclosing private commercial reasoning.</p></label></div></section>
      <section class="stage-card form-grid"><h2 class="field full">Owner-visible site-assessment window</h2><label class="field"><span>Assessment date</span><input type="date" value="2026-08-18"></label><label class="field"><span>Arrival window</span><select><option>9:00–11:00 AM</option><option>1:00–3:00 PM</option></select></label><label class="field full"><span>Assessment scope</span><textarea>Verify landscape service areas, site access, debris volume, observable irrigation-system condition, and production requirements for recurring landscape maintenance.</textarea></label></section>
      ${note('warning', 'Stop-work and qualification boundary', 'Do not proceed where tree hazards, electrical exposure, chemical conditions, structural concerns, or requested services exceed the provider’s training, authorization, equipment, or legal scope.')}
      <div class="stage-actions"><button class="button button-primary" type="button" data-schedule-assessment>${state.assessmentScheduled ? 'Continue to service proposal' : 'Propose site-assessment window'}</button><button class="button button-secondary" type="button" data-provider-note>Add provider-private assessment note</button></div>
    </div>`;
  }

  function proposalView() {
    const proposalStatus = state.proposal === 'accepted' ? '<span class="status status-ready">Proposal v1 approved by owner</span>' : state.proposal === 'sent' ? '<span class="status status-pending">Issued · awaiting owner decision</span>' : '<span class="status status-info">Estimate draft · version 1</span>';
    return `<div class="stage-view">${heading('Service estimate and proposal', 'Convert verified site conditions into a defined scope of work', 'Document inclusions, exclusions, cadence, pricing, assumptions, and proposal validity. Issuing a proposal does not assign a crew, create a work order, or schedule service.')}
      <section class="stage-card"><div class="opportunity-top"><div>${proposalStatus}<h2>Recurring desert landscape maintenance</h2><p class="opportunity-meta">Proposal version 1 · Valid through Aug 28, 2026</p></div><strong>$165 / service visit</strong></div>
        <table class="scope-table"><thead><tr><th>Scope item</th><th>Included services</th><th>Exclusions</th></tr></thead><tbody><tr><td>Front and rear landscape areas</td><td>Green-waste removal, ornamental-bed detailing, shrub shaping, and hardscape blow-off</td><td>Tree removal, irrigation repair, and hauling above 2 cubic yards</td></tr><tr><td>Recurring service cadence</td><td>Every other week with advance arrival-window confirmation</td><td>Guaranteed exact arrival time</td></tr><tr><td>Initial service mobilization</td><td>One-time landscape reset: $240</td><td>Recurring service rate</td></tr></tbody></table>
        <div class="opportunity-facts"><div><span>Weather delay</span><strong>Reschedule notification</strong></div><div><span>Service evidence</span><strong>Before/after photos + completion report</strong></div><div><span>Cancellation notice</span><strong>48 hours</strong></div></div>
      </section>
      ${state.proposal === 'sent' ? `<section class="stage-card"><h2>Proposal clarification and revision</h2><p class="opportunity-meta">Morgan asked whether seasonal cleanup includes fallen palm debris. A clarification or revision does not constitute proposal approval.</p><label class="field"><span>Owner-visible clarification</span><textarea>Fallen palm debris is included up to the stated volume. Palm pruning and removal of attached fronds are excluded.</textarea></label><div class="stage-actions"><button class="button button-secondary" type="button" data-answer-question>Issue clarification</button><button class="button button-secondary" type="button" data-revise-proposal>Create proposal version 2</button></div></section><div class="stage-actions"><button class="button button-primary" type="button" data-simulate-acceptance>Review approved-proposal state</button></div>` : ''}
      ${state.proposal === 'accepted' ? `${note('private', 'Approved proposal snapshot is immutable', 'Proposal version 1, pricing, terms, disclosure receipt, and owner approval remain reviewable. Any later scope or price change requires a new proposal version or documented change order.')}<div class="stage-actions"><button class="button button-primary" type="button" data-go-stage="setup">Begin service mobilization</button><button class="button button-secondary" type="button" data-show-accepted>View approved proposal</button></div>` : state.proposal === 'draft' ? `<div class="stage-actions"><button class="button button-primary" type="button" data-send-proposal>Issue proposal to owner</button><button class="button button-secondary" type="button">Save estimate draft</button></div>` : ''}
    </div>`;
  }

  function setupView() {
    const confirmed = state.setup === 'confirmed';
    return `<div class="stage-view">${heading('Service mobilization', confirmed ? 'The initial service work order is confirmed' : 'Proposal approval does not assign production work', confirmed ? 'The approved service relationship has entered field operations with an assigned crew, work order, and confirmed service window.' : 'Complete property onboarding, translate the approved scope into operational instructions, assign the responsible crew, and confirm the initial service window before the owner sees scheduled work.')}
      <section class="stage-card"><div class="opportunity-top"><div><span class="status ${confirmed ? 'status-ready' : 'status-pending'}">${confirmed ? 'Work order ready' : 'Mobilization in progress'}</span><h2>Morgan Reyes · Residential property</h2><p class="opportunity-meta">Approved proposal v1 · Service relationship REL-104</p></div><span class="status status-info">No payment simulated</span></div>
        <ul class="readiness-list"><li><span class="readiness-icon">✓</span><div><strong>Customer account and service property linked</strong><small>Only owner-authorized facts copied with source provenance</small></div><span class="status status-ready">Complete</span></li><li><span class="readiness-icon">✓</span><div><strong>Scope converted to operational service instructions</strong><small>Approved scope remains separate from provider-private production notes</small></div><span class="status status-ready">Complete</span></li><li><span class="readiness-icon">${confirmed ? '✓' : '3'}</span><div><strong>Responsible landscape maintenance crew</strong><small>${confirmed ? 'Crew 2 · Crew leader: Alex Rivera' : 'Not yet assigned'}</small></div><span class="status ${confirmed ? 'status-ready' : 'status-pending'}">${confirmed ? 'Assigned' : 'Required'}</span></li><li><span class="readiness-icon">${confirmed ? '✓' : '4'}</span><div><strong>Initial service work order</strong><small>${confirmed ? 'Thursday, Aug 27 · 8:00–10:00 AM' : 'Owner sees mobilization in progress—not scheduled service'}</small></div><span class="status ${confirmed ? 'status-ready' : 'status-pending'}">${confirmed ? 'Confirmed' : 'Required'}</span></li></ul>
      </section>
      ${confirmed ? `<section class="stage-card"><h2>Production handoff</h2><div class="opportunity-facts"><div><span>Route assignment</span><strong>Thursday · Crew 2</strong></div><div><span>Required service evidence</span><strong>Before/after photos + completion report</strong></div><div><span>Site access</span><strong>Released for confirmed work order</strong></div></div><div class="stage-actions"><button class="button button-primary" type="button" data-open-field>Open work-order preview</button><button class="button button-secondary" type="button" data-go-stage="support">Review provider support</button></div></section>` : `<section class="stage-card form-grid"><label class="field"><span>Responsible crew</span><select><option>Select a crew</option><option>Crew 2 · Alex Rivera</option></select></label><label class="field"><span>Initial service window</span><select><option>Thursday, Aug 27 · 8–10 AM</option><option>Friday, Aug 28 · 1–3 PM</option></select></label><label class="checkbox-row full"><input type="checkbox" checked><span>Site access, known hazards, materials, service evidence, and customer-visible instructions have been reviewed for the initial work order.</span></label></section><div class="stage-actions"><button class="button button-primary" type="button" data-confirm-first-visit>Assign crew and release work order</button><button class="button button-secondary" type="button">Save mobilization</button></div>`}
    </div>`;
  }

  function supportView() {
    return `<div class="stage-view">${heading('Provider support', 'Route each operational issue to the correct support path', 'Company onboarding, qualification, opportunity, site assessment, safety, field recovery, and access-control issues require different urgency, records, and privacy handling.')}
      ${state.reportSent ? '<div class="stage-note private"><span aria-hidden="true">✓</span><div><strong>Illustrative service-request report received</strong>The request is hidden from this prototype view. No real report, case, or notification was created.</div></div>' : ''}
      <div class="support-categories">
        ${supportCard('Company identity and qualification', 'Resolve duplicate organizations, representative authority, credential status, expiration, correction, or appeal.', 'Review qualification support', 'correction')}
        ${supportCard('Service opportunities and owner contact', 'Pause opportunity intake, review service-fit factors, decline appropriately, or report spam and unwanted contact.', 'Review opportunity controls', 'opportunity')}
        ${supportCard('Site assessment, safety, and incidents', 'Stop unsafe activity, distinguish emergencies, report harassment, and preserve incident context.', 'Review safety and incident path', 'safety')}
        ${supportCard('Personnel roles and access control', 'Correct an invitation, review role scope, remove access, transfer company ownership, or recover an account.', 'Review access-control support', 'access')}
        ${supportCard('Field operations and synchronization', 'Recover offline route, work-order, checklist, photograph, or completion-report activity after service activation.', 'Review field recovery', 'field')}
        ${supportCard('Data and service relationship', 'Pause the business profile, export data, review retention or deletion eligibility, end an owner relationship, or dispute a record.', 'Review data controls', 'data')}
      </div>
      <section class="stage-card"><h2>Open a provider support case</h2><div class="form-grid"><label class="field"><span>Case category</span><select><option>Select a category</option><option>Company qualification or credential</option><option>Service opportunity or owner contact</option><option>Safety or incident</option><option>Personnel access</option></select></label><label class="field"><span>Preferred response channel</span><select><option>In-app and email</option><option>Email</option><option>Telephone</option></select></label></div><p class="opportunity-meta">Prototype only: coverage hours, response targets, supported languages, emergency direction, and escalation ownership require production decisions.</p></section>
      <div class="stage-actions"><button class="button button-primary" type="button" data-open-support-request>Open support case draft</button><button class="button button-secondary" type="button" data-go-stage="opportunities">Return to service opportunities</button></div>
    </div>`;
  }

  function supportCard(title, text, action, kind) {
    return `<article class="support-card"><span class="status ${kind === 'safety' ? 'status-risk' : 'status-info'}">${kind === 'safety' ? 'Safety-aware' : 'Contextual help'}</span><h2>${title}</h2><p>${text}</p><button type="button" data-support-kind="${kind}">${action} →</button></article>`;
  }

  function invitedView() {
    return `<div class="stage-view">${heading('Provider personnel invitation', 'You were invited to join Sonoran Grounds', 'Review the inviting organization, offered role, operational scope, and access permissions before accepting. This path does not create or claim a landscape service business.')}
      <section class="stage-card"><div class="opportunity-top"><div><span class="status status-pending">Expires Aug 20, 2026</span><h2>Landscape maintenance crew leader</h2><p class="opportunity-meta">Sent to alex.rivera@example.com by Morgan Reyes</p></div><span class="status status-info">Invitation email matched</span></div><div class="opportunity-facts"><div><span>Provider organization</span><strong>Sonoran Grounds</strong></div><div><span>Offered role</span><strong>Crew leader</strong></div><div><span>Operational scope</span><strong>Central branch</strong></div></div></section>
      <section class="stage-card"><h2>Role-based access</h2><div class="disclosure-table"><div class="disclosure-row"><div><strong>Assigned routes, work orders, service tasks, and property instructions</strong><small>Limited to the offered branch and active crew assignments</small></div><span class="status status-ready">Permitted</span></div><div class="disclosure-row"><div><strong>Field photographs, service issues, and completion reports</strong><small>Create and submit within assigned work orders</small></div><span class="status status-ready">Permitted</span></div><div class="disclosure-row"><div><strong>Customer pricing, service opportunities, and other crews</strong><small>Excluded from the offered crew-leader role</small></div><span class="status status-pending">Not permitted</span></div></div></section>
      ${note('warning', 'Unexpected invitation?', 'Do not accept it. Report the invitation, request a corrected recipient or role, or let it expire. No company access is granted before acceptance.')}
      <div class="stage-actions"><button class="button button-primary" type="button" data-accept-invite>Accept role and open field operations</button><button class="button button-secondary" type="button" data-correct-invite>Request role correction</button><button class="text-action" type="button" data-report-request>Report invitation</button><button class="text-action" type="button" data-go-stage="path">Select a different business role</button></div>
    </div>`;
  }

  function contextFor(stage) {
    const common = `<section class="context-card"><p class="micro-label">Prototype boundary</p><h2>Review, not production</h2><p>Nothing is persisted, sent, verified, matched, priced, scheduled, assigned, or reported.</p></section>`;
    const content = {
      path: `<section class="context-card"><p class="micro-label">Account outcome</p><h2>${state.path === 'company' ? 'Provider company' : 'Owner-operator'}</h2><p>${state.path === 'company' ? 'One organization with authorized office and crew roles.' : 'A provider organization of one with combined owner and field responsibility.'}</p></section>`,
      profile: `<section class="context-card"><p class="micro-label">Privacy</p><h2>Private company onboarding</h2><p>Draft identity and contact details are not public and do not establish provider eligibility.</p></section>`,
      readiness: `<section class="context-card"><p class="micro-label">Qualification</p><h2>Credential facts—not one badge</h2><p>Provider supplied, independently validated, pending, expired, not applicable, and not collected remain distinct.</p></section>`,
      opportunities: `<section class="context-card"><p class="micro-label">Service alignment</p><h2>Declared fit factors only</h2><ul><li>Approximate service area</li><li>Declared service categories</li><li>Assessment preference</li></ul><p>No marketplace ranking or guaranteed availability.</p></section>`,
      request: `<section class="context-card"><p class="micro-label">Disclosure</p><h2>Owner-controlled</h2><p>Exact address, contact, photos, and access details can be approved separately and later withdrawn.</p></section>`,
      assessment: `<section class="context-card"><p class="micro-label">Site assessment</p><h2>Record uncertainty</h2><p>Photographs do not establish dimensions, diagnosis, safe access, production requirements, or price.</p></section>`,
      proposal: `<section class="context-card"><p class="micro-label">Commercial decision</p><h2>Provider-authored scope</h2><p>Clarifications and revisions are not approval. Approved versions remain immutable.</p></section>`,
      setup: `<section class="context-card"><p class="micro-label">Mobilization</p><h2>The provider assigns production resources</h2><p>Owner approval remains separate from internal crew assignment, work-order release, and route scheduling.</p></section>`,
      support: `<section class="context-card"><p class="micro-label">Urgency</p><h2>Safety is separate</h2><p>Emergency guidance, safety stop, incident intake, and ordinary product support cannot be one queue.</p></section>`,
      invited: `<section class="context-card"><p class="micro-label">Least privilege</p><h2>Role before access</h2><p>The invitation names organization, inviter, role, scope, expiration, and excluded data before acceptance.</p></section>`,
    };
    return (content[stage] || '') + common;
  }

  function renderNav() {
    const activeIndex = stages.findIndex(([key]) => key === state.stage);
    stageNav.innerHTML = stages.map(([key, label], index) => `<li><button type="button" data-go-stage="${key}" ${state.stage === key ? 'aria-current="step"' : ''} class="${state.completed.has(key) ? 'complete' : ''}"><span class="step-number">${state.completed.has(key) ? '✓' : index + 1}</span><span>${label}</span></button></li>`).join('');
    mobileProgress.textContent = state.stage === 'invited' ? 'Invitation path' : activeIndex >= 0 ? `Step ${activeIndex + 1} of ${stages.length}` : 'Provider setup';
    document.querySelector('[data-previous-stage]').disabled = activeIndex <= 0;
    document.querySelector('[data-next-stage]').disabled = activeIndex < 0 || activeIndex >= stages.length - 1;
  }

  function render() {
    body.dataset.stage = state.stage;
    body.dataset.providerPath = state.path;
    body.dataset.opportunityState = state.opportunityState;
    body.dataset.interestState = state.interest;
    body.dataset.disclosureState = state.disclosed ? 'approved' : 'limited';
    body.dataset.proposalState = state.proposal;
    if (state.stage === 'welcome') {
      publicContent.hidden = false;
      publicHeader.hidden = false;
      appShell.hidden = true;
      document.title = 'Grow my landscape service business · Grover working design';
      return;
    }
    publicContent.hidden = true;
    publicHeader.hidden = true;
    appShell.hidden = false;
    stageView.innerHTML = views[state.stage] ? views[state.stage]() : views.path();
    contextRail.innerHTML = contextFor(state.stage);
    providerName.textContent = state.providerName;
    readinessLabel.textContent = state.stage === 'opportunities' ? 'Service opportunities' : state.stage === 'setup' && state.setup === 'confirmed' ? 'Work order ready' : 'Provider onboarding';
    renderNav();
    document.title = `${stages.find(([key]) => key === state.stage)?.[1] || 'Crew invitation'} · Grover working design`;
  }

  function go(stage, announce = true) {
    state.stage = stage;
    if (stage !== 'welcome') window.location.hash = stage;
    render();
    if (stage !== 'welcome') {
      requestAnimationFrame(() => {
        const title = document.querySelector('[data-stage-title]');
        title?.focus();
        if (announce) live.textContent = `${title?.textContent || stage} loaded.`;
        window.scrollTo(0, 0);
      });
    } else {
      history.replaceState(null, '', window.location.pathname);
      window.scrollTo(0, 0);
    }
  }

  function complete(stage, next) {
    state.completed.add(stage);
    go(next);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => { toast.hidden = true; }, 4500);
  }

  function confirmAction(title, text, action, actionLabel, danger = false) {
    confirmContent.innerHTML = `<div class="confirm-body"><p class="micro-label">Confirm action</p><h2 id="confirm-title">${title}</h2><p>${text}</p><div class="stage-actions"><button class="button ${danger ? 'button-danger' : 'button-primary'}" type="button" data-confirm-action="${action}">${actionLabel}</button><button class="button button-secondary" type="button" data-cancel-confirm>Cancel</button></div></div>`;
    confirmDialog.showModal();
  }

  reviewStages.innerHTML = [...stages, ['invited', 'Invited team member']].map(([key, label]) => `<button type="button" data-review-stage="${key}">${label}</button>`).join('');

  document.addEventListener('click', (event) => {
    const target = event.target.closest('button, a');
    if (!target) return;
    if (target.matches('[data-go-stage]')) { event.preventDefault(); reviewDialog.open && reviewDialog.close(); go(target.dataset.goStage); return; }
    if (target.matches('[data-select-path]')) { state.path = target.dataset.selectPath; go('path'); return; }
    if (target.matches('[data-open-review]')) { reviewDialog.showModal(); return; }
    if (target.matches('[data-close-review]')) { reviewDialog.close(); return; }
    if (target.matches('[data-review-stage]')) { reviewDialog.close(); go(target.dataset.reviewStage); return; }
    if (target.matches('[data-review-path]')) { state.path = target.dataset.reviewPath; body.dataset.providerPath = state.path; showToast(`${target.textContent.trim()} path selected.`); return; }
    if (target.matches('[data-review-opportunities]')) { state.opportunityState = target.dataset.reviewOpportunities; body.dataset.opportunityState = state.opportunityState; reviewDialog.open && reviewDialog.close(); go('opportunities'); return; }
    if (target.matches('[data-continue-path]')) { const selected = document.querySelector('input[name="providerPath"]:checked')?.value || state.path; if (selected === 'invited') go('invited'); else { state.path = selected; complete('path', 'profile'); } return; }
    if (target.matches('[data-show-duplicate]')) { confirmAction('A similar provider may already exist', '“Desert & Pine Landscaping LLC” uses the same contact domain. Request access or confirm that this is a different business before creating another organization.', 'claim', 'Request organization access'); return; }
    if (target.matches('[data-service]')) { const id = target.dataset.service; state.services.has(id) ? state.services.delete(id) : state.services.add(id); target.setAttribute('aria-pressed', String(state.services.has(id))); return; }
    if (target.matches('[data-complete-readiness]')) { complete('readiness', 'opportunities'); return; }
    if (target.matches('[data-pause-profile]')) { confirmAction('Pause new service opportunities?', 'Your business profile remains available where applicable. Active owner conversations and approved service relationships are unchanged.', 'pause', 'Pause opportunities'); return; }
    if (target.matches('[data-resume-opportunities]')) { state.opportunityState = 'ready'; render(); showToast('New service opportunities resumed.'); return; }
    if (target.matches('[data-save-search]')) { showToast('Illustrative opportunity search saved. No notification will be sent.'); return; }
    if (target.matches('[data-interest]')) { if (state.failInterest) { state.failInterest = false; state.interestFailed = true; document.querySelector('[data-fail-interest]').checked = false; render(); requestAnimationFrame(() => document.querySelector('[role="alert"]')?.focus()); } else { state.interestFailed = false; state.interest = 'pending'; render(); live.textContent = 'Statement of interest submitted. Awaiting owner disclosure authorization.'; } return; }
    if (target.matches('[data-owner-approve]')) { state.disclosed = true; state.completed.add('request'); render(); live.textContent = 'Owner-authorized site disclosure loaded.'; return; }
    if (target.matches('[data-withdraw-interest]')) { confirmAction('Withdraw statement of interest?', 'Morgan will see that this provider is no longer requesting site-assessment access. No reason is required.', 'withdraw', 'Withdraw statement', true); return; }
    if (target.matches('[data-safe-question]')) { confirmAction('Request clarification', 'This question remains in Grover and does not disclose owner contact: “Does the requested cleanup involve routine green waste or a larger accumulated debris volume?”', 'question', 'Send illustrative request'); return; }
    if (target.matches('[data-decline-request]')) { confirmAction('Decline this service opportunity?', 'Select a customer-safe reason category. The owner will not see private capacity, pricing, staffing, or commercial reasoning.', 'decline', 'Decline opportunity'); return; }
    if (target.matches('[data-report-request]')) { confirmAction('Report this request?', 'Use this for spam, suspicious contact, unsafe requests, harassment, or policy concerns—not simply because the work is not a fit.', 'report', 'Submit illustrative report', true); return; }
    if (target.matches('[data-show-receipt]')) { confirmAction('Site-disclosure receipt', 'Authorized Aug 14, 2026: exact service address and four intake photographs. In-app communication only. Telephone, gate, animal, and service-access details remain withheld.', 'close', 'Done'); return; }
    if (target.matches('[data-schedule-assessment]')) { if (state.assessmentScheduled) complete('assessment', 'proposal'); else { state.assessmentScheduled = true; state.assessmentMode = document.querySelector('input[name="assessment"]:checked')?.value || 'onsite'; render(); live.textContent = 'Illustrative site-assessment window proposed.'; } return; }
    if (target.matches('[data-provider-note]')) { showToast('Provider-private note added to the illustrative site-assessment record.'); return; }
    if (target.matches('[data-send-proposal]')) { state.proposal = 'sent'; state.completed.add('proposal'); render(); live.textContent = 'Service proposal version 1 issued for owner review.'; return; }
    if (target.matches('[data-answer-question]')) { showToast('Illustrative proposal clarification issued. The proposal remains undecided.'); return; }
    if (target.matches('[data-revise-proposal]')) { showToast('Proposal version 2 draft started. Version 1 remains in revision history.'); return; }
    if (target.matches('[data-simulate-acceptance]')) { confirmAction('Review owner proposal approval', 'Morgan explicitly approved proposal version 1. This authorizes service mobilization—not payment, crew assignment, work-order release, or a scheduled service visit.', 'accept', 'Load approved state'); return; }
    if (target.matches('[data-show-accepted]')) { showToast('Approved proposal version 1 remains immutable and reviewable.'); return; }
    if (target.matches('[data-confirm-first-visit]')) { state.setup = 'confirmed'; state.completed.add('setup'); render(); live.textContent = 'Responsible crew assigned and initial service work order released.'; return; }
    if (target.matches('[data-open-field]')) { showToast('Production handoff: open the existing mobile Route → Work order → Service evidence workflow.'); return; }
    if (target.matches('[data-support-kind]')) { const kind = target.dataset.supportKind; kind === 'safety' ? confirmAction('Safety and incident support', 'Stop work when needed. Production must distinguish emergencies, immediate hazards, harassment, incidents, and ordinary product support.', 'close', 'Understood') : showToast(`${target.textContent.trim()} reviewed. Production ownership remains a product gate.`); return; }
    if (target.matches('[data-open-support-request]')) { showToast('Illustrative support draft started. No request was sent.'); return; }
    if (target.matches('[data-open-correction]')) { confirmAction('Review eligibility requirement', 'Tree-service eligibility needs a defined regional requirement, source, review owner, freshness rule, expiry, correction route, and appeal policy before launch.', 'close', 'Keep requirement pending'); return; }
    if (target.matches('[data-accept-invite]')) { showToast('Illustrative invitation accepted. Only the offered crew-leader field-operations workspace would open.'); return; }
    if (target.matches('[data-correct-invite]')) { showToast('Illustrative correction requested from the inviting organization.'); return; }
    if (target.matches('[data-save-exit]')) { showToast('Private prototype progress saved for review. Nothing was persisted.'); return; }
    if (target.matches('[data-previous-stage]')) { const index = stages.findIndex(([key]) => key === state.stage); if (index > 0) go(stages[index - 1][0]); return; }
    if (target.matches('[data-next-stage]')) { const index = stages.findIndex(([key]) => key === state.stage); if (index >= 0 && index < stages.length - 1) go(stages[index + 1][0]); return; }
    if (target.matches('[data-cancel-confirm]')) { confirmDialog.close(); return; }
    if (target.matches('[data-confirm-action]')) {
      const action = target.dataset.confirmAction;
      confirmDialog.close();
      if (action === 'pause') { state.opportunityState = 'paused'; go('opportunities'); }
      else if (action === 'withdraw') { state.interest = 'none'; state.disclosed = false; go('opportunities'); showToast('Statement of interest withdrawn in this illustrative flow.'); }
      else if (action === 'decline') { go('opportunities'); showToast('Service opportunity declined. No private commercial reasoning was shared.'); }
      else if (action === 'report') { state.reportSent = true; go('support'); }
      else if (action === 'accept') { state.proposal = 'accepted'; render(); live.textContent = 'Approved proposal state loaded.'; }
      else if (action === 'claim') showToast('Illustrative organization-access request started.');
      else if (action === 'question') showToast('Illustrative clarification request sent without requesting private contact.');
      return;
    }
  });

  document.addEventListener('change', (event) => {
    if (event.target.matches('input[name="providerPath"]')) { state.path = event.target.value; render(); }
    if (event.target.matches('input[name="assessment"]')) state.assessmentMode = event.target.value;
    if (event.target.matches('[data-fail-interest]')) state.failInterest = event.target.checked;
  });

  document.addEventListener('submit', (event) => {
    if (event.target.id !== 'provider-profile-form') return;
    event.preventDefault();
    const form = new FormData(event.target);
    const name = String(form.get('providerName') || '').trim();
    const email = String(form.get('email') || '').trim();
    const phone = String(form.get('phone') || '').trim();
    const authority = form.get('authority');
    if (name.length < 2 || !email.includes('@') || phone.length < 7 || !authority) { state.profileError = true; render(); return; }
    state.profileError = false;
    state.providerName = name;
    complete('profile', 'readiness');
  });

  reviewDialog.addEventListener('close', () => document.querySelector('[data-open-review]')?.focus());
  confirmDialog.addEventListener('click', (event) => { if (event.target === confirmDialog) confirmDialog.close(); });
  window.addEventListener('hashchange', () => {
    const requested = location.hash.slice(1);
    if (views[requested] && requested !== state.stage) go(requested, false);
  });

  const initial = location.hash.slice(1);
  if (views[initial]) state.stage = initial;
  render();
})();
