const views = {
  overview: 'Overview',
  properties: 'Properties',
  proof: 'Proof',
  approvals: 'Approvals',
};

const body = document.body;
const pageTitle = document.querySelector('[data-page-title]');
const announcer = document.querySelector('[data-announcer]');
let dialogReturnTarget = null;

function openView(id, { focus = true } = {}) {
  const view = Object.hasOwn(views, id) ? id : 'overview';
  body.dataset.activeView = view;
  document.querySelectorAll('[data-view-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.viewPanel !== view;
  });
  document.querySelectorAll('[data-nav]').forEach((control) => {
    if (control.dataset.nav === view) control.setAttribute('aria-current', 'page');
    else control.removeAttribute('aria-current');
  });
  pageTitle.textContent = views[view];
  history.replaceState(null, '', `#${view}`);
  if (focus) pageTitle.focus({ preventScroll: true });
  announcer.textContent = `${views[view]} view opened.`;
}

document.querySelectorAll('[data-nav]').forEach((control) => {
  control.addEventListener('click', (event) => {
    event.preventDefault();
    openView(control.dataset.nav);
  });
});

const reviewStateSelect = document.querySelector('select[data-review-state]');

reviewStateSelect.addEventListener('change', (event) => {
  body.dataset.reviewState = event.target.value;
  announcer.textContent = `${event.target.selectedOptions[0].textContent} review state applied.`;
});

document.querySelectorAll('[data-retry]').forEach((button) => {
  button.addEventListener('click', () => {
    body.dataset.reviewState = 'loading';
    reviewStateSelect.value = 'loading';
    window.setTimeout(() => {
      body.dataset.reviewState = 'default';
      reviewStateSelect.value = 'default';
      announcer.textContent = 'Portfolio restored.';
    }, 450);
  });
});

document.querySelector('[data-portfolio-select]').addEventListener('change', (event) => {
  const retail = event.target.value === 'retail';
  document.querySelector('[data-property-count]').textContent = retail ? '4' : '12';
  document.querySelector('[data-ready-percent]').textContent = retail ? '100%' : '83%';
  document.querySelector('[data-ready-copy]').textContent = retail ? '4 of 4 on track' : '10 of 12 on track';
  document.querySelector('[data-exception-count]').textContent = retail ? '0' : '2';
  document.querySelector('[data-approval-count]').textContent = retail ? '0' : '1';
  body.dataset.reviewState = retail ? 'clear' : 'default';
  reviewStateSelect.value = retail ? 'clear' : 'default';
  announcer.textContent = retail ? 'West Valley retail portfolio opened. All properties are ready.' : 'Phoenix residential portfolio opened.';
});

document.querySelector('[data-property-search]').addEventListener('input', (event) => {
  const query = event.target.value.trim().toLowerCase();
  let matches = 0;
  document.querySelectorAll('[data-property-row]').forEach((row) => {
    const visible = row.textContent.toLowerCase().includes(query);
    row.hidden = !visible;
    if (visible) matches += 1;
  });
  document.querySelector('.no-results').style.display = matches ? 'none' : 'block';
});

const recordDialog = document.querySelector('[data-record-dialog]');
document.querySelectorAll('[data-open-record]').forEach((button) => {
  button.addEventListener('click', () => {
    dialogReturnTarget = button;
    recordDialog.showModal();
  });
});
document.querySelectorAll('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => recordDialog.close());
});
recordDialog.addEventListener('close', () => dialogReturnTarget?.focus());

openView(location.hash.slice(1), { focus: false });
