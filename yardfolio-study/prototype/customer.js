const customerApp = document.getElementById('customer-app');

const initialCustomerState = () => ({
  read: 'ready',
  version: 3,
  stale: false,
  decision: 'pending',
  confirmation: false,
  notice: '',
});

let customerState = initialCustomerState();

function renderCustomer() {
  if (customerState.read === 'unavailable') {
    return `
      <section class="state-card state-card-danger" aria-labelledby="customer-read-title">
        <span class="state-symbol" aria-hidden="true">!</span>
        <p class="step-label">PROPOSAL READ UNAVAILABLE</p>
        <h2 id="customer-read-title" tabindex="-1">The current proposal could not be loaded.</h2>
        <p>Scope and price stay hidden until the read succeeds. No decision was submitted.</p>
        <button class="button button-primary" type="button" data-action="retry-read">Retry proposal read</button>
      </section>
    `;
  }
  if (customerState.stale) {
    return `
      <section class="state-card state-card-warning" aria-labelledby="customer-stale-title">
        <p class="step-label">PROPOSAL VERSION CHANGED</p>
        <h2 id="customer-stale-title" tabindex="-1">Proposal v2 is no longer current.</h2>
        <p>The provider updated this offer. An acceptance of v2 is blocked. Review the latest scope and price before deciding.</p>
        <button class="button button-primary" type="button" data-action="load-current">Load current proposal v3</button>
      </section>
    `;
  }
  const accepted = customerState.decision === 'accepted';
  const revision = customerState.decision === 'revision';
  return `
    <div class="customer-layout">
      <section class="customer-intro" aria-labelledby="customer-property-title">
        <p class="step-label">YOUR PROPERTY</p>
        <h2 id="customer-property-title" tabindex="-1">Canyon View</h2>
        <p>One decision for this property. Only the proposal and customer-safe outcome are shown here.</p>
        <div class="customer-steps" aria-label="Service steps">
          <span class="customer-step-active">1 · Your decision</span>
          <span>2 · Provider planning</span>
          <span>3 · Reviewed result</span>
        </div>
      </section>
      <div class="service-main customer-main">
        <div class="service-heading">
          <div><p class="eyebrow">CURRENT PROPOSAL · VERSION ${customerState.version}</p><h2 id="customer-decision-title" tabindex="-1">One-time cleanup and pruning</h2></div>
          <span class="status-tag ${accepted ? 'status-tag-good' : revision ? 'status-tag-attention' : 'status-tag-neutral'}">${accepted ? 'Accepted' : revision ? 'Changes requested' : 'Your decision'}</span>
        </div>
        ${customerState.notice ? `<p class="inline-notice" role="status">${customerState.notice}</p>` : ''}
        <section class="customer-scope" aria-labelledby="customer-scope-title">
          <p class="step-label">WHAT IS INCLUDED</p>
          <h3 id="customer-scope-title">One-time care at Canyon View</h3>
          <p>Cleanup and pruning for this property. This is proposal <strong>version ${customerState.version}</strong>.</p>
          <div class="customer-price"><span>Total for this proposal</span><strong>$420</strong></div>
        </section>
        <section class="customer-consequence" aria-labelledby="customer-consequence-title">
          <p class="step-label">WHAT ACCEPTANCE MEANS</p>
          <h3 id="customer-consequence-title">Planning can begin after you accept.</h3>
          <p>Accepting this proposal asks the provider to plan the work. It does not confirm a service date or charge your account.</p>
        </section>
        ${accepted ? `
          <section class="handoff-card" aria-labelledby="customer-next-title">
            <div><p class="step-label">NEXT OWNER</p><h3 id="customer-next-title">Company Manager plans the service</h3>
            <p>Your proposal v${customerState.version} decision is recorded in this simulation. You will see a reviewed result after the provider completes and approves the work.</p></div>
          </section>
          <p class="study-link-note">Study control: <a href="./">inspect the Company Manager side</a>. This changes review perspective; it is not customer workspace access.</p>
        ` : revision ? `
          <section class="handoff-card" aria-labelledby="customer-next-title">
            <div><p class="step-label">NEXT OWNER</p><h3 id="customer-next-title">Provider proposal owner revises the offer</h3>
            <p>No work was scheduled or charged. Review a new version before accepting any revised scope.</p></div>
          </section>
        ` : `
          <div class="customer-actions">
            <button class="button button-primary" type="button" data-action="open-accept">Review acceptance of v${customerState.version}</button>
            <button class="button button-secondary" type="button" data-action="request-revision">Ask for a revision</button>
          </div>
        `}
        ${customerState.confirmation ? `
          <section class="decision-panel" aria-labelledby="customer-confirm-title">
            <p class="step-label">CONFIRM YOUR DECISION</p>
            <h3 id="customer-confirm-title" tabindex="-1">Accept proposal v${customerState.version} for $420?</h3>
            <p>This requests provider planning for one-time cleanup and pruning at Canyon View. No date or payment is confirmed.</p>
            <div class="button-row">
              <button class="button button-primary" type="button" data-action="confirm-accept">Accept proposal v${customerState.version}</button>
              <button class="button button-text" type="button" data-action="cancel-accept">Keep reviewing</button>
            </div>
          </section>
        ` : ''}
      </div>
    </div>
  `;
}

function render(focusId) {
  customerApp.innerHTML = renderCustomer();
  if (focusId) document.getElementById(focusId)?.focus();
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'reset') {
    customerState = initialCustomerState();
    render('customer-decision-title'); return;
  }
  if (action === 'fail-read') {
    customerState.read = 'unavailable'; customerState.confirmation = false;
    customerState.notice = '';
    render('customer-read-title'); return;
  }
  if (action === 'retry-read' && customerState.read === 'unavailable') {
    customerState.read = 'ready';
    customerState.notice = 'The proposal read is available again. Check the current version before deciding.';
    render(customerState.stale ? 'customer-stale-title' : 'customer-decision-title'); return;
  }
  if (action === 'inject-stale') {
    customerState.read = 'ready'; customerState.version = 2;
    customerState.stale = true; customerState.confirmation = false;
    customerState.decision = 'pending'; customerState.notice = '';
    render('customer-stale-title'); return;
  }
  if (customerState.read !== 'ready') return;
  if (action === 'load-current' && customerState.stale) {
    customerState.version = 3; customerState.stale = false;
    customerState.notice = 'Current proposal v3 loaded. Review its scope and total before accepting.';
    render('customer-decision-title'); return;
  }
  if (customerState.stale || customerState.decision !== 'pending') return;
  if (action === 'open-accept') { customerState.confirmation = true; render('customer-confirm-title'); return; }
  if (action === 'cancel-accept') { customerState.confirmation = false; render('customer-decision-title'); return; }
  if (action === 'request-revision') {
    customerState.decision = 'revision'; customerState.confirmation = false;
    customerState.notice = 'A revision was requested in this simulation; the current proposal was not accepted.';
    render('customer-next-title'); return;
  }
  if (action === 'confirm-accept' && customerState.confirmation) {
    customerState.decision = 'accepted'; customerState.confirmation = false;
    customerState.notice = `Proposal v${customerState.version} acceptance simulated. No date or payment was confirmed.`;
    render('customer-next-title');
  }
});

render();
