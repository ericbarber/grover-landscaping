const ownerStates = {
  loading: { label: 'Loading', tone: 'neutral', title: 'Loading your yard details…', copy: 'We’re confirming your current property access and service information.', actions: [] },
  empty: { label: 'No visits yet', tone: 'positive', title: 'Your yard is connected.', copy: 'There are no confirmed service visits yet. Your provider will add a visit after you agree on timing.', actions: ['Back to Home'] },
  'access-ended': { label: 'Access ended', tone: 'warning', title: 'This yard is no longer available to this account.', copy: 'Your access may have ended or moved to another account. No property or service details are shown.', actions: ['Back to Home', 'Review account access'] },
  inconsistent: { label: 'Details need review', tone: 'warning', title: 'We found a problem with this yard’s connection.', copy: 'Customer information remains protected while the account and property connection is checked.', actions: ['Try again', 'Back to Home'] },
  unavailable: { label: 'Temporarily unavailable', tone: 'warning', title: 'Your visit details are temporarily unavailable.', copy: 'Customer information remains protected. Try loading the portal again or return Home.', actions: ['Try again', 'Back to Home'] },
};

const routeStates = {
  synced: { label: 'Synced', tone: 'positive', context: 'Today’s route', date: 'Thursday, September 3, 2026', message: 'All current route changes are confirmed by the server.', action: 'Start stop', disabled: false },
  syncing: { label: 'Syncing', tone: 'neutral', context: 'Today’s route', date: 'Thursday, September 3, 2026', message: 'Sending your latest changes. You can keep reviewing this stop.', action: 'Start stop', disabled: false },
  offline: { label: 'Saved on device', tone: 'neutral', context: 'Today’s route', date: 'Thursday, September 3, 2026', message: 'You are offline. Current progress is safe on this device and will upload when the connection returns.', action: 'Start stop offline', disabled: false },
  attention: { label: 'Needs attention', tone: 'warning', context: 'Today’s route', date: 'Thursday, September 3, 2026', message: 'One route update could not be reconciled. Review it before starting the affected stop.', action: 'Review route change', disabled: false },
  past: { label: 'Read only', tone: 'neutral', context: 'Past route', date: 'Thursday, June 18, 2026', message: 'This route is from June 18. Progress and stop actions are read only.', action: 'Past stop', disabled: true },
};

const stateOptions = {
  owner: [['loading', 'Loading'], ['empty', 'Valid empty'], ['access-ended', 'Access ended'], ['inconsistent', 'Inconsistent access'], ['unavailable', 'Unavailable']],
  crew: [['synced', 'Current · synced'], ['syncing', 'Current · syncing'], ['offline', 'Current · saved on device'], ['attention', 'Current · needs attention'], ['past', 'Past route · read only']],
};

const audience = document.querySelector('#audience');
const state = document.querySelector('#state');
const announcer = document.querySelector('#announcer');

function navMarkup(kind) {
  const items = kind === 'owner' ? [['⌂', 'Home'], ['⌑', 'My yard']] : [['⌂', 'Home'], ['⌁', 'Route'], ['▤', 'Jobs'], ['✓', 'Job']];
  const active = kind === 'owner' ? 'My yard' : 'Route';
  return items.map(([icon, label]) => `<button type="button"${label === active ? ' class="active" aria-current="page"' : ''}><span aria-hidden="true">${icon}</span><strong>${label}</strong></button>`).join('');
}

function renderOwner(key) {
  const value = ownerStates[key] ?? ownerStates.unavailable;
  document.querySelector('#owner-state').innerHTML = `<article class="recovery-state ${value.tone}" role="status"><span class="state-icon" aria-hidden="true">${key === 'loading' ? '···' : key === 'empty' ? '✓' : '!'}</span><div><span class="state-label">${value.label}</span><h2>${value.title}</h2><p>${value.copy}</p><div class="state-actions">${value.actions.map((label, index) => `<button type="button" class="button ${index === 0 && label === 'Try again' ? 'button-primary' : 'button-secondary'}">${label}</button>`).join('')}</div></div></article>`;
}

function renderCrew(key) {
  const value = routeStates[key] ?? routeStates.synced;
  const pill = document.querySelector('#route-state-pill');
  pill.textContent = value.label; pill.dataset.tone = value.tone;
  document.querySelector('#route-context').textContent = value.context;
  document.querySelector('#route-date').textContent = value.date;
  document.querySelector('#route-message').innerHTML = `<div class="route-message ${value.tone}" role="status"><strong>${value.label}</strong><span>${value.message}</span></div>`;
  const action = document.querySelector('#route-action');
  action.textContent = value.action; action.disabled = value.disabled;
  document.querySelector('#stop-label').textContent = key === 'past' ? 'First stop · historical' : 'Current stop';
}

function setStateOptions(kind, selected) {
  state.innerHTML = stateOptions[kind].map(([value, label]) => `<option value="${value}"${value === selected ? ' selected' : ''}>${label}</option>`).join('');
}

function setView(kind, selected, announce = true) {
  const isOwner = kind === 'owner';
  document.body.dataset.audience = kind;
  document.body.dataset.state = selected;
  document.querySelector('#owner-view').hidden = !isOwner;
  document.querySelector('#crew-view').hidden = isOwner;
  const person = isOwner ? { name: 'Jamie', full: 'Jamie — Property Owner', role: 'Yard owner', page: 'My yard', summary: 'Property and service details' } : { name: 'Leah', full: 'Leah — Crew Lead', role: 'Crew lead', page: 'Route', summary: 'Today’s stops and progress' };
  document.querySelector('#account-name').textContent = person.full;
  document.querySelector('#rail-name').textContent = person.name;
  document.querySelector('#rail-role').textContent = person.role;
  document.querySelector('#rail-persona').textContent = person.role;
  document.querySelector('#page-kicker').textContent = person.role;
  document.querySelector('#page-title').textContent = person.page;
  document.querySelector('#page-summary').textContent = person.summary;
  document.querySelector('#mobile-persona').textContent = `${person.name} · ${person.role}`;
  document.querySelector('#rail-nav').innerHTML = navMarkup(kind);
  document.querySelector('#mobile-nav').innerHTML = navMarkup(kind);
  if (isOwner) renderOwner(selected); else renderCrew(selected);
  const hash = `#${kind}/${selected}`;
  if (location.hash !== hash) history.replaceState(null, '', hash);
  if (announce) announcer.textContent = `Showing ${person.page}: ${state.selectedOptions[0].textContent}`;
}

function applyHash(announce = false) {
  const [kindRaw, stateRaw] = location.hash.slice(1).split('/');
  const kind = kindRaw === 'crew' ? 'crew' : 'owner';
  const fallback = kind === 'owner' ? 'unavailable' : 'synced';
  const selected = stateOptions[kind].some(([value]) => value === stateRaw) ? stateRaw : fallback;
  audience.value = kind; setStateOptions(kind, selected); setView(kind, selected, announce);
}

audience.addEventListener('change', () => { const initial = audience.value === 'owner' ? 'unavailable' : 'synced'; setStateOptions(audience.value, initial); setView(audience.value, initial); });
state.addEventListener('change', () => setView(audience.value, state.value));
window.addEventListener('hashchange', () => applyHash());
applyHash();
