const viewDefinitions = {
  home: { title: 'Home', announcement: 'My yard home' },
  visits: { title: 'Visits', announcement: 'Service visits' },
  proof: { title: 'Proof', announcement: 'Delivered service proof' },
  account: { title: 'Account', announcement: 'Properties and provider' },
};

const propertyDefinitions = {
  home: {
    shortName: 'Sonoran House',
    address: '123 Oak Street, Phoenix',
    day: '11',
    weekday: 'TUE',
    window: '8:00–10:00 AM',
    nextService: 'Weekly yard care',
    cadence: 'Weekly care',
    rhythm: 'Tuesday · 8:00–10:00 AM',
    reportTitle: 'Weekly yard care complete',
    reportService: 'Weekly yard care',
  },
  garden: {
    shortName: 'Backyard Garden',
    address: 'Backyard area · 123 Oak Street, Phoenix',
    day: '20',
    weekday: 'THU',
    window: '7:30–9:00 AM',
    nextService: 'Seasonal garden refresh',
    cadence: 'Seasonal care',
    rhythm: 'Thursday, Aug 20 · 7:30–9:00 AM',
    reportTitle: 'Seasonal garden refresh complete',
    reportService: 'Seasonal garden care',
  },
};

const body = document.body;
const pageTitle = document.querySelector('[data-page-title]');
const mainContent = document.querySelector('#main-content');
const liveRegion = document.querySelector('[data-live-region]');
const propertySelect = document.querySelector('[data-property-select]');
const visitDialog = document.querySelector('[data-visit-dialog]');
const reportDialog = document.querySelector('[data-report-dialog]');
const bidDialog = document.querySelector('[data-bid-dialog]');
const reviewDialog = document.querySelector('[data-review-dialog]');
const bidError = document.querySelector('[data-bid-error]');
const failureToggle = document.querySelector('[data-simulate-bid-error]');
const dialogReturnTargets = new WeakMap();
let currentBidChoice = 'approve';
let suppressFocusRestore = false;

function announce(message) {
  liveRegion.textContent = '';
  window.requestAnimationFrame(() => { liveRegion.textContent = message; });
}

function setText(selector, value) {
  document.querySelectorAll(selector).forEach((element) => { element.textContent = value; });
}

function normalizeView(view) {
  return Object.hasOwn(viewDefinitions, view) ? view : 'home';
}

function showView(requestedView, { moveFocus = true, updateHash = true } = {}) {
  const view = normalizeView(requestedView);
  body.dataset.activeView = view;
  document.querySelectorAll('[data-view-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.viewPanel !== view;
  });
  document.querySelectorAll('[data-nav]').forEach((control) => {
    if (control.dataset.nav === view) control.setAttribute('aria-current', 'page');
    else control.removeAttribute('aria-current');
  });
  pageTitle.textContent = viewDefinitions[view].title;
  document.title = `${viewDefinitions[view].title} · My yard · Grover working design`;
  if (updateHash) window.history.replaceState(null, '', `#${view}`);
  if (moveFocus) {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    pageTitle.focus({ preventScroll: true });
    announce(`${viewDefinitions[view].announcement} view opened.`);
  }
}

function selectProperty(propertyId, { returnHome = false } = {}) {
  const id = Object.hasOwn(propertyDefinitions, propertyId) ? propertyId : 'home';
  const property = propertyDefinitions[id];
  body.dataset.property = id;
  propertySelect.value = id;
  setText('[data-property-short]', property.shortName);
  setText('[data-property-address]', property.address);
  setText('[data-visit-day]', property.day);
  setText('[data-visit-weekday]', property.weekday);
  setText('[data-visit-window]', property.window);
  setText('[data-next-service]', property.nextService);
  setText('[data-service-cadence]', property.cadence);
  setText('[data-rhythm-next]', property.rhythm);
  setText('[data-report-title]', property.reportTitle);
  setText('[data-report-service]', property.reportService);
  document.querySelectorAll('[data-property-button]').forEach((button) => {
    const selected = button.dataset.propertyButton === id;
    button.setAttribute('aria-pressed', String(selected));
    const label = button.querySelector('.selected-label');
    if (label) label.textContent = selected ? 'Viewing' : 'View';
  });
  document.querySelectorAll('[data-irrigation-scope]').forEach((item) => { item.hidden = id === 'garden'; });
  if (returnHome) showView('home');
  announce(`Now viewing ${property.shortName}. All portal details have been updated.`);
}

function openDialog(dialog, trigger, returnTarget = trigger) {
  if (!dialog || dialog.open) return;
  dialogReturnTargets.set(dialog, returnTarget);
  dialog.showModal();
  const focusTarget = dialog.querySelector('[data-close-dialog], button, select, input');
  focusTarget?.focus();
}

function closeDialog(dialog) {
  if (dialog?.open) dialog.close();
}

function setBidStage(stage) {
  bidDialog.querySelectorAll('[data-bid-stage]').forEach((panel) => {
    panel.hidden = panel.dataset.bidStage !== stage;
  });
  bidDialog.scrollTop = 0;
}

function prepareBidReview() {
  bidError.hidden = true;
  if (body.dataset.reviewState === 'bid-answered') {
    currentBidChoice = 'approve';
    document.querySelector('[data-bid-success-title]').textContent = 'Recommendation approved.';
    document.querySelector('[data-bid-success-copy]').textContent = 'Desert Bloom will contact you before scheduling the work.';
    document.querySelector('[data-bid-success-total]').textContent = '$285 approved';
    setBidStage('success');
    return;
  }
  setBidStage('review');
}

document.querySelectorAll('[data-nav]').forEach((control) => {
  control.addEventListener('click', (event) => {
    event.preventDefault();
    showView(control.dataset.nav);
  });
});

propertySelect.addEventListener('change', () => selectProperty(propertySelect.value));

document.querySelectorAll('[data-property-button]').forEach((button) => {
  button.addEventListener('click', () => selectProperty(button.dataset.propertyButton, { returnHome: true }));
});

document.querySelectorAll('[data-open-visit]').forEach((button) => {
  button.addEventListener('click', () => openDialog(visitDialog, button));
});

document.querySelectorAll('[data-open-report]').forEach((button) => {
  button.addEventListener('click', () => openDialog(reportDialog, button));
});

document.querySelectorAll('[data-open-bid]').forEach((button) => {
  button.addEventListener('click', () => {
    prepareBidReview();
    openDialog(bidDialog, button);
  });
});

document.querySelectorAll('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => closeDialog(button.closest('dialog')));
});

document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.addEventListener('close', () => {
    if (suppressFocusRestore) return;
    const returnTarget = dialogReturnTargets.get(dialog);
    if (returnTarget?.isConnected) returnTarget.focus();
  });
});

document.querySelector('[data-report-to-bid]').addEventListener('click', (event) => {
  const returnTarget = dialogReturnTargets.get(reportDialog) || event.currentTarget;
  suppressFocusRestore = true;
  reportDialog.close();
  suppressFocusRestore = false;
  prepareBidReview();
  openDialog(bidDialog, event.currentTarget, returnTarget);
});

document.querySelectorAll('[data-bid-choice]').forEach((button) => {
  button.addEventListener('click', () => {
    currentBidChoice = button.dataset.bidChoice;
    const approving = currentBidChoice === 'approve';
    document.querySelector('[data-confirm-icon]').textContent = approving ? '✓' : '×';
    document.querySelector('[data-confirm-title]').textContent = approving
      ? 'Approve tree limb removal?'
      : 'Decline tree limb removal?';
    document.querySelector('[data-confirm-copy]').textContent = approving
      ? 'You’re approving $285 of described work. Desert Bloom will contact you before scheduling.'
      : 'The proposed work will not be scheduled. You can contact Desert Bloom if you want to discuss it.';
    const confirmButton = document.querySelector('[data-confirm-bid]');
    confirmButton.textContent = approving ? 'Confirm approval' : 'Confirm decline';
    confirmButton.classList.toggle('button-primary', approving);
    confirmButton.classList.toggle('button-clay', !approving);
    bidError.hidden = true;
    setBidStage('confirm');
    confirmButton.focus();
  });
});

document.querySelector('[data-back-bid]').addEventListener('click', () => {
  bidError.hidden = true;
  setBidStage('review');
  bidDialog.querySelector(`[data-bid-choice="${currentBidChoice}"]`)?.focus();
});

document.querySelector('[data-confirm-bid]').addEventListener('click', (event) => {
  if (failureToggle.checked) {
    failureToggle.checked = false;
    bidError.hidden = false;
    bidError.focus?.();
    announce('Your response was not saved. Nothing changed. Try again.');
    return;
  }
  const approving = currentBidChoice === 'approve';
  document.querySelector('[data-bid-success-title]').textContent = approving
    ? 'Recommendation approved.'
    : 'Recommendation declined.';
  document.querySelector('[data-bid-success-copy]').textContent = approving
    ? 'Desert Bloom will contact you before scheduling the work.'
    : 'The work will not be scheduled. You can contact Desert Bloom with questions.';
  document.querySelector('[data-bid-success-total]').textContent = approving ? '$285 approved' : 'Declined';
  setBidStage('success');
  document.querySelector('[data-finish-bid]').focus();
  announce(approving ? 'Recommendation approved.' : 'Recommendation declined.');
  event.currentTarget.disabled = false;
});

document.querySelector('[data-finish-bid]').addEventListener('click', () => {
  if (currentBidChoice === 'approve') {
    body.dataset.reviewState = 'bid-answered';
    const stateInput = reviewDialog.querySelector('input[value="bid-answered"]');
    if (stateInput) stateInput.checked = true;
  }
  closeDialog(bidDialog);
});

document.querySelector('[data-open-review]').addEventListener('click', (event) => {
  openDialog(reviewDialog, event.currentTarget);
});

document.querySelector('[data-apply-review]').addEventListener('click', () => {
  const selected = reviewDialog.querySelector('input[name="review-state"]:checked');
  const state = selected?.value || 'default';
  body.dataset.reviewState = state;
  closeDialog(reviewDialog);
  if (state === 'expired-report') {
    showView('proof', { moveFocus: false });
    window.setTimeout(() => openDialog(reportDialog, document.querySelector('[data-open-report]')), 0);
  } else if (['empty-schedule', 'no-proof', 'bid-answered'].includes(state)) {
    showView('home');
  }
  announce(`Review state changed to ${selected?.closest('label')?.querySelector('strong')?.textContent || state}.`);
});

document.querySelector('[data-retry]').addEventListener('click', () => {
  body.dataset.reviewState = 'loading';
  announce('Trying to load your yard again.');
  window.setTimeout(() => {
    body.dataset.reviewState = 'default';
    reviewDialog.querySelector('input[value="default"]').checked = true;
    announce('Your yard details are available.');
  }, 700);
});

window.addEventListener('hashchange', () => showView(window.location.hash.slice(1), { moveFocus: true, updateHash: false }));

body.dataset.property = 'home';
selectProperty('home');
showView(window.location.hash.slice(1), { moveFocus: false, updateHash: !window.location.hash });
