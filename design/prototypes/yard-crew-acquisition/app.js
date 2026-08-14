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
    ['path', 'Choose your path'],
    ['profile', 'Business profile'],
    ['readiness', 'Services & readiness'],
    ['opportunities', 'Find opportunities'],
    ['request', 'Review request'],
    ['assessment', 'Yard assessment'],
    ['proposal', 'Proposal'],
    ['setup', 'Work-ready setup'],
    ['support', 'Provider support'],
  ];

  const state = {
    stage: 'welcome',
    path: 'solo',
    completed: new Set(),
    providerName: 'Desert & Pine Yard Care',
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
        ${heading('Provider setup · Step 1', 'How do you work today?', 'Choose the path that matches your responsibility. You can review the resulting account before creating anything.')}
        <fieldset class="choice-grid" aria-describedby="path-help"><legend class="live-region">Provider path</legend>
          ${pathChoice('solo', '1', 'I run the business and do the work', 'Create a provider organization of one. You receive business-owner and field permissions.', 'Owner-operator account')}
          ${pathChoice('company', '2+', 'I manage a company or several crews', 'Create or claim the provider organization, then configure response owners and invite the team.', 'Company account')}
          ${pathChoice('invited', '↳', 'I am joining an existing company', 'Verify the invitation and offered role. You will not create or claim a business.', 'Invitation path')}
        </fieldset>
        <p class="stage-note private" id="path-help"><span aria-hidden="true">◉</span><span><strong>Owners choose businesses, not individual employees.</strong> Crew assignments, pricing permissions, and team access stay inside the provider organization.</span></p>
        <div class="stage-actions"><button class="button button-primary" type="button" data-continue-path>Continue with this path</button><button class="button button-secondary" type="button" data-go-stage="welcome">Return to overview</button></div>
      </div>`,
    profile: () => `
      <div class="stage-view">
        ${heading('Provider setup · Step 2', state.path === 'company' ? 'Create or claim your provider organization' : 'Build your owner-operator profile', state.path === 'company' ? 'Use the identity customers recognize. Grover checks for likely duplicates before creating another organization.' : 'A solo operator still uses a provider organization—just one where you hold both business and field responsibilities.')}
        ${state.profileError ? '<div class="form-error" role="alert"><strong>Review the highlighted details.</strong> Enter a provider name, verified contact, and authority confirmation. Your entries have been preserved.</div>' : ''}
        <form class="stage-card form-grid" id="provider-profile-form" novalidate>
          <label class="field full"><span>Customer-facing provider name *</span><small>Use the business or trade name owners should recognize.</small><input name="providerName" value="${escapeHtml(state.providerName)}" autocomplete="organization" required></label>
          <label class="field"><span>Verified business email *</span><input name="email" value="hello@desertpine.example" type="email" autocomplete="email" required></label>
          <label class="field"><span>Verified mobile number *</span><input name="phone" value="(602) 555-0148" type="tel" autocomplete="tel" required></label>
          <label class="field"><span>Operating model</span><select name="model"><option ${state.path === 'solo' ? 'selected' : ''}>Owner-operator</option><option ${state.path === 'company' ? 'selected' : ''}>Multi-crew company</option></select></label>
          <label class="field"><span>Primary language</span><select><option>English</option><option>Spanish</option><option>English and Spanish</option></select></label>
          <label class="checkbox-row full"><input name="authority" type="checkbox" ${state.profileError ? '' : 'checked'}><span><strong>I am authorized to represent this provider.</strong><br>I understand profile creation does not make the business eligible for owner requests.</span></label>
          <div class="stage-actions full"><button class="button button-primary" type="submit">Save provider profile</button><button class="button button-secondary" type="button" data-show-duplicate>Review a possible duplicate</button></div>
        </form>
        ${note('warning', 'Illustrative identity only', 'No business, email, phone, document, license, insurance, or authority is checked in this prototype.')}
      </div>`,
    readiness: () => `
      <div class="stage-view">
        ${heading('Provider setup · Step 3', 'Describe the work you can responsibly assess', 'Services and territory improve fit. They do not guarantee an opportunity, owner selection, route density, or exclusive coverage.')}
        <section class="stage-card"><h2>Services offered</h2><p class="opportunity-meta">Choose only work your business is prepared and qualified to assess. You can pause a category later.</p>
          <div class="chip-group" data-service-chips>${serviceChip('upkeep', 'Recurring upkeep')}${serviceChip('cleanup', 'Seasonal cleanup')}${serviceChip('lawn', 'Lawn care')}${serviceChip('desert', 'Desert landscape')}${serviceChip('irrigation', 'Irrigation observation')}${serviceChip('trees', 'Tree & shrub care')}</div>
        </section>
        <section class="stage-card form-grid"><h2 class="field full">Service area and response</h2>
          <label class="field"><span>Primary service area</span><input value="Central Phoenix" autocomplete="address-level2"></label>
          <label class="field"><span>Travel boundary</span><select><option>Within about 12 miles</option><option>Selected postal codes</option><option>Review a service-area map</option></select></label>
          <label class="field"><span>Assessment method</span><select><option>On site preferred</option><option>Remote review first</option><option>Either</option></select></label>
          <label class="field"><span>Typical response</span><select><option>Within 1 business day</option><option>Within 2 business days</option><option>Within 3 business days</option></select></label>
        </section>
        <section class="stage-card"><div class="opportunity-top"><div><h2>Readiness facts</h2><p class="opportunity-meta">Each fact keeps its own source, scope, freshness, and correction path.</p></div><span class="status status-pending">2 need review</span></div>
          <ul class="readiness-list"><li><span class="readiness-icon">✓</span><div><strong>Business identity supplied</strong><small>Customer-facing identity submitted Aug 14, 2026</small></div><span class="status status-info">Supplied</span></li><li><span class="readiness-icon">↻</span><div><strong>Insurance document</strong><small>Document supplied; independent check not simulated</small></div><span class="status status-pending">Review pending</span></li><li><span class="readiness-icon">✓</span><div><strong>Response owner</strong><small>${state.path === 'company' ? 'Morgan Reyes · Operations owner' : 'Morgan Reyes · Owner-operator'}</small></div><span class="status status-ready">Ready</span></li><li><span class="readiness-icon">!</span><div><strong>Tree-service eligibility</strong><small>Region and service requirement needs review</small></div><button class="text-action" type="button" data-open-correction>Review</button></li></ul>
        </section>
        <div class="stage-actions"><button class="button button-primary" type="button" data-complete-readiness>Finish readiness review</button><button class="button button-secondary" type="button" data-pause-profile>Pause new requests</button></div>
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
    const headingBlock = heading('Opportunity workspace', 'Find owner requests that fit your business', 'These previews use approximate area and owner-approved care needs. Interest asks the owner for assessment access; it does not claim or accept work.');
    if (state.opportunityState === 'unavailable') return `<div class="stage-view">${headingBlock}<div class="empty-state"><span class="empty-icon" aria-hidden="true">↻</span><h2>Opportunities are temporarily unavailable</h2><p>Your readiness and filters are safe. Grover cannot confirm current requests, so it will not show a stale or empty list.</p><button class="button button-primary" type="button" data-review-opportunities="ready">Try again</button><button class="button button-secondary" type="button" data-go-stage="support">Get help</button></div></div>`;
    if (state.opportunityState === 'paused') return `<div class="stage-view">${headingBlock}<div class="empty-state"><span class="empty-icon" aria-hidden="true">Ⅱ</span><h2>New requests are paused</h2><p>Your provider profile remains visible where applicable, but Grover is not adding new opportunities to this workspace. Active owner conversations are unchanged.</p><button class="button button-primary" type="button" data-resume-opportunities>Resume requests</button><button class="button button-secondary" type="button" data-go-stage="support">Review pause settings</button></div></div>`;
    if (state.opportunityState === 'empty') return `<div class="stage-view">${headingBlock}<div class="opportunity-toolbar"><input class="search-field" aria-label="Search owner opportunities" value="tree removal"><button class="button button-secondary" type="button">Filters · 3</button></div><div class="filter-row"><button class="chip selected" type="button">Central Phoenix</button><button class="chip selected" type="button">Tree work</button><button class="chip selected" type="button">Within 12 miles</button></div><div class="empty-state"><span class="empty-icon" aria-hidden="true">⌕</span><h2>No suitable requests match these filters</h2><p>Grover will not broaden your service area or show private owner requests just to fill the list. Remove a filter, update a capability, or check later.</p><button class="button button-primary" type="button" data-review-opportunities="ready">Clear tree-work filter</button><button class="button button-secondary" type="button" data-save-search>Save this search</button></div></div>`;
    return `<div class="stage-view">${headingBlock}
      <div class="opportunity-toolbar"><label><span class="live-region">Search opportunities</span><input class="search-field" aria-label="Search owner opportunities" placeholder="Search care type or approximate area"></label><button class="button button-secondary" type="button" data-review-opportunities="empty">Filters · 2</button></div>
      <div class="filter-row"><button class="chip selected" type="button">Central Phoenix</button><button class="chip selected" type="button">Your services</button><button class="chip" type="button" data-review-opportunities="empty">Tree removal</button></div>
      <div class="opportunity-list">
        ${opportunityCard('opp-1', 'Recurring desert-yard upkeep', 'Central Phoenix', 'Upkeep + cleanup', 'Recommend one', 'On site expected', 'Good service fit', true)}
        ${opportunityCard('opp-2', 'Overgrown front-yard reset', 'Encanto area', 'One-time cleanup', 'One time', 'Remote review first', 'Review travel', false)}
      </div>
      ${note('private', 'Opportunity previews protect both sides', 'Exact address, owner contact, photos, access notes, competitors, ranking, and owner budget are not included.')}
    </div>`;
  }

  function opportunityCard(id, title, area, care, cadence, assessment, fit, primary) {
    return `<article class="opportunity-card" data-opportunity-id="${id}"><div class="opportunity-top"><div><span class="status ${primary ? 'status-fit' : 'status-pending'}">${fit}</span><h2>${title}</h2><p class="opportunity-meta">${area} · Respond by Aug ${primary ? '18' : '17'}, 2026</p></div><button class="button button-secondary" type="button" data-go-stage="request">Review</button></div><div class="opportunity-facts"><div><span>Requested care</span><strong>${care}</strong></div><div><span>Preferred rhythm</span><strong>${cadence}</strong></div><div><span>Yard review</span><strong>${assessment}</strong></div></div><ul class="fit-list"><li>Matches ${primary ? '2' : '1'} services you offer</li><li>${primary ? 'About 4 miles' : 'Near the edge'} of your declared area</li></ul></article>`;
  }

  function requestView() {
    if (state.disclosed) return `<div class="stage-view">${heading('Owner-approved disclosure', 'Morgan approved assessment access', 'The disclosure receipt records exactly what this provider can see. Access is for assessment only and may be withdrawn.')}
      <section class="stage-card"><div class="opportunity-top"><div><span class="status status-ready">Access approved</span><h2>Recurring desert-yard upkeep</h2><p class="opportunity-meta">Disclosure receipt · Aug 14, 2026 at 3:20 PM</p></div><button class="text-action" type="button" data-show-receipt>View receipt</button></div><div class="disclosure-table"><div class="disclosure-row"><div><strong>Exact service address</strong><small>Approved for assessment and arrival planning</small></div><span class="status status-ready">Shared</span></div><div class="disclosure-row"><div><strong>Owner contact</strong><small>In-app conversation only; phone remains private</small></div><span class="status status-info">Limited</span></div><div class="disclosure-row"><div><strong>Yard photographs</strong><small>4 owner-selected intake photos</small></div><span class="status status-ready">Shared</span></div><div class="disclosure-row"><div><strong>Gate and pet details</strong><small>Not needed until a visit is confirmed</small></div><span class="status status-pending">Hidden</span></div></div></section>
      <div class="stage-actions"><button class="button button-primary" type="button" data-go-stage="assessment">Start yard review</button><button class="button button-secondary" type="button" data-go-stage="support">Report or withdraw</button></div></div>`;
    const failed = state.interestFailed ? '<div class="form-error" role="alert"><strong>Your interest request was not sent.</strong> The opportunity is still available and your note is preserved. Retry when ready.</div>' : '';
    const pending = state.interest === 'pending' ? `<div class="stage-note warning"><span aria-hidden="true">…</span><div><strong>Waiting for owner approval</strong>Morgan can approve exact address and selected photos independently, ask a question, choose another provider, or let the request expire.</div></div><div class="stage-actions"><button class="button button-primary" type="button" data-owner-approve>Review owner approval state</button><button class="button button-secondary" type="button" data-withdraw-interest>Withdraw interest</button></div>` : '';
    return `<div class="stage-view">${heading('Opportunity review', 'Recurring desert-yard upkeep', 'Decide whether the request is worth assessing using only the approved preview. Do not infer exact size, condition, price, or access from this summary.')}
      ${failed}
      <section class="stage-card"><div class="opportunity-top"><div><span class="status status-fit">Good service fit</span><h2>Owner’s private brief summary</h2></div><span class="opportunity-meta">Request OP-104 · Illustrative</span></div><div class="opportunity-facts"><div><span>Approximate area</span><strong>Central Phoenix</strong></div><div><span>Areas</span><strong>Front + back yard</strong></div><div><span>Goal</span><strong>Reliable upkeep</strong></div></div><p class="stage-note private"><span aria-hidden="true">◉</span><span><strong>Still private</strong> Exact address, owner contact, 4 photos, gate details, and pet information require provider-specific owner approval.</span></p></section>
      <section class="stage-card"><h2>Before asking for access</h2><label class="field"><span>Optional owner-visible note</span><small>Ask only what helps decide whether to assess. Do not request contact outside Grover.</small><textarea>We provide recurring desert-yard upkeep in Central Phoenix. I’d like to review the yard and confirm whether an on-site assessment is needed.</textarea></label></section>
      ${state.interest === 'pending' ? pending : `<div class="stage-actions"><button class="button button-primary" type="button" data-interest>Interested — request assessment access</button><button class="button button-secondary" type="button" data-safe-question>Ask a clarifying question</button><button class="text-action" type="button" data-decline-request>Not a fit</button><button class="text-action" type="button" data-report-request>Report request</button></div><p class="opportunity-meta">Interest does not accept work, reveal competitors, or promise owner selection.</p>`}
    </div>`;
  }

  function assessmentView() {
    const scheduled = state.assessmentScheduled ? `<div class="stage-note private"><span aria-hidden="true">✓</span><div><strong>Assessment window confirmed</strong>Tuesday, Aug 18 · 9:00–11:00 AM. This is an assessment, not a service visit.</div></div>` : '';
    return `<div class="stage-view">${heading('Yard review and assessment', 'Review what is known—and name what is not', 'Owner photos and answers are context, not measurements, diagnosis, or proof that remote pricing is safe.')}
      ${scheduled}
      <section class="assessment-grid"><article class="yard-zone"><span class="status status-info">Owner photo · illustrative</span><h3>Front yard</h3><p>Desert landscape, two planting beds, visible leaf debris. Plant condition and irrigation operation are not established.</p><button class="text-action" type="button">Inspect photo details</button></article><article class="yard-zone"><span class="status status-pending">Needs confirmation</span><h3>Back yard</h3><p>Owner selected “not sure” for irrigation and noted a dog. Exact access details remain hidden until a visit is confirmed.</p><button class="text-action" type="button" data-safe-question>Ask owner</button></article></section>
      <section class="stage-card"><h2>Assessment decision</h2><div class="choice-grid"><label class="choice-card"><input type="radio" name="assessment" value="remote" ${state.assessmentMode === 'remote' ? 'checked' : ''}><span class="choice-icon">⌂</span><strong>Remote review may be enough</strong><p>Continue only for scope that can be credibly assessed from shared information.</p></label><label class="choice-card"><input type="radio" name="assessment" value="onsite" ${state.assessmentMode === 'onsite' ? 'checked' : ''}><span class="choice-icon">→</span><strong>On-site assessment required</strong><p>Confirm dimensions, access, condition, hazards, and service feasibility in person.</p></label><label class="choice-card"><input type="radio" name="assessment" value="decline" ${state.assessmentMode === 'decline' ? 'checked' : ''}><span class="choice-icon">×</span><strong>Cannot safely assess</strong><p>Decline without inventing a diagnosis or exposing private business reasoning.</p></label></div></section>
      <section class="stage-card form-grid"><h2 class="field full">Owner-visible assessment window</h2><label class="field"><span>Date</span><input type="date" value="2026-08-18"></label><label class="field"><span>Arrival window</span><select><option>9:00–11:00 AM</option><option>1:00–3:00 PM</option></select></label><label class="field full"><span>What will be reviewed</span><textarea>Confirm service areas, access, cleanup volume, irrigation observations, and scope for recurring upkeep.</textarea></label></section>
      ${note('warning', 'Safety and qualification stop', 'Tree hazards, electrical risk, chemicals, structural conditions, or work outside the provider’s qualifications must be stopped and routed appropriately.')}
      <div class="stage-actions"><button class="button button-primary" type="button" data-schedule-assessment>${state.assessmentScheduled ? 'Continue to proposal' : 'Propose assessment window'}</button><button class="button button-secondary" type="button" data-provider-note>Add private assessment note</button></div>
    </div>`;
  }

  function proposalView() {
    const proposalStatus = state.proposal === 'accepted' ? '<span class="status status-ready">Owner accepted version 1</span>' : state.proposal === 'sent' ? '<span class="status status-pending">Sent · owner reviewing</span>' : '<span class="status status-info">Draft version 1</span>';
    return `<div class="stage-view">${heading('Provider-authored proposal', 'Turn the assessment into clear, comparable scope', 'The owner can ask a question or request a revision without deciding. Sending does not assign a crew or schedule service.')}
      <section class="stage-card"><div class="opportunity-top"><div>${proposalStatus}<h2>Recurring desert-yard care</h2><p class="opportunity-meta">Version 1 · Expires Aug 28, 2026</p></div><strong>$165 / visit</strong></div>
        <table class="scope-table"><thead><tr><th>Area</th><th>Included</th><th>Not included</th></tr></thead><tbody><tr><td>Front + back</td><td>Debris cleanup, bed detail, shrub shaping, hardscape blow-off</td><td>Tree removal, irrigation repair, hauling above 2 cubic yards</td></tr><tr><td>Cadence</td><td>Every other week · arrival window confirmed ahead</td><td>Exact arrival time guarantee</td></tr><tr><td>First visit</td><td>One-time reset: $240</td><td>Recurring visit price</td></tr></tbody></table>
        <div class="opportunity-facts"><div><span>Weather</span><strong>Customer-safe reschedule notice</strong></div><div><span>Proof</span><strong>Before/after + completion note</strong></div><div><span>Cancellation</span><strong>48-hour policy</strong></div></div>
      </section>
      ${state.proposal === 'sent' ? `<section class="stage-card"><h2>Owner collaboration</h2><p class="opportunity-meta">Morgan asked whether seasonal cleanup includes palm debris. Answer or revise without treating the question as acceptance.</p><label class="field"><span>Response</span><textarea>Palm debris already on the ground is included within the stated volume. Palm trimming is excluded.</textarea></label><div class="stage-actions"><button class="button button-secondary" type="button" data-answer-question>Send answer</button><button class="button button-secondary" type="button" data-revise-proposal>Create version 2</button></div></section><div class="stage-actions"><button class="button button-primary" type="button" data-simulate-acceptance>Review owner acceptance</button></div>` : ''}
      ${state.proposal === 'accepted' ? `${note('private', 'Accepted scope is immutable', 'Version 1, its price, terms, disclosure receipt, and owner confirmation remain reviewable. Later changes require a new version or change workflow.')}<div class="stage-actions"><button class="button button-primary" type="button" data-go-stage="setup">Begin provider setup</button><button class="button button-secondary" type="button" data-show-accepted>View accepted snapshot</button></div>` : state.proposal === 'draft' ? `<div class="stage-actions"><button class="button button-primary" type="button" data-send-proposal>Send proposal to owner</button><button class="button button-secondary" type="button">Save draft</button></div>` : ''}
    </div>`;
  }

  function setupView() {
    const confirmed = state.setup === 'confirmed';
    return `<div class="stage-view">${heading('Work-ready handoff', confirmed ? 'The first visit is confirmed' : 'Accepted does not mean assigned', confirmed ? 'The accepted relationship now enters the existing field workflow with explicit operational ownership.' : 'Finish provider-side property setup, assign the responsible crew, and confirm the first visit before the owner sees scheduled service.')}
      <section class="stage-card"><div class="opportunity-top"><div><span class="status ${confirmed ? 'status-ready' : 'status-pending'}">${confirmed ? 'Work ready' : 'Provider setup in progress'}</span><h2>Morgan Reyes · Home</h2><p class="opportunity-meta">Accepted proposal v1 · Relationship REL-104</p></div><span class="status status-info">No payment simulated</span></div>
        <ul class="readiness-list"><li><span class="readiness-icon">✓</span><div><strong>Customer and service property linked</strong><small>Only consented owner facts copied with source provenance</small></div><span class="status status-ready">Ready</span></li><li><span class="readiness-icon">✓</span><div><strong>Operational scope reviewed</strong><small>Accepted scope separated from provider-private instructions</small></div><span class="status status-ready">Ready</span></li><li><span class="readiness-icon">${confirmed ? '✓' : '3'}</span><div><strong>Responsible crew</strong><small>${confirmed ? 'Crew 2 · Lead: Alex Rivera' : 'Not yet assigned'}</small></div><span class="status ${confirmed ? 'status-ready' : 'status-pending'}">${confirmed ? 'Assigned' : 'Needed'}</span></li><li><span class="readiness-icon">${confirmed ? '✓' : '4'}</span><div><strong>First visit</strong><small>${confirmed ? 'Thursday, Aug 27 · 8:00–10:00 AM' : 'Owner sees provider setup—not scheduled service'}</small></div><span class="status ${confirmed ? 'status-ready' : 'status-pending'}">${confirmed ? 'Confirmed' : 'Needed'}</span></li></ul>
      </section>
      ${confirmed ? `<section class="stage-card"><h2>Field handoff</h2><div class="opportunity-facts"><div><span>Route</span><strong>Thursday · Crew 2</strong></div><div><span>Evidence</span><strong>Before + after required</strong></div><div><span>Access</span><strong>Shared for confirmed visit</strong></div></div><div class="stage-actions"><button class="button button-primary" type="button" data-open-field>Open field-work preview</button><button class="button button-secondary" type="button" data-go-stage="support">Review support</button></div></section>` : `<section class="stage-card form-grid"><label class="field"><span>Responsible crew</span><select><option>Choose a crew</option><option>Crew 2 · Alex Rivera</option></select></label><label class="field"><span>First-visit window</span><select><option>Thursday, Aug 27 · 8–10 AM</option><option>Friday, Aug 28 · 1–3 PM</option></select></label><label class="checkbox-row full"><input type="checkbox" checked><span>Access, hazard, material, evidence, and customer-visible instructions reviewed for the first visit.</span></label></section><div class="stage-actions"><button class="button button-primary" type="button" data-confirm-first-visit>Assign crew and confirm first visit</button><button class="button button-secondary" type="button">Save setup</button></div>`}
    </div>`;
  }

  function supportView() {
    return `<div class="stage-view">${heading('Provider support', 'Help should match the decision you are making', 'Setup, opportunity, assessment, safety, field recovery, and account-access issues need different urgency, context, and privacy handling.')}
      ${state.reportSent ? '<div class="stage-note private"><span aria-hidden="true">✓</span><div><strong>Illustrative report received</strong>The request is hidden from this prototype view. No real report or notification was sent.</div></div>' : ''}
      <div class="support-categories">
        ${supportCard('Business and verification', 'Duplicate organization, claim authority, document status, expiry, correction, or appeal.', 'Review correction path', 'correction')}
        ${supportCard('Opportunities and contact', 'Pause requests, explain match facts, decline safely, report spam or unwanted contact.', 'Review opportunity controls', 'opportunity')}
        ${supportCard('Assessment and safety', 'Stop unsafe work, separate emergencies, report harassment, or preserve incident context.', 'Review safety path', 'safety')}
        ${supportCard('Team and access', 'Correct an invitation, review a role, remove access, transfer ownership, or recover an account.', 'Review access help', 'access')}
        ${supportCard('Field and synchronization', 'Recover offline route, checklist, photo, or completion work after service activation.', 'Review field recovery', 'field')}
        ${supportCard('Data and relationship', 'Profile pause, export, retention, deletion eligibility, owner relationship end, or dispute.', 'Review data controls', 'data')}
      </div>
      <section class="stage-card"><h2>Contact support</h2><div class="form-grid"><label class="field"><span>Topic</span><select><option>Choose a topic</option><option>Provider verification</option><option>Opportunity or owner contact</option><option>Safety or incident</option><option>Account access</option></select></label><label class="field"><span>Preferred response</span><select><option>In-app and email</option><option>Email</option><option>Call me</option></select></label></div><p class="opportunity-meta">Prototype only: support coverage, response targets, languages, emergency handling, and escalation ownership require production decisions.</p></section>
      <div class="stage-actions"><button class="button button-primary" type="button" data-open-support-request>Start a support request</button><button class="button button-secondary" type="button" data-go-stage="opportunities">Return to opportunities</button></div>
    </div>`;
  }

  function supportCard(title, text, action, kind) {
    return `<article class="support-card"><span class="status ${kind === 'safety' ? 'status-risk' : 'status-info'}">${kind === 'safety' ? 'Safety-aware' : 'Contextual help'}</span><h2>${title}</h2><p>${text}</p><button type="button" data-support-kind="${kind}">${action} →</button></article>`;
  }

  function invitedView() {
    return `<div class="stage-view">${heading('Crew invitation', 'You were invited to join Sonoran Grounds', 'Review who invited you, which role is offered, and what it can access before accepting. This path does not create a provider business.')}
      <section class="stage-card"><div class="opportunity-top"><div><span class="status status-pending">Expires Aug 20, 2026</span><h2>Crew lead invitation</h2><p class="opportunity-meta">Sent to alex.rivera@example.com by Morgan Reyes</p></div><span class="status status-info">Email matched</span></div><div class="opportunity-facts"><div><span>Organization</span><strong>Sonoran Grounds</strong></div><div><span>Offered role</span><strong>Crew lead</strong></div><div><span>Scope</span><strong>Central branch</strong></div></div></section>
      <section class="stage-card"><h2>What this role can access</h2><div class="disclosure-table"><div class="disclosure-row"><div><strong>Assigned routes, jobs, tasks, and property instructions</strong><small>For the offered branch and active assignments</small></div><span class="status status-ready">Allowed</span></div><div class="disclosure-row"><div><strong>Field photos, issues, and completion reports</strong><small>Create and submit within assigned work</small></div><span class="status status-ready">Allowed</span></div><div class="disclosure-row"><div><strong>Customer pricing, company opportunities, and other crews</strong><small>Not included in the offered crew-lead role</small></div><span class="status status-pending">Not allowed</span></div></div></section>
      ${note('warning', 'Unexpected invitation?', 'Do not accept it. Report the invitation, request a corrected recipient or role, or let it expire. No company access is granted before acceptance.')}
      <div class="stage-actions"><button class="button button-primary" type="button" data-accept-invite>Accept and open field workspace</button><button class="button button-secondary" type="button" data-correct-invite>Request a correction</button><button class="text-action" type="button" data-report-request>Report invitation</button><button class="text-action" type="button" data-go-stage="path">Use a different path</button></div>
    </div>`;
  }

  function contextFor(stage) {
    const common = `<section class="context-card"><p class="micro-label">Prototype boundary</p><h2>Review, not production</h2><p>Nothing is persisted, sent, verified, matched, priced, scheduled, assigned, or reported.</p></section>`;
    const content = {
      path: `<section class="context-card"><p class="micro-label">Account outcome</p><h2>${state.path === 'company' ? 'Provider company' : 'Owner-operator'}</h2><p>${state.path === 'company' ? 'One organization with authorized office and crew roles.' : 'A provider organization of one with combined owner and field responsibility.'}</p></section>`,
      profile: `<section class="context-card"><p class="micro-label">Privacy</p><h2>Private setup</h2><p>Draft identity and contact details are not a public profile and do not unlock opportunities.</p></section>`,
      readiness: `<section class="context-card"><p class="micro-label">Readiness</p><h2>Facts, not one badge</h2><p>Supplied, checked, pending, expired, not applicable, and not collected remain distinct.</p></section>`,
      opportunities: `<section class="context-card"><p class="micro-label">Why shown</p><h2>Declared fit only</h2><ul><li>Approximate area</li><li>Offered services</li><li>Assessment preference</li></ul><p>No ranking or guaranteed availability.</p></section>`,
      request: `<section class="context-card"><p class="micro-label">Disclosure</p><h2>Owner-controlled</h2><p>Exact address, contact, photos, and access details can be approved separately and later withdrawn.</p></section>`,
      assessment: `<section class="context-card"><p class="micro-label">Yard review</p><h2>Name uncertainty</h2><p>Photos do not establish measurement, diagnosis, safety, access, or price.</p></section>`,
      proposal: `<section class="context-card"><p class="micro-label">Decision</p><h2>Provider-authored</h2><p>Questions and revisions do not decide. Accepted versions remain immutable.</p></section>`,
      setup: `<section class="context-card"><p class="micro-label">Handoff</p><h2>Provider assigns the crew</h2><p>The owner relationship is separate from internal crew continuity and schedule operations.</p></section>`,
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
      document.title = 'Grow my yard-care business · Grover working design';
      return;
    }
    publicContent.hidden = true;
    publicHeader.hidden = true;
    appShell.hidden = false;
    stageView.innerHTML = views[state.stage] ? views[state.stage]() : views.path();
    contextRail.innerHTML = contextFor(state.stage);
    providerName.textContent = state.providerName;
    readinessLabel.textContent = state.stage === 'opportunities' ? 'Opportunity workspace' : state.stage === 'setup' && state.setup === 'confirmed' ? 'Work ready' : 'Provider setup';
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

  reviewStages.innerHTML = [...stages, ['invited', 'Invited worker']].map(([key, label]) => `<button type="button" data-review-stage="${key}">${label}</button>`).join('');

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
    if (target.matches('[data-pause-profile]')) { confirmAction('Pause new owner requests?', 'Your provider profile remains available where applicable. Active conversations and accepted service are unchanged.', 'pause', 'Pause new requests'); return; }
    if (target.matches('[data-resume-opportunities]')) { state.opportunityState = 'ready'; render(); showToast('New owner requests resumed.'); return; }
    if (target.matches('[data-save-search]')) { showToast('Illustrative search saved. No alert will be sent.'); return; }
    if (target.matches('[data-interest]')) { if (state.failInterest) { state.failInterest = false; state.interestFailed = true; document.querySelector('[data-fail-interest]').checked = false; render(); requestAnimationFrame(() => document.querySelector('[role="alert"]')?.focus()); } else { state.interestFailed = false; state.interest = 'pending'; render(); live.textContent = 'Interest request sent. Waiting for owner approval.'; } return; }
    if (target.matches('[data-owner-approve]')) { state.disclosed = true; state.completed.add('request'); render(); live.textContent = 'Owner-approved disclosure loaded.'; return; }
    if (target.matches('[data-withdraw-interest]')) { confirmAction('Withdraw interest?', 'Morgan will see that this provider is no longer requesting assessment access. No reason is required.', 'withdraw', 'Withdraw interest', true); return; }
    if (target.matches('[data-safe-question]')) { confirmAction('Ask a clarifying question', 'This question stays in Grover and does not reveal owner contact: “Is the requested cleanup mainly routine debris or a larger accumulated volume?”', 'question', 'Send illustrative question'); return; }
    if (target.matches('[data-decline-request]')) { confirmAction('Mark this request not a fit?', 'Choose a customer-safe category. The owner will not see private capacity, pricing, staffing, or internal reasoning.', 'decline', 'Not a fit'); return; }
    if (target.matches('[data-report-request]')) { confirmAction('Report this request?', 'Use this for spam, suspicious contact, unsafe requests, harassment, or policy concerns—not simply because the work is not a fit.', 'report', 'Submit illustrative report', true); return; }
    if (target.matches('[data-show-receipt]')) { confirmAction('Disclosure receipt', 'Approved Aug 14, 2026: exact address and four intake photos. In-app conversation only. Phone, gate, pet, and access details remain hidden.', 'close', 'Done'); return; }
    if (target.matches('[data-schedule-assessment]')) { if (state.assessmentScheduled) complete('assessment', 'proposal'); else { state.assessmentScheduled = true; state.assessmentMode = document.querySelector('input[name="assessment"]:checked')?.value || 'onsite'; render(); live.textContent = 'Illustrative assessment window proposed.'; } return; }
    if (target.matches('[data-provider-note]')) { showToast('Private note added to the provider-only assessment record.'); return; }
    if (target.matches('[data-send-proposal]')) { state.proposal = 'sent'; state.completed.add('proposal'); render(); live.textContent = 'Proposal version 1 sent for owner review.'; return; }
    if (target.matches('[data-answer-question]')) { showToast('Illustrative answer sent. The proposal remains undecided.'); return; }
    if (target.matches('[data-revise-proposal]')) { showToast('Version 2 draft started. Version 1 remains in history.'); return; }
    if (target.matches('[data-simulate-acceptance]')) { confirmAction('Review owner acceptance', 'Morgan explicitly accepted proposal version 1. This authorizes provider setup—not payment, crew assignment, or a scheduled first visit.', 'accept', 'Load accepted state'); return; }
    if (target.matches('[data-show-accepted]')) { showToast('Accepted proposal version 1 remains immutable and reviewable.'); return; }
    if (target.matches('[data-confirm-first-visit]')) { state.setup = 'confirmed'; state.completed.add('setup'); render(); live.textContent = 'Responsible crew assigned and first visit confirmed.'; return; }
    if (target.matches('[data-open-field]')) { showToast('Production handoff: open the existing mobile Route → Job → Proof workflow.'); return; }
    if (target.matches('[data-support-kind]')) { const kind = target.dataset.supportKind; kind === 'safety' ? confirmAction('Safety and incident support', 'Stop work when needed. Production must distinguish emergencies, immediate hazards, harassment, incidents, and ordinary product support.', 'close', 'Understood') : showToast(`${target.textContent.trim()} reviewed. Production ownership remains a product gate.`); return; }
    if (target.matches('[data-open-support-request]')) { showToast('Illustrative support draft started. No request was sent.'); return; }
    if (target.matches('[data-open-correction]')) { confirmAction('Review eligibility requirement', 'Tree-service eligibility needs a defined regional requirement, source, review owner, freshness rule, expiry, correction route, and appeal policy before launch.', 'close', 'Keep requirement pending'); return; }
    if (target.matches('[data-accept-invite]')) { showToast('Illustrative invitation accepted. Only the offered crew-lead workspace would open.'); return; }
    if (target.matches('[data-correct-invite]')) { showToast('Illustrative correction requested from the inviting organization.'); return; }
    if (target.matches('[data-save-exit]')) { showToast('Private prototype progress saved for review. Nothing was persisted.'); return; }
    if (target.matches('[data-previous-stage]')) { const index = stages.findIndex(([key]) => key === state.stage); if (index > 0) go(stages[index - 1][0]); return; }
    if (target.matches('[data-next-stage]')) { const index = stages.findIndex(([key]) => key === state.stage); if (index >= 0 && index < stages.length - 1) go(stages[index + 1][0]); return; }
    if (target.matches('[data-cancel-confirm]')) { confirmDialog.close(); return; }
    if (target.matches('[data-confirm-action]')) {
      const action = target.dataset.confirmAction;
      confirmDialog.close();
      if (action === 'pause') { state.opportunityState = 'paused'; go('opportunities'); }
      else if (action === 'withdraw') { state.interest = 'none'; state.disclosed = false; go('opportunities'); showToast('Interest withdrawn in this illustrative flow.'); }
      else if (action === 'decline') { go('opportunities'); showToast('Request marked not a fit. No private reason was shared.'); }
      else if (action === 'report') { state.reportSent = true; go('support'); }
      else if (action === 'accept') { state.proposal = 'accepted'; render(); live.textContent = 'Accepted proposal state loaded.'; }
      else if (action === 'claim') showToast('Illustrative organization-access request started.');
      else if (action === 'question') showToast('Illustrative question sent without requesting private contact.');
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
