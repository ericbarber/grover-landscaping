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
    dateLong: 'Tuesday, August 11',
    rescheduledDay: '13',
    rescheduledWeekday: 'THU',
    rescheduledDateLong: 'Thursday, August 13',
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
    dateLong: 'Thursday, August 20',
    rescheduledDay: '22',
    rescheduledWeekday: 'SAT',
    rescheduledDateLong: 'Saturday, August 22',
    window: '7:30–9:00 AM',
    nextService: 'Seasonal garden refresh',
    cadence: 'Seasonal care',
    rhythm: 'Thursday, Aug 20 · 7:30–9:00 AM',
    reportTitle: 'Seasonal garden refresh complete',
    reportService: 'Seasonal garden care',
  },
};

const serviceStateDefinitions = {
  default: {
    status: 'Confirmed',
    update: '',
    timing: null,
    prepIcon: '☀',
    prepTitle: 'You’re all set.',
    prepCopy: 'Side gate access is on file.',
    prepSummary: 'No preparation needed',
    nextUpdate: 'We’ll update this visit if timing changes.',
    activeStep: 'confirmed',
  },
  'en-route': {
    status: 'En route',
    update: 'Your care team is on the way.',
    timing: 'Arriving 8:35–8:55 AM',
    prepIcon: '↗',
    prepTitle: 'Please prepare now.',
    prepCopy: 'Keep the side gate clear and pets inside.',
    prepSummary: 'Keep gate clear and pets inside',
    nextUpdate: 'Arrival is expected between 8:35 and 8:55 AM.',
    activeStep: 'en-route',
  },
  arrived: {
    status: 'Care in progress',
    update: 'Your care team arrived at 8:42 AM.',
    timing: 'Started 8:42 AM',
    prepIcon: '✓',
    prepTitle: 'Access confirmed.',
    prepCopy: 'No action is needed while care is underway.',
    prepSummary: 'Access confirmed',
    nextUpdate: 'We’ll let you know when care is complete and proof is being reviewed.',
    activeStep: 'in-progress',
  },
  'weather-delay': {
    status: 'Weather delay',
    update: 'Lightning nearby has paused outdoor work.',
    timing: 'Next update by 10:30 AM',
    prepIcon: '☂',
    prepTitle: 'No action needed.',
    prepCopy: 'Desert Bloom is monitoring conditions and will update you.',
    prepSummary: 'No action needed',
    nextUpdate: 'Desert Bloom will confirm today’s timing or a new service date by 10:30 AM.',
    activeStep: 'confirmed',
  },
  rescheduled: {
    status: 'Rescheduled',
    update: 'Weather moved this visit from Tuesday, August 11.',
    timing: '8:00–10:00 AM',
    prepIcon: '↻',
    prepTitle: 'New date confirmed.',
    prepCopy: 'Your access instructions remain on file.',
    prepSummary: 'New date confirmed',
    nextUpdate: 'Your visit is confirmed for the new date. We’ll notify you if timing changes.',
    activeStep: 'confirmed',
  },
  'proof-pending': {
    status: 'Visit complete',
    update: 'Care finished at 9:06 AM.',
    timing: 'Completed 9:06 AM',
    prepIcon: '✓',
    prepTitle: 'Care is complete.',
    prepCopy: 'Proof is being reviewed before it is delivered to you.',
    prepSummary: 'Proof pending provider review',
    nextUpdate: 'Delivered proof will appear here after provider review. Unpublished evidence remains private.',
    activeStep: 'completed',
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
const conversationDialog = document.querySelector('[data-conversation-dialog]');
const reviewDialog = document.querySelector('[data-review-dialog]');
const bidError = document.querySelector('[data-bid-error]');
const failureToggle = document.querySelector('[data-simulate-bid-error]');
const messageFailureToggle = document.querySelector('[data-simulate-message-error]');
const preferencesFailureToggle = document.querySelector('[data-simulate-preferences-error]');
const dialogReturnTargets = new WeakMap();
const dialogsSkippingRestore = new WeakSet();
let currentBidChoice = 'approve';
let conversationMode = 'visit-question';

function announce(message) {
  liveRegion.textContent = '';
  window.requestAnimationFrame(() => { liveRegion.textContent = message; });
}

function setText(selector, value) {
  document.querySelectorAll(selector).forEach((element) => { element.textContent = value; });
}

function reviewServiceState() {
  return Object.hasOwn(serviceStateDefinitions, body.dataset.reviewState)
    ? body.dataset.reviewState
    : 'default';
}

function renderServiceState() {
  const property = propertyDefinitions[body.dataset.property || 'home'];
  const stateId = reviewServiceState();
  const state = serviceStateDefinitions[stateId];
  const rescheduled = stateId === 'rescheduled';
  const timing = state.timing || property.window;

  setText('[data-visit-day]', rescheduled ? property.rescheduledDay : property.day);
  setText('[data-visit-weekday]', rescheduled ? property.rescheduledWeekday : property.weekday);
  setText('[data-visit-date-long]', rescheduled ? property.rescheduledDateLong : property.dateLong);
  setText('[data-visit-window]', timing);
  setText('[data-prep-icon]', state.prepIcon);
  setText('[data-prep-title]', state.prepTitle);
  setText('[data-prep-copy]', state.prepCopy);
  setText('[data-visit-prep-summary]', state.prepSummary);
  setText('[data-next-update]', state.nextUpdate);
  document.querySelectorAll('[data-service-status]').forEach((element) => {
    const dot = document.createElement('i');
    dot.setAttribute('aria-hidden', 'true');
    element.replaceChildren(dot, ` ${state.status}`);
  });
  document.querySelectorAll('[data-service-update]').forEach((element) => {
    const update = rescheduled ? `Weather moved this visit from ${property.dateLong}.` : state.update;
    element.textContent = update;
    element.hidden = !update;
  });
  const stepOrder = ['confirmed', 'en-route', 'in-progress', 'completed'];
  const activeIndex = stepOrder.indexOf(state.activeStep);
  document.querySelectorAll('[data-service-step]').forEach((step) => {
    const stepIndex = stepOrder.indexOf(step.dataset.serviceStep);
    step.classList.toggle('done', stepIndex < activeIndex || state.activeStep === 'completed');
    step.classList.toggle('current', stepIndex === activeIndex && state.activeStep !== 'completed');
    const marker = step.querySelector('span');
    if (marker) marker.textContent = stepIndex < activeIndex || state.activeStep === 'completed' ? '✓' : String(stepIndex + 1);
  });
}

function renderConcernState(status = 'received') {
  const card = document.querySelector('[data-concern-card]');
  const states = {
    received: {
      label: 'Received',
      title: 'Desert Bloom received your concern.',
      copy: 'Expect a response within one business day. Updates stay connected to the August 4 visit.',
    },
    followUp: {
      label: 'Follow-up planned',
      title: 'A follow-up visit is planned for Thursday.',
      copy: 'Desert Bloom will inspect the west lawn between 8:00 and 10:00 AM. No preparation is needed.',
    },
    resolved: {
      label: 'Resolved',
      title: 'Your service concern is resolved.',
      copy: 'Desert Bloom completed the follow-up and shared the outcome. You can reopen the conversation by contacting your provider.',
    },
  };
  const value = states[status];
  card.hidden = false;
  const statusElement = card.querySelector('[data-concern-status]');
  const dot = document.createElement('i');
  dot.setAttribute('aria-hidden', 'true');
  statusElement.replaceChildren(dot, ` ${value.label}`);
  setText('[data-concern-title]', value.title);
  setText('[data-concern-copy]', value.copy);
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
  renderServiceState();
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

const bidReviewStates = {
  'bid-answered': {
    homeStatus: 'Received',
    homeTitle: 'Tree limb removal approved',
    homeCopy: 'Desert Bloom received your approval. They’ll contact you when the work is scheduled.',
    homeAction: 'View response',
    eyebrow: 'Response received',
    title: 'Recommendation approved.',
    copy: 'Desert Bloom will contact you before scheduling the work.',
    total: '$285 approved',
    current: 'Approval received',
    currentDate: 'August 11',
    next: 'Scheduling next',
    nextCopy: 'Desert Bloom will contact you',
    icon: '✓',
  },
  'bid-rejected': {
    homeStatus: 'Declined',
    homeTitle: 'Tree limb removal declined',
    homeCopy: 'Desert Bloom received your response. The proposed work will not be scheduled.',
    homeAction: 'View response',
    eyebrow: 'Response received',
    title: 'Recommendation declined.',
    copy: 'The work will not be scheduled. You can contact Desert Bloom if you want to reconsider it.',
    total: 'Declined',
    current: 'Decline received',
    currentDate: 'August 11',
    next: 'No work scheduled',
    nextCopy: 'Contact provider to reconsider',
    icon: '×',
  },
  'bid-revision-requested': {
    homeStatus: 'Change requested',
    homeTitle: 'Proposal update requested',
    homeCopy: 'The $285 proposal remains undecided while Desert Bloom reviews your requested scope change.',
    homeAction: 'View request',
    eyebrow: 'Change requested',
    title: 'The proposal awaits revision.',
    copy: 'The current proposal is not approved. Desert Bloom can respond or deliver revised scope for a new decision.',
    total: 'Decision paused',
    current: 'Change requested',
    currentDate: 'August 11',
    next: 'Provider review',
    nextCopy: 'A revised proposal may follow',
    icon: '↻',
  },
  'bid-expired': {
    homeStatus: 'Expired',
    homeTitle: 'Tree limb proposal expired',
    homeCopy: 'The proposal can no longer be approved. Contact Desert Bloom if you still want to consider the work.',
    homeAction: 'View expired proposal',
    eyebrow: 'Decision unavailable',
    title: 'This proposal has expired.',
    copy: 'No decision can be recorded. Ask Desert Bloom whether an updated proposal is available.',
    total: '$285 expired',
    current: 'Proposal expired',
    currentDate: 'August 14',
    next: 'Updated scope if needed',
    nextCopy: 'Contact Desert Bloom',
    icon: '⌁',
  },
  'bid-scheduled': {
    homeStatus: 'Scheduled',
    homeTitle: 'Tree limb removal scheduled',
    homeCopy: 'Approved work is scheduled for Thursday, August 20 from 7:30 to 9:00 AM.',
    homeAction: 'View work history',
    eyebrow: 'Approved work scheduled',
    title: 'Tree limb removal is scheduled.',
    copy: 'The approved $285 scope is connected to a new visit on Thursday, August 20.',
    total: '$285 approved',
    current: 'Approval received',
    currentDate: 'August 11',
    next: 'Work scheduled',
    nextCopy: 'August 20 · 7:30–9:00 AM',
    icon: '✓',
  },
};

function renderBidState(stateId = body.dataset.reviewState) {
  const state = bidReviewStates[stateId] || bidReviewStates['bid-answered'];
  const status = document.querySelector('[data-home-bid-status]');
  const dot = document.createElement('i');
  dot.setAttribute('aria-hidden', 'true');
  status.replaceChildren(dot, ` ${state.homeStatus}`);
  setText('[data-home-bid-title]', state.homeTitle);
  setText('[data-home-bid-copy]', state.homeCopy);
  setText('[data-home-bid-action]', state.homeAction);
  setText('[data-bid-success-eyebrow]', state.eyebrow);
  setText('[data-bid-success-title]', state.title);
  setText('[data-bid-success-copy]', state.copy);
  setText('[data-bid-success-total]', state.total);
  setText('[data-decision-history-current]', state.current);
  setText('[data-decision-history-date]', state.currentDate);
  setText('[data-decision-history-next]', state.next);
  setText('[data-decision-history-next-copy]', state.nextCopy);
  setText('[data-bid-success-icon]', state.icon);
}

function prepareBidReview() {
  bidError.hidden = true;
  if (Object.hasOwn(bidReviewStates, body.dataset.reviewState)) {
    currentBidChoice = 'approve';
    renderBidState();
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
    if (dialogsSkippingRestore.has(dialog)) {
      dialogsSkippingRestore.delete(dialog);
      return;
    }
    const returnTarget = dialogReturnTargets.get(dialog);
    if (returnTarget?.isConnected) returnTarget.focus();
  });
});

document.querySelector('[data-report-to-bid]').addEventListener('click', (event) => {
  const returnTarget = dialogReturnTargets.get(reportDialog) || event.currentTarget;
  dialogsSkippingRestore.add(reportDialog);
  reportDialog.close();
  prepareBidReview();
  openDialog(bidDialog, event.currentTarget, returnTarget);
});

const conversationDefinitions = {
  'visit-question': {
    eyebrow: 'Visit question',
    title: 'Ask about this visit',
    submit: 'Send question',
    context: () => `${propertyDefinitions[body.dataset.property].nextService} · ${propertyDefinitions[body.dataset.property].dateLong}`,
    options: [['timing', 'Timing or arrival'], ['preparation', 'Gate, pets, or preparation'], ['service', 'Planned service'], ['other', 'Something else']],
    successTitle: 'Your question is ready for review.',
    successCopy: 'Desert Bloom typically responds within one business day. The question remains connected to this visit.',
  },
  concern: {
    eyebrow: 'Service concern',
    title: 'Report a concern',
    submit: 'Send concern',
    context: () => `${propertyDefinitions[body.dataset.property].reportService} · August 4`,
    options: [['lawn', 'Lawn or edging'], ['plants', 'Shrubs, plants, or beds'], ['irrigation', 'Irrigation'], ['cleanup', 'Cleanup or property condition'], ['other', 'Something else']],
    successTitle: 'Your concern is ready for review.',
    successCopy: 'Desert Bloom typically responds within one business day. You can follow the customer-safe recovery status in Proof.',
  },
  'bid-question': {
    eyebrow: 'Recommendation question',
    title: 'Ask before deciding',
    submit: 'Send question',
    context: () => 'Tree limb removal · $285 proposal',
    options: [['scope', 'Scope of work'], ['timing', 'Scheduling'], ['price', 'Price or line item'], ['evidence', 'Recommendation evidence']],
    successTitle: 'Your proposal question is ready.',
    successCopy: 'The proposal still awaits your decision. Desert Bloom typically responds within one business day.',
  },
  'scope-change': {
    eyebrow: 'Proposal change',
    title: 'Request a scope change',
    submit: 'Request change',
    context: () => 'Tree limb removal · $285 proposal',
    options: [['remove', 'Remove an item'], ['add', 'Add an item'], ['quantity', 'Change quantity or area'], ['other', 'Describe another change']],
    successTitle: 'Your change request is ready.',
    successCopy: 'The current proposal is not approved. Desert Bloom can respond or deliver revised scope for a new decision.',
  },
};

function prepareConversation(mode) {
  conversationMode = Object.hasOwn(conversationDefinitions, mode) ? mode : 'visit-question';
  const definition = conversationDefinitions[conversationMode];
  const form = document.querySelector('[data-conversation-form]');
  form.reset();
  document.querySelector('[data-conversation-form-stage]').hidden = false;
  document.querySelector('[data-conversation-success]').hidden = true;
  document.querySelector('[data-conversation-submit-error]').hidden = true;
  setText('[data-conversation-error]', '');
  setText('[data-conversation-eyebrow]', definition.eyebrow);
  setText('[data-conversation-title]', definition.title);
  setText('[data-conversation-context]', definition.context());
  setText('[data-conversation-submit]', definition.submit);
  setText('[data-conversation-success-title]', definition.successTitle);
  setText('[data-conversation-success-copy]', definition.successCopy);
  setText('[data-conversation-success-context]', definition.context().split(' · ')[0]);
  const topic = document.querySelector('[data-conversation-topic]');
  topic.replaceChildren(...definition.options.map(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    return option;
  }));
  document.querySelector('[data-conversation-cancel]').hidden = false;
  document.querySelector('[data-conversation-submit]').hidden = false;
  document.querySelector('[data-finish-conversation]').hidden = true;
}

function openConversation(mode, trigger) {
  prepareConversation(mode);
  const sourceDialog = trigger.closest('dialog[open]');
  if (sourceDialog) {
    const returnTarget = dialogReturnTargets.get(sourceDialog) || trigger;
    dialogsSkippingRestore.add(sourceDialog);
    sourceDialog.close();
    window.setTimeout(() => openDialog(conversationDialog, trigger, returnTarget), 0);
    return;
  }
  openDialog(conversationDialog, trigger);
}

document.querySelectorAll('[data-open-question]').forEach((button) => {
  button.addEventListener('click', () => openConversation('visit-question', button));
});

document.querySelectorAll('[data-open-conversation]').forEach((button) => {
  button.addEventListener('click', () => openConversation(button.dataset.openConversation, button));
});

document.querySelector('[data-conversation-form]').addEventListener('submit', (event) => {
  event.preventDefault();
  const message = event.currentTarget.elements['conversation-message'];
  const error = document.querySelector('[data-conversation-error]');
  if (message.value.trim().length < 12) {
    error.textContent = 'Add at least 12 characters so your provider understands what you need.';
    message.setAttribute('aria-invalid', 'true');
    message.focus();
    return;
  }
  error.textContent = '';
  message.removeAttribute('aria-invalid');
  if (messageFailureToggle.checked) {
    messageFailureToggle.checked = false;
    document.querySelector('[data-conversation-submit-error]').hidden = false;
    announce('Your message was not sent. Nothing was shared. Try again.');
    return;
  }
  document.querySelector('[data-conversation-submit-error]').hidden = true;
  document.querySelector('[data-conversation-form-stage]').hidden = true;
  document.querySelector('[data-conversation-success]').hidden = false;
  document.querySelector('[data-conversation-cancel]').hidden = true;
  document.querySelector('[data-conversation-submit]').hidden = true;
  document.querySelector('[data-finish-conversation]').hidden = false;
  if (conversationMode === 'concern') {
    body.dataset.hasConcern = 'true';
    renderConcernState('received');
  } else if (conversationMode === 'scope-change') {
    body.dataset.reviewState = 'bid-revision-requested';
    reviewDialog.querySelector('input[value="bid-revision-requested"]').checked = true;
    renderServiceState();
    renderBidState('bid-revision-requested');
  }
  document.querySelector('[data-finish-conversation]').focus();
  announce(conversationDefinitions[conversationMode].successTitle);
});

document.querySelector('[data-finish-conversation]').addEventListener('click', () => closeDialog(conversationDialog));

document.querySelector('[data-positive-feedback]').addEventListener('click', (event) => {
  const result = document.querySelector('[data-feedback-result]');
  result.hidden = false;
  result.textContent = 'Thank you. This design records positive feedback without opening a concern.';
  event.currentTarget.disabled = true;
  announce('Feedback recorded in the design prototype.');
});

document.querySelector('[data-comparison-range]').addEventListener('input', (event) => {
  const comparison = event.currentTarget.closest('.evidence-pair');
  comparison.style.setProperty('--comparison', `${event.currentTarget.value}%`);
  announce(`Before image ${event.currentTarget.value} percent, after image ${100 - Number(event.currentTarget.value)} percent.`);
});

const preferencesForm = document.querySelector('[data-preferences-form]');
preferencesForm.addEventListener('input', () => {
  document.querySelector('[data-preferences-unsaved]').hidden = false;
  document.querySelector('[data-preferences-success]').hidden = true;
  document.querySelector('[data-preferences-error]').hidden = true;
});

preferencesForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const instructions = event.currentTarget.elements['access-instructions'];
  const shareAccess = event.currentTarget.elements['share-access'];
  const accessError = document.querySelector('[data-access-error]');
  if (shareAccess.checked && instructions.value.trim().length < 10) {
    accessError.textContent = 'Add clear access guidance or turn off sharing before saving.';
    instructions.setAttribute('aria-invalid', 'true');
    instructions.focus();
    return;
  }
  accessError.textContent = '';
  instructions.removeAttribute('aria-invalid');
  if (preferencesFailureToggle.checked) {
    preferencesFailureToggle.checked = false;
    document.querySelector('[data-preferences-error]').hidden = false;
    announce('Preferences were not saved. Nothing changed. Try again.');
    return;
  }
  document.querySelector('[data-preferences-error]').hidden = true;
  document.querySelector('[data-preferences-unsaved]').hidden = true;
  document.querySelector('[data-preferences-success]').hidden = false;
  announce('Preferences saved in the design prototype. Nothing was transmitted.');
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
  renderBidState(approving ? 'bid-answered' : 'bid-rejected');
  setBidStage('success');
  document.querySelector('[data-finish-bid]').focus();
  announce(approving ? 'Recommendation approved.' : 'Recommendation declined.');
  event.currentTarget.disabled = false;
});

document.querySelector('[data-finish-bid]').addEventListener('click', () => {
  const stateId = currentBidChoice === 'approve' ? 'bid-answered' : 'bid-rejected';
  body.dataset.reviewState = stateId;
  const stateInput = reviewDialog.querySelector(`input[value="${stateId}"]`);
  if (stateInput) stateInput.checked = true;
  renderServiceState();
  renderBidState(stateId);
  closeDialog(bidDialog);
});

document.querySelector('[data-open-review]').addEventListener('click', (event) => {
  openDialog(reviewDialog, event.currentTarget);
});

document.querySelector('[data-apply-review]').addEventListener('click', () => {
  const selected = reviewDialog.querySelector('input[name="review-state"]:checked');
  const state = selected?.value || 'default';
  body.dataset.reviewState = state;
  renderServiceState();
  if (Object.hasOwn(bidReviewStates, state)) renderBidState(state);
  if (state === 'default') {
    document.querySelector('[data-concern-card]').hidden = true;
    delete body.dataset.hasConcern;
  }
  closeDialog(reviewDialog);
  if (state === 'expired-report') {
    showView('proof', { moveFocus: false });
    const proofTrigger = document.querySelector('[data-view-panel="proof"] [data-open-report]');
    window.setTimeout(() => openDialog(reportDialog, proofTrigger), 0);
  } else if (['empty-schedule', 'no-proof'].includes(state) || Object.hasOwn(bidReviewStates, state)) {
    showView('home');
  } else if (Object.hasOwn(serviceStateDefinitions, state)) {
    showView('home');
  } else if (state === 'concern-follow-up' || state === 'concern-resolved') {
    body.dataset.hasConcern = 'true';
    renderConcernState(state === 'concern-follow-up' ? 'followUp' : 'resolved');
    showView('proof');
  }
  announce(`Review state changed to ${selected?.closest('label')?.querySelector('strong')?.textContent || state}.`);
});

document.querySelector('[data-retry]').addEventListener('click', () => {
  body.dataset.reviewState = 'loading';
  announce('Trying to load your yard again.');
  window.setTimeout(() => {
    body.dataset.reviewState = 'default';
    renderServiceState();
    reviewDialog.querySelector('input[value="default"]').checked = true;
    announce('Your yard details are available.');
  }, 700);
});

window.addEventListener('hashchange', () => showView(window.location.hash.slice(1), { moveFocus: true, updateHash: false }));

body.dataset.property = 'home';
selectProperty('home');
showView(window.location.hash.slice(1), { moveFocus: false, updateHash: !window.location.hash });
