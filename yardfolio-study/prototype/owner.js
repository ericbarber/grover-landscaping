const ownerApp = document.getElementById('owner-app');

const freshOwner = () => ({ read: 'ready', screen: 'queue', stage: 'unassigned', panel: false, stale: false, notice: '' });
let owner = freshOwner();

function ownerUnavailable() {
  return `<section class="state-card state-card-danger" aria-labelledby="owner-read-title">
    <span class="state-symbol" aria-hidden="true">!</span><p class="step-label">COMPANY READ UNAVAILABLE</p>
    <h2 id="owner-read-title" tabindex="-1">The current company work could not be loaded.</h2>
    <p>Service risk, assignment, and action controls stay hidden until the read succeeds. An unavailable read is not an all-clear signal; no assignment was sent.</p>
    <button class="button button-primary" type="button" data-action="retry">Retry company read</button>
  </section>`;
}

function ownerQueue() {
  return `<section class="queue-card" aria-labelledby="owner-queue-title">
    <div class="card-topline"><span class="step-label">COMPANY TODAY · SEPTEMBER 16</span><span class="status-tag status-tag-attention">1 service risk to track</span></div>
    <h2 id="owner-queue-title" tabindex="-1">What needs an accountable operator</h2>
    <p class="muted">Canyon View has an access blocker on accepted work. Open the service to see customer impact and the next responsible person.</p>
    <button class="service-row" type="button" data-action="open" aria-label="Open Canyon View company risk">
      <span class="service-row-top"><strong>Canyon View</strong><span aria-hidden="true">↗</span></span>
      <span class="service-row-detail">Access blocker · one-time cleanup and pruning</span>
      <span class="service-row-bottom">${owner.stage === 'assigned' ? 'Avery · Company Manager owns resolution' : 'Operational owner needed'}</span>
    </button>
    <p class="queue-footnote">A separate field role may be available to a multi-role owner. This company view begins with business accountability.</p>
  </section>`;
}

function ownerDetail() {
  return `<div class="service-layout">
    <aside class="queue-sidebar" aria-label="Company work queue"><p class="step-label">TODAY · 1 RISK</p><button class="back-button" type="button" data-action="back"><span aria-hidden="true">←</span> All company work</button><div class="queue-active"><strong>Canyon View</strong><span>Access blocker · service at risk</span></div></aside>
    <div class="service-main">
      <div class="service-heading"><div><p class="eyebrow">CANYON VIEW · COMPANY RISK</p><h2 id="owner-title" tabindex="-1">Accepted work is waiting on access</h2></div><span class="status-tag status-tag-attention">Needs office response</span></div>
      ${owner.notice ? `<p class="inline-notice" role="status">${owner.notice}</p>` : ''}
      ${owner.stale ? `<section class="state-card state-card-warning portfolio-warning" aria-labelledby="owner-stale-title"><p class="step-label">ASSIGNMENT CHANGED</p><h3 id="owner-stale-title" tabindex="-1">This risk already has an operator.</h3><p>Avery was assigned while you were reviewing. Do not send the earlier assignment again; load the current status.</p><button class="button button-primary" type="button" data-action="load-current">Load current assignment</button></section>` : ''}
      <div class="facts-grid">
        <section class="fact-card" aria-labelledby="owner-impact-title"><p class="step-label">BUSINESS CONSEQUENCE</p><h3 id="owner-impact-title">One service is paused</h3><p>The customer accepted one-time cleanup and pruning. Access uncertainty affects the promised visit. The office must communicate any customer-visible change.</p><p class="fine-print">This view does not imply an invoice, payment, or new charge.</p></section>
        <section class="fact-card" aria-labelledby="owner-boundary-title"><p class="step-label">OPERATIONAL BOUNDARY</p><h3 id="owner-boundary-title">Keep work held safely</h3><p>A Crew Lead raised the access question. The manager verifies the property guidance and updates the field instruction before work resumes.</p><p class="fine-print">Assigning accountability here does not approve new scope or release a route.</p></section>
      </div>
      <section class="handoff-card" aria-labelledby="owner-next-title"><div><p class="step-label">ACCOUNTABLE OPERATOR</p><h3 id="owner-next-title">${owner.stage === 'assigned' ? 'Avery · Company Manager' : 'Assign a Company Manager'}</h3><p>${owner.stage === 'assigned' ? 'Avery owns verification, field direction, and the next customer-safe update. The Company Owner can monitor the risk.' : 'The Company Owner sets accountability. The assigned manager owns access verification and any revised field instruction.'}</p></div>${owner.stage === 'unassigned' && !owner.stale ? '<div class="handoff-actions"><button class="button button-primary" type="button" data-action="review">Review assignment</button></div>' : ''}</section>
      ${owner.panel && owner.stage === 'unassigned' && !owner.stale ? `<section class="decision-panel" aria-labelledby="owner-confirm-title"><p class="step-label">REVIEW ACCOUNTABILITY</p><h3 id="owner-confirm-title" tabindex="-1">Assign Avery to this risk?</h3><dl class="confirmation-list"><div><dt>Service</dt><dd>Canyon View · access blocker</dd></div><div><dt>Operator</dt><dd>Avery · Company Manager</dd></div><div><dt>Next work</dt><dd>Verify access, guide the crew, and update the customer if timing changes</dd></div></dl><p>This assignment is simulated. It does not release a route or message Avery.</p><div class="button-row"><button class="button button-primary" type="button" data-action="assign">Assign Avery</button><button class="button button-text" type="button" data-action="cancel">Keep reviewing</button></div></section>` : ''}
      ${owner.stage === 'assigned' ? '<p class="study-link-note">Study control: <a href="exception.html">inspect the manager exception task</a>. It starts at a matching synthetic moment; assignment is not transferred between pages.</p>' : ''}
    </div>
  </div>`;
}

function renderOwner(focusId) {
  ownerApp.innerHTML = owner.read === 'unavailable' ? ownerUnavailable()
    : owner.screen === 'queue' ? ownerQueue() : ownerDetail();
  if (focusId) document.getElementById(focusId)?.focus();
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'reset') { owner = freshOwner(); renderOwner('owner-queue-title'); return; }
  if (action === 'fail') { owner.read = 'unavailable'; owner.panel = false; owner.notice = ''; renderOwner('owner-read-title'); return; }
  if (action === 'retry' && owner.read === 'unavailable') { owner.read = 'ready'; owner.notice = 'Company read restored. Recheck the current operator before acting.'; renderOwner(owner.screen === 'queue' ? 'owner-queue-title' : owner.stale ? 'owner-stale-title' : 'owner-title'); return; }
  if (owner.read !== 'ready') return;
  if (action === 'stale' && owner.stage === 'unassigned') { owner.screen = 'detail'; owner.stale = true; owner.panel = false; owner.notice = ''; renderOwner('owner-stale-title'); return; }
  if (action === 'load-current' && owner.stale) { owner.stale = false; owner.stage = 'assigned'; owner.notice = 'Current assignment loaded. No duplicate assignment was sent.'; renderOwner('owner-next-title'); return; }
  if (action === 'open') { owner.screen = 'detail'; renderOwner(owner.stale ? 'owner-stale-title' : 'owner-title'); return; }
  if (action === 'back') { owner.screen = 'queue'; owner.panel = false; renderOwner('owner-queue-title'); return; }
  if (action === 'cancel') { owner.panel = false; renderOwner('owner-title'); return; }
  if (action === 'review' && owner.stage === 'unassigned' && !owner.stale) { owner.panel = true; renderOwner('owner-confirm-title'); return; }
  if (action === 'assign' && owner.panel && owner.stage === 'unassigned' && !owner.stale) { owner.stage = 'assigned'; owner.panel = false; owner.notice = 'Avery assigned in simulation. No route was released or operator notified.'; renderOwner('owner-next-title'); }
});

renderOwner();
