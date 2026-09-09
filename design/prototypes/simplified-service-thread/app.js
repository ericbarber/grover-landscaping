const stages = [
  { id: 'need', label: 'Need', detail: 'Service requested' },
  { id: 'decision', label: 'Decision', detail: 'Exact scope' },
  { id: 'release', label: 'Plan', detail: 'Released work' },
  { id: 'field', label: 'Field work', detail: 'Service and recovery' },
  { id: 'proof', label: 'Proof', detail: 'Reviewed outcome' },
];

const momentIndex = { decision: 1, release: 2, field: 3, proof: 4 };

const personas = {
  owner: {
    name: 'Yard Owner', identity: 'Jamie R.', initials: 'JR', family: 'CUSTOMER SERVICE', collection: 'Services',
    nav: [['home', 'Home', '⌂'], ['services', 'Services', '◇'], ['account', 'Account', '○']], active: 'services',
    boundary: 'Plan versions, route capacity, crew identity, draft evidence, provider notes, and internal recovery actions remain outside the customer view.',
    why: 'The owner needs the current service outcome and its next responsible person—not separate approval, schedule, proof, and support products.',
    timeline: {
      decision: [['Sep 5', 'Routine care requested', 'Mesa Court · front and back yard'], ['Sep 6', 'Recommendation version 2 ready', 'Exact scope and consequence available for review']],
      release: [['Sep 6', 'Version 2 accepted', 'Acceptance did not silently schedule work'], ['Sep 7', 'Service preparation started', 'Grover Yard Care owns the next update']],
      field: [['Sep 8 · 8:26', 'Care started', 'Customer-safe arrival update'], ['Now', 'Routine care underway', 'No owner action is required']],
      proof: [['Sep 8 · 8:26', 'Care started', 'Routine service at Mesa Court'], ['Sep 8 · 9:18', 'Care completed', 'Provider review followed'], ['Sep 8 · 9:34', 'Proof delivered', 'Six tasks and three reviewed photos']],
    },
    moments: {
      decision: {
        stage: 'Decision', status: 'Your decision', title: 'Review the exact care plan',
        copy: 'The scope, price, version, and consequence stay together before anything is accepted.',
        owner: 'You', update: 'Nothing is scheduled until you respond.',
        facts: ['Routine care · Version 2', '$145 exact total', 'Acceptance does not schedule work'],
        essentials: [['Property', 'Mesa Court'], ['Timing', 'Requested for September 8'], ['Provider', 'Grover Yard Care']],
        action: 'Review recommendation', choiceLabel: 'Response to version 2', options: ['Accept this exact scope', 'Request a revision', 'Ask a question before deciding'], confirm: 'Preview response',
      },
      release: {
        stage: 'Plan', status: 'Provider preparing', title: 'Your care is being scheduled',
        copy: 'The accepted service stays in one thread while the provider prepares and releases the visit.',
        owner: 'Company Manager', update: 'You will see the confirmed window here.',
        facts: ['Version 2 accepted', 'No visit window published yet', 'No action required'],
        essentials: [['Accepted scope', 'Routine yard care'], ['Property access', 'Side gate instruction current'], ['Expected update', 'Confirmed service window']],
        action: 'Review accepted service',
      },
      field: {
        stage: 'Field work', status: 'In progress', title: 'Today’s care is underway',
        copy: 'Only the customer-safe service state appears; internal route and recovery detail stays with the provider.',
        owner: 'Grover Yard Care', update: 'Reviewed completion proof comes next.',
        facts: ['Arrived at 8:26 AM', 'Routine care in progress', 'No owner action required'],
        essentials: [['Visit window', '8:00–10:00 AM'], ['Preparation', 'Complete'], ['Next update', 'Delivered proof']],
        action: 'Review current service',
      },
      proof: {
        stage: 'Proof', status: 'Delivered', title: 'Your September 8 care is ready',
        copy: 'The reviewed completion record closes the same service thread that began with your decision.',
        owner: 'You', update: 'Review the outcome when convenient.',
        facts: ['6 tasks completed', '3 provider-reviewed photos', 'Completed at 9:18 AM'],
        essentials: [['Service', 'Routine yard care'], ['Delivered', 'September 8 · 9:34 AM'], ['Provider', 'Grover Yard Care']],
        action: 'Review delivered care', choiceLabel: 'Is the outcome understandable?', options: ['Yes, the completed care is clear', 'Ask about this exact visit'], confirm: 'Preview response',
      },
    },
  },
  property: {
    name: 'Property Manager', identity: 'Morgan L.', initials: 'ML', family: 'PORTFOLIO SERVICE', collection: 'Properties',
    nav: [['overview', 'Overview', '⌂'], ['properties', 'Properties', '▦'], ['account', 'Account', '○']], active: 'properties',
    boundary: 'Provider route versions, crew identity, internal recovery notes, unrelated properties, draft evidence, and company administration remain outside this portfolio view.',
    why: 'A property manager needs an exception-first portfolio entry, then one complete property service story—not separate property, approval, proof, and provider-operation products.',
    timeline: {
      decision: [['Sep 5', 'Routine care requested', 'Mesa Court · authorized property'], ['Sep 6', 'Recommendation version 2 ready', 'Exact property, scope, and decision consequence together']],
      release: [['Sep 6', 'Version 2 accepted', 'Decision receipt retained'], ['Sep 7', 'Service confirmed', 'September 8 · 8:00–10:00 AM']],
      field: [['Sep 8 · 8:26', 'Care started', 'Customer-safe portfolio update'], ['Sep 8 · 8:41', 'Access review underway', 'Provider owns the next response']],
      proof: [['Sep 8 · 9:18', 'Care completed', 'Provider review followed'], ['Sep 8 · 9:34', 'Proof delivered', 'Mesa Court · six tasks and three reviewed photos']],
    },
    moments: {
      decision: {
        stage: 'Decision', status: 'Portfolio decision', title: 'Mesa Court needs one exact response',
        copy: 'The authorized property, recommendation version, scope, and consequence remain together.',
        owner: 'You', update: 'No service is scheduled until an authorized response.',
        facts: ['Mesa Court · Version 2', '$145 exact total', '11 other properties unaffected'],
        essentials: [['Portfolio', 'Desert Vista'], ['Property', 'Mesa Court'], ['Requested timing', 'September 8']],
        action: 'Review property recommendation', choiceLabel: 'Response to version 2', options: ['Accept for Mesa Court', 'Request a property-specific revision', 'Ask a question before deciding'], confirm: 'Preview portfolio response',
      },
      release: {
        stage: 'Plan', status: 'Confirmed', title: 'Mesa Court service is scheduled',
        copy: 'The accepted decision, property access, and customer-visible timing stay in one property thread.',
        owner: 'Grover Yard Care', update: 'The provider owns service delivery and the next update.',
        facts: ['September 8 · 8:00–10:00 AM', 'Property access current', 'No portfolio action required'],
        essentials: [['Accepted scope', 'Routine yard care'], ['Decision', 'Version 2 accepted'], ['Portfolio impact', 'No other property changed']],
        action: 'Review confirmed service',
      },
      field: {
        stage: 'Field work', status: 'Provider reviewing', title: 'Mesa Court access is being resolved',
        copy: 'The portfolio sees the customer-safe consequence and responsible provider without internal route or crew detail.',
        owner: 'Grover Yard Care', update: 'The current arrival window remains in place.',
        facts: ['Care began at 8:26 AM', 'Access review in progress', 'No portfolio decision requested'],
        essentials: [['Property', 'Mesa Court'], ['Service state', 'In progress'], ['Next update', 'Resolution or delivered proof']],
        action: 'Review property service',
      },
      proof: {
        stage: 'Proof', status: 'Delivered', title: 'Mesa Court care is ready to review',
        copy: 'The property decision, service chronology, and reviewed proof close one portfolio thread.',
        owner: 'You', update: 'Review the outcome or continue to another exception.',
        facts: ['6 tasks completed', '3 provider-reviewed photos', 'No other property affected'],
        essentials: [['Property', 'Mesa Court'], ['Delivered', 'September 8 · 9:34 AM'], ['Portfolio', 'Desert Vista']],
        action: 'Review property outcome', choiceLabel: 'Portfolio review', options: ['Outcome is clear for Mesa Court', 'Ask about this exact service'], confirm: 'Preview portfolio response',
      },
    },
  },
  company: {
    name: 'Company Owner', identity: 'Avery K.', initials: 'AK', family: 'BUSINESS READINESS', collection: 'Operations',
    nav: [['home', 'Home', '⌂'], ['operations', 'Operations', '▦'], ['customers', 'Customers', '◇'], ['team', 'Team', '◎']], active: 'operations',
    boundary: 'Customer-private conversation, route editing, low-level field controls, draft evidence, platform support, and unsupported billing remain outside this owner view.',
    why: 'The Company Owner enters the exact service only when readiness or business consequence warrants attention. Daily coordination remains with the manager inside the same record.',
    timeline: {
      decision: [['Sep 5', 'Mesa Court relationship authorized', 'Customer and property readiness confirmed'], ['Sep 6', 'Manager owns service decision', 'No owner-level blocker remains']],
      release: [['Sep 6', 'Customer decision completed', 'Exact operating work is ready'], ['Sep 7', 'Tomorrow is operationally covered', 'Manager and Crew Lead ownership confirmed']],
      field: [['Sep 8 · 8:26', 'Mesa Court service began', 'Routine operating state'], ['Sep 8 · 8:41', 'One service risk is owned', 'Manager response in progress; no owner action']],
      proof: [['Sep 8 · 9:18', 'Field work completed', 'Manager review followed'], ['Sep 8 · 9:34', 'Customer outcome delivered', 'No owner-level exception remains']],
    },
    moments: {
      decision: {
        stage: 'Decision', status: 'Ready', title: 'Mesa Court has an accountable manager',
        copy: 'Relationship readiness and the responsible operator are visible without exposing the customer conversation.',
        owner: 'Company Manager', update: 'The manager owns the exact service decision.',
        facts: ['Customer relationship active', 'Property access authorized', 'Manager Riley assigned'],
        essentials: [['Customer account', 'Mesa Court relationship'], ['Business blocker', 'None'], ['Operating owner', 'Company Manager']],
        action: 'Review business readiness',
      },
      release: {
        stage: 'Plan', status: 'Operationally covered', title: 'Tomorrow’s Mesa Court service is staffed',
        copy: 'The owner sees business readiness and accountable roles without receiving plan-editing controls.',
        owner: 'Company Manager', update: 'Daily coordination remains with operations.',
        facts: ['Customer commitment covered', 'Crew Lead active', 'No owner decision required'],
        essentials: [['Service date', 'September 8'], ['Responsible manager', 'Riley T.'], ['Field lead', 'Leah M.']],
        action: 'Review operating coverage',
      },
      field: {
        stage: 'Field work', status: 'Owned service risk', title: 'Mesa Court has one managed exception',
        copy: 'Only the business consequence and accountable operator reach the owner; field and plan detail stay with operations.',
        owner: 'Company Manager', update: 'The arrival promise remains achievable.',
        facts: ['One customer commitment affected', 'Manager response in progress', 'No owner escalation needed'],
        essentials: [['Customer impact', 'Window still achievable'], ['Operating owner', 'Riley T.'], ['Business risk', 'Contained']],
        action: 'Review exception ownership',
      },
      proof: {
        stage: 'Proof', status: 'Customer outcome delivered', title: 'Mesa Court closed without an owner-level issue',
        copy: 'The owner receives business confidence while detailed proof remains with the authorized customer and manager.',
        owner: 'Company Manager', update: 'No owner action is required.',
        facts: ['Service completed', 'Customer outcome delivered', 'No open escalation'],
        essentials: [['Customer commitment', 'Complete'], ['Operating result', 'Delivered'], ['Owner queue', 'Clear']],
        action: 'Review business outcome',
      },
    },
  },
  manager: {
    name: 'Company Manager', identity: 'Riley T.', initials: 'RT', family: 'PROVIDER OFFICE', collection: 'Work',
    nav: [['today', 'Today', '⌂'], ['work', 'Work', '▦'], ['customers', 'Customers', '◇'], ['team', 'Team', '◎']], active: 'work',
    boundary: 'Owner-only company setup, platform support, unsupported billing, unrelated customer history, and low-level device controls remain outside this thread.',
    why: 'The manager coordinates one service outcome. Customer decision, exact plan, field request, proof review, and recovery should not require separate feature silos.',
    timeline: {
      decision: [['Sep 5', 'Customer requested routine care', 'Mesa Court · access context current'], ['Sep 6', 'Recommendation version 2 sent', 'Waiting for the exact customer response']],
      release: [['Sep 6', 'Customer accepted version 2', 'Scope and price retained'], ['Now', 'Service is ready to release', 'Plan 8, crew, access, and evidence requirements are together']],
      field: [['Sep 7', 'Plan 8 published', 'North route · Crew Lead Leah'], ['Sep 8 · 8:41', 'Field access request received', 'Published plan remains unchanged until review']],
      proof: [['Sep 8 · 9:18', 'Crew Lead submitted completion', 'Checklist and photos retained'], ['Now', 'Customer-safe proof ready for review', 'Draft evidence remains provider-private']],
    },
    moments: {
      decision: {
        stage: 'Decision', status: 'Waiting for customer', title: 'Mesa Court has one open decision',
        copy: 'The current recommendation and customer response state remain attached to the service.',
        owner: 'Yard Owner', update: 'Planning begins after the exact response.',
        facts: ['Recommendation · Version 2', '$145 exact total', 'No response yet'],
        essentials: [['Customer', 'Jamie R.'], ['Property', 'Mesa Court'], ['Expires', 'September 9']],
        action: 'Review customer state',
      },
      release: {
        stage: 'Plan', status: 'Ready to release', title: 'Release Mesa Court to the field',
        copy: 'Accepted scope, Plan 8, crew capacity, property access, and required evidence are reviewed in one place.',
        owner: 'You', update: 'Crew Lead receives only the released work.',
        facts: ['Plan 8 · North route', 'Crew Lead Leah assigned', 'Arrival 8:00–10:00 AM'],
        essentials: [['Accepted scope', 'Version 2 · $145'], ['Access', 'Side gate instruction current'], ['Evidence', 'Checklist + 3 photos']],
        action: 'Review service release', choiceType: 'checkbox', choiceLabel: 'Release check', options: ['Accepted scope and property confirmed', 'Crew capacity and arrival window confirmed', 'Access, safety, and evidence requirements confirmed'], confirm: 'Preview service release',
      },
      field: {
        stage: 'Field work', status: 'Review requested', title: 'The Crew Lead reported an access change',
        copy: 'The request, current Plan 8, customer impact, and recovery choices stay inside the affected service thread.',
        owner: 'You', update: 'The published plan remains unchanged until review.',
        facts: ['Side gate access unavailable', 'Crew remains on current work', 'Plan 8 is still published'],
        essentials: [['Requested by', 'Crew Lead Leah'], ['Customer impact', 'Arrival window still achievable'], ['Evidence state', 'No work lost']],
        action: 'Review field request', choiceLabel: 'Manager response', options: ['Publish Plan 9 with front access', 'Keep Plan 8 and ask an access question', 'Hold this service and notify the customer'], confirm: 'Preview reviewed response',
      },
      proof: {
        stage: 'Proof', status: 'Provider review', title: 'Completion evidence is ready to publish',
        copy: 'Draft field evidence and the customer-safe outcome remain connected but visibly different.',
        owner: 'You', update: 'The customer sees proof only after review.',
        facts: ['6 checklist items complete', '3 photos submitted', 'Completed at 9:18 AM'],
        essentials: [['Plan', 'Plan 9 · exact released work'], ['Submitted by', 'Crew Lead Leah'], ['Customer view', 'Not delivered yet']],
        action: 'Review and publish proof', choiceType: 'checkbox', choiceLabel: 'Publication check', options: ['Checklist matches released scope', 'Photos are customer-safe', 'Completion time and outcome are correct'], confirm: 'Preview proof delivery',
      },
    },
  },
  lead: {
    name: 'Crew Lead', identity: 'Leah M.', initials: 'LM', family: 'FIELD SERVICE', collection: 'Today',
    nav: [['today', 'Today', '⌂'], ['saved', 'Saved', '↻'], ['account', 'Account', '○']], active: 'today',
    boundary: 'Customer pricing and history, company setup, plan publication, customer messaging, proof delivery, and unrelated routes remain outside the field view.',
    why: 'The Crew Lead needs one stop context containing released scope, access, safety, progress, evidence, and recovery—not separate job, route, report, and exception products.',
    timeline: {
      decision: [['Sep 6', 'Customer decision completed', 'Pricing and private customer conversation are not shown'], ['Waiting', 'Work is not released', 'No field action available']],
      release: [['Sep 7', 'Plan 8 released', 'North route · first stop'], ['Now', 'Mesa Court is ready', 'Scope, access, safety, and evidence requirements available']],
      field: [['Sep 8 · 8:26', 'Stop started', 'Routine care · Plan 8'], ['Now', 'Access changed', 'Original plan and device-held progress remain unchanged']],
      proof: [['Sep 8 · 9:18', 'Field work complete', 'Six tasks and three photos saved'], ['Now', 'Completion ready to submit', 'Manager owns customer-safe review and delivery']],
    },
    moments: {
      decision: {
        stage: 'Decision', status: 'Not released', title: 'This service is not field work yet',
        copy: 'The customer and office can complete their decision without exposing private context or premature work controls.',
        owner: 'Company Manager', update: 'The stop appears after an exact release.',
        facts: ['No released stop', 'No property detail loaded', 'No action available'],
        essentials: [['Route', 'North route'], ['Field state', 'Waiting'], ['Next update', 'Released service']],
        action: 'Review field status',
      },
      release: {
        stage: 'Plan', status: 'Ready', title: 'Mesa Court is your first stop',
        copy: 'The exact released scope, property access, safety, and evidence requirements lead the field view.',
        owner: 'You', update: 'Confirm readiness before starting the stop.',
        facts: ['Plan 8 · Stop 1 of 4', 'Routine care · 55 minutes', 'Side gate instruction current'],
        essentials: [['Arrival', '8:00–10:00 AM'], ['Safety', 'Pets remain inside'], ['Evidence', 'Checklist + 3 photos']],
        action: 'Review stop readiness', choiceType: 'checkbox', choiceLabel: 'Field readiness', options: ['Property and released scope confirmed', 'Access and safety notes reviewed', 'Evidence requirements understood'], confirm: 'Preview stop start',
      },
      field: {
        stage: 'Field work', status: 'Needs office review', title: 'The side gate is unavailable',
        copy: 'Create a request inside this stop. Plan 8 and saved progress remain unchanged until the manager responds.',
        owner: 'You', update: 'Send the exact field context to the manager.',
        facts: ['Plan 8 · Stop 1', 'No progress lost', 'Front access may be available'],
        essentials: [['Current work', 'Saved on this device'], ['Customer contact', 'Office only'], ['Plan authority', 'Company Manager']],
        action: 'Send field request', choiceLabel: 'Requested recovery', options: ['Request front-access approval', 'Ask the office to contact the customer', 'Hold the stop without changing Plan 8'], confirm: 'Preview field request',
      },
      proof: {
        stage: 'Proof', status: 'Ready to submit', title: 'Record the completed field outcome',
        copy: 'The field record stays attached to the same stop while customer delivery remains with the manager.',
        owner: 'You', update: 'Manager review follows confirmed submission.',
        facts: ['6 tasks complete', '3 photos saved', 'Originals remain on this device'],
        essentials: [['Service', 'Routine care · Plan 9'], ['Completed', '9:18 AM'], ['Next owner', 'Company Manager']],
        action: 'Review completion submission', choiceType: 'checkbox', choiceLabel: 'Completion check', options: ['Released scope is complete', 'Required photos are attached', 'Device-held originals remain until confirmation'], confirm: 'Preview completion submission',
      },
    },
  },
};

const handoffs = {
  'owner/decision': ['manager', 'release'],
  'owner/release': ['manager', 'release'],
  'owner/field': ['manager', 'field'],
  'owner/proof': ['manager', 'proof'],
  'property/decision': ['manager', 'release'],
  'property/release': ['manager', 'release'],
  'property/field': ['manager', 'field'],
  'property/proof': ['manager', 'proof'],
  'company/decision': ['manager', 'decision'],
  'company/release': ['manager', 'release'],
  'company/field': ['manager', 'field'],
  'company/proof': ['manager', 'proof'],
  'manager/decision': ['owner', 'decision'],
  'manager/release': ['lead', 'release'],
  'manager/field': ['lead', 'field'],
  'manager/proof': ['owner', 'proof'],
  'lead/decision': ['manager', 'decision'],
  'lead/release': ['lead', 'field'],
  'lead/field': ['manager', 'field'],
  'lead/proof': ['manager', 'proof'],
};

const personaPicker = document.querySelector('#persona-picker');
const momentPicker = document.querySelector('#moment-picker');
const actionDialog = document.querySelector('#action-dialog');
const completionDialog = document.querySelector('#completion-dialog');
const workspace = document.querySelector('#workspace');
let state = { persona: 'owner', moment: 'decision' };
let lastTrigger = null;

function navMarkup(persona) {
  return persona.nav.map(([id, label, icon]) => `<button class="nav-button" type="button" data-nav="${id}" ${id === persona.active ? 'aria-current="page"' : ''}><span class="nav-icon" aria-hidden="true">${icon}</span><span>${label}</span></button>`).join('');
}

function render(announce = true) {
  const persona = personas[state.persona];
  const focus = persona.moments[state.moment];
  const current = momentIndex[state.moment];
  document.body.dataset.persona = state.persona;
  document.body.dataset.moment = state.moment;
  personaPicker.value = state.persona;
  momentPicker.value = state.moment;
  document.querySelector('#family-label').textContent = persona.family;
  document.querySelector('#role-label').textContent = persona.name;
  document.querySelector('#identity-label').textContent = persona.identity;
  document.querySelector('#desktop-initials').textContent = persona.initials;
  document.querySelector('#mobile-initials').textContent = persona.initials;
  document.querySelector('#collection-label').textContent = persona.collection;
  document.querySelector('#thread-summary').textContent = `${persona.name} sees one authorized perspective on the same service outcome.`;
  document.querySelector('#next-owner').textContent = focus.owner;
  document.querySelector('#next-update').textContent = focus.update;
  document.querySelector('#focus-stage').textContent = focus.stage;
  document.querySelector('#focus-status').textContent = focus.status;
  document.querySelector('#focus-title').textContent = focus.title;
  document.querySelector('#focus-copy').textContent = focus.copy;
  document.querySelector('#fact-list').innerHTML = focus.facts.map((fact) => `<span>${fact}</span>`).join('');
  document.querySelector('#primary-action').textContent = focus.action;
  document.querySelector('#explanation').textContent = persona.why;
  document.querySelector('#explain-action').setAttribute('aria-expanded', 'false');
  document.querySelector('#explanation').hidden = true;
  document.querySelector('#essential-list').innerHTML = focus.essentials.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
  document.querySelector('#timeline-list').innerHTML = persona.timeline[state.moment].map(([time, title, copy]) => `<li><time>${time}</time><div><strong>${title}</strong><p>${copy}</p></div></li>`).join('');
  document.querySelector('#boundary-copy').textContent = persona.boundary;
  document.querySelector('#stage-list').innerHTML = stages.map((stage, index) => `<li class="${index < current ? 'done' : ''} ${index === current ? 'current' : ''}" ${index === current ? 'aria-current="step"' : ''}><small>0${index + 1}</small><strong>${stage.label}</strong><span class="sr-only">${stage.detail}</span></li>`).join('');
  document.querySelector('#desktop-nav').innerHTML = navMarkup(persona);
  document.querySelector('#mobile-nav').innerHTML = navMarkup(persona);
  document.title = `${persona.name} · ${focus.stage} · Grover service thread`;
  history.replaceState(null, '', `#${state.persona}/${state.moment}`);
  bindNavigation();
  if (announce) document.querySelector('#announcer').textContent = `${persona.name}, ${focus.stage}: ${focus.title}`;
}

function bindNavigation() {
  document.querySelectorAll('[data-nav]').forEach((button) => button.addEventListener('click', () => {
    const persona = personas[state.persona];
    const requested = button.dataset.nav;
    if (requested === persona.active) {
      workspace.focus({ preventScroll: true });
      document.querySelector('#announcer').textContent = `${persona.name} service thread`;
      return;
    }
    document.querySelector('#announcer').textContent = `${button.textContent.trim()} remains outside this service-thread prototype slice`;
  }));
}

function openAction() {
  const persona = personas[state.persona];
  const task = persona.moments[state.moment];
  lastTrigger = document.querySelector('#primary-action');
  document.querySelector('#dialog-title').textContent = task.action;
  document.querySelector('#dialog-copy').textContent = task.copy;
  document.querySelector('#dialog-context').innerHTML = task.facts.map((fact) => `<span>${fact}</span>`).join('');
  const fieldset = document.querySelector('#choice-fieldset');
  const list = document.querySelector('#choice-list');
  const confirm = document.querySelector('#confirm-action');
  if (task.options?.length) {
    const type = task.choiceType ?? 'radio';
    fieldset.hidden = false;
    document.querySelector('#choice-label').textContent = task.choiceLabel;
    list.innerHTML = task.options.map((option, index) => `<label><input type="${type}" name="thread-choice" value="${index}"><span>${option}</span></label>`).join('');
    confirm.disabled = true;
    confirm.textContent = task.confirm;
    list.querySelectorAll('input').forEach((input) => input.addEventListener('change', () => {
      const selected = list.querySelectorAll('input:checked').length;
      confirm.disabled = type === 'checkbox' ? selected < task.options.length : selected === 0;
    }));
  } else {
    fieldset.hidden = true;
    list.innerHTML = '';
    confirm.disabled = false;
    confirm.textContent = 'Return to service';
  }
  actionDialog.showModal();
  document.querySelector('#close-dialog').focus();
}

personaPicker.addEventListener('change', () => {
  state.persona = personaPicker.value;
  render();
  workspace.focus({ preventScroll: true });
});

momentPicker.addEventListener('change', () => {
  state.moment = momentPicker.value;
  render();
  workspace.focus({ preventScroll: true });
});

document.querySelector('#follow-handoff').addEventListener('click', () => {
  const [persona, moment] = handoffs[`${state.persona}/${state.moment}`];
  state = { persona, moment };
  render();
  workspace.focus({ preventScroll: true });
});

document.querySelector('#primary-action').addEventListener('click', openAction);
document.querySelector('#explain-action').addEventListener('click', (event) => {
  const panel = document.querySelector('#explanation');
  panel.hidden = !panel.hidden;
  event.currentTarget.setAttribute('aria-expanded', String(!panel.hidden));
});
actionDialog.addEventListener('close', () => {
  if (actionDialog.returnValue === 'default') {
    completionDialog.showModal();
    document.querySelector('#return-action').focus();
    return;
  }
  lastTrigger?.focus({ preventScroll: true });
});
document.querySelector('#return-action').addEventListener('click', () => {
  completionDialog.close();
  lastTrigger?.focus({ preventScroll: true });
});

function restoreFromHash() {
  const [personaKey, momentKey] = location.hash.slice(1).split('/');
  state = {
    persona: personas[personaKey] ? personaKey : 'owner',
    moment: Object.hasOwn(momentIndex, momentKey) ? momentKey : 'decision',
  };
  render(false);
}

window.addEventListener('hashchange', restoreFromHash);
restoreFromHash();
