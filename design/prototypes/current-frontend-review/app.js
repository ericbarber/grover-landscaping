const surfaces = {
  public: { public: true, title: 'Public landing' },
  'company-home': { title: 'Company owner Home', name: 'Olivia — Organization Owner', authRole: 'OrganizationOwner', persona: 'Yard-care company owner', mobileTitle: 'Home', mobileKicker: 'Yard-care company owner', summary: 'Today’s work and next actions', nav: [['⌂', 'Home'], ['⌘', 'Manage'], ['⌁', 'Route'], ['▤', 'Jobs'], ['✓', 'Job']] },
  'company-manage': { title: 'Company owner Manage', name: 'Olivia — Organization Owner', authRole: 'OrganizationOwner', persona: 'Yard-care company owner', mobileTitle: 'Manage', mobileKicker: 'Manager and office tools', summary: 'Scheduling, customers, and recovery', nav: [['⌂', 'Home'], ['⌘', 'Manage']] },
  'crew-home': { title: 'Crew lead Home', name: 'Leah — Crew Lead', authRole: 'CrewLead', persona: 'Crew lead', mobileTitle: 'Home', mobileKicker: 'Today', summary: '1 assigned job · Synced', nav: [['⌂', 'Home'], ['⌁', 'Route'], ['▤', 'Jobs'], ['✓', 'Job']] },
  'crew-route': { title: 'Crew lead Route', name: 'Leah — Crew Lead', authRole: 'CrewLead', persona: 'Crew lead', mobileTitle: 'Crew route', mobileKicker: 'Today', summary: '5 assigned jobs · Synced', nav: [['⌂', 'Home'], ['⌁', 'Route'], ['▤', 'Jobs'], ['✓', 'Job']] },
  'owner-home': { title: 'Yard owner Home', name: 'Jamie — Property Owner', authRole: 'PropertyOwner', persona: 'Yard owner', mobileTitle: 'Home', mobileKicker: 'Yard owner', summary: 'Properties, upcoming service, reports, photos, and bids', nav: [['⌂', 'Home'], ['⌑', 'My yard']] },
  'owner-yard': { title: 'Yard owner My yard unavailable', name: 'Jamie — Property Owner', authRole: 'PropertyOwner', persona: 'Yard owner', mobileTitle: 'My yard', mobileKicker: 'Yard owner', summary: 'Properties, upcoming service, reports, photos, and bids', nav: [['⌂', 'Home'], ['⌑', 'My yard']] },
  portfolio: { title: 'Property manager Portfolio', name: 'Morgan — Property Manager', authRole: 'PropertyManager', persona: 'Property manager', mobileTitle: 'Portfolio', mobileKicker: 'Property manager', summary: 'Coverage, proof, approvals, and exceptions', nav: [['⌂', 'Home'], ['⌑', 'Portfolio'], ['⌘', 'Manage']] },
};

const picker = document.querySelector('#surface-picker');
const announcer = document.querySelector('#prototype-announcer');
const desktopNav = document.querySelector('#desktop-nav');
const mobileNav = document.querySelector('#mobile-nav');
const fields = {
  authName: document.querySelector('#auth-name'), authRole: document.querySelector('#auth-role'),
  railName: document.querySelector('#rail-name'), railRole: document.querySelector('#rail-role'), railPersona: document.querySelector('#rail-persona'),
  mobileKicker: document.querySelector('#mobile-kicker'), mobileTitle: document.querySelector('#mobile-title'), mobileSummary: document.querySelector('#mobile-summary'), mobilePerson: document.querySelector('#mobile-person'),
};

const publicPersonas = {
  owner: {
    eyebrow: 'Confidence after every visit', headline: 'See the care behind your yard.', description: 'Know what was planned, what was completed, and what your property may need next—without chasing an update.',
    preview: ['Oak Street residence', 'Your latest service is ready', 'Report ready', '100%', 'report complete', '1', 'recommendation', '0', 'open questions', 'Service complete', 'Completed work and photo evidence', 'Ready', 'What is next', 'Review one recommendation', 'Your choice'],
  },
  'property-manager': {
    eyebrow: 'Clarity across every address', headline: 'Keep every property ready.', description: 'Track service quality, open needs, and completion evidence across your portfolio from one focused view.',
    preview: ['Portfolio readiness', '14 of 16 properties on track', '2 need review', '14', 'on track', '2', 'owned needs', '16', 'properties', 'Mesa portfolio', 'Service coverage and proof', 'Ready', 'Open needs', 'Owners and due dates assigned', 'Review'],
  },
  company: {
    eyebrow: 'Operations customers can trust', headline: 'Plan every visit. Care with confidence. Prove the work.', description: 'Connect scheduling, crews, proof, customer communication, and revenue in one calm operating view.',
    preview: ['Today’s operation', 'Thursday, September 3', 'Synced', '8/9', 'crews active', '46%', 'route progress', '7', 'unassigned', 'North crew', '4 stops · 340 planned minutes', '80 min open', 'West crew', '3 stops · 225 planned minutes', '135 min open'],
  },
  crew: {
    eyebrow: 'A better day in the field', headline: 'Know the next stop—and what done looks like.', description: 'Give crews the route, service details, and evidence requirements they need without the office back-and-forth.',
    preview: ['Stop 3 of 8', 'Oak Street residence', 'In progress', '4/6', 'tasks complete', '2', 'tasks remain', '1', 'active stop', 'Property context', 'Access and service details offline', 'Ready', 'Evidence handoff', 'Photos and notes together', 'Next'],
  },
};

function setPublicPersona(key) {
  const persona = publicPersonas[key] ?? publicPersonas.company;
  document.querySelector('#public-eyebrow').textContent = persona.eyebrow;
  document.querySelector('#public-headline').textContent = persona.headline;
  document.querySelector('#public-description').textContent = persona.description;
  const previewValues = persona.preview;
  ['kicker', 'title', 'status', 'value-one', 'label-one', 'value-two', 'label-two', 'value-three', 'label-three', 'row-one-title', 'row-one-copy', 'row-one-meta', 'row-two-title', 'row-two-copy', 'row-two-meta'].forEach((field, index) => {
    document.querySelector(`#preview-${field}`).textContent = previewValues[index];
  });
  document.querySelectorAll('[data-public-persona]').forEach((button) => {
    const selected = button.dataset.publicPersona === key;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

function navMarkup(items, activeLabel) {
  return items.map(([icon, label]) => `<button type="button"${label === activeLabel ? ' class="active" aria-current="page"' : ''}><span aria-hidden="true">${icon}</span><strong>${label}</strong></button>`).join('');
}

function setSurface(next, announce = true) {
  const key = surfaces[next] ? next : 'company-home';
  const surface = surfaces[key];
  document.body.dataset.surface = key;
  picker.value = key;
  document.querySelectorAll('[data-panel]').forEach((panel) => { panel.hidden = panel.dataset.panel !== key; });
  if (!surface.public) {
    const active = key.endsWith('home') ? 'Home' : key === 'company-manage' ? 'Manage' : key === 'crew-route' ? 'Route' : key === 'owner-yard' ? 'My yard' : 'Portfolio';
    fields.authName.textContent = surface.name; fields.authRole.textContent = surface.authRole;
    fields.railName.textContent = surface.name; fields.railRole.textContent = surface.persona; fields.railPersona.textContent = surface.persona;
    fields.mobileKicker.textContent = surface.mobileKicker; fields.mobileTitle.textContent = surface.mobileTitle; fields.mobileSummary.textContent = surface.summary; fields.mobilePerson.textContent = `${surface.name.split(' — ')[0]} — ${surface.persona}`;
    desktopNav.innerHTML = navMarkup(surface.nav, active); mobileNav.innerHTML = navMarkup(surface.nav, active);
  }
  if (location.hash !== `#${key}`) history.replaceState(null, '', `#${key}`);
  document.title = `${surface.title} · Grover current frontend review`;
  if (announce) {
    announcer.textContent = `Showing ${surface.title}`;
    const target = surface.public ? document.querySelector('.public-mirror h1') : document.querySelector(`[data-panel="${key}"] h1`);
    target?.focus({ preventScroll: true });
  }
}

picker.addEventListener('change', () => setSurface(picker.value));
document.querySelectorAll('[data-public-persona]').forEach((button) => button.addEventListener('click', () => setPublicPersona(button.dataset.publicPersona)));
window.addEventListener('hashchange', () => setSurface(location.hash.slice(1), false));
setSurface(location.hash.slice(1) || picker.value, false);
