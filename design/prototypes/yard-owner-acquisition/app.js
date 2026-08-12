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
  verify: { title: 'Verify my email', eyebrow: 'Your identity', progress: 'yard', save: ['Private draft', 'Nothing shared'] },
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

function addReviewOption(value, title, description, beforeValue) {
  if (reviewDialog.querySelector(`input[name="review-step"][value="${value}"]`)) return;
  const label = document.createElement('label');
  const input = document.createElement('input');
  const copy = document.createElement('span');
  const strong = document.createElement('strong');
  const small = document.createElement('small');
  input.type = 'radio';
  input.name = 'review-step';
  input.value = value;
  strong.textContent = title;
  small.textContent = description;
  copy.append(strong, small);
  label.append(input, copy);
  const before = reviewDialog.querySelector(`input[name="review-step"][value="${beforeValue}"]`)?.closest('label');
  before?.before(label);
}

addReviewOption('verify', 'Email verification', 'Code, resend, and recovery', 'property');
addReviewOption('directory-share', 'Directory disclosure', 'Separate provider requests', 'assessment');
addReviewOption('saved', 'Private draft saved', 'No-provider finish-later state', 'unavailable');
document.querySelectorAll('[data-provider-card]').forEach((card) => {
  card.querySelector('.select-provider input').setAttribute('aria-label', `Select ${card.querySelector('h3').textContent}`);
});

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
    if (index === activeIndex) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
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

document.querySelectorAll('[data-error-for]').forEach((error) => {
  if (!error.id) error.id = `${error.dataset.errorFor}-error`;
  const input = document.querySelector(`[name="${error.dataset.errorFor}"]`);
  if (!input) return;
  const describedBy = new Set((input.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
  describedBy.add(error.id);
  input.setAttribute('aria-describedby', [...describedBy].join(' '));
});

document.querySelector('[data-account-form]').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const name = form.elements['owner-name'];
  const email = form.elements['owner-email'];
  const phone = form.elements['owner-phone'];
  const channel = form.elements['preferred-channel'];
  const privacy = form.elements.privacy;
  const needsPhone = channel.value !== 'Email';
  const errors = {
    'owner-name': name.value.trim().length < 2 ? 'Enter your name.' : '',
    'owner-email': !/^\S+@\S+\.\S+$/.test(email.value.trim()) ? 'Enter a valid email address.' : '',
    'owner-phone': needsPhone && phone.value.replace(/\D/g, '').length < 10 ? 'Enter a mobile number for text updates, or choose email.' : '',
  };
  Object.entries(errors).forEach(([field, message]) => {
    const input = form.elements[field];
    input.setAttribute('aria-invalid', String(Boolean(message)));
    document.querySelector(`[data-error-for="${field}"]`).textContent = message;
  });
  privacy.setAttribute('aria-invalid', String(!privacy.checked));
  const invalid = Object.values(errors).some(Boolean) || !privacy.checked;
  document.querySelector('[data-account-error]').hidden = !invalid;
  if (invalid) {
    (Object.values(errors).some(Boolean) ? form.querySelector('[aria-invalid="true"]') : privacy).focus();
    announce('Check the highlighted owner information.');
    return;
  }
  document.querySelector('[data-verify-email]').textContent = email.value.trim();
  showStep('verify');
});

document.querySelector('[data-verify-form]').addEventListener('submit', (event) => {
  event.preventDefault();
  const code = event.currentTarget.elements['verification-code'];
  const error = document.querySelector('[data-verify-error]');
  const invalid = code.value.trim() !== '482913';
  code.setAttribute('aria-invalid', String(invalid));
  document.querySelector('[data-error-for="verification-code"]').textContent = invalid ? 'Enter the six-digit code 482913 for this working design.' : '';
  error.hidden = !invalid;
  if (invalid) {
    code.focus();
    announce('The verification code is incorrect. Your private profile is unchanged.');
    return;
  }
  showStep('property');
  announce('Email confirmed for the working design. Nothing has been shared with a provider.');
});

document.querySelector('[data-resend-code]').addEventListener('click', (event) => {
  event.currentTarget.disabled = true;
  document.querySelector('[data-resend-result]').textContent = 'A new illustrative code was sent. Use 482913.';
  announce('A new verification code was sent in this working design.');
});

const propertyForm = document.querySelector('[data-property-form]');
propertyForm.querySelectorAll('input[name="street"], input[name="city"], input[name="postal"], select[name="state"]').forEach((input) => {
  input.addEventListener('input', () => {
    if (!addressVerified) return;
    addressVerified = false;
    document.querySelector('[data-address-result]').hidden = true;
    document.querySelector('[data-address-status]').textContent = 'Address changed. Confirm the location again.';
    const marker = document.querySelector('[data-verify-address] > span:first-child');
    marker.textContent = '⌖';
    announce('Address changed. Confirm the location again before continuing.');
  });
});

document.querySelector('[data-verify-address]').addEventListener('click', (event) => {
  const requiredLocationFields = ['street', 'city', 'postal'];
  const missing = requiredLocationFields.find((field) => !propertyForm.elements[field].value.trim());
  if (missing) {
    propertyForm.elements[missing].setAttribute('aria-invalid', 'true');
    document.querySelector(`[data-error-for="${missing}"]`).textContent = `Enter the ${missing === 'postal' ? 'ZIP code' : missing} before confirming the location.`;
    propertyForm.elements[missing].focus();
    announce('Complete the address before confirming the location.');
    return;
  }
  addressVerified = true;
  document.querySelector('[data-address-result]').hidden = false;
  document.querySelector('[data-address-status]').textContent = 'Central Phoenix confirmed. Exact address remains private.';
  event.currentTarget.querySelector(':scope > span:first-child').textContent = '✓';
  announce('Address location confirmed for Central Phoenix.');
});

propertyForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const authority = form.elements.authority;
  const fieldErrors = {
    'property-name': form.elements['property-name'].value.trim().length < 2 ? 'Enter a property nickname.' : '',
    street: form.elements.street.value.trim().length < 5 ? 'Enter a complete service address.' : '',
    city: form.elements.city.value.trim().length < 2 ? 'Enter the city.' : '',
    postal: !/^\d{5}(?:-\d{4})?$/.test(form.elements.postal.value.trim()) ? 'Enter a valid ZIP code.' : '',
  };
  Object.entries(fieldErrors).forEach(([field, message]) => {
    form.elements[field].setAttribute('aria-invalid', String(Boolean(message)));
    document.querySelector(`[data-error-for="${field}"]`).textContent = message;
  });
  authority.setAttribute('aria-invalid', String(!authority.checked));
  const firstInvalidField = Object.entries(fieldErrors).find(([, message]) => message)?.[0];
  let message = firstInvalidField ? fieldErrors[firstInvalidField] : '';
  if (!message && !addressVerified) message = 'Confirm the location before continuing.';
  else if (!message && !authority.checked) message = 'Confirm that you are authorized to request care.';
  document.querySelector('[data-property-error]').hidden = !message;
  document.querySelector('[data-property-error-copy]').textContent = message;
  if (message) {
    (firstInvalidField ? form.elements[firstInvalidField] : !addressVerified ? document.querySelector('[data-verify-address]') : authority).focus();
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

document.querySelector('[data-brief-form]').addEventListener('input', (event) => {
  if (event.target.matches('input[name="area"]')) {
    const unsure = document.querySelector('[data-area-unsure]');
    const specificAreas = [...document.querySelectorAll('input[name="area"]:not([data-area-unsure])')];
    if (event.target === unsure && unsure.checked) specificAreas.forEach((input) => { input.checked = false; });
    if (event.target !== unsure && event.target.checked) unsure.checked = false;
  }
  const areaCount = document.querySelectorAll('input[name="area"]:checked').length;
  document.querySelector('[data-brief-complete]').textContent = areaCount ? 'Ready to continue' : 'Tell us what you know';
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
  document.querySelector('[data-directory-photo-count]').textContent = `${count} photo${count === 1 ? '' : 's'}`;
  document.querySelector('[data-continue-photos]').textContent = count ? 'Review my yard brief' : 'Continue without photos';
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
  const invalidEmail = !/^\S+@\S+\.\S+$/.test(email.value.trim());
  email.setAttribute('aria-invalid', String(invalidEmail));
  confirm.setAttribute('aria-invalid', String(!confirm.checked));
  document.querySelector('[data-error-for="provider-email"]').textContent = invalidEmail ? 'Enter a valid business email.' : '';
  if (invalidEmail || !confirm.checked) {
    error.hidden = false;
    document.querySelector('[data-invite-error-copy]').textContent = invalidEmail
      ? 'Enter a valid business email. Nothing was sent.'
      : 'Confirm the limited invitation. Nothing was sent.';
    (invalidEmail ? email : confirm).focus();
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
  const button = document.querySelector('[data-revoke-invite]');
  if (!button.dataset.confirming) {
    button.dataset.confirming = 'true';
    button.textContent = 'Confirm revoke invitation';
    document.querySelector('[data-connection-result]').textContent = 'Confirm to prevent this recipient from opening or responding to the invitation.';
    announce('Confirm revocation of the provider invitation.');
    return;
  }
  document.querySelector('[data-connection-status]').textContent = 'Invitation revoked';
  document.querySelector('[data-connection-result]').textContent = 'Future invitation access was revoked in this design. No yard details were shared.';
  document.querySelector('[data-preview-provider]').disabled = true;
  button.disabled = true;
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
  const form = event.currentTarget;
  const confirm = form.elements['approve-confirm'];
  const selected = form.querySelectorAll('input[name="approve-item"]:checked').length;
  const error = document.querySelector('[data-access-error]');
  const errorCopy = document.querySelector('[data-access-error-copy]');
  if (!selected || !confirm.checked) {
    error.hidden = false;
    errorCopy.textContent = !selected ? 'Choose at least one item to share. Nothing has been shared yet.' : 'Confirm this provider-specific disclosure. Nothing has been shared yet.';
    (!selected ? form.querySelector('input[name="approve-item"]') : confirm).focus();
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

function filterProviders() {
  const care = document.querySelector('[data-care-filter]').value;
  const method = document.querySelector('[data-method-filter]').value;
  let visible = 0;
  document.querySelectorAll('[data-provider-card]').forEach((card) => {
    const matchesCare = card.dataset.care.split(' ').includes(care);
    const matchesMethod = method === 'any' || card.dataset.method.split(' ').includes(method);
    card.hidden = !(matchesCare && matchesMethod);
    if (!card.hidden) visible += 1;
    if (card.hidden) card.querySelector('input').checked = false;
  });
  const words = ['No', 'One', 'Two', 'Three'];
  document.querySelector('[data-provider-result-count]').textContent = words[visible] || String(visible);
  document.querySelector('[data-no-provider-results]').hidden = visible !== 0;
  updateDirectorySelection();
  announce(`${visible} provider${visible === 1 ? '' : 's'} shown for the selected filters.`);
}

document.querySelector('[data-care-filter]').addEventListener('change', filterProviders);
document.querySelector('[data-method-filter]').addEventListener('change', filterProviders);

providerDialog.querySelector('.dialog-content > h3').textContent = 'Why this provider may fit';
const providerDetails = {
  desert: { name: 'Desert Bloom Landscaping', logo: 'DB', heading: 'Routine and low-water yard care', area: 'Central Phoenix · Remote or on-site assessment', match: 'Its declared service area and capabilities cover all three care areas in your yard brief.', insurance: 'On file · expires March 2027' },
  copper: { name: 'Copper State Yard Co.', logo: 'CS', heading: 'Routine lawn, shrub, and cleanup care', area: 'Central and North Phoenix · On-site assessment', match: 'Its declared service area includes your coarse location and it offers the cadence you requested.', insurance: 'On file · expires January 2027' },
  mesa: { name: 'Mesa Verde Yard Care', logo: 'MY', heading: 'Native and low-water landscape care', area: 'Central Phoenix · Remote-first assessment', match: 'Its declared specialty covers the low-water landscape areas in your brief.', insurance: 'Not shown · ask the provider before deciding' },
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
  const form = event.currentTarget;
  const confirm = form.elements['directory-confirm'];
  const selectedItems = form.querySelectorAll('input[name="directory-item"]:checked').length;
  const error = document.querySelector('[data-directory-share-error]');
  const errorCopy = document.querySelector('[data-directory-share-error-copy]');
  if (!selectedItems || !confirm.checked) {
    error.hidden = false;
    errorCopy.textContent = !selectedItems ? 'Choose at least one item to share. No requests have been sent.' : 'Confirm these separate provider disclosures. No requests have been sent.';
    (!selectedItems ? form.querySelector('input[name="directory-item"]') : confirm).focus();
    announce('Confirm the separate provider disclosures. No requests were sent.');
    return;
  }
  error.hidden = true;
  showStep('assessment');
  announce(`${selectedProviders.length} separate assessment requests sent in this design. Desert Bloom responded with an assessment window.`);
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
    event.currentTarget.textContent = 'Confirm end of future provider access';
    document.querySelector('[data-relationship-result]').textContent = 'Confirm to stop future service and provider access after operational closeout. Accepted proposals and delivered service records remain available.';
    announce('Confirm ending future provider access. Historical records will remain available.');
    return;
  }
  document.querySelector('[data-relationship-result]').textContent = 'Future provider access ended in this design. Historical accepted and delivered records remain protected.';
  event.currentTarget.disabled = true;
  announce('Future provider access ended.');
});
document.querySelector('[data-change-provider]').addEventListener('click', () => showStep('directory'));
document.querySelector('[data-revoke-photos]').addEventListener('click', (event) => {
  if (!event.currentTarget.dataset.confirming) {
    event.currentTarget.dataset.confirming = 'true';
    event.currentTarget.textContent = 'Confirm photo access revocation';
    document.querySelector('[data-photo-result]').textContent = 'Confirm to prevent future access to intake photos. A proposal snapshot may retain references under the disclosed policy.';
    announce('Confirm revocation of future intake photo access.');
    return;
  }
  const item = document.querySelector('[data-photo-access]');
  item.querySelector(':scope > span').textContent = '—';
  item.querySelector('small').textContent = 'Future access revoked; proposal snapshot retention remains disclosed';
  event.currentTarget.disabled = true;
  document.querySelector('[data-photo-result]').textContent = 'Future intake photo access was revoked. Disclosed proposal-snapshot retention remains unchanged.';
  announce('Future intake photo access revoked.');
});
document.querySelector('[data-export-data]').addEventListener('click', () => {
  document.querySelector('[data-data-result]').textContent = 'Data export requested in the design. A production version would verify identity and report preparation status.';
});
document.querySelector('[data-delete-intake]').addEventListener('click', (event) => {
  if (!event.currentTarget.dataset.confirming) {
    event.currentTarget.dataset.confirming = 'true';
    event.currentTarget.textContent = 'Confirm deletion request';
    document.querySelector('[data-data-result]').textContent = 'Confirm to request deletion of intake media that is not retained with an accepted proposal or delivered service record.';
    announce('Confirm the unused intake media deletion request.');
    return;
  }
  event.currentTarget.disabled = true;
  document.querySelector('[data-data-result]').textContent = 'Unused intake-media deletion requested. Failed object deletion would remain visible for recovery.';
  announce('Unused intake media deletion requested in the working design.');
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
document.querySelector('[data-brief-complete]').textContent = document.querySelectorAll('input[name="area"]:checked').length ? 'Ready to continue' : 'Tell us what you know';
updatePhotoSummary();
