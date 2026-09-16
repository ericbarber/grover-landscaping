const app = document.getElementById('app');

const initialState = () => ({
  screen: 'queue',
  read: 'ready',
  version: 8,
  stale: false,
  fit: 'open',
  released: false,
  panel: null,
  notice: '',
});

let state = initialState();

function statusTag(label, tone = 'neutral') {
  return `<span class="status-tag status-tag-${tone}">${label}</span>`;
}

function renderQueue() {
  const queueStatus = state.released ? 'No decisions waiting'
    : state.fit === 'correction' ? '1 correction waiting'
      : state.fit === 'confirmed' ? '1 ready to release' : '1 needs a decision';
  const rowStatus = state.released ? 'Crew Lead owns the released plan'
    : state.fit === 'correction' ? 'Dispatch correction requested'
      : state.fit === 'confirmed' ? 'Crew fit confirmed · release ready' : 'Crew fit check open';
  return `
    <section class="queue-card" aria-labelledby="queue-title">
      <div class="card-topline"><span class="step-label">01 · TODAY</span>${statusTag(queueStatus, state.released ? 'good' : 'attention')}</div>
      <h2 id="queue-title" tabindex="-1">Work that needs your decision</h2>
      <p class="muted">The next action is attached to the service, not buried in a schedule tool.</p>
      <button class="service-row" type="button" data-action="open-service" aria-label="Open Canyon View service decision">
        <span class="service-row-top"><strong>Canyon View</strong><span aria-hidden="true">↗</span></span>
        <span class="service-row-detail">One-time cleanup and pruning · accepted proposal v3</span>
        <span class="service-row-bottom">Plan ${state.version} ${state.released ? 'released' : 'draft'} <span>·</span> ${rowStatus}</span>
      </button>
      <p class="queue-footnote">Only one synthetic service is included in this first prototype slice.</p>
    </section>
  `;
}

function renderReadFailure() {
  return `
    <section class="state-card state-card-danger" aria-labelledby="read-title">
      <span class="state-symbol" aria-hidden="true">!</span>
      <p class="step-label">SERVICE READ UNAVAILABLE</p>
      <h2 id="read-title" tabindex="-1">The current service could not be loaded.</h2>
      <p>No plan version, crew fit, or release decision is shown until the read succeeds. Your last action was not submitted.</p>
      <button class="button button-primary" type="button" data-action="retry-read">Retry service read</button>
    </section>
  `;
}

function renderStale() {
  return `
    <section class="state-card state-card-warning" aria-labelledby="stale-title">
      <p class="step-label">VERSION CONFLICT</p>
      <h2 id="stale-title" tabindex="-1">Plan ${state.version} is no longer current.</h2>
      <p>Another manager changed this service. Release is stopped; load the latest draft before making a new decision.</p>
      <button class="button button-primary" type="button" data-action="reload-latest">Load current Plan 9</button>
    </section>
  `;
}

function renderFitPanel() {
  return `
    <section class="decision-panel" aria-labelledby="fit-title">
      <p class="step-label">CREW FIT · PLAN ${state.version}</p>
      <h3 id="fit-title" tabindex="-1">Can the crew take this accepted work?</h3>
      <p>Confirm the crew has time and the property access note has been checked. If either is unresolved, send this draft for correction.</p>
      <div class="button-row">
        <button class="button button-primary" type="button" data-action="confirm-fit">Confirm crew fit</button>
        <button class="button button-secondary" type="button" data-action="request-correction">Request correction</button>
        <button class="button button-text" type="button" data-action="close-panel">Cancel</button>
      </div>
    </section>
  `;
}

function renderReleasePanel() {
  return `
    <section class="decision-panel" aria-labelledby="release-title">
      <p class="step-label">RELEASE REVIEW · PLAN ${state.version}</p>
      <h3 id="release-title" tabindex="-1">Release the exact accepted service?</h3>
      <dl class="confirmation-list">
        <div><dt>Customer decision</dt><dd>Accepted proposal v3 · $420</dd></div>
        <div><dt>Work</dt><dd>One-time cleanup and pruning at Canyon View</dd></div>
        <div><dt>Field version</dt><dd>Plan ${state.version} · crew fit confirmed</dd></div>
        <div><dt>Next owner</dt><dd>Crew Lead receives the released plan</dd></div>
      </dl>
      <p class="fine-print">This is a simulated release. It does not schedule, charge, or notify a real person.</p>
      <div class="button-row">
        <button class="button button-primary" type="button" data-action="confirm-release">Release Plan ${state.version}</button>
        <button class="button button-text" type="button" data-action="close-panel">Keep draft</button>
      </div>
    </section>
  `;
}

function renderService() {
  const fitLabel = state.fit === 'confirmed' ? 'Confirmed' : state.fit === 'correction' ? 'Correction requested' : 'Check open';
  const fitTone = state.fit === 'confirmed' ? 'good' : state.fit === 'correction' ? 'neutral' : 'attention';
  const status = state.stale ? 'Version stale' : state.released ? `Plan ${state.version} released` : `Plan ${state.version} draft`;
  return `
    <div class="service-layout">
      <aside class="queue-sidebar" aria-label="Today queue">
        <p class="step-label">TODAY · 1 SERVICE</p>
        <button class="back-button" type="button" data-action="back-queue"><span aria-hidden="true">←</span> All decisions</button>
        <div class="queue-active"><strong>Canyon View</strong><span>${state.released ? 'Released to field' : 'Manager decision'}</span></div>
      </aside>
      <div class="service-main">
        <div class="service-heading">
          <div><p class="eyebrow">EXACT SERVICE · CANYON VIEW</p><h2 id="service-title" tabindex="-1">One-time cleanup and pruning</h2></div>
          ${statusTag(status, state.released && !state.stale ? 'good' : 'attention')}
        </div>
        ${state.notice ? `<p class="inline-notice" role="status">${state.notice}</p>` : ''}
        ${state.stale ? renderStale() : `
          <div class="facts-grid">
            <section class="fact-card" aria-labelledby="customer-title">
              <span class="step-label">CUSTOMER IMPACT</span><h3 id="customer-title">Accepted scope</h3>
              <p>Canyon View accepted proposal <strong>version 3</strong> for one-time cleanup and pruning.</p>
              <strong class="price">$420</strong>
              <p class="fine-print">Acceptance requests planning. It does not charge the customer or confirm a service date.</p>
            </section>
            <section class="fact-card" aria-labelledby="plan-title">
              <span class="step-label">OFFICE PLAN</span><h3 id="plan-title">Draft Plan ${state.version}</h3>
              <p>Linked to accepted proposal v3. The prior released version is Plan 7.</p>
              <div class="fact-divider"></div>
              <div class="status-line"><span>Crew fit and access</span>${statusTag(fitLabel, fitTone)}</div>
            </section>
          </div>
          <section class="handoff-card" aria-labelledby="handoff-title">
            <div><span class="step-label">NEXT HANDOFF</span><h3 id="handoff-title">${state.released ? 'Crew Lead owns field execution' : state.fit === 'correction' ? 'Dispatch owns the correction' : state.fit === 'confirmed' ? 'Manager can release the plan' : 'Manager checks crew fit before release'}</h3>
            <p>${state.released ? 'The released plan is the field version in this simulation. Proof review comes later.' : state.fit === 'correction' ? 'The draft remains unreleased. Resolve crew time or access, then review the latest plan.' : state.fit === 'confirmed' ? 'The accepted scope and fit check are ready for an exact-version release.' : 'The customer has accepted scope, but the crew and access check is still open.'}</p></div>
            <div class="handoff-actions">
              ${state.released ? statusTag('Release simulated', 'good') : state.fit === 'correction'
                ? `<button class="button button-secondary" type="button" data-action="receive-correction">Simulate revised Plan ${state.version + 1}</button>`
                : state.fit === 'confirmed'
                  ? `<button class="button button-primary" type="button" data-action="open-release">Review and release Plan ${state.version}</button>`
                  : '<button class="button button-primary" type="button" data-action="open-fit">Resolve crew fit</button>'}
            </div>
          </section>
          ${state.panel === 'fit' ? renderFitPanel() : state.panel === 'release' ? renderReleasePanel() : ''}
        `}
      </div>
    </div>
  `;
}

function render(focusId) {
  app.innerHTML = state.read === 'unavailable' ? renderReadFailure()
    : state.screen === 'queue' ? renderQueue() : renderService();
  if (focusId) document.getElementById(focusId)?.focus();
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'reset') {
    state = initialState();
    render('queue-title');
    return;
  }
  if (action === 'fail-read') {
    state.read = 'unavailable';
    state.panel = null;
    state.notice = '';
    render('read-title');
    return;
  }
  if (action === 'retry-read' && state.read === 'unavailable') {
    state.read = 'ready';
    state.notice = 'The current service read is available again. Review the version before acting.';
    render(state.screen === 'queue' ? 'queue-title' : state.stale ? 'stale-title' : 'service-title');
    return;
  }
  if (action === 'inject-stale') {
    state.read = 'ready';
    state.screen = 'service';
    state.stale = true;
    state.panel = null;
    state.notice = '';
    render('stale-title');
    return;
  }
  if (state.read !== 'ready') return;
  if (action === 'reload-latest' && state.stale) {
    state.stale = false;
    state.version = 9;
    state.fit = 'open';
    state.released = false;
    state.notice = 'Current Plan 9 loaded. The earlier crew fit decision must be checked again.';
    render('service-title');
    return;
  }
  if (state.stale) return;
  if (action === 'open-service') { state.screen = 'service'; render('service-title'); return; }
  if (action === 'back-queue') { state.screen = 'queue'; render('queue-title'); return; }
  if (action === 'receive-correction' && state.fit === 'correction') {
    state.version += 1; state.fit = 'open';
    state.notice = `Revised Plan ${state.version} loaded. Recheck crew fit before release.`;
    render('service-title'); return;
  }
  if (action === 'open-fit') { state.panel = 'fit'; render('fit-title'); return; }
  if (action === 'close-panel') { state.panel = null; render('service-title'); return; }
  if (action === 'confirm-fit' && state.panel === 'fit') {
    state.fit = 'confirmed'; state.panel = null;
    state.notice = `Crew fit confirmed for draft Plan ${state.version}. Release still needs review.`;
    render('handoff-title'); return;
  }
  if (action === 'request-correction' && state.panel === 'fit') {
    state.fit = 'correction'; state.panel = null;
    state.notice = `Correction requested for draft Plan ${state.version}. No plan was released.`;
    render('handoff-title'); return;
  }
  if (action === 'open-release' && state.fit === 'confirmed' && !state.released) {
    state.panel = 'release'; render('release-title'); return;
  }
  if (action === 'confirm-release' && state.panel === 'release' && state.fit === 'confirmed' && !state.released) {
    state.released = true; state.panel = null;
    state.notice = `Plan ${state.version} release simulated. Crew Lead is the next owner.`;
    render('handoff-title');
  }
});

render();
