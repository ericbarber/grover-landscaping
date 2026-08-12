const body = document.body;
const pageTitle = document.querySelector('[data-page-title]');
const pageEyebrow = document.querySelector('[data-page-eyebrow]');
const liveRegion = document.querySelector('[data-live-region]');
const saveState = document.querySelector('[data-save-state]');
const reviewDialog = document.querySelector('[data-review-dialog]');
const howDialog = document.querySelector('[data-how-dialog]');
const proposalDialog = document.querySelector('[data-proposal-dialog]');
const providerDialog = document.querySelector('[data-provider-dialog]');
const dialogReturnTargets = new WeakMap();

const stepDefinitions = {
  welcome: { title: 'Find care for my yard', eyebrow: 'Get started', progress: null, save: ['Private start', 'Nothing shared'] },
  account: { title: 'Create my private profile', eyebrow: 'Your yard', progress: 'yard', save: ['Private draft', 'Nothing shared'] },
  property: { title: 'Add my property', eyebrow: 'Your yard', progress: 'yard', save: ['Private draft', 'Nothing shared'] },
  brief: { title: 'Build my yard brief', eyebrow: 'Your yard', progress: 'yard', save: ['Private draft', 'Nothing shared'] },
  photos: { title: 'Show the yard', eyebrow: 'Optional photos', progress: 'photos', save: ['Private draft', 'Nothing shared'] },
  share: { title: 'Choose how to connect', eyebrow: 'Your choice', progress: 'connect', save: ['Brief ready', 'Nothing shared'] },
  invite: { title: 'Invite my provider', eyebrow: 'Direct connection', progress: 'connect', save: ['Review sharing', 'Nothing sent'] },
  connection: { title: 'Connection progress', eyebrow: 'Provider invitation', progress: 'connect', save: ['Request sent', 'Limited details'] },
  provider: { title: 'Provider request preview', eyebrow: 'Provider side', progress: 'connect', save: ['Provider preview', 'No service created'] },
  'access-approval': { title: 'Approve provider access', eyebrow: 'Your consent', progress: 'connect', save: ['Review sharing', 'Full access pending'] },
  directory: { title: 'Find a provider', eyebrow: 'Curated discovery', progress: 'connect', save: ['Brief private', 'Coarse matching only'] },
  'directory-share': { title: 'Review assessment requests', eyebrow: 'Your consent', progress: 'connect', save: ['Review sharing', 'Nothing sent'] },
  assessment: { title: 'Plan the assessment', eyebrow: 'Verify the yard', progress: 'proposal', save: ['Provider connected', 'Assessment only'] },
  proposals: { title: 'Compare proposed care', eyebrow: 'Informed decision', progress: 'proposal', save: ['Proposals delivered', 'No decision yet'] },
  activation: { title: 'Provider setup', eyebrow: 'Accepted care', progress: 'ready', save: ['Scope accepted', 'Setup in progress'] },
  ready: { title: 'Care connected', eyebrow: 'First visit confirmed', progress: 'ready', save: ['Active care', 'Provider connected'] },
  relationship: { title: 'Account and privacy', eyebrow: 'Your controls', progress: 'ready', save: ['Active care', 'Sharing controlled'] },
  saved: { title: 'Private draft saved', eyebrow: 'Finish later', progress: null, save: ['Private draft', 'Nothing shared'] },
  unavailable: { title: 'Yard setup unavailable', eyebrow: 'Protected recovery', progress: null, save: ['Protected', 'Nothing shared'] },
};

const progressOrder = ['yard', 'photos', 'connect', 'proposal', 'ready'];
let currentStep = 'welcome';
let addressVerified = false;
let selectedProviders = [];
let currentProposal = 'desert';

function announce(message) {
  liveRegion.textContent = '';
  window.requestAnimationFrame(() => { liveRegion.textContent = message; });
}

function updateSaveState([title, copy]) {
  saveState.querySelector('strong').textContent = title;
  saveState.querySelector('small').textContent = copy;
}

function renderProgress(active) {
  const activeIndex = active ? progressOrder.indexOf(active) : -1;
  document.querySelectorAll('[data-progress]').forEach((item) => {
    const index = progressOrder.indexOf(item.dataset.progress);
    item.classList.toggle('current', index === activeIndex);
    item.classList.toggle('done', activeIndex > index || active === 'ready' && index < progressOrder.length - 1);
    const marker = item.querySelector(':scope > span');
    marker.textContent = item.classList.contains('done') ? '✓' : String(index + 1);
  });
}

function showStep(step, { moveFocus = true, updateHash = true } = {}) {
  const next = Object.hasOwn(stepDefinitions, step) ? step : 'welcome';
  currentStep = next;
  body.dataset.step = next;
  body.dataset.persona = next === 'provider' ? 'provider' : 'owner';
  document.querySelectorAll('[data-step-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.stepPanel !== next;
  });
  const definition = stepDefinitions[next];
  pageTitle.textContent = definition.title;
  pageEyebrow.textContent = definition.eyebrow;
  document.title = `${definition.title} · Grover working design`;
  updateSaveState(definition.save);
  renderProgress(definition.progress);
  document.querySelector(`input[name="review-step"][value="${next}"]`)?.setAttribute('checked', '');
  document.querySelectorAll('input[name="review-step"]').forEach((input) => { input.checked = input.value === next; });
  if (updateHash) window.history.replaceState(null, '', `#${next}`);
  if (moveFocus) {
    window.scrollTo({ top: 0, behavior: 'auto' });
    pageTitle.focus({ preventScroll: true });
    announce(`${definition.title} opened.`);
  }
}

function openDialog(dialog, trigger) {
  if (!dialog || dialog.open) return;
  dialogReturnTargets.set(dialog, trigger);
  dialog.showModal();
  dialog.querySelector('[data-close-dialog], button, input, select, textarea')?.focus();
}

function closeDialog(dialog) {
  if (dialog?.open) dialog.close();
}

document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.addEventListener('close', () => {
    const target = dialogReturnTargets.get(dialog);
    if (target?.isConnected) target.focus();
  });
});

document.querySelectorAll('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => closeDialog(button.closest('dialog')));
});

document.querySelectorAll('[data-go-step]').forEach((control) => {
  control.addEventListener('click', (event) => {
    if (control.tagName === 'A') event.preventDefault();
    showStep(control.dataset.goStep);
  });
});

document.querySelector('[data-open-how]').addEventListener('click', (event) => openDialog(howDialog, event.currentTarget));
document.querySelector('[data-open-review]').addEventListener('click', (event) => openDialog(reviewDialog, event.currentTarget));

document.querySelector('[data-account-form]').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const name = form.elements['owner-name'];
  const email = form.elements['owner-email'];
  const privacy = form.elements.privacy;
  const errors = {
    'owner-name': name.value.trim().length < 2 ? 'Enter your name.' : '',
    'owner-email': !/^\S+@\S+\.\S+$/.test(email.value.trim()) ? 'Enter a valid email address.' : '',
  };
  Object.entries(errors).forEach(([field, message]) => {
    const input = form.elements[field];
    input.setAttribute('aria-invalid', String(Boolean(message)));
    document.querySelector(`[data-error-for="${field}"]`).textContent = message;
  });
  const invalid = Object.values(errors).some(Boolean) || !privacy.checked;
  document.querySelector('[data-account-error]').hidden = !invalid;
  if (invalid) {
    (Object.values(errors).some(Boolean) ? form.querySelector('[aria-invalid="true"]') : privacy).focus();
    announce('Check the highlighted owner information.');
    return;
  }
  showStep('property');
});

document.querySelector('[data-verify-address]').addEventListener('click', (event) => {
  addressVerified = true;
  document.querySelector('[data-address-result]').hidden = false;
  document.querySelector('[data-address-status]').textContent = 'Central Phoenix confirmed. Exact address remains private.';
  event.currentTarget.querySelector(':scope > span:first-child').textContent = '✓';
  announce('Address location confirmed for Central Phoenix.');
});

document.querySelector('[data-property-form]').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const authority = form.elements.authority;
  const street = form.elements.street;
  let message = '';
  if (street.value.trim().length < 5) message = 'Enter a complete service address.';
  else if (!addressVerified) message = 'Confirm the location before continuing.';
  else if (!authority.checked) message = 'Confirm that you are authorized to request care.';
  document.querySelector('[data-property-error]').hidden = !message;
  document.querySelector('[data-property-error-copy]').textContent = message;
  street.setAttribute('aria-invalid', String(street.value.trim().length < 5));
  if (message) {
    (street.value.trim().length < 5 ? street : authority).focus();
    announce(message);
    return;
  }
  showStep('brief');
});

document.querySelectorAll('.consideration-chips button').forEach((button) => {
  button.addEventListener('click', () => {
    button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
  });
});

document.querySelector('[data-brief-form]').addEventListener('input', () => {
  const areaCount = document.querySelectorAll('input[name="area"]:checked').length;
  document.querySelector('[data-brief-complete]').textContent = `${Math.min(100, 40 + areaCount * 10)}%`;
});

document.querySelector('[data-brief-form]').addEventListener('submit', (event) => {
  event.preventDefault();
  const checkedAreas = [...document.querySelectorAll('input[name="area"]:checked')].map((input) => input.value);
  const goal = document.querySelector('input[name="goal"]:checked')?.value || 'Recommend one';
  const cadence = event.currentTarget.elements.cadence.value;
  document.querySelector('[data-summary-areas]').textContent = checkedAreas.length ? checkedAreas.join(', ') : 'Provider recommendation requested';
  document.querySelector('[data-summary-goal]').textContent = goal;
  document.querySelector('[data-summary-cadence]').textContent = cadence;
  showStep('photos');
});

function updatePhotoSummary() {
  const count = document.querySelectorAll('.photo-card.added').length;
  document.querySelector('[data-photo-count]').textContent = String(count);
  document.querySelector('[data-summary-photos]').textContent = `${count} optional photo${count === 1 ? '' : 's'}`;
  document.querySelector('[data-invite-photo-count]').textContent = `${count} photo${count === 1 ? '' : 's'}`;
  document.querySelector('[data-access-photo-count]').textContent = `${count} photo${count === 1 ? '' : 's'}`;
  document.querySelector('[data-upload-state]').textContent = count
    ? `${count} private photo${count === 1 ? '' : 's'} processed for this design. Location metadata removed.`
    : 'Photos have not been added.';
}

document.querySelectorAll('[data-toggle-photo]').forEach((button) => {
  button.addEventListener('click', () => {
    const card = document.querySelector(`[data-photo="${button.dataset.togglePhoto}"]`);
    const adding = !card.classList.contains('added');
    card.classList.toggle('added', adding);
    button.textContent = adding ? 'Remove photo' : 'Add photo';
    updatePhotoSummary();
    announce(adding ? `${button.dataset.togglePhoto} yard photo added to the private design brief.` : `${button.dataset.togglePhoto} yard photo removed.`);
  });
});

document.querySelector('[data-save-later]').addEventListener('click', () => showStep('saved'));

document.querySelector('[data-invite-form]').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const email = form.elements['provider-email'];
  const confirm = form.elements['confirm-share'];
  const error = document.querySelector('[data-invite-error]');
  if (!/^\S+@\S+\.\S+$/.test(email.value.trim()) || !confirm.checked) {
    error.hidden = false;
    document.querySelector('[data-invite-error-copy]').textContent = !confirm.checked
      ? 'Review and confirm the provider-specific disclosure.'
      : 'Enter a valid business email.';
    (!confirm.checked ? confirm : email).focus();
    announce('Invitation needs more information. Nothing was sent.');
    return;
  }
  const failureToggle = document.querySelector('[data-fail-invite]');
  if (failureToggle.checked) {
    failureToggle.checked = false;
    error.hidden = false;
    document.querySelector('[data-invite-error-copy]').textContent = 'Nothing was shared. Your provider and disclosure choices are still here so you can retry.';
    email.focus();
    announce('Invitation failed. Nothing was shared and entries were preserved.');
    return;
  }
  error.hidden = true;
  showStep('connection');
  announce('Connection invitation delivered in the working design. Exact address and photos remain private.');
});

document.querySelector('[data-preview-provider]').addEventListener('click', () => showStep('provider'));
document.querySelector('[data-revoke-invite]').addEventListener('click', () => {
  document.querySelector('[data-connection-status]').textContent = 'Invitation revoked';
  document.querySelector('[data-connection-result]').textContent = 'Future invitation access was revoked in this design. No yard details were shared.';
  announce('Invitation revoked.');
});

document.querySelector('[data-provider-decline]').addEventListener('click', () => {
  document.querySelector('[data-provider-result]').textContent = 'The request was declined with a customer-safe “not taking this request” response. No private yard access was granted.';
  announce('Provider declined the request without exposing internal details.');
});

document.querySelector('[data-provider-interest]').addEventListener('click', () => {
  showStep('access-approval');
  announce('Provider expressed assessment interest. Owner approval is still required.');
});

document.querySelector('[data-access-form]').addEventListener('submit', (event) => {
  event.preventDefault();
  const confirm = event.currentTarget.elements['approve-confirm'];
  const error = document.querySelector('[data-access-error]');
  if (!confirm.checked) {
    error.hidden = false;
    confirm.focus();
    announce('Confirm the provider-specific disclosure. Nothing has been shared.');
    return;
  }
  error.hidden = true;
  showStep('assessment');
  announce('Assessment access approved for Desert Bloom in this working design.');
});

function updateDirectorySelection() {
  selectedProviders = [...document.querySelectorAll('.select-provider input:checked')].map((input) => input.value);
  const count = selectedProviders.length;
  document.querySelector('[data-selected-count]').textContent = String(count);
  document.querySelector('[data-selection-title]').textContent = count ? `${count} provider${count === 1 ? '' : 's'} selected` : 'Select providers to continue';
  document.querySelector('[data-selection-copy]').textContent = count ? 'Each receives a separate request after your review.' : 'You can request up to three assessments.';
  document.querySelector('[data-review-requests]').disabled = count === 0;
}

document.querySelectorAll('.select-provider input').forEach((input) => input.addEventListener('change', updateDirectorySelection));

const providerDetails = {
  desert: { name: 'Desert Bloom Landscaping', logo: 'DB', heading: 'Routine and low-water yard care', area: 'Central Phoenix · Remote or on-site assessment', match: 'Its declared service area and capabilities match all three care areas in your yard brief.', insurance: 'On file · expires March 2027' },
  copper: { name: 'Copper State Yard Co.', logo: 'CS', heading: 'Routine lawn, shrub, and cleanup care', area: 'Central and North Phoenix · On-site assessment', match: 'Its service area includes your coarse location and it offers the cadence you requested.', insurance: 'On file · expires January 2027' },
  mesa: { name: 'Mesa Verde Yard Care', logo: 'MY', heading: 'Native and low-water landscape care', area: 'Central Phoenix · Remote-first assessment', match: 'Its declared specialty aligns with the low-water landscape areas in your brief.', insurance: 'Not shown · ask the provider before deciding' },
};

document.querySelectorAll('[data-view-provider]').forEach((button) => {
  button.addEventListener('click', () => {
    const details = providerDetails[button.dataset.viewProvider];
    document.querySelector('[data-provider-detail-name]').textContent = details.name;
    document.querySelector('[data-provider-detail-logo]').textContent = details.logo;
    document.querySelector('[data-provider-detail-heading]').textContent = details.heading;
    document.querySelector('[data-provider-detail-area]').textContent = details.area;
    document.querySelector('[data-provider-detail-match]').textContent = details.match;
    document.querySelector('[data-provider-detail-insurance]').textContent = details.insurance;
    openDialog(providerDialog, button);
  });
});

document.querySelector('[data-review-requests]').addEventListener('click', () => {
  const list = document.querySelector('[data-selected-provider-list]');
  list.replaceChildren(...selectedProviders.map((name) => {
    const item = document.createElement('article');
    const logo = document.createElement('span');
    logo.className = 'provider-logo';
    logo.textContent = name.split(' ').map((part) => part[0]).slice(0, 2).join('');
    const copy = document.createElement('div');
    copy.innerHTML = `<strong>${name}</strong><small>Separate assessment request · no competitor information</small>`;
    item.append(logo, copy);
    return item;
  }));
  showStep('directory-share');
});

document.querySelector('[data-directory-share-form]').addEventListener('submit', (event) => {
  event.preventDefault();
  const confirm = event.currentTarget.elements['directory-confirm'];
  const error = document.querySelector('[data-directory-share-error]');
  if (!confirm.checked) {
    error.hidden = false;
    confirm.focus();
    announce('Confirm the separate provider disclosures. No requests were sent.');
    return;
  }
  error.hidden = true;
  showStep('proposals');
  announce(`${selectedProviders.length} separate assessment requests completed in this design. Proposal comparison opened.`);
});

document.querySelector('[data-confirm-assessment]').addEventListener('click', () => {
  showStep('proposals');
  announce('Assessment confirmed and illustrative proposals delivered for review.');
});

const proposalDefinitions = {
  desert: { eyebrow: 'Service proposal · Version 2', title: 'Reliable biweekly yard care', provider: 'Desert Bloom Landscaping', logo: 'DB', date: 'Delivered August 12 · Expires August 18', price: '$148 / visit', cadence: 'Every other Tuesday', cancel: '24 hours before arrival', proof: 'Checklist and four delivered photos', exclusions: 'Tree work, irrigation repair, treatment products, and major restoration require a separate proposal.', scope: ['Mow and edge lawn', 'Clear desert beds and hard surfaces', 'Shape shrubs when needed', 'Check visible irrigation operation'] },
  copper: { eyebrow: 'Service proposal · Version 1', title: 'Weekly lawn and surface care', provider: 'Copper State Yard Co.', logo: 'CS', date: 'Delivered August 12 · Expires August 17', price: '$92 / visit', cadence: 'Every Thursday', cancel: '48 hours before arrival', proof: 'Checklist and two delivered photos', exclusions: 'Irrigation work, desert-bed cleanup, tree work, and treatment products are not included.', scope: ['Mow and edge lawn', 'Blow hard surfaces', 'Shape shrubs monthly', 'Bag routine green waste'] },
  accepted: { eyebrow: 'Accepted service snapshot · Version 2', title: 'Reliable biweekly yard care', provider: 'Desert Bloom Landscaping', logo: 'DB', date: 'Accepted August 12 · Immutable customer snapshot', price: '$148 / visit', cadence: 'Every other Tuesday', cancel: '24 hours before arrival', proof: 'Checklist and four delivered photos', exclusions: 'Tree work, irrigation repair, treatment products, and major restoration require a separate proposal.', scope: ['Mow and edge lawn', 'Clear desert beds and hard surfaces', 'Shape shrubs when needed', 'Check visible irrigation operation'], readonly: true },
};

function openProposal(id, trigger) {
  currentProposal = id;
  const proposal = proposalDefinitions[id] || proposalDefinitions.desert;
  document.querySelector('[data-proposal-eyebrow]').textContent = proposal.eyebrow;
  document.querySelector('[data-proposal-title]').textContent = proposal.title;
  document.querySelector('[data-proposal-provider]').textContent = proposal.provider;
  document.querySelector('[data-proposal-logo]').textContent = proposal.logo;
  document.querySelector('[data-proposal-date]').textContent = proposal.date;
  document.querySelector('[data-proposal-price]').textContent = proposal.price;
  document.querySelector('[data-proposal-cadence]').textContent = proposal.cadence;
  document.querySelector('[data-proposal-cancel]').textContent = proposal.cancel;
  document.querySelector('[data-proposal-proof]').textContent = proposal.proof;
  document.querySelector('[data-proposal-exclusions]').textContent = proposal.exclusions;
  const scope = document.querySelector('[data-proposal-scope]');
  scope.replaceChildren(...proposal.scope.map((item) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>✓</span> ${item}`;
    return li;
  }));
  document.querySelector('[data-proposal-question]').hidden = true;
  document.querySelector('[data-proposal-error]').hidden = true;
  const accept = document.querySelector('[data-accept-proposal]');
  accept.hidden = Boolean(proposal.readonly);
  accept.textContent = 'Accept described care';
  delete accept.dataset.confirming;
  document.querySelector('[data-decline-proposal]').hidden = Boolean(proposal.readonly);
  document.querySelector('[data-ask-proposal]').hidden = Boolean(proposal.readonly);
  openDialog(proposalDialog, trigger);
}

document.querySelectorAll('[data-open-proposal]').forEach((button) => button.addEventListener('click', () => openProposal(button.dataset.openProposal, button)));

document.querySelector('[data-ask-proposal]').addEventListener('click', () => {
  document.querySelector('[data-proposal-question]').hidden = false;
  document.querySelector('[data-proposal-question] textarea').focus();
});
document.querySelector('[data-cancel-question]').addEventListener('click', () => {
  document.querySelector('[data-proposal-question]').hidden = true;
  document.querySelector('[data-ask-proposal]').focus();
});
document.querySelector('[data-send-question]').addEventListener('click', () => {
  document.querySelector('[data-proposal-question]').hidden = true;
  closeDialog(proposalDialog);
  announce('Proposal question recorded in the design without accepting or declining.');
});

document.querySelector('[data-decline-proposal]').addEventListener('click', (event) => {
  if (!event.currentTarget.dataset.confirming) {
    event.currentTarget.dataset.confirming = 'true';
    event.currentTarget.textContent = 'Confirm decline';
    announce('Confirm that you want to decline this proposal.');
    return;
  }
  closeDialog(proposalDialog);
  announce('Proposal declined in this design. No service was created.');
});

document.querySelector('[data-accept-proposal]').addEventListener('click', (event) => {
  const button = event.currentTarget;
  if (!button.dataset.confirming) {
    button.dataset.confirming = 'true';
    button.textContent = `Confirm ${proposalDefinitions[currentProposal].price}`;
    announce('Confirm acceptance of the described care. No payment will be collected.');
    return;
  }
  const failureToggle = document.querySelector('[data-fail-proposal]');
  if (failureToggle.checked) {
    failureToggle.checked = false;
    document.querySelector('[data-proposal-error]').hidden = false;
    button.textContent = 'Retry acceptance';
    announce('Proposal decision failed. Nothing changed and the proposal remains open.');
    return;
  }
  document.querySelector('[data-proposal-error]').hidden = true;
  closeDialog(proposalDialog);
  showStep('activation');
  announce('Proposal accepted in the working design. Provider setup is in progress; no visit is scheduled yet.');
});

document.querySelector('[data-simulate-activation]').addEventListener('click', () => {
  document.querySelector('[data-activation-status]').textContent = 'First visit confirmed';
  const current = document.querySelector('[data-activation-current]');
  current.classList.remove('current');
  current.classList.add('done');
  current.querySelector(':scope > span').textContent = '✓';
  const first = document.querySelector('[data-activation-first]');
  first.classList.add('done');
  first.querySelector(':scope > span').textContent = '✓';
  showStep('ready');
});

document.querySelector('[data-end-care]').addEventListener('click', (event) => {
  if (!event.currentTarget.dataset.confirming) {
    event.currentTarget.dataset.confirming = 'true';
    event.currentTarget.textContent = 'Confirm end of future access';
    document.querySelector('[data-relationship-result]').textContent = 'Ending care stops future provider access after operational closeout; retained delivered records remain available.';
    return;
  }
  document.querySelector('[data-relationship-result]').textContent = 'Future provider access ended in this design. Historical accepted and delivered records remain protected.';
  event.currentTarget.disabled = true;
  announce('Future provider access ended.');
});
document.querySelector('[data-change-provider]').addEventListener('click', () => showStep('directory'));
document.querySelector('[data-revoke-photos]').addEventListener('click', (event) => {
  const item = document.querySelector('[data-photo-access]');
  item.querySelector(':scope > span').textContent = '—';
  item.querySelector('small').textContent = 'Future access revoked; proposal snapshot retention remains disclosed';
  event.currentTarget.disabled = true;
  announce('Future intake photo access revoked.');
});
document.querySelector('[data-export-data]').addEventListener('click', () => {
  document.querySelector('[data-data-result]').textContent = 'Data export requested in the design. A production version would verify identity and report preparation status.';
});
document.querySelector('[data-delete-intake]').addEventListener('click', () => {
  document.querySelector('[data-data-result]').textContent = 'Unused intake-media deletion requested. Failed object deletion would remain visible for recovery.';
});

document.querySelector('[data-retry-load]').addEventListener('click', () => {
  showStep('share');
  announce('Private yard brief restored in the design.');
});

document.querySelector('[data-apply-review]').addEventListener('click', () => {
  const step = reviewDialog.querySelector('input[name="review-step"]:checked')?.value || 'welcome';
  closeDialog(reviewDialog);
  showStep(step);
});

const initialHash = window.location.hash.slice(1);
showStep(Object.hasOwn(stepDefinitions, initialHash) ? initialHash : 'welcome', { moveFocus: false, updateHash: false });
updatePhotoSummary();
