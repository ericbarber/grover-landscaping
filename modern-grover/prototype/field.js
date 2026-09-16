const fieldApp = document.getElementById('field-app');

const initialFieldState = () => ({
  read: 'ready',
  connection: 'online',
  plan: 8,
  conflict: false,
  issuePanel: false,
  issue: 'none',
  checklist: 'none',
  note: '',
  error: '',
  notice: '',
});

let fieldState = initialFieldState();

function safeText(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function pendingCount() {
  return Number(fieldState.issue === 'local') + Number(fieldState.checklist === 'local');
}

function renderReadFailure() {
  return `
    <section class="state-card state-card-danger" aria-labelledby="field-read-title">
      <span class="state-symbol" aria-hidden="true">!</span>
      <p class="step-label">RELEASED PLAN READ UNAVAILABLE</p>
      <h2 id="field-read-title" tabindex="-1">The current route could not be loaded.</h2>
      <p>Stop details stay hidden until the read succeeds. ${pendingCount() > 0 ? `${pendingCount()} simulated local change${pendingCount() === 1 ? ' remains' : 's remain'} in this tab; no sync was attempted.` : 'No field action was submitted.'}</p>
      <button class="button button-primary" type="button" data-action="retry-read">Retry route read</button>
    </section>
  `;
}

function renderIssuePanel() {
  return `
    <section class="decision-panel" aria-labelledby="issue-title">
      <p class="step-label">ACCESS CLARIFICATION</p>
      <h3 id="issue-title" tabindex="-1">What needs office review?</h3>
      <p>Use synthetic details only. The crew can save a question; only the office changes the released plan.</p>
      <label class="field-label" for="field-note">Short field note</label>
      <textarea id="field-note" maxlength="160" rows="3" placeholder="For example: Gate code in the plan does not work."></textarea>
      ${fieldState.error ? `<p class="field-error" role="alert">${fieldState.error}</p>` : ''}
      <div class="button-row">
        <button class="button button-primary" type="button" data-action="save-issue">${fieldState.connection === 'offline' ? 'Hold question in this tab' : 'Send question to manager'}</button>
        <button class="button button-text" type="button" data-action="cancel-issue">Cancel</button>
      </div>
    </section>
  `;
}

function renderField() {
  if (fieldState.read === 'unavailable') return renderReadFailure();
  const pending = pendingCount();
  const nextOwner = fieldState.conflict ? 'Company Manager reviews the version conflict'
    : fieldState.issue === 'local' ? 'Crew Lead sends the unsent question'
      : fieldState.issue === 'sent' ? 'Company Manager reviews the access question'
        : 'Crew Lead documents the access question';
  const nextDetail = fieldState.conflict
    ? `Plan ${fieldState.plan} changes stay in this prototype tab. Do not apply them to Plan ${fieldState.plan + 1} or discard them before manager review.`
    : fieldState.issue === 'local'
      ? 'The office has not received this question. Reconnect and sync before expecting a response.'
      : fieldState.issue === 'sent'
        ? 'The manager owns any plan correction. Continue only with work that is safe under the released plan.'
        : 'Access is unclear at this stop. Ask the office rather than editing the released plan.';
  return `
    <div class="field-layout">
      <aside class="field-day" aria-labelledby="field-day-title">
        <p class="step-label">ASSIGNED SERVICE DAY</p>
        <h2 id="field-day-title">September 16</h2>
        <p>2026 · Canyon View · Stop 1</p>
        <div class="field-day-status"><span>Released Plan ${fieldState.plan}${fieldState.conflict ? ' · stale' : ''}</span><span>${fieldState.connection === 'offline' ? 'Offline' : 'Connection available'}</span></div>
        ${fieldState.connection === 'offline' ? '<button class="button button-secondary" type="button" data-action="reconnect">Reconnect and sync</button>' : ''}
      </aside>
      <div class="service-main field-main">
        <div class="service-heading">
          <div><p class="eyebrow">CREW LEAD · RELEASED PLAN ${fieldState.plan}</p><h2 id="field-title" tabindex="-1">Canyon View</h2></div>
          <span class="status-tag ${fieldState.conflict ? 'status-tag-attention' : fieldState.connection === 'offline' ? 'status-tag-attention' : 'status-tag-good'}">${fieldState.conflict ? 'Version conflict' : fieldState.connection === 'offline' ? 'Offline simulation' : 'Assigned stop'}</span>
        </div>
        ${fieldState.notice ? `<p class="inline-notice" role="status">${fieldState.notice}</p>` : ''}
        ${fieldState.conflict ? `
          <section class="state-card state-card-warning field-conflict" aria-labelledby="field-conflict-title">
            <p class="step-label">PLAN VERSION CHANGED</p>
            <h3 id="field-conflict-title" tabindex="-1">Plan ${fieldState.plan + 1} was released while this tab held Plan ${fieldState.plan} changes.</h3>
            <p>${pending > 0 ? `${pending} simulated local change${pending === 1 ? ' is' : 's are'} still in this tab. Sync is stopped until the manager reviews the conflict.` : 'No local changes are waiting. Load the new plan before continuing.'}</p>
            ${pending === 0 ? `<button class="button button-primary" type="button" data-action="load-plan">Load released Plan ${fieldState.plan + 1}</button>` : ''}
          </section>
        ` : ''}
        <section class="field-stop" aria-labelledby="field-stop-title">
          <div class="field-stop-top"><span class="step-label">${fieldState.conflict ? 'STOP 1 · PREVIOUS PLAN' : 'STOP 1 · THIS ASSIGNMENT'}</span><span class="field-time">Released Plan ${fieldState.plan}</span></div>
          <h3 id="field-stop-title">Cleanup and pruning</h3>
          <p>One-time care at Canyon View. The access detail needs clarification before the affected work proceeds.</p>
          <div class="field-access"><strong>Access question</strong><span>Gate access in the field does not match the released note.</span></div>
        </section>
        <div class="field-task-grid">
          <section class="field-task" aria-labelledby="field-issue-title">
            <p class="step-label">FIELD EXCEPTION</p><h3 id="field-issue-title">Ask for clarification</h3>
            <p>Record what changed. The manager owns plan correction.</p>
            ${fieldState.issue === 'none'
              ? `<button class="button button-secondary" type="button" data-action="open-issue" ${fieldState.conflict ? 'disabled' : ''}>Report access issue</button>`
              : `<p class="field-task-state">${fieldState.issue === 'local' ? 'Held in this tab · not sent' : 'Sent to Company Manager · awaiting review'}</p><p class="field-note-preview">${safeText(fieldState.note)}</p>`}
          </section>
          <section class="field-task" aria-labelledby="field-check-title">
            <p class="step-label">CHECKLIST</p><h3 id="field-check-title">Walkway check</h3>
            <p>Record the safe portion of this stop without claiming the service is complete.</p>
            ${fieldState.checklist === 'none'
              ? `<button class="button button-secondary" type="button" data-action="save-checklist" ${fieldState.conflict ? 'disabled' : ''}>Save walkway check</button>`
              : `<p class="field-task-state">${fieldState.checklist === 'local' ? 'Held in this tab · not sent' : 'Sent for review · service not complete'}</p>`}
          </section>
        </div>
        ${fieldState.issuePanel && !fieldState.conflict ? renderIssuePanel() : ''}
        <section class="handoff-card" aria-labelledby="field-next-title">
          <div><p class="step-label">NEXT OWNER</p><h3 id="field-next-title">${nextOwner}</h3><p>${nextDetail}</p></div>
          <span class="status-tag ${pending > 0 ? 'status-tag-attention' : 'status-tag-good'}">${pending > 0 ? `${pending} held in tab` : 'No local changes'}</span>
        </section>
        ${fieldState.issue === 'sent' && !fieldState.conflict
          ? '<p class="study-link-note">Study control: <a href="exception.html">inspect the manager exception review</a>. This is not a crew workspace action.</p>'
          : ''}
      </div>
    </div>
  `;
}

function render(focusId) {
  fieldApp.innerHTML = renderField();
  if (focusId) document.getElementById(focusId)?.focus();
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'reset') { fieldState = initialFieldState(); render('field-title'); return; }
  if (action === 'fail-read') {
    fieldState.read = 'unavailable'; fieldState.issuePanel = false;
    fieldState.notice = '';
    render('field-read-title'); return;
  }
  if (action === 'retry-read' && fieldState.read === 'unavailable') {
    fieldState.read = 'ready';
    fieldState.notice = 'The route read is available. Check plan version and local changes before continuing.';
    render(fieldState.conflict ? 'field-conflict-title' : 'field-title'); return;
  }
  if (action === 'go-offline') {
    fieldState.read = 'ready';
    fieldState.connection = 'offline';
    fieldState.notice = 'Offline mode simulated. New changes stay in this tab until reload.';
    render('field-title'); return;
  }
  if (action === 'plan-changed') {
    fieldState.read = 'ready'; fieldState.connection = 'online'; fieldState.conflict = true;
    fieldState.issuePanel = false;
    fieldState.notice = 'A newer released plan was detected. Local changes were not sent or discarded.';
    render('field-conflict-title'); return;
  }
  if (fieldState.read !== 'ready') return;
  if (action === 'reconnect' && fieldState.connection === 'offline') {
    fieldState.connection = 'online';
    if (fieldState.conflict) {
      fieldState.notice = `Connection restored, but Plan ${fieldState.plan} changes remain in this tab for manager review.`;
    } else {
      if (fieldState.issue === 'local') fieldState.issue = 'sent';
      if (fieldState.checklist === 'local') fieldState.checklist = 'sent';
      fieldState.notice = 'Device-held changes were sent in this simulation. Manager review is still required for the access question.';
    }
    render('field-next-title'); return;
  }
  if (action === 'load-plan' && fieldState.conflict && pendingCount() === 0) {
    fieldState.plan += 1; fieldState.conflict = false;
    fieldState.issue = 'none'; fieldState.checklist = 'none';
    fieldState.notice = `Released Plan ${fieldState.plan} loaded. Recheck the assignment before taking action.`;
    render('field-title'); return;
  }
  if (fieldState.conflict) return;
  if (action === 'open-issue') { fieldState.issuePanel = true; fieldState.error = ''; render('issue-title'); return; }
  if (action === 'cancel-issue') { fieldState.issuePanel = false; render('field-title'); return; }
  if (action === 'save-issue' && fieldState.issuePanel) {
    const note = document.getElementById('field-note')?.value.trim() ?? '';
    if (!note) {
      fieldState.error = 'Add a short synthetic field note before saving.';
      document.getElementById('field-note')?.focus();
      document.querySelector('.field-error')?.remove();
      const error = document.createElement('p'); error.className = 'field-error'; error.setAttribute('role', 'alert'); error.textContent = fieldState.error;
      document.getElementById('field-note')?.after(error);
      return;
    }
    fieldState.note = note;
    fieldState.issue = fieldState.connection === 'offline' ? 'local' : 'sent';
    fieldState.issuePanel = false;
    fieldState.notice = fieldState.issue === 'local'
      ? 'Access question held in this tab. The manager has not received it.'
      : 'Access question sent in this simulation. The manager owns the response.';
    render('field-next-title'); return;
  }
  if (action === 'save-checklist' && fieldState.checklist === 'none') {
    fieldState.checklist = fieldState.connection === 'offline' ? 'local' : 'sent';
    fieldState.notice = fieldState.checklist === 'local'
      ? 'Walkway check held in this tab. The service is not complete.'
      : 'Walkway check sent in this simulation. The service is not complete.';
    render('field-check-title');
  }
});

render();
