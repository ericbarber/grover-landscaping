const proofApp = document.getElementById('proof-app');

const initialProofState = () => ({
  screen: 'queue',
  read: 'ready',
  stage: 'review',
  version: 1,
  stale: false,
  panel: null,
  notice: '',
});

let proofState = initialProofState();

function renderProofQueue() {
  const status = proofState.stage === 'delivered' ? 'No proof waiting for delivery'
    : proofState.stage === 'ready' ? '1 package ready for review'
      : proofState.stage === 'correction' ? '1 correction waiting on crew'
        : '1 proof package needs review';
  return `
    <section class="queue-card" aria-labelledby="proof-queue-title">
      <div class="card-topline"><span class="step-label">TODAY · PROOF REVIEW</span><span class="status-tag ${proofState.stage === 'delivered' ? 'status-tag-good' : 'status-tag-attention'}">${status}</span></div>
      <h2 id="proof-queue-title" tabindex="-1">Work waiting for proof review</h2>
      <p class="muted">The customer sees a result only after the manager approves the exact package.</p>
      <button class="service-row" type="button" data-action="open-proof" aria-label="Open Canyon View proof package">
        <span class="service-row-top"><strong>Canyon View</strong><span aria-hidden="true">↗</span></span>
        <span class="service-row-detail">One-time cleanup and pruning · completion package ${proofState.version}</span>
        <span class="service-row-bottom">${proofState.stage === 'delivered' ? 'Reviewed result delivered' : proofState.stage === 'ready' ? 'Replacement after-photo record needs review' : proofState.stage === 'correction' ? 'After-photo correction requested' : 'After-photo record rejected'}</span>
      </button>
    </section>
  `;
}

function renderProofFailure() {
  return `
    <section class="state-card state-card-danger" aria-labelledby="proof-read-title">
      <span class="state-symbol" aria-hidden="true">!</span>
      <p class="step-label">PROOF READ UNAVAILABLE</p>
      <h2 id="proof-read-title" tabindex="-1">The current completion package could not be loaded.</h2>
      <p>Evidence status and delivery actions stay hidden until the read succeeds. No new correction or delivery was submitted during this failed read.</p>
      <button class="button button-primary" type="button" data-action="retry-read">Retry proof read</button>
    </section>
  `;
}

function renderProofStale() {
  return `
    <section class="state-card state-card-warning proof-stale" aria-labelledby="proof-stale-title">
      <p class="step-label">PACKAGE VERSION CHANGED</p>
      <h3 id="proof-stale-title" tabindex="-1">Package ${proofState.version} is no longer current.</h3>
      <p>Another submission arrived during review. Delivery is stopped; load and review the current package before any customer result is published.</p>
      <button class="button button-primary" type="button" data-action="load-latest">Load package ${proofState.version + 1}</button>
    </section>
  `;
}

function renderCorrectionPanel() {
  return `
    <section class="decision-panel" aria-labelledby="proof-correction-title">
      <p class="step-label">EXACT EVIDENCE GAP · PACKAGE ${proofState.version}</p>
      <h3 id="proof-correction-title" tabindex="-1">Request a replacement after photo?</h3>
      <p>The current after-photo record does not show the completed pruning area. Ask the Crew Lead for a clear replacement. The customer sees no draft or rejected evidence.</p>
      <div class="button-row">
        <button class="button button-primary" type="button" data-action="confirm-correction">Request correction</button>
        <button class="button button-text" type="button" data-action="close-panel">Keep reviewing</button>
      </div>
    </section>
  `;
}

function renderDeliveryPanel() {
  return `
    <section class="decision-panel" aria-labelledby="proof-delivery-title">
      <p class="step-label">CUSTOMER DELIVERY · PACKAGE ${proofState.version}</p>
      <h3 id="proof-delivery-title" tabindex="-1">Deliver the reviewed result?</h3>
      <dl class="confirmation-list">
        <div><dt>Exact service</dt><dd>Canyon View · one-time cleanup and pruning</dd></div>
        <div><dt>Evidence</dt><dd>After-photo record in package ${proofState.version} reviewed</dd></div>
        <div><dt>Customer view</dt><dd>Completed work and approved evidence only</dd></div>
        <div><dt>Next owner</dt><dd>Yard Owner reviews the delivered result</dd></div>
      </dl>
      <p class="fine-print">This is a simulated delivery. No photo, notification, invoice, or payment is created.</p>
      <div class="button-row">
        <button class="button button-primary" type="button" data-action="confirm-delivery">Deliver package ${proofState.version}</button>
        <button class="button button-text" type="button" data-action="close-panel">Keep private</button>
      </div>
    </section>
  `;
}

function renderProofDetail() {
  const stage = proofState.stage;
  const nextOwner = stage === 'delivered' ? 'Yard Owner reviews the delivered result'
    : stage === 'ready' ? 'Company Manager reviews replacement proof'
      : stage === 'correction' ? 'Crew Lead supplies a clearer after photo'
        : 'Company Manager requests proof correction';
  const nextDetail = stage === 'delivered'
    ? 'Only the reviewed package is customer-visible in this simulation. Any future care idea is a separate decision.'
    : stage === 'ready'
      ? 'The replacement record is present, but remains private until the manager confirms delivery.'
      : stage === 'correction'
        ? 'The rejected record stays private. Wait for a replacement package before reviewing delivery.'
        : 'The after-photo record does not show the completed pruning area. Do not deliver this package.';
  return `
    <div class="service-layout">
      <aside class="queue-sidebar" aria-label="Proof queue">
        <p class="step-label">TODAY · PROOF REVIEW</p>
        <button class="back-button" type="button" data-action="back-queue"><span aria-hidden="true">←</span> All proof reviews</button>
        <div class="queue-active"><strong>Canyon View</strong><span>Completion package ${proofState.version}</span></div>
      </aside>
      <div class="service-main">
        <div class="service-heading">
          <div><p class="eyebrow">EXACT SERVICE · CANYON VIEW</p><h2 id="proof-title" tabindex="-1">Completion proof</h2></div>
          <span class="status-tag ${stage === 'delivered' ? 'status-tag-good' : 'status-tag-attention'}">${proofState.stale ? 'Version stale' : stage === 'delivered' ? 'Delivered' : stage === 'ready' ? 'Review needed' : 'Private draft'}</span>
        </div>
        ${proofState.notice ? `<p class="inline-notice" role="status">${proofState.notice}</p>` : ''}
        ${proofState.stale ? renderProofStale() : `
          <div class="facts-grid">
            <section class="fact-card" aria-labelledby="proof-service-title">
              <p class="step-label">SERVICE RESULT</p><h3 id="proof-service-title">Cleanup and pruning</h3>
              <p>One-time work at Canyon View is recorded as complete in this synthetic task moment.</p>
              <p class="fine-print">This is a task state, not an inspection of real completed work.</p>
            </section>
            <section class="fact-card" aria-labelledby="proof-evidence-title">
              <p class="step-label">EVIDENCE · PACKAGE ${proofState.version}</p><h3 id="proof-evidence-title">After-photo record</h3>
              <p>${stage === 'review' || stage === 'correction' ? 'Rejected: the record does not show the completed pruning area.' : 'Replacement record marked ready for manager review in this synthetic task.'}</p>
              <span class="status-tag ${stage === 'review' || stage === 'correction' ? 'status-tag-attention' : 'status-tag-good'}">${stage === 'review' || stage === 'correction' ? 'Not customer-visible' : stage === 'delivered' ? 'Reviewed and delivered' : 'Private until approved'}</span>
              <p class="fine-print proof-evidence-note">No actual photo is supplied. This prototype tests status and handoff comprehension, not image quality.</p>
            </section>
          </div>
          <section class="handoff-card" aria-labelledby="proof-next-title">
            <div><p class="step-label">NEXT OWNER</p><h3 id="proof-next-title">${nextOwner}</h3><p>${nextDetail}</p></div>
            <div class="handoff-actions">
              ${stage === 'review' ? '<button class="button button-primary" type="button" data-action="open-correction">Review correction request</button>'
                : stage === 'ready' ? `<button class="button button-primary" type="button" data-action="open-delivery">Review package ${proofState.version} delivery</button>`
                  : `<span class="status-tag ${stage === 'delivered' ? 'status-tag-good' : 'status-tag-attention'}">${stage === 'delivered' ? 'Delivery simulated' : 'Correction pending'}</span>`}
            </div>
          </section>
          ${stage === 'delivered' ? '<p class="study-link-note">Study control: <a href="outcome.html">inspect the Yard Owner result</a>. This changes perspective; no customer account was opened.</p>' : ''}
          ${proofState.panel === 'correction' ? renderCorrectionPanel() : proofState.panel === 'delivery' ? renderDeliveryPanel() : ''}
        `}
      </div>
    </div>
  `;
}

function render(focusId) {
  proofApp.innerHTML = proofState.read === 'unavailable' ? renderProofFailure()
    : proofState.screen === 'queue' ? renderProofQueue() : renderProofDetail();
  if (focusId) document.getElementById(focusId)?.focus();
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'reset') { proofState = initialProofState(); render('proof-queue-title'); return; }
  if (action === 'fail-read') {
    proofState.read = 'unavailable'; proofState.panel = null;
    proofState.notice = '';
    render('proof-read-title'); return;
  }
  if (action === 'retry-read' && proofState.read === 'unavailable') {
    proofState.read = 'ready';
    proofState.notice = 'Current proof read restored. Check the package version before acting.';
    render(proofState.screen === 'queue' ? 'proof-queue-title' : proofState.stale ? 'proof-stale-title' : 'proof-title'); return;
  }
  if (action === 'corrected-evidence') {
    proofState.read = 'ready'; proofState.screen = 'detail';
    proofState.stage = 'ready'; proofState.version = 2;
    proofState.stale = false; proofState.panel = null;
    proofState.notice = 'Replacement after-photo record received in package 2. Customer delivery still needs manager review.';
    render('proof-title'); return;
  }
  if (action === 'stale-package') {
    proofState.read = 'ready'; proofState.screen = 'detail';
    proofState.stale = true; proofState.panel = null;
    proofState.notice = '';
    render('proof-stale-title'); return;
  }
  if (proofState.read !== 'ready') return;
  if (action === 'load-latest' && proofState.stale) {
    proofState.version += 1; proofState.stage = 'ready';
    proofState.stale = false;
    proofState.notice = `Package ${proofState.version} loaded. Review its replacement record before delivery.`;
    render('proof-title'); return;
  }
  if (proofState.stale) return;
  if (action === 'open-proof') { proofState.screen = 'detail'; render('proof-title'); return; }
  if (action === 'back-queue') { proofState.screen = 'queue'; render('proof-queue-title'); return; }
  if (action === 'close-panel') { proofState.panel = null; render('proof-title'); return; }
  if (action === 'open-correction' && proofState.stage === 'review') {
    proofState.panel = 'correction'; render('proof-correction-title'); return;
  }
  if (action === 'confirm-correction' && proofState.panel === 'correction' && proofState.stage === 'review') {
    proofState.stage = 'correction'; proofState.panel = null;
    proofState.notice = 'Correction request simulated. Rejected evidence remains private; no result was delivered.';
    render('proof-next-title'); return;
  }
  if (action === 'open-delivery' && proofState.stage === 'ready') {
    proofState.panel = 'delivery'; render('proof-delivery-title'); return;
  }
  if (action === 'confirm-delivery' && proofState.panel === 'delivery' && proofState.stage === 'ready') {
    proofState.stage = 'delivered'; proofState.panel = null;
    proofState.notice = `Package ${proofState.version} delivery simulated. Yard Owner is the next owner.`;
    render('proof-next-title');
  }
});

render();
