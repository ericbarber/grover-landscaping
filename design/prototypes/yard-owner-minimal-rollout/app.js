const personas = {
  owner: {
    name: 'Yard Owner', identity: 'Jamie — Property Owner', shortName: 'Jamie', role: 'Yard owner', identityAction: 'Account', plan: '../../review/yard-owner-minimal-rollout-plan.md',
    units: {
      u1: { option: 'U1 · Care visibility — minimum launch', label: 'Minimum launch', title: 'Care visibility', copy: 'A complete read-only answer to “What happens next?”', intro: 'Here is what is next for your yard.', nav: ['Home'], capabilities: ['Protected account and property access', 'Next confirmed visit', 'Preparation and next update', 'Empty and recovery states'] },
      u2: { option: 'U2 · Visit tracking', label: 'Functional unit 2', title: 'Visit tracking', copy: 'Add service-day progress only after provider status publishing is operational.', intro: 'Follow upcoming and customer-visible service updates.', nav: ['Home', 'Visits'], capabilities: ['Everything in U1', 'Visit chronology', 'Six explicit service-day states', 'Past/current date context'] },
      u3: { option: 'U3 · Delivered proof', label: 'Functional unit 3', title: 'Delivered proof', copy: 'Add immutable reviewed outcomes without exposing unpublished evidence.', intro: 'Follow care and review delivered results.', nav: ['Home', 'Visits', 'Proof'], capabilities: ['Everything in U2', 'Exact-visit delivered proof', 'Completed checklist and reviewed photos', 'Pending, missing, and unavailable distinctions'] },
      u4: { option: 'U4 · Questions and decisions', label: 'Functional unit 4', title: 'Questions and decisions', copy: 'Enable writes only with provider response ownership and recovery in place.', intro: 'Follow care, review proof, and respond in context.', nav: ['Home', 'Visits', 'Proof'], capabilities: ['Everything in U3', 'Visit-specific questions and replies', 'Versioned recommendation history', 'Affirmed owner decisions and receipts'] },
    },
  },
  crew: {
    name: 'Crew Lead', identity: 'Leah — Crew Lead', shortName: 'Leah', role: 'Crew lead', identityAction: 'Account', plan: '../../review/crew-lead-minimal-rollout-plan.md',
    units: {
      c1: { option: 'C1 · Day plan visibility — minimum launch', label: 'Minimum launch', title: 'Day plan visibility', copy: 'A reliable read-only route replaces paper and office check-ins.', intro: 'See today’s route and property context before leaving the yard.', nav: ['Home', 'Route'], capabilities: ['Verified crew membership', 'Assigned day plan and ordered stops', 'Customer-safe service/access context', 'Current sync and unavailable states'] },
      c2: { option: 'C2 · Stop execution', label: 'Functional unit 2', title: 'Stop execution', copy: 'Add progress writes only after durable offline replay and conflict recovery pass.', intro: 'Move through each assigned stop with resilient progress.', nav: ['Home', 'Route', 'Jobs', 'Job'], capabilities: ['Everything in C1', 'Start, arrive, pause, and complete', 'Durable offline progress queue', 'Replay, stale, and conflict recovery'] },
      c3: { option: 'C3 · Field proof', label: 'Functional unit 3', title: 'Field proof', copy: 'Add checklist, photos, and report handoff when evidence operations are ready.', intro: 'Complete the work and return reviewable evidence together.', nav: ['Home', 'Route', 'Jobs', 'Job'], capabilities: ['Everything in C2', 'Checklist completion', 'Offline-safe photo capture', 'Quality rejection and retry', 'Completion report handoff'] },
      c4: { option: 'C4 · Changes and recovery', label: 'Functional unit 4', title: 'Changes and recovery', copy: 'Add route requests and exceptional recovery without mutating the published plan silently.', intro: 'Execute the day and coordinate changes with the office.', nav: ['Home', 'Route', 'Jobs', 'Job'], capabilities: ['Everything in C3', 'Skip and added-service requests', 'Queued amendment replay', 'Conflict resolution', 'Manager-visible completion handoff'] },
    },
  },
};

const personaPicker = document.querySelector('#persona-picker');
const unitPicker = document.querySelector('#unit-picker');
const navIcon = { Home: '⌂', Route: '⌁', Jobs: '▤', Job: '✓', Visits: '▤', Proof: '✓' };

function navMarkup(items) {
  const active = items.includes('Route') ? 'Route' : 'Home';
  return items.map((item) => `<button type="button"${item === active ? ' class="active" aria-current="page"' : ''}><span aria-hidden="true">${navIcon[item]}</span><strong>${item}</strong></button>`).join('');
}

function unitOptions(persona, selected) {
  return Object.entries(persona.units).map(([key, unit]) => `<option value="${key}"${key === selected ? ' selected' : ''}>${unit.option}</option>`).join('');
}

function setUnit(personaKey, unitKey, announce = true) {
  const persona = personas[personaKey] ?? personas.owner;
  const fallback = Object.keys(persona.units)[0];
  const key = persona.units[unitKey] ? unitKey : fallback;
  const unit = persona.units[key];
  document.body.dataset.persona = personaKey;
  document.body.dataset.unit = key;
  personaPicker.value = personaKey;
  unitPicker.innerHTML = unitOptions(persona, key);
  document.querySelector('#owner-experience').hidden = personaKey !== 'owner';
  document.querySelector('#crew-experience').hidden = personaKey !== 'crew';
  document.querySelector('#identity-name').textContent = persona.identity;
  document.querySelector('#identity-action').textContent = persona.identityAction;
  document.querySelector('#rail-persona').textContent = persona.role;
  document.querySelector('#rail-name').textContent = persona.shortName;
  document.querySelector('#rail-role').textContent = persona.role;
  document.querySelector('#rollout-plan-link').href = persona.plan;
  document.querySelectorAll('[data-unit-label]').forEach((element) => { element.textContent = unit.label; });
  document.querySelectorAll('[data-unit-title]').forEach((element) => { element.textContent = unit.title; });
  document.querySelectorAll('[data-unit-copy]').forEach((element) => { element.textContent = unit.copy; });
  document.querySelectorAll('[data-unit-intro]').forEach((element) => { element.textContent = unit.intro; });
  const nav = navMarkup(unit.nav);
  document.querySelector('#rail-nav').innerHTML = nav;
  document.querySelector('#mobile-nav').innerHTML = nav;
  const innerNav = personaKey === 'owner' ? '#portal-tabs' : '#crew-tabs';
  document.querySelector(innerNav).innerHTML = nav;
  document.querySelectorAll('[data-capabilities]').forEach((element) => { element.innerHTML = unit.capabilities.map((capability) => `<span><b aria-hidden="true">✓</b>${capability}</span>`).join(''); });
  const hash = `#${personaKey}/${key}`;
  if (location.hash !== hash) history.replaceState(null, '', hash);
  document.title = `${persona.name} ${unit.title} · Grover rollout`;
  if (announce) document.querySelector('#announcer').textContent = `Showing ${persona.name}, ${unit.label}: ${unit.title}`;
}

function applyHash(announce = false) {
  const [personaRaw, unitRaw] = location.hash.slice(1).split('/');
  if (personas[personaRaw]) return setUnit(personaRaw, unitRaw, announce);
  setUnit('owner', personaRaw || 'u1', announce);
}

personaPicker.addEventListener('change', () => setUnit(personaPicker.value, personaPicker.value === 'crew' ? 'c1' : 'u1'));
unitPicker.addEventListener('change', () => setUnit(personaPicker.value, unitPicker.value));
window.addEventListener('hashchange', () => applyHash());
applyHash();
