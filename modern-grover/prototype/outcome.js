const outcomeApp = document.getElementById('outcome-app');

const initialOutcomeState = () => ({
  read: 'ready',
  proofOpen: false,
  recommendation: 'closed',
  notice: '',
});

let outcomeState = initialOutcomeState();

function renderOutcomeFailure() {
  return `
    <section class="state-card state-card-danger" aria-labelledby="outcome-read-title">
      <span class="state-symbol" aria-hidden="true">!</span>
      <p class="step-label">SERVICE RESULT UNAVAILABLE</p>
      <h2 id="outcome-read-title" tabindex="-1">Your reviewed result could not be loaded.</h2>
      <p>Service and evidence details stay hidden until the read succeeds. This does not mean the work was undone or a new proposal was accepted.</p>
      <button class="button button-primary" type="button" data-action="retry-read">Retry result read</button>
    </section>
  `;
}

function renderOutcome() {
  if (outcomeState.read === 'unavailable') return renderOutcomeFailure();
  const requested = outcomeState.recommendation === 'requested';
  return `
    <div class="customer-layout">
      <section class="customer-intro" aria-labelledby="outcome-property-title">
        <p class="step-label">YOUR PROPERTY</p>
        <h2 id="outcome-property-title">Canyon View</h2>
        <p>One-time cleanup and pruning · synthetic service day September 16, 2026.</p>
        <div class="customer-steps" aria-label="Service steps">
          <span>1 · Decision made</span>
          <span>2 · Provider work</span>
          <span class="customer-step-active">3 · Reviewed result</span>
        </div>
      </section>
      <div class="service-main customer-main">
        <div class="service-heading">
          <div><p class="eyebrow">DELIVERED SERVICE · CANYON VIEW</p><h2 id="outcome-title" tabindex="-1">Cleanup and pruning completed</h2></div>
          <span class="status-tag status-tag-good">Reviewed result</span>
        </div>
        ${outcomeState.notice ? `<p class="inline-notice" role="status">${outcomeState.notice}</p>` : ''}
        <section class="customer-scope" aria-labelledby="outcome-summary-title">
          <p class="step-label">COMPLETED WORK</p>
          <h3 id="outcome-summary-title">One-time care, delivered</h3>
          <p>The provider marked the accepted cleanup and pruning work complete. A manager reviewed the result before this customer view was delivered.</p>
          <div class="outcome-metadata"><span>Service day</span><strong>September 16, 2026</strong></div>
        </section>
        <section class="customer-consequence" aria-labelledby="outcome-proof-title">
          <p class="step-label">REVIEWED PROOF</p>
          <h3 id="outcome-proof-title">After-photo record approved</h3>
          <p>Completion package 2 was reviewed for this service. Only approved proof is included in this customer result.</p>
          <button class="button button-secondary outcome-proof-button" type="button" data-action="toggle-proof" aria-expanded="${outcomeState.proofOpen}">${outcomeState.proofOpen ? 'Hide proof details' : 'Review proof details'}</button>
          ${outcomeState.proofOpen ? `
            <div class="outcome-proof-detail" id="outcome-proof-detail">
              <strong>Package 2 · manager reviewed</strong>
              <p>This concept supplies evidence status only. No actual photo is available here, so image quality cannot be judged in this study.</p>
            </div>
          ` : ''}
        </section>
        <section class="outcome-recommendation" aria-labelledby="outcome-recommendation-title">
          <p class="step-label">OPTIONAL NEXT CARE</p>
          <h3 id="outcome-recommendation-title">A seasonal follow-up check</h3>
          <p>This is a separate care idea. It does not reopen the completed service, schedule another visit, or charge you.</p>
          ${outcomeState.recommendation === 'closed'
            ? '<button class="button button-secondary" type="button" data-action="review-idea">Review next care idea</button>'
            : outcomeState.recommendation === 'open'
              ? `<div class="outcome-idea"><strong>Request a separate proposal</strong><p>A provider can prepare scope and price for a future seasonal check. You would decide on that proposal separately.</p><button class="button button-primary" type="button" data-action="request-proposal">Request proposal</button><button class="button button-text" type="button" data-action="close-idea">Not now</button></div>`
              : '<span class="status-tag status-tag-good">Separate proposal requested in simulation</span>'}
        </section>
        <section class="handoff-card" aria-labelledby="outcome-next-title">
          <div><p class="step-label">NEXT OWNER</p><h3 id="outcome-next-title">${requested ? 'Provider prepares a separate proposal' : 'Yard Owner can review the completed result'}</h3>
          <p>${requested ? 'The completed Canyon View service remains delivered. A future care proposal would need its own scope, price, and decision.' : 'The reviewed result is ready. The optional care idea is a new choice, not unfinished work.'}</p></div>
        </section>
      </div>
    </div>
  `;
}

function render(focusId) {
  outcomeApp.innerHTML = renderOutcome();
  if (focusId) document.getElementById(focusId)?.focus();
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'reset') { outcomeState = initialOutcomeState(); render('outcome-title'); return; }
  if (action === 'fail-read') {
    outcomeState.read = 'unavailable'; outcomeState.notice = '';
    render('outcome-read-title'); return;
  }
  if (action === 'retry-read' && outcomeState.read === 'unavailable') {
    outcomeState.read = 'ready';
    outcomeState.notice = 'The reviewed result is available again. No new service decision was made during the failed read.';
    render('outcome-title'); return;
  }
  if (outcomeState.read !== 'ready') return;
  if (action === 'toggle-proof') {
    outcomeState.proofOpen = !outcomeState.proofOpen;
    render('outcome-proof-title'); return;
  }
  if (action === 'review-idea' && outcomeState.recommendation === 'closed') {
    outcomeState.recommendation = 'open'; render('outcome-recommendation-title'); return;
  }
  if (action === 'close-idea' && outcomeState.recommendation === 'open') {
    outcomeState.recommendation = 'closed'; render('outcome-recommendation-title'); return;
  }
  if (action === 'request-proposal' && outcomeState.recommendation === 'open') {
    outcomeState.recommendation = 'requested';
    outcomeState.notice = 'A separate proposal request was simulated. No new visit, charge, or payment was created.';
    render('outcome-next-title');
  }
});

render();
