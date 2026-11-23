const portfolioApp = document.getElementById('portfolio-app');

const freshPortfolio = () => ({ read: 'ready', access: 'active', screen: 'queue',
  version: 2, panel: null, stale: false, sent: false, uncertain: false, notice: '' });
let portfolio = freshPortfolio();

function portfolioUnavailable() {
  const ended = portfolio.access === 'ended';
  return `<section class="state-card state-card-danger" aria-labelledby="portfolio-read-title">
    <span class="state-symbol" aria-hidden="true">!</span>
    <p class="step-label">${ended ? 'PROPERTY ACCESS ENDED' : 'PORTFOLIO READ UNAVAILABLE'}</p>
    <h2 id="portfolio-read-title" tabindex="-1">${ended ? 'Your property access is no longer active.' : 'The current portfolio could not be loaded.'}</h2>
    <p>${ended ? 'Property names, service details, and response controls are withheld. Ask the account administrator to review access.' : 'Property and request details stay hidden until the protected read succeeds. No guidance was sent.'}</p>
    ${ended ? '' : '<button class="button button-primary" type="button" data-action="retry">Retry portfolio read</button>'}
  </section>`;
}

function portfolioQueue() {
  return `<section class="queue-card" aria-labelledby="portfolio-queue-title">
    <div class="card-topline"><span class="step-label">AUTHORIZED PROPERTIES · 2</span><span class="status-tag ${portfolio.sent ? 'status-tag-good' : 'status-tag-attention'}">${portfolio.sent ? 'No response waiting' : '1 response waiting'}</span></div>
    <h2 id="portfolio-queue-title" tabindex="-1">Your properties today</h2>
    <p class="muted">One service needs property guidance. Open the exact request before responding.</p>
    <button class="service-row" type="button" data-action="open" aria-label="Open Canyon View access request">
      <span class="service-row-top"><strong>Canyon View</strong><span aria-hidden="true">↗</span></span>
      <span class="service-row-detail">One-time cleanup and pruning · September 16, 2026</span>
      <span class="service-row-bottom">${portfolio.sent ? portfolio.uncertain ? 'Entrance not confirmed · office follow-up needed' : 'Guidance sent for office verification' : 'Access guidance requested · response needed'}</span>
    </button>
    <div class="portfolio-secondary"><strong>Sage Lane</strong><span>Service scheduled · no decision requested</span></div>
    <p class="queue-footnote">Only properties within this synthetic manager scope appear. This page does not grant access to provider routes or crew records.</p>
  </section>`;
}

function portfolioDetail() {
  return `<div class="customer-layout">
    <aside class="customer-intro" aria-label="Authorized properties">
      <p class="step-label">YOUR PORTFOLIO</p><h2>Canyon View</h2>
      <p>One property question needs a response. Sage Lane has no action waiting.</p>
      <button class="portfolio-back" type="button" data-action="back">← All properties</button>
    </aside>
    <div class="service-main customer-main">
      <div class="service-heading"><div><p class="eyebrow">CANYON VIEW · REQUEST ${portfolio.version}</p><h2 id="portfolio-title" tabindex="-1">Confirm approved access guidance</h2></div><span class="status-tag ${portfolio.sent && !portfolio.uncertain ? 'status-tag-good' : 'status-tag-attention'}">${portfolio.sent ? portfolio.uncertain ? 'Office follow-up needed' : 'Sent for verification' : 'Your response needed'}</span></div>
      ${portfolio.notice ? `<p class="inline-notice" role="status">${portfolio.notice}</p>` : ''}
      ${portfolio.stale ? `<section class="state-card state-card-warning portfolio-warning" aria-labelledby="portfolio-stale-title"><p class="step-label">REQUEST CHANGED</p><h3 id="portfolio-stale-title" tabindex="-1">Request 2 is no longer current.</h3><p>Guidance for an older request cannot be sent. Load request 3 and review the exact question again.</p><button class="button button-primary" type="button" data-action="load-current">Load current request 3</button></section>` : ''}
      <section class="customer-scope" aria-labelledby="portfolio-service-title"><p class="step-label">CUSTOMER-SAFE SERVICE</p><h3 id="portfolio-service-title">One-time cleanup and pruning</h3><p>The accepted scope remains unchanged. The provider has paused access-dependent work while the property entrance is clarified.</p><div class="outcome-metadata"><span>Service day</span><strong>September 16, 2026</strong></div></section>
      <section class="customer-consequence" aria-labelledby="portfolio-question-title"><p class="step-label">EXACT PROPERTY QUESTION · REQUEST ${portfolio.version}</p><h3 id="portfolio-question-title">Is the north service entrance still approved?</h3><p>${portfolio.version === 2 ? 'The property record lists the north entrance for this visit. Confirm that it is still the property-approved access point.' : 'The provider updated the request. Review it again before confirming the north entrance.'}</p><p class="fine-print">No gate code, resident contact, crew route, or provider-private work note is shown in this study view.</p></section>
      <section class="handoff-card" aria-labelledby="portfolio-next-title"><div><p class="step-label">NEXT OWNER</p><h3 id="portfolio-next-title">${portfolio.sent ? portfolio.uncertain ? 'Company Manager seeks verified access' : 'Company Manager verifies and updates the crew' : 'Property Manager responds to the access question'}</h3><p>${portfolio.sent ? portfolio.uncertain ? 'The north entrance was not confirmed. A manager must obtain new property guidance before affected work resumes.' : 'Your response is simulated. The provider still verifies access and decides when affected work can resume.' : 'You can confirm the listed entrance or flag that it cannot be confirmed. Neither response releases a route or changes accepted scope.'}</p></div>${!portfolio.sent && !portfolio.stale ? '<div class="handoff-actions portfolio-actions"><button class="button button-primary" type="button" data-action="review">Confirm north entrance</button><button class="button button-secondary" type="button" data-action="cannot-confirm">Cannot confirm entrance</button></div>' : ''}</section>
      ${portfolio.panel && !portfolio.stale && !portfolio.sent ? `<section class="decision-panel" aria-labelledby="portfolio-confirm-title"><p class="step-label">REVIEW REQUEST ${portfolio.version}</p><h3 id="portfolio-confirm-title" tabindex="-1">${portfolio.panel === 'confirm' ? 'Send approved north entrance guidance?' : 'Tell the office the entrance is unconfirmed?'}</h3><p>${portfolio.panel === 'confirm' ? 'Company Manager will verify it before the Crew Lead receives an updated instruction.' : 'Company Manager must seek verified property guidance. Affected work stays on hold.'} No access code or personal contact detail is sent in this simulation.</p><div class="button-row"><button class="button button-primary" type="button" data-action="send">${portfolio.panel === 'confirm' ? 'Send property guidance' : 'Flag entrance unconfirmed'}</button><button class="button button-text" type="button" data-action="cancel">Keep reviewing</button></div></section>` : ''}
    </div>
  </div>`;
}

function renderPortfolio(focusId) {
  portfolioApp.innerHTML = portfolio.access === 'ended' || portfolio.read === 'unavailable'
    ? portfolioUnavailable() : portfolio.screen === 'queue' ? portfolioQueue() : portfolioDetail();
  if (focusId) document.getElementById(focusId)?.focus();
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'reset') { portfolio = freshPortfolio(); renderPortfolio('portfolio-queue-title'); return; }
  if (action === 'end-access') { portfolio.access = 'ended'; portfolio.panel = null; portfolio.notice = ''; renderPortfolio('portfolio-read-title'); return; }
  if (portfolio.access !== 'active') return;
  if (action === 'fail') { portfolio.read = 'unavailable'; portfolio.panel = null; portfolio.notice = ''; renderPortfolio('portfolio-read-title'); return; }
  if (action === 'retry' && portfolio.read === 'unavailable') { portfolio.read = 'ready'; portfolio.notice = 'Protected portfolio read restored. No guidance was sent during the failed read.'; renderPortfolio(portfolio.screen === 'queue' ? 'portfolio-queue-title' : 'portfolio-title'); return; }
  if (portfolio.read !== 'ready') return;
  if (action === 'stale' && !portfolio.sent) { portfolio.screen = 'detail'; portfolio.stale = true; portfolio.panel = null; portfolio.notice = ''; renderPortfolio('portfolio-stale-title'); return; }
  if (action === 'load-current' && portfolio.stale) { portfolio.version = 3; portfolio.stale = false; portfolio.notice = 'Request 3 loaded. Review its question before sending a response.'; renderPortfolio('portfolio-title'); return; }
  if (action === 'open') { portfolio.screen = 'detail'; renderPortfolio(portfolio.stale ? 'portfolio-stale-title' : 'portfolio-title'); return; }
  if (action === 'back') { portfolio.screen = 'queue'; portfolio.panel = null; renderPortfolio('portfolio-queue-title'); return; }
  if (action === 'cancel') { portfolio.panel = null; renderPortfolio('portfolio-title'); return; }
  if (action === 'review' && !portfolio.stale && !portfolio.sent) { portfolio.panel = 'confirm'; renderPortfolio('portfolio-confirm-title'); return; }
  if (action === 'cannot-confirm' && !portfolio.stale && !portfolio.sent) { portfolio.panel = 'uncertain'; renderPortfolio('portfolio-confirm-title'); return; }
  if (action === 'send' && portfolio.panel && !portfolio.stale && !portfolio.sent) { portfolio.uncertain = portfolio.panel === 'uncertain'; portfolio.sent = true; portfolio.panel = null; portfolio.notice = portfolio.uncertain ? `Request ${portfolio.version} was flagged unconfirmed in simulation. A manager must seek verified guidance; affected work stays held.` : `Request ${portfolio.version} guidance sent in simulation. Company Manager verifies before field work resumes.`; renderPortfolio('portfolio-next-title'); }
});

renderPortfolio();
