const units = {
  u1: { label: 'Minimum launch', title: 'Care visibility', copy: 'A complete read-only answer to “What happens next?”', intro: 'Here is what is next for your yard.', nav: ['Home'], capabilities: ['Protected account and property access', 'Next confirmed visit', 'Preparation and next update', 'Empty and recovery states'] },
  u2: { label: 'Functional unit 2', title: 'Visit tracking', copy: 'Add service-day progress only after provider status publishing is operational.', intro: 'Follow upcoming and customer-visible service updates.', nav: ['Home', 'Visits'], capabilities: ['Everything in U1', 'Visit chronology', 'Six explicit service-day states', 'Past/current date context'] },
  u3: { label: 'Functional unit 3', title: 'Delivered proof', copy: 'Add immutable reviewed outcomes without exposing unpublished evidence.', intro: 'Follow care and review delivered results.', nav: ['Home', 'Visits', 'Proof'], capabilities: ['Everything in U2', 'Exact-visit delivered proof', 'Completed checklist and reviewed photos', 'Pending, missing, and unavailable distinctions'] },
  u4: { label: 'Functional unit 4', title: 'Questions and decisions', copy: 'Enable writes only with provider response ownership and recovery in place.', intro: 'Follow care, review proof, and respond in context.', nav: ['Home', 'Visits', 'Proof'], capabilities: ['Everything in U3', 'Visit-specific questions and replies', 'Versioned recommendation history', 'Affirmed owner decisions and receipts'] },
};

const picker = document.querySelector('#unit-picker');
const navIcon = { Home: '⌂', Visits: '▤', Proof: '✓' };

function navMarkup(items, mobile = false) {
  return items.map((item, index) => `<button type="button"${index === 0 ? ' class="active" aria-current="page"' : ''}><span aria-hidden="true">${navIcon[item]}</span><strong>${item}</strong></button>`).join('');
}

function setUnit(key, announce = true) {
  const unit = units[key] ?? units.u1;
  document.body.dataset.unit = key;
  picker.value = key;
  document.querySelector('#unit-label').textContent = unit.label;
  document.querySelector('#unit-title').textContent = unit.title;
  document.querySelector('#unit-copy').textContent = unit.copy;
  document.querySelector('#unit-intro').textContent = unit.intro;
  document.querySelector('#rail-nav').innerHTML = navMarkup(unit.nav);
  document.querySelector('#portal-tabs').innerHTML = navMarkup(unit.nav);
  document.querySelector('#mobile-nav').innerHTML = navMarkup(unit.nav, true);
  document.querySelector('#capabilities').innerHTML = unit.capabilities.map((capability) => `<span><b aria-hidden="true">✓</b>${capability}</span>`).join('');
  if (location.hash !== `#${key}`) history.replaceState(null, '', `#${key}`);
  if (announce) document.querySelector('#announcer').textContent = `Showing ${unit.label}: ${unit.title}`;
}

picker.addEventListener('change', () => setUnit(picker.value));
window.addEventListener('hashchange', () => setUnit(location.hash.slice(1), false));
setUnit(location.hash.slice(1) || 'u1', false);
