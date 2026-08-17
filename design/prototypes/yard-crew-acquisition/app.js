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
  const alertDialog = document.querySelector('[data-alert-dialog]');
  const toast = document.querySelector('[data-toast]');

  const stages = [
    ['path', 'Choose your path'],
    ['profile', 'Business profile'],
    ['readiness', 'Services & readiness'],
    ['opportunities', 'Service opportunities'],
    ['request', 'Request property details'],
    ['assessment', 'Site assessment'],
    ['proposal', 'Service proposal'],
    ['setup', 'Prepare service'],
  ];

  const stageGroups = [
    ['Get started', new Set(['path', 'profile', 'readiness'])],
    ['Find the right work', new Set(['opportunities', 'request', 'assessment', 'proposal'])],
    ['Start service', new Set(['setup'])],
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
    ownerNotification: 'draft',
    failOwnerNotification: false,
    alertStatus: 'none',
    alertFrequency: 'Daily digest',
    alertChannels: 'In-app + email',
    alertQuietHours: '7:00 PM–7:00 AM',
    failAlertSave: false,
    invitationState: 'draft',
    teamRole: 'crew-leader',
    pilotState: 'not-ready',
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
        ${heading('Provider setup · Step 1', 'How do you work today?', 'Choose the path that best fits your role. You can review the account and access before creating or joining anything.')}
        <fieldset class="choice-grid" aria-describedby="path-help"><legend class="live-region">Provider path</legend>
          ${pathChoice('solo', '1', 'I’m an owner-operator', 'Set up one business account with both management and field-work access.', 'One business · one operator')}
          ${pathChoice('company', '2+', 'I own or manage a company', 'Set up or claim the business, choose who manages new opportunities, and invite your team.', 'One business · multiple roles')}
          ${pathChoice('invited', '↳', 'I’m joining a provider team', 'Review the company, role, and branch in your invitation. You will not create or claim the business.', 'Access through an invitation')}
        </fieldset>
        <p class="stage-note private" id="path-help"><span aria-hidden="true">◉</span><span><strong>Owners choose a landscape business, not an individual crew member.</strong> Your company stays in control of pricing, crew assignments, and team access.</span></p>
        <div class="stage-actions"><button class="button button-primary" type="button" data-continue-path>Continue with this path</button><button class="button button-secondary" type="button" data-go-stage="welcome">Return to overview</button></div>
      </div>`,
    profile: () => `
      <div class="stage-view">
        ${heading('Provider setup · Step 2', state.path === 'company' ? 'Set up or claim your business' : 'Build your owner-operator profile', state.path === 'company' ? 'Use the legal or trade name customers know. Grover checks for likely duplicates before creating another business account.' : 'You will have one business account with both management and field-work access.')}
        ${state.profileError ? '<div class="form-error" role="alert"><strong>Review the required business details.</strong> Enter a business name and contact details, then confirm you can represent the business. Your entries have been preserved.</div>' : ''}
        <form class="stage-card form-grid" id="provider-profile-form" novalidate>
          <label class="field full"><span>Business name customers will see *</span><small>Use the legal name, trade name, or established business name your customers know.</small><input name="providerName" value="${escapeHtml(state.providerName)}" autocomplete="organization" required></label>
          <label class="field"><span>Business email *</span><small>Email verification is required before activation.</small><input name="email" value="hello@desertpine.example" type="email" autocomplete="email" required></label>
          <label class="field"><span>Business mobile number *</span><small>Phone verification is required before activation.</small><input name="phone" value="(602) 555-0148" type="tel" autocomplete="tel" required></label>
          <label class="field"><span>Business structure</span><select name="model"><option ${state.path === 'solo' ? 'selected' : ''}>Owner-operator</option><option ${state.path === 'company' ? 'selected' : ''}>Multi-crew provider</option></select></label>
          <label class="field"><span>Primary language</span><select><option>English</option><option>Spanish</option><option>English and Spanish</option></select></label>
          <label class="checkbox-row full"><input name="authority" type="checkbox" ${state.profileError ? '' : 'checked'}><span><strong>I confirm that I’m allowed to represent this business.</strong><br>Creating a profile does not confirm a license, insurance policy, certification, or eligibility for new opportunities.</span></label>
          <div class="stage-actions full"><button class="button button-primary" type="submit">Save business profile</button><button class="button button-secondary" type="button" data-show-duplicate>Check a possible duplicate</button></div>
        </form>
        ${note('warning', 'Illustrative business information', 'This prototype does not verify the business, contact details, representative authority, license, insurance, certification, or registration.')}
      </div>`,
    readiness: () => `
      <div class="stage-view">
        ${heading('Provider setup · Step 3', 'Show where and how you work', 'Your services and service area help Grover show better-fit opportunities. They do not guarantee new work, route density, or an exclusive territory.')}
        <section class="stage-card"><h2>Services you offer</h2><p class="opportunity-meta">Choose only services your business is prepared, qualified, and legally allowed to assess and perform. You can pause a service later.</p>
          <div class="chip-group" data-service-chips>${serviceChip('upkeep', 'Recurring landscape maintenance')}${serviceChip('cleanup', 'Seasonal cleanups')}${serviceChip('lawn', 'Turf maintenance')}${serviceChip('desert', 'Desert landscape maintenance')}${serviceChip('irrigation', 'Irrigation inspection & repair')}${serviceChip('trees', 'Ornamental tree & shrub maintenance')}</div>
        </section>
        <section class="stage-card form-grid"><h2 class="field full">Service area and response time</h2>
          <label class="field"><span>Primary service area</span><input value="Central Phoenix" autocomplete="address-level2"></label>
          <label class="field"><span>Service radius</span><select><option>Approximately 12 miles</option><option>Selected postal codes</option><option>Define on service-area map</option></select></label>
          <label class="field"><span>Site assessment method</span><select><option>On site preferred</option><option>Desktop review first</option><option>Either method</option></select></label>
          <label class="field"><span>Typical response time</span><select><option>Within 1 business day</option><option>Within 2 business days</option><option>Within 3 business days</option></select></label>
        </section>
        <section class="stage-card form-grid"><h2 class="field full">Work preferences and capacity</h2>
          <label class="field"><span>Openings for recurring properties</span><select><option>2 openings</option><option>1 opening</option><option>3–5 openings</option><option>Not accepting recurring work</option></select></label>
          <label class="field"><span>Preferred new work</span><select><option>Recurring maintenance + initial cleanups</option><option>Recurring maintenance only</option><option>One-time cleanups only</option></select></label>
          <label class="field"><span>Typical service crew</span><select><option>2 people</option><option>Owner-operator</option><option>3–4 people</option></select></label>
          <label class="field"><span>Preferred service days</span><select><option>Weekdays</option><option>Any available day</option><option>Selected days</option></select></label>
        </section>
        <section class="readiness-summary" aria-labelledby="opportunity-readiness-title"><div><p class="micro-label">Opportunity readiness</p><h2 id="opportunity-readiness-title">Ready for routine maintenance and cleanup</h2><p>You can review matching opportunities and request assessment access. Tree-removal requests stay hidden until local requirements are resolved.</p></div><span class="status status-ready">Ready with limits</span></section>
        <section class="stage-card"><div class="opportunity-top"><div><h2>Business readiness</h2><p class="opportunity-meta">Review each business detail separately so you can see what was supplied, what was checked, and what still needs attention.</p></div><span class="status status-pending">2 need review</span></div>
          <ul class="readiness-list"><li><span class="readiness-icon">✓</span><div><strong>Business identity submitted</strong><small>Legal or trade identity submitted Aug 14, 2026</small></div><span class="status status-info">Provider supplied</span></li><li><span class="readiness-icon">↻</span><div><strong>Certificate of insurance</strong><small>Document supplied; independent validation not simulated</small></div><span class="status status-pending">Validation pending</span></li><li><span class="readiness-icon">✓</span><div><strong>Opportunity response authority</strong><small>${state.path === 'company' ? 'Morgan Reyes · Operations manager' : 'Morgan Reyes · Owner-operator'}</small></div><span class="status status-ready">Assigned</span></li><li><span class="readiness-icon">!</span><div><strong>Tree-work service eligibility</strong><small>Jurisdiction and proposed scope require review</small></div><button class="text-action" type="button" data-open-correction>Review</button></li></ul>
        </section>
        <div class="stage-actions"><button class="button button-primary" type="button" data-complete-readiness>Finish business readiness</button>${state.path === 'company' ? '<button class="button button-secondary" type="button" data-go-stage="team">Review team authority</button>' : ''}<button class="button button-secondary" type="button" data-pause-profile>Pause new opportunities</button></div>
      </div>`,
    opportunities: () => opportunityView(),
    request: () => requestView(),
    assessment: () => assessmentView(),
    proposal: () => proposalView(),
    setup: () => setupView(),
    team: () => teamView(),
    governance: () => governanceView(),
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
    const headingBlock = heading('Service opportunities', 'Find requests that fit your business', 'Each preview shows an approximate service area and the maintenance the owner requested. Ask for assessment access when you want a closer look; this does not accept or schedule the work.');
    if (state.opportunityState === 'unavailable') return `<div class="stage-view">${headingBlock}<div class="empty-state"><span class="empty-icon" aria-hidden="true">↻</span><h2>Service opportunities are temporarily unavailable</h2><p>Your business readiness and filters are safe. Grover cannot confirm current requests right now, so it will not show an old list as if it were current.</p><button class="button button-primary" type="button" data-review-opportunities="ready">Try again</button><button class="button button-secondary" type="button" data-go-stage="support">Get help</button></div></div>`;
    if (state.opportunityState === 'paused') return `<div class="stage-view">${headingBlock}${alertSummary(true)}<div class="empty-state"><span class="empty-icon" aria-hidden="true">Ⅱ</span><h2>New service opportunities are paused</h2><p>Your business profile stays in place, but new opportunities will not appear here. Current owner conversations and approved service are unchanged.</p><button class="button button-primary" type="button" data-resume-opportunities>Resume opportunities</button><button class="button button-secondary" type="button" data-go-stage="support">Review availability settings</button></div></div>`;
    if (state.opportunityState === 'empty') return `<div class="stage-view">${headingBlock}<div class="opportunity-toolbar"><input class="search-field" aria-label="Search service opportunities" value="tree removal"><button class="button button-secondary" type="button">Filters · 3</button></div><div class="filter-row"><button class="chip selected" type="button">Central Phoenix</button><button class="chip selected" type="button">Tree work</button><button class="chip selected" type="button">12-mile service radius</button></div>${alertSummary(false)}<div class="empty-state"><span class="empty-icon" aria-hidden="true">⌕</span><h2>No service opportunities match these filters</h2><p>Grover will not expand your service area or reveal private owner requests just to fill the list. Remove a filter, update your services, or check again later.</p><button class="button button-primary" type="button" data-review-opportunities="ready">Remove tree-work filter</button><button class="button button-secondary" type="button" data-save-search>${state.alertStatus === 'none' ? 'Save this search' : 'Manage saved alert'}</button></div></div>`;
    return `<div class="stage-view">${headingBlock}
      <section class="capacity-strip"><div><p class="micro-label">Your current availability</p><strong>2 recurring openings · Weekdays</strong><span>Routine maintenance and cleanup are active. Tree-removal requests are hidden while requirements are reviewed.</span></div><button class="button button-secondary" type="button" data-go-stage="readiness">Edit services &amp; capacity</button></section>
      <div class="opportunity-toolbar"><label><span class="live-region">Search service opportunities</span><input class="search-field" aria-label="Search service opportunities" placeholder="Search service category or approximate area"></label><button class="button button-secondary" type="button" data-review-opportunities="empty">Filters · 2</button></div>
      <div class="filter-row"><button class="chip selected" type="button">Central Phoenix</button><button class="chip selected" type="button">Your services</button><button class="chip" type="button" data-review-opportunities="empty">Tree removal</button></div>
      ${alertSummary(false)}
      <div class="opportunity-list">
        ${opportunityCard('opp-1', 'Recurring desert landscape maintenance', 'Central Phoenix', 'Routine maintenance + cleanup', 'Provider to recommend', 'On-site assessment requested', 'Good service fit', true)}
        ${opportunityCard('opp-2', 'Initial landscape cleanup and reset', 'Encanto area', 'One-time cleanup', 'One-time service', 'Desktop review permitted', 'Review route impact', false)}
      </div>
      ${note('private', 'Private details stay with the owner', 'The exact address, contact details, photos, access instructions, other providers, and owner budget are not included in the preview.')}
    </div>`;
  }

  function alertSummary(suppressed) {
    if (state.alertStatus === 'none') return '';
    const paused = suppressed || state.alertStatus === 'paused';
    return `<section class="alert-summary ${paused ? 'suppressed' : ''}" aria-labelledby="saved-alert-title"><div><p class="micro-label">Saved opportunity alert</p><h2 id="saved-alert-title">${paused ? 'Alerts are suppressed' : 'Central Phoenix · Your services'}</h2><p>${paused ? 'No new-match notifications will be sent while opportunity intake or this alert is paused.' : `${state.alertFrequency} · ${state.alertChannels} · Quiet hours ${state.alertQuietHours}`}</p></div><div class="alert-summary-actions"><span class="status ${paused ? 'status-pending' : 'status-ready'}">${paused ? 'Paused' : 'Active'}</span><button class="text-action" type="button" data-save-search>Manage</button><button class="text-action" type="button" data-toggle-alert>${paused ? 'Resume alert' : 'Pause alert'}</button></div><p class="full-width opportunity-meta">Alerts reflect current filters and eligibility. They do not reserve, rank, or guarantee work.</p></section>`;
  }

  function opportunityCard(id, title, area, care, cadence, assessment, fit, primary) {
    const propertyProfile = primary ? 'Desert landscape · no turf' : 'Mixed landscape · front yard';
    const sizeBand = primary ? 'About 4,000–7,000 sq ft' : 'About 2,000–4,000 sq ft';
    const startWindow = primary ? 'Within 2 weeks' : 'Within 7 days';
    return `<article class="opportunity-card" data-opportunity-id="${id}"><div class="opportunity-top"><div><span class="status ${primary ? 'status-fit' : 'status-pending'}">${fit}</span><h2>${title}</h2><p class="opportunity-meta">${area} · Respond by Aug ${primary ? '18' : '17'}, 2026</p></div><button class="button button-secondary" type="button" data-go-stage="request">Review service brief</button></div><div class="opportunity-facts"><div><span>Requested services</span><strong>${care}</strong></div><div><span>Service cadence</span><strong>${cadence}</strong></div><div><span>Site assessment</span><strong>${assessment}</strong></div><div><span>Landscape profile</span><strong>${propertyProfile}</strong></div><div><span>Owner-supplied size</span><strong>${sizeBand}</strong></div><div><span>Requested start</span><strong>${startWindow}</strong></div></div><ul class="fit-list"><li>Fits ${primary ? '2' : '1'} services you offer</li><li>${primary ? 'About 4 miles inside' : 'Near the edge of'} your service area</li><li>${primary ? 'Adds about 12 minutes to a nearby route' : 'No nearby route identified yet'}</li></ul><p class="opportunity-meta">Size and route impact are planning estimates. Confirm them during assessment.</p></article>`;
  }

  function requestView() {
    if (state.disclosed) return `<div class="stage-view">${heading('Owner-approved property details', 'Morgan shared details for your assessment', 'This receipt shows exactly what your business can see. The information is for this assessment and the owner can withdraw access.')}
      <section class="stage-card"><div class="opportunity-top"><div><span class="status status-ready">Assessment access approved</span><h2>Recurring desert landscape maintenance</h2><p class="opportunity-meta">Sharing receipt · Aug 14, 2026 at 3:20 PM</p></div><button class="text-action" type="button" data-show-receipt>View sharing receipt</button></div><div class="disclosure-table"><div class="disclosure-row"><div><strong>Exact service address</strong><small>Shared for the site assessment and arrival planning</small></div><span class="status status-ready">Shared</span></div><div class="disclosure-row"><div><strong>Owner contact</strong><small>In-app conversation only; phone number stays private</small></div><span class="status status-info">Limited</span></div><div class="disclosure-row"><div><strong>Property photos</strong><small>4 photos selected by the owner</small></div><span class="status status-ready">Shared</span></div><div class="disclosure-row"><div><strong>Gate and pet details</strong><small>Shared after an on-site assessment is confirmed</small></div><span class="status status-pending">Not shared yet</span></div></div></section>
      <div class="stage-actions"><button class="button button-primary" type="button" data-go-stage="assessment">Begin site assessment</button><button class="button button-secondary" type="button" data-go-stage="support">Report concern or withdraw</button></div></div>`;
    const failed = state.interestFailed ? '<div class="form-error" role="alert"><strong>Your assessment request was not sent.</strong> The opportunity is still available and your note has been saved. Try again when you’re ready.</div>' : '';
    const pending = state.interest === 'pending' ? `<section class="stage-card"><div class="opportunity-top"><div><p class="micro-label">Assessment request progress</p><h2>Waiting for the owner</h2></div><span class="status status-pending">Expires Aug 18</span></div><ol class="request-timeline"><li class="complete"><span>✓</span><div><strong>Assessment requested</strong><small>Sent Aug 14 at 3:14 PM</small></div></li><li class="current"><span>2</span><div><strong>Owner reviewing</strong><small>Morgan may share details, ask a question, choose another provider, or let the request expire.</small></div></li><li><span>3</span><div><strong>Property details shared</strong><small>You will see only the details Morgan approves.</small></div></li></ol></section><div class="stage-actions"><button class="button button-primary" type="button" data-owner-approve>Review sharing status</button><button class="button button-secondary" type="button" data-withdraw-interest>Withdraw request</button></div>` : '';
    return `<div class="stage-view">${heading('Service brief', 'Recurring desert landscape maintenance', 'Use the owner-approved preview to decide whether you want to assess the property. The summary does not establish the exact size, site conditions, access, cost, or price.')}
      ${failed}
      <section class="stage-card"><div class="opportunity-top"><div><span class="status status-fit">Strong service alignment</span><h2>Owner’s preliminary service brief</h2></div><span class="opportunity-meta">Service request SR-104 · Illustrative</span></div><div class="opportunity-facts"><div><span>Approximate service area</span><strong>Central Phoenix</strong></div><div><span>Landscape areas</span><strong>Front and rear yards</strong></div><div><span>Service objective</span><strong>Consistent routine maintenance</strong></div></div><p class="stage-note private"><span aria-hidden="true">◉</span><span><strong>Site details remain private</strong> Exact address, owner contact, 4 photographs, gate details, and animal information require provider-specific owner authorization.</span></p></section>
      <section class="stage-card"><h2>Ask to assess the property</h2><label class="field"><span>Optional note to the owner</span><small>Share only what helps the owner review your request. Keep communication in Grover.</small><textarea>We provide recurring desert landscape maintenance in Central Phoenix. I’d like to review the property and confirm whether an on-site assessment is needed.</textarea></label></section>
      ${state.interest === 'pending' ? pending : `<div class="stage-actions"><button class="button button-primary" type="button" data-interest>Request assessment access</button><button class="button button-secondary" type="button" data-safe-question>Ask a question</button><button class="text-action" type="button" data-decline-request>Not a fit</button><button class="text-action" type="button" data-report-request>Report request</button></div><p class="opportunity-meta">This tells the owner you’re interested. It does not award the work, create an agreement, or schedule service.</p>`}
    </div>`;
  }

  function assessmentView() {
    const scheduled = state.assessmentScheduled ? `<div class="stage-note private"><span aria-hidden="true">✓</span><div><strong>Site assessment confirmed</strong>Tuesday, Aug 18 · 9:00–11:00 AM. This visit is for assessment only; no service or work order has been scheduled.</div></div>` : '';
    return `<div class="stage-view">${heading('Site assessment', 'Confirm what you know—and what still needs a closer look', 'The owner’s photos and answers are a starting point. Confirm measurements, access, site conditions, production needs, and price before committing to the scope.')}
      ${scheduled}
      <section class="assessment-grid"><article class="yard-zone"><span class="status status-info">Owner photo · illustrative</span><h3>Front landscape area</h3><p>Desert planting, two ornamental beds, and visible leaf litter. Plant health, irrigation performance, and debris volume still need confirmation.</p><button class="text-action" type="button">Review photo details</button></article><article class="yard-zone"><span class="status status-pending">Confirm on site</span><h3>Rear landscape area</h3><p>The owner marked the irrigation condition as “unknown” and noted a dog. Gate and pet instructions will be shared when the visit is confirmed.</p><button class="text-action" type="button" data-safe-question>Ask the owner</button></article></section>
      <section class="stage-card"><div class="opportunity-top"><div><h2>Assessment checklist</h2><p class="opportunity-meta">Use the same facts for every property before writing the scope.</p></div><span class="status status-pending">2 confirmed · 4 to review</span></div><ul class="readiness-list assessment-checklist"><li><span class="readiness-icon">✓</span><div><strong>Requested services and landscape areas</strong><small>Owner brief reviewed; confirm against the site</small></div><span class="status status-info">Owner supplied</span></li><li><span class="readiness-icon">2</span><div><strong>Approximate dimensions</strong><small>Front and rear service areas need measurement</small></div><span class="status status-pending">Confirm on site</span></li><li><span class="readiness-icon">3</span><div><strong>Access, parking, gate, and pets</strong><small>Visit instructions release after the window is confirmed</small></div><span class="status status-pending">Needs visit</span></li><li><span class="readiness-icon">4</span><div><strong>Debris volume and disposal</strong><small>Confirm volume, load-out path, and hauling limit</small></div><span class="status status-pending">Needs visit</span></li><li><span class="readiness-icon">i</span><div><strong>Visible irrigation condition</strong><small>Observation only—not an irrigation audit or repair diagnosis</small></div><span class="status status-info">Boundary set</span></li><li><span class="readiness-icon">✓</span><div><strong>Known hazards and owner concerns</strong><small>Dog disclosed; no other owner-reported hazard</small></div><span class="status status-info">Owner supplied</span></li></ul></section>
      <section class="stage-card"><h2>Choose how to assess the property</h2><div class="choice-grid"><label class="choice-card"><input type="radio" name="assessment" value="remote" ${state.assessmentMode === 'remote' ? 'checked' : ''}><span class="choice-icon">⌂</span><strong>The shared details are enough</strong><p>Use a desktop assessment only when you can write a reliable scope without field measurements or an access check.</p></label><label class="choice-card"><input type="radio" name="assessment" value="onsite" ${state.assessmentMode === 'onsite' ? 'checked' : ''}><span class="choice-icon">→</span><strong>I need an on-site assessment</strong><p>Visit the property to confirm measurements, access, conditions, hazards, production needs, and service fit.</p></label><label class="choice-card"><input type="radio" name="assessment" value="decline" ${state.assessmentMode === 'decline' ? 'checked' : ''}><span class="choice-icon">×</span><strong>I can’t assess this work responsibly</strong><p>Decline without guessing about the property or sharing private business details.</p></label></div></section>
      <section class="visibility-grid" aria-label="Assessment information visibility"><article><p class="micro-label">Owner can see</p><h2>Visit and scope details</h2><p>Assessment window, areas reviewed, questions, and the scope you choose to propose.</p></article><article class="private-panel"><p class="micro-label">Your business only</p><h2>Production notes</h2><p>Crew-hours, equipment, disposal, route impact, cost, margin, and internal safety notes.</p></article></section>
      <section class="stage-card form-grid"><h2 class="field full">Assessment window the owner will see</h2><label class="field"><span>Assessment date</span><input type="date" value="2026-08-18"></label><label class="field"><span>Arrival window</span><select><option>9:00–11:00 AM</option><option>1:00–3:00 PM</option></select></label><label class="field full"><span>What you’ll review</span><textarea>Confirm the landscape areas, site access, debris volume, visible irrigation condition, and production needs for recurring landscape maintenance.</textarea></label></section>
      ${note('warning', 'Stop when the work is outside your scope', 'Do not continue when tree hazards, electrical exposure, chemicals, structural concerns, or requested services exceed your team’s training, authorization, equipment, or legal scope.')}
      <div class="stage-actions"><button class="button button-primary" type="button" data-schedule-assessment>${state.assessmentScheduled ? 'Continue to proposal' : 'Propose assessment window'}</button><button class="button button-secondary" type="button" data-provider-note>Add a private team note</button></div>
    </div>`;
  }

  function proposalView() {
    const proposalStatus = state.proposal === 'accepted' ? '<span class="status status-ready">Proposal v1 approved by owner</span>' : state.proposal === 'sent' ? '<span class="status status-pending">Issued · awaiting owner decision</span>' : '<span class="status status-info">Estimate draft · version 1</span>';
    return `<div class="stage-view">${heading('Service estimate and proposal', 'Build a scope the owner and your crew can rely on', 'List what is included, what is excluded, the service cadence, price, assumptions, and how long the proposal is valid. Sending it does not assign a crew or schedule service.')}
      <section class="private-estimate" aria-labelledby="estimate-basis-title"><div class="opportunity-top"><div><p class="micro-label">Your business only</p><h2 id="estimate-basis-title">Production plan behind this price</h2><p class="opportunity-meta">These planning assumptions are never included in the owner proposal.</p></div><span class="status status-info">Private</span></div><div class="opportunity-facts"><div><span>Crew time</span><strong>2 people × 1.5 hours</strong></div><div><span>Total labor plan</span><strong>3 crew-hours</strong></div><div><span>Green waste</span><strong>Up to 0.5 cubic yard</strong></div><div><span>Equipment</span><strong>Standard maintenance kit</strong></div><div><span>Route impact</span><strong>About 12 added minutes</strong></div><div><span>Open item</span><strong>Confirm rear access</strong></div></div><p>Illustrative only: production must define cost, overhead, margin, tax, and approval rules before offering pricing guidance.</p></section>
      <section class="stage-card"><div class="opportunity-top"><div>${proposalStatus}<h2>Recurring desert landscape maintenance</h2><p class="opportunity-meta">Proposal version 1 · Valid through Aug 28, 2026</p></div><strong>$165 / service visit</strong></div>
        <table class="scope-table"><thead><tr><th>Scope item</th><th>Included services</th><th>Exclusions</th></tr></thead><tbody><tr><td>Front and rear landscape areas</td><td>Green-waste removal, ornamental-bed detailing, shrub shaping, and hardscape blow-off</td><td>Tree removal, irrigation repair, and hauling above 2 cubic yards</td></tr><tr><td>Recurring service cadence</td><td>Every other week with advance arrival-window confirmation</td><td>Guaranteed exact arrival time</td></tr><tr><td>Initial service</td><td>One-time landscape reset: $240</td><td>Recurring service rate</td></tr></tbody></table>
        <div class="opportunity-facts"><div><span>Weather delay</span><strong>Reschedule notification</strong></div><div><span>Service evidence</span><strong>Before/after photos + completion report</strong></div><div><span>Cancellation notice</span><strong>48 hours</strong></div></div>
      </section>
      ${state.proposal === 'sent' ? `<section class="stage-card"><h2>Owner question</h2><p class="opportunity-meta">Morgan asked whether seasonal cleanup includes fallen palm debris. Answering or revising the proposal does not approve it.</p><label class="field"><span>Answer the owner will see</span><textarea>Fallen palm debris is included up to the stated volume. Palm pruning and removal of attached fronds are excluded.</textarea></label><div class="stage-actions"><button class="button button-secondary" type="button" data-answer-question>Send answer</button><button class="button button-secondary" type="button" data-revise-proposal>Create proposal version 2</button></div></section><div class="stage-actions"><button class="button button-primary" type="button" data-simulate-acceptance>Review approved proposal</button></div>` : ''}
      ${state.proposal === 'accepted' ? `${note('private', 'The approved proposal stays on record', 'Proposal version 1, its price and terms, the sharing receipt, and the owner’s approval remain available to review. Later scope or price changes need a new proposal version or change order.')}<div class="stage-actions"><button class="button button-primary" type="button" data-go-stage="setup">Prepare the service</button><button class="button button-secondary" type="button" data-show-accepted>View approved proposal</button></div>` : state.proposal === 'draft' ? `<div class="stage-actions"><button class="button button-primary" type="button" data-send-proposal>Send proposal to owner</button><button class="button button-secondary" type="button">Save draft</button></div>` : ''}
    </div>`;
  }

  function setupView() {
    const confirmed = state.setup === 'confirmed';
    return `<div class="stage-view">${heading('Prepare service', confirmed ? 'The first service is ready' : 'The proposal is approved—now prepare the work', confirmed ? 'A crew is assigned, the work order is ready, and the owner can see the confirmed service window.' : 'Finish the property setup, turn the approved scope into crew instructions, assign the right crew, and confirm the first service window.')}
      <section class="stage-card"><div class="opportunity-top"><div><span class="status ${confirmed ? 'status-ready' : 'status-pending'}">${confirmed ? 'Work order ready' : 'Mobilization in progress'}</span><h2>Morgan Reyes · Residential property</h2><p class="opportunity-meta">Approved proposal v1 · Service relationship REL-104</p></div><span class="status status-info">No payment simulated</span></div>
        <ul class="readiness-list"><li><span class="readiness-icon">✓</span><div><strong>Customer account and service property linked</strong><small>Only owner-approved details were copied, with their source recorded</small></div><span class="status status-ready">Complete</span></li><li><span class="readiness-icon">✓</span><div><strong>Scope turned into crew instructions</strong><small>The approved scope stays separate from private team notes</small></div><span class="status status-ready">Complete</span></li><li><span class="readiness-icon">${confirmed ? '✓' : '3'}</span><div><strong>Responsible landscape maintenance crew</strong><small>${confirmed ? 'Crew 2 · Crew leader: Alex Rivera' : 'Not yet assigned'}</small></div><span class="status ${confirmed ? 'status-ready' : 'status-pending'}">${confirmed ? 'Assigned' : 'Required'}</span></li><li><span class="readiness-icon">${confirmed ? '✓' : '4'}</span><div><strong>Initial service work order</strong><small>${confirmed ? 'Thursday, Aug 27 · 8:00–10:00 AM' : 'Owner sees setup in progress—not scheduled service'}</small></div><span class="status ${confirmed ? 'status-ready' : 'status-pending'}">${confirmed ? 'Confirmed' : 'Required'}</span></li><li><span class="readiness-icon">${confirmed ? '✓' : '5'}</span><div><strong>Owner service update</strong><small>${confirmed ? 'Sent after work-order confirmation · In-app and email' : 'Preview required before anything is sent'}</small></div><span class="status ${confirmed ? 'status-ready' : 'status-pending'}">${confirmed ? 'Sent' : 'Required'}</span></li></ul>
      </section>
      ${confirmed ? `${ownerNotificationReceipt()}<section class="stage-card"><h2>Ready for the field</h2><div class="opportunity-facts"><div><span>Route assignment</span><strong>Thursday · Crew 2</strong></div><div><span>Required service evidence</span><strong>Before/after photos + completion report</strong></div><div><span>Site access</span><strong>Available for this work order</strong></div></div><div class="stage-actions"><button class="button button-primary" type="button" data-open-field>Open work-order preview</button><button class="button button-secondary" type="button" data-go-stage="support">Get support</button></div></section>` : setupDraft()}
    </div>`;
  }

  function setupDraft() {
    if (state.ownerNotification === 'editing') return `<section class="stage-card owner-message-editor"><p class="micro-label">Owner-visible update</p><h2>Edit the first-service message</h2><div class="form-grid"><label class="field"><span>Recipient</span><input value="Morgan Reyes" readonly></label><label class="field"><span>Delivery</span><select><option>In-app and email</option><option>In-app only</option><option>Email only</option></select></label><label class="field"><span>Send timing</span><select><option>After the work order is confirmed</option><option>Save without sending</option></select></label><label class="field"><span>Owner preparation</span><input value="Please unlock the side gate and keep pets inside."></label><label class="field full"><span>Arrival and weather note</span><textarea>We plan to arrive Thursday between 8:00 and 10:00 AM. We’ll contact you if weather or field conditions require a change.</textarea></label></div>${note('private', 'Business-only information stays out', 'Crew names, route position, labor assumptions, margins, internal hazards, and private team notes are not included.')}<div class="stage-actions"><button class="button button-primary" type="button" data-save-owner-message>Save and review message</button><button class="button button-secondary" type="button" data-cancel-owner-message>Cancel</button></div></section>`;
    const previewReady = state.ownerNotification === 'preview' || state.ownerNotification === 'error';
    return `<section class="stage-card form-grid"><label class="field"><span>Responsible crew</span><select><option>Crew 2 · Alex Rivera</option><option>Crew 3 · Sam Ortiz</option></select></label><label class="field"><span>First service window</span><select><option>Thursday, Aug 27 · 8–10 AM</option><option>Friday, Aug 28 · 1–3 PM</option></select></label><label class="checkbox-row full"><input type="checkbox" checked><span>I reviewed the site access, known hazards, materials, service evidence, and owner-visible instructions for the first work order.</span></label></section>${previewReady ? ownerNotificationPreview() : ''}${state.ownerNotification === 'error' ? '<div class="form-error" role="alert" tabindex="-1"><strong>The work order and owner update were not confirmed.</strong><span>Your crew, service window, and message are still here. Review them and try again.</span></div>' : ''}<div class="stage-actions">${previewReady ? '<button class="button button-primary" type="button" data-confirm-first-visit>Confirm work order and send owner update</button><button class="button button-secondary" type="button" data-edit-owner-message>Edit owner update</button>' : '<button class="button button-primary" type="button" data-preview-first-visit>Assign crew and preview owner update</button>'}<button class="button button-secondary" type="button">Save and finish later</button></div>`;
  }

  function ownerNotificationPreview() {
    return `<section class="owner-notification" aria-labelledby="owner-message-title"><div class="opportunity-top"><div><p class="micro-label">Owner message preview</p><h2 id="owner-message-title">Your first service is confirmed</h2><p class="opportunity-meta">Morgan Reyes · In-app and email · Sends only after work-order confirmation</p></div><span class="status status-pending">Not sent</span></div><p>Desert &amp; Pine will provide recurring desert landscape maintenance on Thursday, Aug 27, with an arrival window of 8:00–10:00 AM.</p><div class="notification-facts"><div><span>Included</span><strong>Approved maintenance scope and initial landscape reset</strong></div><div><span>Please prepare</span><strong>Unlock the side gate and keep pets inside</strong></div><div><span>If plans change</span><strong>We’ll contact you about weather or field delays</strong></div><div><span>Questions</span><strong>Reply in Grover or call the provider office</strong></div></div><aside><strong>Not shown to the owner</strong><span>Crew identity, route position, labor plan, internal hazards, margin, and team notes.</span></aside></section>`;
  }

  function ownerNotificationReceipt() {
    return `<section class="owner-notification sent" aria-labelledby="owner-receipt-title"><div class="opportunity-top"><div><p class="micro-label">Owner communication receipt</p><h2 id="owner-receipt-title">First-service update sent</h2><p class="opportunity-meta">Aug 16, 2026 · 10:42 AM · In-app and email</p></div><span class="status status-ready">Delivered</span></div><div class="notification-facts"><div><span>Recipient</span><strong>Morgan Reyes</strong></div><div><span>Confirmed window</span><strong>Thursday · 8:00–10:00 AM</strong></div><div><span>Message version</span><strong>First-service update v1</strong></div><div><span>Owner preparation</span><strong>Gate and pet reminder included</strong></div></div><button class="text-action" type="button" data-view-owner-receipt>View exact message and delivery record</button></section>`;
  }

  function teamRoleLabel() {
    return state.teamRole === 'opportunity-manager' ? 'Opportunity manager' : state.teamRole === 'estimator' ? 'Assessor and estimator' : state.teamRole === 'crew-member' ? 'Crew member' : 'Crew leader';
  }

  function teamView() {
    const roleLabel = teamRoleLabel();
    const statusContent = {
      draft: `<section class="stage-card team-invite-builder"><h2>Prepare an invitation</h2><div class="form-grid"><label class="field"><span>Team member email</span><input type="email" value="alex.rivera@example.com"></label><label class="field"><span>Role</span><select data-team-role><option value="crew-leader" ${state.teamRole === 'crew-leader' ? 'selected' : ''}>Crew leader</option><option value="crew-member" ${state.teamRole === 'crew-member' ? 'selected' : ''}>Crew member</option><option value="estimator" ${state.teamRole === 'estimator' ? 'selected' : ''}>Assessor and estimator</option><option value="opportunity-manager" ${state.teamRole === 'opportunity-manager' ? 'selected' : ''}>Opportunity manager</option></select></label><label class="field"><span>Branch</span><select><option>Central branch</option><option>North branch</option></select></label><label class="field"><span>Approval owner</span><select><option>Morgan Reyes · Business owner</option></select></label></div><div class="role-preview"><div><p class="micro-label">Invitation preview</p><h3>${roleLabel}</h3><p>The recipient sees the company, inviter, role, branch, expiration, included tools, and excluded data before accepting.</p></div><span class="status status-info">Approval required</span></div><div class="stage-actions"><button class="button button-primary" type="button" data-submit-team-invite>Send for owner approval</button><button class="button button-secondary" type="button" data-go-stage="invited">Preview recipient experience</button></div></section>`,
      approval: `<section class="stage-card"><div class="opportunity-top"><div><span class="status status-pending">Awaiting owner approval</span><h2>${roleLabel} invitation</h2><p class="opportunity-meta">alex.rivera@example.com · Central branch</p></div><span class="status status-info">No access granted</span></div><p>The invitation will not be sent until an authorized business owner confirms the role and branch.</p><div class="stage-actions"><button class="button button-primary" type="button" data-approve-team-invite>Approve and send invitation</button><button class="button button-secondary" type="button" data-edit-team-invite>Edit role or branch</button></div></section>`,
      sent: `<section class="stage-card"><div class="opportunity-top"><div><span class="status status-ready">Invitation sent</span><h2>${roleLabel} · Central branch</h2><p class="opportunity-meta">alex.rivera@example.com · Expires Aug 20, 2026</p></div><span class="status status-pending">Awaiting acceptance</span></div><ol class="request-timeline"><li class="complete"><span>✓</span><div><strong>Role approved</strong><small>Morgan Reyes · Aug 16 at 10:20 AM</small></div></li><li class="complete"><span>✓</span><div><strong>Invitation delivered</strong><small>Verified destination · Aug 16 at 10:21 AM</small></div></li><li class="current"><span>3</span><div><strong>Recipient reviewing</strong><small>No company access until acceptance</small></div></li></ol><div class="stage-actions"><button class="button button-secondary" type="button" data-go-stage="invited">Preview recipient experience</button><button class="button button-danger" type="button" data-revoke-team-invite>Revoke invitation</button></div></section>`,
      correction: `<section class="stage-card"><div class="opportunity-top"><div><span class="status status-pending">Correction requested</span><h2>Review the recipient or role</h2><p class="opportunity-meta">alex.rivera@example.com · No access granted</p></div></div><p>The recipient flagged this invitation before accepting it. Confirm the email, branch, and authority, then prepare a replacement invitation.</p><button class="button button-primary" type="button" data-edit-team-invite>Review and correct invitation</button></section>`,
      expired: `<section class="stage-card"><div class="opportunity-top"><div><span class="status status-risk">Invitation expired</span><h2>No access was granted</h2><p class="opportunity-meta">alex.rivera@example.com · Expired Aug 20, 2026</p></div></div><p>The expired invitation cannot be accepted. Preparing another invitation requires a new authority review and approval.</p><button class="button button-primary" type="button" data-new-team-invite>Prepare a new invitation</button></section>`,
      revoked: `<section class="stage-card"><div class="opportunity-top"><div><span class="status status-risk">Invitation revoked</span><h2>No access was granted</h2><p class="opportunity-meta">alex.rivera@example.com · Revoked Aug 16 at 10:36 AM</p></div></div><p>The old invitation cannot be accepted. A new invitation and approval are required if the person still needs access.</p><button class="button button-primary" type="button" data-new-team-invite>Prepare a new invitation</button></section>`,
      accepted: `<section class="stage-card"><div class="opportunity-top"><div><span class="status status-ready">Access accepted</span><h2>${roleLabel} · Central branch</h2><p class="opportunity-meta">alex.rivera@example.com · Accepted Aug 16 at 11:05 AM</p></div><span class="status status-info">Active access</span></div><p>The accepted role, branch, included tools, and exclusions remain on record. Removing active access is a separate controlled action—not invitation revocation.</p><div class="stage-actions"><button class="button button-secondary" type="button" data-go-stage="invited">Review acceptance receipt</button><button class="button button-secondary" type="button" data-go-stage="support">Review access support</button></div></section>`,
    }[state.invitationState] || '';
    return `<div class="stage-view">${heading('Team roles and access', 'Give each person only the access they need', 'Compare authority before inviting someone. Roles control who may review opportunities, assess property, set price, release work, or complete field service.')}
      <section class="stage-card authority-matrix"><div class="opportunity-top"><div><p class="micro-label">Authority comparison</p><h2>Who can make each decision?</h2></div><span class="status status-info">Business-controlled</span></div><div class="table-scroll" tabindex="0" aria-label="Scrollable role authority comparison"><table><thead><tr><th>Capability</th><th>Owner</th><th>Opportunity manager</th><th>Estimator</th><th>Crew leader</th><th>Crew member</th></tr></thead><tbody><tr><th>Review opportunities</th><td>Yes</td><td>Yes</td><td>View assigned</td><td>No</td><td>No</td></tr><tr><th>Request owner disclosure</th><td>Yes</td><td>Yes</td><td>No</td><td>No</td><td>No</td></tr><tr><th>Complete site assessment</th><td>Yes</td><td>Assigned</td><td>Yes</td><td>Field facts</td><td>No</td></tr><tr><th>Set price and send proposal</th><td>Yes</td><td>If granted</td><td>Draft only</td><td>No</td><td>No</td></tr><tr><th>Assign crew and release work</th><td>Yes</td><td>If granted</td><td>No</td><td>No</td><td>No</td></tr><tr><th>Complete assigned field work</th><td>Optional</td><td>No</td><td>No</td><td>Yes</td><td>Yes</td></tr></tbody></table></div><p class="opportunity-meta">Production must make every “if granted” permission explicit, auditable, and revocable. A job title alone must not imply authority.</p></section>
      ${statusContent}
      ${note('warning', 'Access changes need a record', 'Approval, delivery, acceptance, correction, expiration, revocation, and role changes should retain actor, time, scope, and previous access.')}
    </div>`;
  }

  function governanceView() {
    const limited = state.pilotState === 'limited';
    return `<div class="stage-view">${heading('Pilot governance review', limited ? 'A known-owner pilot can move to implementation planning' : 'Close the operating decisions before marketplace launch', limited ? 'Direct provider invitations can validate identity, disclosure, assessment, proposal, support, and handoff without promising an open opportunity marketplace.' : 'The interface cannot safely promise eligibility, ranking, response times, or regional availability until each operating owner and rule is approved.')}
      <section class="pilot-readiness ${limited ? 'limited' : ''}"><div><p class="micro-label">Recommended release boundary</p><h2>${limited ? 'Known-owner connection only' : 'Not ready for curated opportunity launch'}</h2><p>${limited ? 'Public provider routing and direct owner invitations may proceed to production design. Curated opportunities remain gated.' : 'Continue prototype review while product, operations, trust, support, and legal owners resolve the launch contract.'}</p></div><span class="status ${limited ? 'status-ready' : 'status-risk'}">${limited ? 'Limited pilot candidate' : '6 gates open'}</span></section>
      <section class="stage-card governance-gates"><h2>Pilot release gates</h2><div class="disclosure-table"><div class="disclosure-row"><div><strong>Provider eligibility by region and service</strong><small>Define minimum facts, source, freshness, expiry, correction, and appeal.</small></div><span class="status ${limited ? 'status-ready' : 'status-pending'}">${limited ? 'Direct pilot rule' : 'Decision needed'}</span></div><div class="disclosure-row"><div><strong>Pre-consent opportunity fields</strong><small>Approve size, landscape profile, service request, timing, and route-impact derivation.</small></div><span class="status ${limited ? 'status-ready' : 'status-pending'}">${limited ? 'Bounded set' : 'Decision needed'}</span></div><div class="disclosure-row"><div><strong>Role authority</strong><small>Name who may request disclosure, assess, price, propose, assign, and release work.</small></div><span class="status ${limited ? 'status-ready' : 'status-pending'}">${limited ? 'Owner-controlled' : 'Decision needed'}</span></div><div class="disclosure-row"><div><strong>Safety, abuse, and support response</strong><small>Separate emergency guidance, safety stop, incident intake, harassment, and product help.</small></div><span class="status status-pending">Operating owner needed</span></div><div class="disclosure-row"><div><strong>Allocation, fairness, and provider density</strong><small>Define response windows, rate limits, measurement, and supported launch region.</small></div><span class="status status-pending">Marketplace-gated</span></div><div class="disclosure-row"><div><strong>Marketplace claims and health</strong><small>No rank, lead-volume, earnings, exclusivity, or demand-health claim without evidence.</small></div><span class="status status-risk">Blocked from promise</span></div></div></section>
      <div class="visibility-grid"><article><p class="micro-label">Safe to design now</p><h2>Direct connection workflow</h2><p>Provider entry, owner invitation, precise disclosure, assessment, proposal, explicit approval, work preparation, and contextual support.</p></article><article class="private-panel"><p class="micro-label">Keep product-gated</p><h2>Marketplace scale</h2><p>Open discovery, ranking, regional health, sponsored placement, lead fees, availability claims, and performance comparisons.</p></article></div>
      <div class="stage-actions">${limited ? '<button class="button button-secondary" type="button" data-review-pilot="not-ready">Return to unresolved gates</button>' : '<button class="button button-primary" type="button" data-review-pilot="limited">Review limited pilot boundary</button>'}<button class="button button-secondary" type="button" data-go-stage="support">Review support ownership</button></div>
    </div>`;
  }

  function supportView() {
    return `<div class="stage-view">${heading('Provider support', 'Get help for the step you’re working on', 'Choose the topic that best matches your question so the right support team receives the useful details without asking you to start over.')}
      ${state.reportSent ? '<div class="stage-note private"><span aria-hidden="true">✓</span><div><strong>Illustrative service-request report received</strong>The request is hidden from this prototype view. No real report, case, or notification was created.</div></div>' : ''}
      <div class="support-categories">
        ${supportCard('Business profile and documents', 'Resolve a duplicate business, confirm who can represent it, or review a document status, expiration, correction, or appeal.', 'Review business-profile help', 'correction')}
        ${supportCard('Opportunities and owner contact', 'Pause new opportunities, understand why a request fits, decline it, or report spam and unwanted contact.', 'Review opportunity controls', 'opportunity')}
        ${supportCard('Site assessment and safety', 'Stop unsafe activity, distinguish an emergency, report harassment, or preserve incident details.', 'Review safety support', 'safety')}
        ${supportCard('Team roles and access', 'Correct an invitation, review a role, remove access, transfer ownership, or recover an account.', 'Review team-access help', 'access')}
        ${supportCard('Field work and offline recovery', 'Recover route, work-order, checklist, photo, or completion-report activity after service begins.', 'Review field recovery', 'field')}
        ${supportCard('Business data and customer relationship', 'Pause the profile, export data, review retention or deletion, end a customer relationship, or dispute a record.', 'Review data controls', 'data')}
      </div>
      <section class="stage-card"><h2>Contact provider support</h2><div class="form-grid"><label class="field"><span>What do you need help with?</span><select><option>Choose a topic</option><option>Business profile or document</option><option>Service opportunity or owner contact</option><option>Safety or incident</option><option>Team access</option></select></label><label class="field"><span>How should we respond?</span><select><option>In-app and email</option><option>Email</option><option>Phone call</option></select></label></div><p class="opportunity-meta">Prototype only: support hours, response times, languages, emergency guidance, and escalation ownership still require production decisions.</p></section>
      <div class="stage-actions"><button class="button button-primary" type="button" data-open-support-request>Start a support request</button><button class="button button-secondary" type="button" data-go-stage="team">Review team authority</button><button class="button button-secondary" type="button" data-go-stage="governance">Review pilot gates</button><button class="button button-secondary" type="button" data-go-stage="opportunities">Return to opportunities</button></div>
    </div>`;
  }

  function supportCard(title, text, action, kind) {
    return `<article class="support-card"><span class="status ${kind === 'safety' ? 'status-risk' : 'status-info'}">${kind === 'safety' ? 'Safety-aware' : 'Contextual help'}</span><h2>${title}</h2><p>${text}</p><button type="button" data-support-kind="${kind}">${action} →</button></article>`;
  }

  function invitedView() {
    const roleLabel = teamRoleLabel();
    const roleAccess = {
      'opportunity-manager': ['Owner-approved opportunity previews and disclosure requests', 'For the Central branch and only while opportunity authority remains active', 'Customer price, proposal release, crew assignment, and field-work data', 'These require separate granted capabilities or an assigned field role'],
      estimator: ['Assigned property details, assessment evidence, and estimate drafts', 'For assigned Central branch assessments only', 'Proposal release, crew assignment, other crews, and business administration', 'Drafting an estimate does not grant authority to issue the proposal'],
      'crew-member': ['Assigned work orders, service tasks, and property instructions', 'For active Central branch crew assignments only', 'Customer pricing, new opportunities, other crews, and work release', 'These are not included with the crew-member role'],
      'crew-leader': ['Assigned routes, work orders, service tasks, and property instructions', 'For the Central branch and your active crew assignments', 'Customer pricing, new opportunities, and other crews', 'These are not included with the crew-leader role'],
    }[state.teamRole];
    const unavailable = ['correction', 'expired', 'revoked'].includes(state.invitationState);
    const invitationStatus = state.invitationState === 'correction' ? ['Correction requested', 'status-pending', 'The inviting business is reviewing the role or recipient. No access is available while the invitation is being corrected.'] : state.invitationState === 'expired' ? ['Invitation expired', 'status-risk', 'This invitation can no longer be accepted. Ask Sonoran Grounds to prepare and approve a new invitation.'] : state.invitationState === 'revoked' ? ['Invitation revoked', 'status-risk', 'Sonoran Grounds ended this invitation before acceptance. No company access was granted.'] : state.invitationState === 'accepted' ? ['Access accepted', 'status-ready', `${roleLabel} access is active for the Central branch.`] : ['Expires Aug 20, 2026', 'status-pending', 'Review the role and included tools before accepting.'];
    return `<div class="stage-view">${heading('Team invitation', state.invitationState === 'accepted' ? `Your ${roleLabel} access is ready` : 'You were invited to join Sonoran Grounds', 'Review the company, your role, your branch, and the tools you can use before accepting. This invitation will not create or claim a new business.')}
      <section class="stage-card"><div class="opportunity-top"><div><span class="status ${invitationStatus[1]}">${invitationStatus[0]}</span><h2>${roleLabel}</h2><p class="opportunity-meta">Sent to alex.rivera@example.com by Morgan Reyes</p></div><span class="status status-info">Email matches</span></div><p>${invitationStatus[2]}</p><div class="opportunity-facts"><div><span>Company</span><strong>Sonoran Grounds</strong></div><div><span>Your role</span><strong>${roleLabel}</strong></div><div><span>Your branch</span><strong>Central branch</strong></div></div></section>
      <section class="stage-card"><h2>What this role can access</h2><div class="disclosure-table"><div class="disclosure-row"><div><strong>${roleAccess[0]}</strong><small>${roleAccess[1]}</small></div><span class="status status-ready">Included</span></div><div class="disclosure-row"><div><strong>${roleAccess[2]}</strong><small>${roleAccess[3]}</small></div><span class="status status-pending">Not included</span></div></div></section>
      <details class="stage-card role-boundary"><summary>Compare this role with other team roles</summary><div class="role-comparison"><div><strong>Opportunity manager</strong><span>May review opportunities and request owner disclosure when granted.</span></div><div><strong>Assessor and estimator</strong><span>May document site facts and draft an estimate; proposal authority is separate.</span></div><div><strong>Crew leader</strong><span>May lead assigned field work and submit service evidence.</span></div><div><strong>Crew member</strong><span>May complete assigned field tasks without customer price or opportunity access.</span></div></div><button class="text-action" type="button" data-go-stage="team">Open the full authority comparison</button></details>
      ${state.invitationState === 'accepted' ? note('private', 'Acceptance receipt', 'Accepted Aug 16, 2026 at 11:05 AM. Company, inviter, role, branch, destination, included tools, and exclusions remain available to review.') : note('warning', 'Unexpected invitation?', 'Do not accept it. Report the invitation, request a corrected recipient or role, or let it expire. No company access is granted before acceptance.')}
      <div class="stage-actions">${state.invitationState === 'accepted' ? '<button class="button button-primary" type="button" data-open-field>Open assigned field work</button>' : unavailable ? '<button class="button button-primary" type="button" data-go-stage="team">Review invitation status</button>' : '<button class="button button-primary" type="button" data-accept-invite>Accept and open field work</button><button class="button button-secondary" type="button" data-correct-invite>Request a correction</button>'}<button class="text-action" type="button" data-report-request>Report invitation</button><button class="text-action" type="button" data-go-stage="path">Choose a different path</button></div>
    </div>`;
  }

  function contextFor(stage) {
    const common = `<section class="context-card"><p class="micro-label">Prototype boundary</p><h2>Review, not production</h2><p>Nothing is persisted, sent, verified, matched, priced, scheduled, assigned, or reported.</p></section>`;
    const content = {
      path: `<section class="context-card"><p class="micro-label">Your account</p><h2>${state.path === 'company' ? 'Landscape company' : 'Owner-operator'}</h2><p>${state.path === 'company' ? 'One business account with separate office and crew roles.' : 'One business account with both management and field access.'}</p></section>`,
      profile: `<section class="context-card"><p class="micro-label">Privacy</p><h2>Your setup stays private</h2><p>Draft business and contact details are not public and do not unlock new opportunities.</p></section>`,
      readiness: `<section class="context-card"><p class="micro-label">Business readiness</p><h2>Review each detail on its own</h2><p>Supplied, independently checked, pending, expired, not required, and not collected do not mean the same thing.</p></section>`,
      opportunities: `<section class="context-card"><p class="micro-label">Why this may fit</p><h2>Based on your choices</h2><ul><li>Approximate service area</li><li>Services you offer</li><li>Assessment preference</li></ul><p>No ranking or guaranteed availability.</p></section>`,
      request: `<section class="context-card"><p class="micro-label">Owner privacy</p><h2>The owner chooses what to share</h2><p>The address, contact details, photos, and access notes can be shared separately and later withdrawn.</p></section>`,
      assessment: `<section class="context-card"><p class="micro-label">Site assessment</p><h2>Be clear about what is unknown</h2><p>Photos do not confirm dimensions, diagnosis, safe access, production needs, or price.</p></section>`,
      proposal: `<section class="context-card"><p class="micro-label">Owner decision</p><h2>Your scope, clearly recorded</h2><p>Questions and revisions are not approval. The approved proposal stays available to review.</p></section>`,
      setup: `<section class="context-card"><p class="micro-label">Prepare the work</p><h2>Your business assigns the crew</h2><p>The owner approves the proposal; your team controls the crew assignment, work order, and route.</p></section>`,
      team: `<section class="context-card"><p class="micro-label">Team authority</p><h2>Permission before access</h2><p>Role, branch, approval owner, included tools, and excluded data are explicit before delivery or acceptance.</p></section>`,
      governance: `<section class="context-card"><p class="micro-label">Pilot boundary</p><h2>Direct connection first</h2><p>Known-owner invitations validate the operating loop with less allocation, density, ranking, and abuse risk.</p></section>`,
      support: `<section class="context-card"><p class="micro-label">Urgency</p><h2>Safety is separate</h2><p>Emergency guidance, safety stop, incident intake, and ordinary product support cannot be one queue.</p></section>`,
      invited: `<section class="context-card"><p class="micro-label">Least privilege</p><h2>Role before access</h2><p>The invitation names organization, inviter, role, scope, expiration, and excluded data before acceptance.</p></section>`,
    };
    return (content[stage] || '') + common;
  }

  function renderNav() {
    const activeIndex = stages.findIndex(([key]) => key === state.stage);
    stageNav.innerHTML = stageGroups.map(([groupLabel, keys]) => `<li class="stage-group-label">${groupLabel}</li>${stages.filter(([key]) => keys.has(key)).map(([key, label]) => { const index = stages.findIndex(([stageKey]) => stageKey === key); return `<li><button type="button" data-go-stage="${key}" ${state.stage === key ? 'aria-current="step"' : ''} class="${state.completed.has(key) ? 'complete' : ''}"><span class="step-number">${state.completed.has(key) ? '✓' : index + 1}</span><span>${label}</span></button></li>`; }).join('')}`).join('');
    mobileProgress.textContent = state.stage === 'invited' ? 'Team invitation' : state.stage === 'support' ? 'Provider support' : activeIndex >= 0 ? `Step ${activeIndex + 1} of ${stages.length}` : 'Business setup';
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
    body.dataset.ownerNotificationState = state.ownerNotification;
    body.dataset.alertState = state.alertStatus;
    body.dataset.invitationState = state.invitationState;
    body.dataset.pilotState = state.pilotState;
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
    readinessLabel.textContent = state.stage === 'opportunities' ? 'Service opportunities' : state.stage === 'setup' && state.setup === 'confirmed' ? 'First service ready' : state.stage === 'team' ? 'Team administration' : state.stage === 'governance' ? 'Pilot review' : 'Business setup';
    renderNav();
    const specialTitle = { invited: 'Crew invitation', support: 'Provider support', team: 'Team roles', governance: 'Pilot governance' }[state.stage];
    document.title = `${stages.find(([key]) => key === state.stage)?.[1] || specialTitle || 'Crew acquisition'} · Grover working design`;
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

  reviewStages.innerHTML = [...stages, ['team', 'Team roles and access'], ['support', 'Provider support'], ['invited', 'Invited team member'], ['governance', 'Pilot governance']].map(([key, label]) => `<button type="button" data-review-stage="${key}">${label}</button>`).join('');

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
    if (target.matches('[data-review-alert]')) { state.alertStatus = target.dataset.reviewAlert; reviewDialog.open && reviewDialog.close(); go('opportunities'); return; }
    if (target.matches('[data-review-invite]')) { state.invitationState = target.dataset.reviewInvite; reviewDialog.open && reviewDialog.close(); go('invited'); return; }
    if (target.matches('[data-review-pilot]')) { state.pilotState = target.dataset.reviewPilot; reviewDialog.open && reviewDialog.close(); go('governance'); return; }
    if (target.matches('[data-continue-path]')) { const selected = document.querySelector('input[name="providerPath"]:checked')?.value || state.path; if (selected === 'invited') go('invited'); else { state.path = selected; complete('path', 'profile'); } return; }
    if (target.matches('[data-show-duplicate]')) { confirmAction('A similar provider may already exist', '“Desert & Pine Landscaping LLC” uses the same contact domain. Request access or confirm that this is a different business before creating another organization.', 'claim', 'Request organization access'); return; }
    if (target.matches('[data-service]')) { const id = target.dataset.service; state.services.has(id) ? state.services.delete(id) : state.services.add(id); target.setAttribute('aria-pressed', String(state.services.has(id))); return; }
    if (target.matches('[data-complete-readiness]')) { complete('readiness', 'opportunities'); return; }
    if (target.matches('[data-pause-profile]')) { confirmAction('Pause new service opportunities?', 'Your business profile remains available where applicable. Active owner conversations and approved service relationships are unchanged.', 'pause', 'Pause opportunities'); return; }
    if (target.matches('[data-resume-opportunities]')) { state.opportunityState = 'ready'; render(); showToast('New service opportunities are on again.'); return; }
    if (target.matches('[data-save-search]')) { alertDialog.showModal(); return; }
    if (target.matches('[data-close-alert]')) { alertDialog.close(); return; }
    if (target.matches('[data-toggle-alert]')) { state.alertStatus = state.alertStatus === 'paused' ? 'saved' : 'paused'; render(); live.textContent = state.alertStatus === 'paused' ? 'Saved opportunity alert paused.' : 'Saved opportunity alert resumed.'; return; }
    if (target.matches('[data-interest]')) { if (state.failInterest) { state.failInterest = false; state.interestFailed = true; document.querySelector('[data-fail-interest]').checked = false; render(); requestAnimationFrame(() => document.querySelector('[role="alert"]')?.focus()); } else { state.interestFailed = false; state.interest = 'pending'; render(); live.textContent = 'Assessment request sent. Waiting for the owner to choose what to share.'; } return; }
    if (target.matches('[data-owner-approve]')) { state.disclosed = true; state.completed.add('request'); render(); live.textContent = 'Owner-approved property details loaded.'; return; }
    if (target.matches('[data-withdraw-interest]')) { confirmAction('Withdraw your assessment request?', 'Morgan will see that your business is no longer asking to assess the property. You do not need to provide a reason.', 'withdraw', 'Withdraw request', true); return; }
    if (target.matches('[data-safe-question]')) { confirmAction('Ask the owner a question', 'This question stays in Grover and does not reveal the owner’s contact details: “Is the cleanup mostly routine green waste or a larger amount of accumulated debris?”', 'question', 'Send question'); return; }
    if (target.matches('[data-decline-request]')) { confirmAction('Mark this opportunity not a fit?', 'Choose a simple reason the owner can understand. Your private capacity, pricing, staffing, and business reasoning stay private.', 'decline', 'Not a fit'); return; }
    if (target.matches('[data-report-request]')) { confirmAction('Report this request?', 'Use this for spam, suspicious contact, unsafe requests, harassment, or policy concerns—not simply because the work is not a fit.', 'report', 'Submit illustrative report', true); return; }
    if (target.matches('[data-show-receipt]')) { confirmAction('Property-sharing receipt', 'Shared Aug 14, 2026: exact service address and four intake photos. Conversation stays in Grover. Phone, gate, pet, and service-access details have not been shared.', 'close', 'Done'); return; }
    if (target.matches('[data-schedule-assessment]')) { if (state.assessmentScheduled) complete('assessment', 'proposal'); else { state.assessmentScheduled = true; state.assessmentMode = document.querySelector('input[name="assessment"]:checked')?.value || 'onsite'; render(); live.textContent = 'Illustrative site-assessment window proposed.'; } return; }
    if (target.matches('[data-provider-note]')) { showToast('Private team note added to the illustrative site assessment.'); return; }
    if (target.matches('[data-send-proposal]')) { state.proposal = 'sent'; state.completed.add('proposal'); render(); live.textContent = 'Service proposal version 1 issued for owner review.'; return; }
    if (target.matches('[data-answer-question]')) { showToast('Illustrative proposal clarification issued. The proposal remains undecided.'); return; }
    if (target.matches('[data-revise-proposal]')) { showToast('Proposal version 2 draft started. Version 1 remains in revision history.'); return; }
    if (target.matches('[data-simulate-acceptance]')) { confirmAction('Review the approved proposal', 'Morgan approved proposal version 1. Your team can now prepare the service, but payment, crew assignment, the work order, and the service date are not complete yet.', 'accept', 'Load approved proposal'); return; }
    if (target.matches('[data-show-accepted]')) { showToast('Approved proposal version 1 stays unchanged and available to review.'); return; }
    if (target.matches('[data-preview-first-visit]')) { state.ownerNotification = 'preview'; render(); live.textContent = 'Owner service update preview ready. Nothing has been sent.'; return; }
    if (target.matches('[data-edit-owner-message]')) { state.ownerNotification = 'editing'; render(); return; }
    if (target.matches('[data-save-owner-message]')) { state.ownerNotification = 'preview'; render(); live.textContent = 'Owner update saved for review. Nothing has been sent.'; return; }
    if (target.matches('[data-cancel-owner-message]')) { state.ownerNotification = 'preview'; render(); return; }
    if (target.matches('[data-confirm-first-visit]')) { if (state.failOwnerNotification) { state.failOwnerNotification = false; state.ownerNotification = 'error'; document.querySelector('[data-fail-owner-notification]').checked = false; render(); requestAnimationFrame(() => document.querySelector('[role="alert"]')?.focus()); } else { state.setup = 'confirmed'; state.ownerNotification = 'sent'; state.completed.add('setup'); render(); live.textContent = 'Work order confirmed and first-service update delivered to the owner.'; } return; }
    if (target.matches('[data-view-owner-receipt]')) { confirmAction('First-service communication receipt', 'Sent Aug 16, 2026 at 10:42 AM to Morgan Reyes by in-app message and email. The receipt retains the exact owner-visible scope, service window, preparation, weather note, provider contact, sender, and delivery result.', 'close', 'Done'); return; }
    if (target.matches('[data-open-field]')) { showToast('Production handoff: open the existing mobile Route → Work order → Service evidence workflow.'); return; }
    if (target.matches('[data-submit-team-invite]')) { state.invitationState = 'approval'; render(); live.textContent = 'Team invitation is waiting for business-owner approval. No access was granted.'; return; }
    if (target.matches('[data-approve-team-invite]')) { state.invitationState = 'sent'; render(); live.textContent = 'Team invitation approved and delivered. No access until acceptance.'; return; }
    if (target.matches('[data-edit-team-invite]') || target.matches('[data-new-team-invite]')) { state.invitationState = 'draft'; render(); return; }
    if (target.matches('[data-revoke-team-invite]')) { confirmAction('Revoke this invitation?', 'The recipient will no longer be able to accept it. No company access has been granted. A later invitation requires a new approval.', 'revoke-invite', 'Revoke invitation', true); return; }
    if (target.matches('[data-support-kind]')) { const kind = target.dataset.supportKind; kind === 'safety' ? confirmAction('Safety and incident support', 'Stop work when needed. Production must distinguish emergencies, immediate hazards, harassment, incidents, and ordinary product support.', 'close', 'Understood') : showToast(`${target.textContent.trim()} reviewed. Production ownership remains a product gate.`); return; }
    if (target.matches('[data-open-support-request]')) { showToast('Illustrative support draft started. No request was sent.'); return; }
    if (target.matches('[data-open-correction]')) { confirmAction('Review eligibility requirement', 'Tree-service eligibility needs a defined regional requirement, source, review owner, freshness rule, expiry, correction route, and appeal policy before launch.', 'close', 'Keep requirement pending'); return; }
    if (target.matches('[data-accept-invite]')) { state.invitationState = 'accepted'; render(); live.textContent = `${teamRoleLabel()} invitation accepted with Central branch access.`; return; }
    if (target.matches('[data-correct-invite]')) { state.invitationState = 'correction'; render(); live.textContent = 'Invitation correction requested. No access was granted.'; return; }
    if (target.matches('[data-save-exit]')) { showToast('Private prototype progress saved for review. Nothing was persisted.'); return; }
    if (target.matches('[data-previous-stage]')) { const index = stages.findIndex(([key]) => key === state.stage); if (index > 0) go(stages[index - 1][0]); return; }
    if (target.matches('[data-next-stage]')) { const index = stages.findIndex(([key]) => key === state.stage); if (index >= 0 && index < stages.length - 1) go(stages[index + 1][0]); return; }
    if (target.matches('[data-cancel-confirm]')) { confirmDialog.close(); return; }
    if (target.matches('[data-confirm-action]')) {
      const action = target.dataset.confirmAction;
      confirmDialog.close();
      if (action === 'pause') { state.opportunityState = 'paused'; go('opportunities'); }
      else if (action === 'withdraw') { state.interest = 'none'; state.disclosed = false; go('opportunities'); showToast('Assessment request withdrawn in this illustrative flow.'); }
      else if (action === 'decline') { go('opportunities'); showToast('Opportunity marked not a fit. No private business details were shared.'); }
      else if (action === 'report') { state.reportSent = true; go('support'); }
      else if (action === 'accept') { state.proposal = 'accepted'; render(); live.textContent = 'Approved proposal state loaded.'; }
      else if (action === 'revoke-invite') { state.invitationState = 'revoked'; go('team'); }
      else if (action === 'claim') showToast('Illustrative organization-access request started.');
      else if (action === 'question') showToast('Illustrative question sent without asking for private contact details.');
      return;
    }
  });

  document.addEventListener('change', (event) => {
    if (event.target.matches('input[name="providerPath"]')) { state.path = event.target.value; render(); }
    if (event.target.matches('input[name="assessment"]')) state.assessmentMode = event.target.value;
    if (event.target.matches('[data-fail-interest]')) state.failInterest = event.target.checked;
    if (event.target.matches('[data-fail-owner-notification]')) state.failOwnerNotification = event.target.checked;
    if (event.target.matches('[data-fail-alert-save]')) state.failAlertSave = event.target.checked;
    if (event.target.matches('[data-team-role]')) { state.teamRole = event.target.value; render(); }
  });

  document.addEventListener('submit', (event) => {
    if (event.target.matches('[data-alert-form]')) {
      event.preventDefault();
      const form = new FormData(event.target);
      const channels = form.getAll('alertChannel');
      const error = alertDialog.querySelector('[data-alert-error]');
      if (state.failAlertSave || channels.length === 0) {
        state.failAlertSave = false;
        const failureToggle = alertDialog.querySelector('[data-fail-alert-save]');
        if (failureToggle) failureToggle.checked = false;
        error.hidden = false;
        error.querySelector('span').textContent = channels.length === 0 ? 'Choose at least one delivery channel. Your other preferences are still here.' : 'Your frequency, channels, quiet hours, and filters are still here. Try again.';
        error.focus();
        return;
      }
      state.alertFrequency = String(form.get('alertFrequency') || 'Daily digest');
      state.alertChannels = channels.join(' + ');
      state.alertQuietHours = String(form.get('quietHours') || '7:00 PM–7:00 AM');
      state.alertStatus = 'saved';
      error.hidden = true;
      alertDialog.close();
      render();
      live.textContent = 'Opportunity alert saved. It does not reserve or guarantee work.';
      return;
    }
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
  alertDialog.addEventListener('close', () => document.querySelector('[data-save-search]')?.focus());
  confirmDialog.addEventListener('click', (event) => { if (event.target === confirmDialog) confirmDialog.close(); });
  window.addEventListener('hashchange', () => {
    const requested = location.hash.slice(1);
    if (views[requested] && requested !== state.stage) go(requested, false);
  });

  const initial = location.hash.slice(1);
  if (views[initial]) state.stage = initial;
  render();
})();
