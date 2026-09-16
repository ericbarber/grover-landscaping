const exceptionApp = document.getElementById('exception-app');

const initialExceptionState = () => ({
  screen: 'queue',
  read: 'ready',
  stage: 'review',
  panel: null,
  notice: '',
});

let exceptionState = initialExceptionState();

function renderExceptionQueue() {
  const status = exceptionState.stage === 'released' ? 'No exception awaiting release'
    : exceptionState.stage === 'draft' ? '1 revised plan to release'
      : exceptionState.stage === 'verification' ? '1 access detail to verify'
        : '1 field exception needs review';
  return `
    <section class="queue-card" aria-labelledby="exception-queue-title">
      <div class="card-topline"><span class="step-label">TODAY · FIELD EXCEPTIONS</span><span class="status-tag ${exceptionState.stage === 'released' ? 'status-tag-good' : 'status-tag-attention'}">${status}</span></div>
      <h2 id="exception-queue-title" tabindex="-1">Work waiting on the office</h2>
      <p class="muted">A Crew Lead asked about access at the exact Canyon View stop.</p>
      <button class="service-row" type="button" data-action="open-exception" aria-label="Open Canyon View field exception">
        <span class="service-row-top"><strong>Canyon View</strong><span aria-hidden="true">↗</span></span>
        <span class="service-row-detail">Access question · Stop 1 · released Plan 8</span>
        <span class="service-row-bottom">${exceptionState.stage === 'released' ? 'Revised Plan 9 released' : exceptionState.stage === 'draft' ? 'Plan 9 draft · exact release needed' : exceptionState.stage === 'verification' ? 'Affected work held · manager verifying access' : 'Crew question awaits manager decision'}</span>
      </button>
    </section>
  `;
}

function renderExceptionFailure() {
  return `
    <section class="state-card state-card-danger" aria-labelledby="exception-read-title">
      <span class="state-symbol" aria-hidden="true">!</span>
      <p class="step-label">EXCEPTION READ UNAVAILABLE</p>
      <h2 id="exception-read-title" tabindex="-1">The current field request could not be loaded.</h2>
      <p>Request, plan, and release details stay hidden until the read succeeds. No new office instruction was sent during this failed read.</p>
      <button class="button button-primary" type="button" data-action="retry-read">Retry exception read</button>
    </section>
  `;
}

function renderHoldConfirmation() {
  return `
    <section class="decision-panel" aria-labelledby="hold-title">
      <p class="step-label">SAFE FIELD RESPONSE · PLAN 8</p>
      <h3 id="hold-title" tabindex="-1">Hold access-dependent work?</h3>
      <p>The Crew Lead receives a hold instruction in this simulation. The Company Manager remains responsible for verifying access and preparing a new plan if needed. Accepted customer scope and price do not change.</p>
      <div class="button-row">
        <button class="button button-primary" type="button" data-action="confirm-hold">Send hold instruction</button>
        <button class="button button-text" type="button" data-action="close-panel">Keep reviewing</button>
      </div>
    </section>
  `;
}

function renderRevisedRelease() {
  return `
    <section class="decision-panel" aria-labelledby="exception-release-title">
      <p class="step-label">EXACT VERSION REVIEW · PLAN 9</p>
      <h3 id="exception-release-title" tabindex="-1">Release revised Plan 9?</h3>
      <dl class="confirmation-list">
        <div><dt>Service</dt><dd>Canyon View · one-time cleanup and pruning</dd></div>
        <div><dt>Accepted scope</dt><dd>Proposal v3 · unchanged</dd></div>
        <div><dt>Field correction</dt><dd>Verified access instructions attached to Plan 9</dd></div>
        <div><dt>Next owner</dt><dd>Crew Lead reviews the new release before continuing</dd></div>
      </dl>
      <p class="fine-print">This is a simulated release. It does not message a crew or change a real route.</p>
      <div class="button-row">
        <button class="button button-primary" type="button" data-action="confirm-release">Release revised Plan 9</button>
        <button class="button button-text" type="button" data-action="close-panel">Keep draft</button>
      </div>
    </section>
  `;
}

function renderExceptionDetail() {
  const stage = exceptionState.stage;
  const nextOwner = stage === 'released' ? 'Crew Lead reviews released Plan 9'
    : stage === 'draft' ? 'Company Manager releases the revised plan'
      : stage === 'verification' ? 'Company Manager verifies the access detail'
        : 'Company Manager responds to the field request';
  const nextDetail = stage === 'released'
    ? 'The office response is complete in this simulation. The crew must read Plan 9 before continuing affected work.'
    : stage === 'draft'
      ? 'Access is represented as verified. Review the exact revision; Plan 8 remains the field version until Plan 9 is released.'
      : stage === 'verification'
        ? 'The crew has a hold instruction. Obtain verified access details before issuing any revised field plan.'
        : 'The crew cannot resolve this by editing the released plan. Hold affected work while access is checked.';
  return `
    <div class="service-layout">
      <aside class="queue-sidebar" aria-label="Exception queue">
        <p class="step-label">TODAY · 1 EXCEPTION</p>
        <button class="back-button" type="button" data-action="back-queue"><span aria-hidden="true">←</span> All exceptions</button>
        <div class="queue-active"><strong>Canyon View</strong><span>Stop 1 · Plan 8 field request</span></div>
      </aside>
      <div class="service-main">
        <div class="service-heading">
          <div><p class="eyebrow">EXACT SERVICE · CANYON VIEW</p><h2 id="exception-title" tabindex="-1">Access question at Stop 1</h2></div>
          <span class="status-tag ${stage === 'released' ? 'status-tag-good' : 'status-tag-attention'}">${stage === 'released' ? 'Plan 9 released' : stage === 'draft' ? 'Plan 9 draft' : 'Plan 8 released'}</span>
        </div>
        ${exceptionState.notice ? `<p class="inline-notice" role="status">${exceptionState.notice}</p>` : ''}
        <div class="facts-grid">
          <section class="fact-card" aria-labelledby="request-title">
            <p class="step-label">CREW REQUEST · RELEASED PLAN 8</p><h3 id="request-title">Access needs clarification</h3>
            <p>The Crew Lead reports that the gate access in the field does not match the released note. The affected work is paused.</p>
            <p class="fine-print">This is a synthetic request summary. Notes entered on the separate field page are not transferred. No customer contact detail appears here.</p>
          </section>
          <section class="fact-card" aria-labelledby="impact-title">
            <p class="step-label">CUSTOMER IMPACT</p><h3 id="impact-title">Accepted work waits safely</h3>
            <p>One-time cleanup and pruning at Canyon View remains the accepted scope from proposal v3. Access verification may affect when the crew can continue.</p>
            <p class="fine-print">The request does not approve extra work, change price, or close the service.</p>
          </section>
        </div>
        <section class="handoff-card" aria-labelledby="exception-next-title">
          <div><p class="step-label">NEXT OWNER</p><h3 id="exception-next-title">${nextOwner}</h3><p>${nextDetail}</p></div>
          <div class="handoff-actions">
            ${stage === 'review' ? '<button class="button button-primary" type="button" data-action="open-hold">Review hold instruction</button>'
              : stage === 'draft' ? '<button class="button button-primary" type="button" data-action="open-release">Review revised Plan 9</button>'
                : `<span class="status-tag ${stage === 'released' ? 'status-tag-good' : 'status-tag-attention'}">${stage === 'released' ? 'Release simulated' : 'Verification pending'}</span>`}
          </div>
        </section>
        ${stage === 'released' ? '<p class="study-link-note">Study control: <a href="field.html">inspect the Crew Lead side</a> and use the Plan changed scenario. This is not a real role switch.</p>' : ''}
        ${exceptionState.panel === 'hold' ? renderHoldConfirmation() : exceptionState.panel === 'release' ? renderRevisedRelease() : ''}
      </div>
    </div>
  `;
}

function render(focusId) {
  exceptionApp.innerHTML = exceptionState.read === 'unavailable' ? renderExceptionFailure()
    : exceptionState.screen === 'queue' ? renderExceptionQueue() : renderExceptionDetail();
  if (focusId) document.getElementById(focusId)?.focus();
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'reset') { exceptionState = initialExceptionState(); render('exception-queue-title'); return; }
  if (action === 'fail-read') {
    exceptionState.read = 'unavailable'; exceptionState.panel = null;
    exceptionState.notice = '';
    render('exception-read-title'); return;
  }
  if (action === 'retry-read' && exceptionState.read === 'unavailable') {
    exceptionState.read = 'ready';
    exceptionState.notice = 'Current exception read restored. Recheck the plan state before acting.';
    render(exceptionState.screen === 'queue' ? 'exception-queue-title' : 'exception-title'); return;
  }
  if (action === 'verify-access') {
    exceptionState.read = 'ready'; exceptionState.screen = 'detail';
    exceptionState.stage = 'draft'; exceptionState.panel = null;
    exceptionState.notice = 'Verified access is simulated. Plan 9 is a draft; Plan 8 remains released until a new release is reviewed.';
    render('exception-title'); return;
  }
  if (exceptionState.read !== 'ready') return;
  if (action === 'open-exception') { exceptionState.screen = 'detail'; render('exception-title'); return; }
  if (action === 'back-queue') { exceptionState.screen = 'queue'; render('exception-queue-title'); return; }
  if (action === 'close-panel') { exceptionState.panel = null; render('exception-title'); return; }
  if (action === 'open-hold' && exceptionState.stage === 'review') {
    exceptionState.panel = 'hold'; render('hold-title'); return;
  }
  if (action === 'confirm-hold' && exceptionState.panel === 'hold' && exceptionState.stage === 'review') {
    exceptionState.stage = 'verification'; exceptionState.panel = null;
    exceptionState.notice = 'Hold instruction simulated. The manager still owns access verification; no revised plan was released.';
    render('exception-next-title'); return;
  }
  if (action === 'open-release' && exceptionState.stage === 'draft') {
    exceptionState.panel = 'release'; render('exception-release-title'); return;
  }
  if (action === 'confirm-release' && exceptionState.stage === 'draft' && exceptionState.panel === 'release') {
    exceptionState.stage = 'released'; exceptionState.panel = null;
    exceptionState.notice = 'Revised Plan 9 release simulated. Crew Lead is the next owner; accepted scope remains unchanged.';
    render('exception-next-title');
  }
});

render();
