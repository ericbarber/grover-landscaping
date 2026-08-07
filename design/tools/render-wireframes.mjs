import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const designRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const palette = {
  ink: '#17352f',
  text: '#2f4540',
  muted: '#6d7d78',
  line: '#bcc8c3',
  paper: '#f7f4ec',
  surface: '#ffffff',
  soft: '#e8eee9',
  accent: '#2d6654',
  sand: '#dfc89f',
  warning: '#f1dfb8',
  danger: '#ead0c8',
};

const pages = [
  {
    path: 'wireframes/public/01-homepage.svg',
    kind: 'marketing',
    status: 'CURRENT TARGET',
    title: 'Public homepage',
    subtitle: 'One product story that adapts to four audiences without fragmenting the brand.',
    cards: [
      ['Hero', 'Outcome-led headline, short proof statement, primary CTA, workspace sign-in, product preview.'],
      ['Audience selector', 'Yard owner · Property manager · Landscaping company · Crew lead.'],
      ['Plan · Care · Proof', 'Interactive three-step explanation with persona-specific outcomes.'],
      ['Capability proof', 'Routes, offline work, evidence, reports, recovery, and access boundaries.'],
      ['Credibility', 'Verified capabilities now; customer proof and metrics only after approval.'],
      ['Conversion', 'Audience-aware request form with consent and campaign attribution.'],
    ],
    notes: ['Make the value visible before product detail.', 'Keep one primary CTA per persona.', 'Use real product imagery after UI approval.'],
  },
  {
    path: 'wireframes/public/02-persona-campaign-mobile.svg',
    kind: 'mobile',
    status: 'CURRENT TARGET',
    eyebrow: 'CAMPAIGN LANDING',
    title: 'Persona campaign page',
    subtitle: 'Tailored first screen; shared product narrative below.',
    navigation: ['Story', 'Tour', 'Proof'],
    cards: [
      ['Audience promise', 'Dynamic headline and outcome for the selected audience.'],
      ['Primary action', 'Demo, portfolio discussion, or early access.'],
      ['Product tour', 'Swipe or tap through Plan, Care, and Proof.'],
      ['Capability evidence', 'What exists now and what is intentionally planned.'],
    ],
  },
  {
    path: 'wireframes/public/03-conversion-flow.svg',
    kind: 'modal',
    status: 'CURRENT TARGET',
    title: 'Conversion request flow',
    subtitle: 'A focused, consent-based request without losing the landing-page context.',
    cards: [
      ['Contact', 'Name, work email, phone (optional), company.'],
      ['Fit', 'Audience, team or portfolio size, primary goal.'],
      ['Consent', 'Clear contact permission and privacy explanation.'],
      ['Attribution', 'Landing path and campaign details captured silently.'],
    ],
    notes: ['Mobile-safe dialog becomes a full-height sheet.', 'Success distinguishes persisted requests from local preview.', 'Errors preserve entered information.'],
  },
  {
    path: 'wireframes/public/04-shared-customer-proof.svg',
    kind: 'shared',
    status: 'CURRENT TARGET',
    title: 'Shared report and bid pages',
    subtitle: 'Customer-safe proof and decisions outside the authenticated workspace.',
    cards: [
      ['Service identity', 'Property, service date, provider, and immutable delivery status.'],
      ['Evidence', 'Before/after photos, checklist, notes, and completed add-ons.'],
      ['Decision area', 'Approve or reject an active bid; explain expired or revoked links.'],
      ['Trust footer', 'No manager-only IDs, internal notes, or unrelated account data.'],
    ],
    notes: ['Shared links need explicit loading, expired, revoked, and unavailable states.', 'Report content is a delivered snapshot, not mutable live job state.'],
  },
  {
    path: 'wireframes/auth/01-access-and-onboarding.svg',
    kind: 'auth',
    status: 'CURRENT TARGET',
    title: 'Access and first-owner onboarding',
    subtitle: 'A branded entrance followed by a short readiness path for the first company owner.',
    cards: [
      ['Sign in', 'Managed identity, clear callback progress, and recoverable errors.'],
      ['Create company', 'Organization name, service area, timezone, and first crew.'],
      ['Invite team', 'Owner, manager, dispatcher, crew, billing, and customer roles.'],
      ['Publish readiness', 'Customers · Properties · Crew · Route · Notifications.'],
    ],
    notes: ['Never imply setup succeeded if persisted identity or audit storage is unavailable.', 'Keep demo/auth-disabled mode visually explicit.'],
  },
  {
    path: 'wireframes/field/01-home.svg',
    kind: 'mobile',
    status: 'CURRENT TARGET',
    eyebrow: 'CREW LEAD',
    title: 'Field home',
    subtitle: 'The next useful action, today’s progress, and sync health.',
    navigation: ['Home', 'Route', 'Jobs', 'Job'],
    cards: [
      ['Good morning, Maya', '3 of 8 stops complete · 2 changes waiting to sync.'],
      ['Recommended next action', 'Open the current stop and review access notes.'],
      ['Today at a glance', 'Route duration, remaining drive time, evidence readiness.'],
      ['Quick actions', 'Resume job · Review offline work · Report exception.'],
    ],
  },
  {
    path: 'wireframes/field/02-route.svg',
    kind: 'mobile',
    status: 'CURRENT TARGET',
    eyebrow: 'TODAY',
    title: 'Crew route',
    subtitle: 'Current and next stop first; the whole route remains one tap away.',
    navigation: ['Home', 'Route', 'Jobs', 'Job'],
    cards: [
      ['Current stop · 3', 'Oak Street Residence · In progress · 42 min planned.'],
      ['Primary controls', 'Arrived · Start service · Finish stop.'],
      ['Next stop · 4', 'Mesa HOA entrance · 12 min drive · Access code ready.'],
      ['Route controls', 'Show all 8 stops · Request change · Review pending sync.'],
    ],
  },
  {
    path: 'wireframes/field/03-jobs.svg',
    kind: 'mobile',
    status: 'CURRENT TARGET',
    eyebrow: 'FIELD WORK',
    title: 'Assigned jobs',
    subtitle: 'A compact, searchable list with operational status visible at a glance.',
    navigation: ['Home', 'Route', 'Jobs', 'Job'],
    cards: [
      ['Filters', 'Today · Status · Evidence blocker · Search customer or address.'],
      ['Oak Street Residence', 'In progress · Stop 3 · 4/6 checklist · Before photo ready.'],
      ['Mesa HOA entrance', 'Next · Stop 4 · Gate instructions · Extra service request.'],
      ['Citrus Grove Offices', 'Later · Stop 5 · 55 min planned · No blockers.'],
    ],
  },
  {
    path: 'wireframes/field/04-job-detail.svg',
    kind: 'mobile',
    status: 'CURRENT TARGET',
    eyebrow: 'IN PROGRESS',
    title: 'Job detail',
    subtitle: 'Customer context and primary actions stay visible while one workflow opens at a time.',
    navigation: ['Home', 'Route', 'Jobs', 'Job'],
    cards: [
      ['Property context', 'Oak Street Residence · Access notes · Contracted service.'],
      ['Primary action', 'Complete job — blocked until required evidence is ready.'],
      ['Workflow tabs', 'Checklist 4/6 · Photos 1/2 · Add-ons 1 · Report blocked.'],
      ['Active panel', 'Selected checklist/photo/add-on/report content only.'],
    ],
  },
  {
    path: 'wireframes/manager/00-manager-hub.svg',
    kind: 'mobile',
    status: 'CURRENT TARGET',
    eyebrow: 'COMPANY MANAGER',
    title: 'Operations hub',
    subtitle: 'Six stable categories prevent the manager workspace from becoming one long dashboard.',
    navigation: ['Home', 'Manage', 'Route', 'Jobs'],
    cards: [
      ['Overview', 'Company setup and readiness.'],
      ['Schedule', 'Routes, dispatch, and workload.'],
      ['Customers', 'Accounts, properties, portfolios.'],
      ['Team', 'Members, invitations, access.'],
      ['Reports', 'Quality, activity, communication.'],
      ['Recovery', 'Exceptions, photos, privacy.'],
    ],
  },
  {
    path: 'wireframes/manager/01-schedule.svg',
    kind: 'desktop',
    status: 'CURRENT + PLANNED',
    title: 'Schedule and dispatch',
    subtitle: 'Build routes, see capacity risk, and move work with clear downstream impact.',
    section: 'Schedule',
    navigation: ['Overview', 'Schedule', 'Customers', 'Team', 'Reports', 'Recovery'],
    metrics: [['Routes', '12'], ['Unassigned', '7'], ['At risk', '3'], ['Capacity', '86%']],
    cards: [
      ['Schedule board', 'Day/week calendar · Crew lanes · Unassigned work · Drag-and-drop target.'],
      ['Route inspector', 'Stops, drive/service estimates, publish blockers, sync state.'],
      ['Reassignment impact', 'Travel · Overtime · Equipment · Customer continuity · Audit.'],
      ['Dispatch structure', 'Regions · Branches · Territories · Crews · Daily capacity.'],
    ],
  },
  {
    path: 'wireframes/manager/02-customers.svg',
    kind: 'desktop',
    status: 'CURRENT + PLANNED',
    title: 'Customers and properties',
    subtitle: 'Onboarding, operational readiness, portfolio coverage, and service context.',
    section: 'Customers',
    navigation: ['Overview', 'Schedule', 'Customers', 'Team', 'Reports', 'Recovery'],
    metrics: [['Accounts', '248'], ['Onboarding', '9'], ['Unassigned', '5'], ['Issues', '4']],
    cards: [
      ['Account directory', 'Search · Lifecycle · Contacts · Billing and communication readiness.'],
      ['Property readiness', 'Address · Access · Service details · Required operational fields.'],
      ['Portfolio coverage', 'Grouped properties · Active crew · Frequency · Coverage gaps.'],
      ['Customer preview', 'Scheduled work · Reports · Photos · Bids · Support requests.'],
    ],
  },
  {
    path: 'wireframes/manager/03-team.svg',
    kind: 'desktop',
    status: 'CURRENT TARGET',
    title: 'Team and access',
    subtitle: 'Readable people administration backed by immutable activity records.',
    section: 'Team',
    navigation: ['Overview', 'Schedule', 'Customers', 'Team', 'Reports', 'Recovery'],
    metrics: [['Active', '38'], ['Invited', '4'], ['Crews', '9'], ['Unstaffed', '2']],
    cards: [
      ['Member directory', 'Name · Role · Status · Crew · Branch · Last access.'],
      ['Invitations', 'Invite · Reissue · Revoke · Expiry · Delivery state.'],
      ['Crew administration', 'Lead · Capacity · Branch · Territory · Move review.'],
      ['Team activity', 'Actor and event filters · Directional moves · CSV · Audit IDs.'],
    ],
  },
  {
    path: 'wireframes/manager/04-reports.svg',
    kind: 'desktop',
    status: 'CURRENT + PLANNED',
    title: 'Reports and communication',
    subtitle: 'One review surface for quality, activity, notifications, and business signals.',
    section: 'Reports',
    navigation: ['Overview', 'Schedule', 'Customers', 'Team', 'Reports', 'Recovery'],
    metrics: [['Ready', '18'], ['Blocked', '6'], ['Delivery fails', '2'], ['Leads', '14']],
    cards: [
      ['Completion review', 'Submitted · In review · Changes requested · Delivered.'],
      ['Operations activity', 'Route · Job · Bid · Photo · Notification · Exception events.'],
      ['Notification history', 'Queued · Sent · Failed · Skipped · Retry · Resolve.'],
      ['Business insights', 'Conversion · Route efficiency · Quality · Profitability roadmap.'],
    ],
  },
  {
    path: 'wireframes/manager/05-recovery.svg',
    kind: 'desktop',
    status: 'ACTIVE DESIGN TARGET',
    title: 'Recovery and exceptions',
    subtitle: 'Every failed or risky workflow should be visible, attributable, and actionable.',
    section: 'Recovery',
    navigation: ['Overview', 'Schedule', 'Customers', 'Team', 'Reports', 'Recovery'],
    metrics: [['Open', '11'], ['Assigned', '7'], ['Urgent', '3'], ['Resolved today', '8']],
    cards: [
      ['Exception queue', 'Delay · Staffing · Access · Weather · Equipment · Safety · Escalation.'],
      ['Exception detail', 'Status · Owner · Timeline · Affected work · Resolution action.'],
      ['Photo recovery', 'Processing failures · Retry history · Dead letters · Manual resolution.'],
      ['Privacy recovery', 'Export · Erasure manifest · Object deletion failures · Audit.'],
    ],
  },
  {
    path: 'wireframes/customer/01-yard-owner-portal.svg',
    kind: 'mobile',
    status: 'CURRENT + PLANNED',
    eyebrow: 'YARD OWNER',
    title: 'My yard',
    subtitle: 'Upcoming service, trustworthy proof, bids, and help without operations clutter.',
    navigation: ['Home', 'My yard'],
    cards: [
      ['Next service', 'Tuesday · Standard yard care · Arrival window · Contact preference.'],
      ['Properties', 'Compact property list with portfolio/group context.'],
      ['Recent proof', 'Two newest delivered reports with before/after preview.'],
      ['Bids and support', 'Active decisions · History · Ask about this service.'],
    ],
  },
  {
    path: 'wireframes/customer/02-property-manager-portfolio.svg',
    kind: 'desktop',
    status: 'PLANNED TARGET',
    title: 'Property portfolio',
    subtitle: 'Portfolio-wide service visibility with approvals, exceptions, and evidence.',
    section: 'Portfolio',
    navigation: ['Overview', 'Properties', 'Schedule', 'Reports', 'Bids', 'Issues'],
    metrics: [['Properties', '126'], ['Serviced', '91%'], ['Open issues', '8'], ['Approvals', '5']],
    cards: [
      ['Coverage map/list', 'Region · Property · Provider · Frequency · Next service.'],
      ['Exception summary', 'Missed or delayed work · Access issues · Open corrections.'],
      ['Evidence review', 'Delivered reports · Before/after photos · Sample queue.'],
      ['Approval center', 'Bids · Additional work · Support issues · Budget context.'],
    ],
  },
  {
    path: 'wireframes/revenue/01-revenue-operations.svg',
    kind: 'desktop',
    status: 'PLANNED TARGET',
    title: 'Revenue operations',
    subtitle: 'Connect service scope, completed work, billing readiness, and payment state.',
    section: 'Revenue',
    navigation: ['Overview', 'Catalog', 'Contracts', 'Estimates', 'Invoices', 'Costs'],
    metrics: [['Ready to bill', '$38.4k'], ['Draft', '$12.8k'], ['Overdue', '$6.1k'], ['Margin', '31%']],
    cards: [
      ['Billing readiness', 'Completed scope · Evidence · Labor · Materials · Approvals.'],
      ['Service catalog', 'Units · Duration · Pricing · Approval rules · Lifecycle.'],
      ['Contracts and estimates', 'Frequency · Change orders · Deposits · Conversion.'],
      ['Invoices and cost', 'Tax · Discounts · Balance · Payment · Job profitability.'],
    ],
  },
  {
    path: 'wireframes/future/01-homeowner-assistant.svg',
    kind: 'mobile',
    status: 'FUTURE CONCEPT',
    eyebrow: 'HOMEOWNER MODE',
    title: 'Today in your yard',
    subtitle: 'An adaptive maintenance assistant, intentionally separate from provider operations.',
    navigation: ['Today', 'Calendar', 'Yard', 'Supplies'],
    cards: [
      ['Today’s plan', '3 tasks · 75 minutes · Best work window 7–10 AM.'],
      ['Guided session', 'Why · When · Steps · Tools · Safety · Completion.'],
      ['Weather adjustment', 'Postpone heat-sensitive task and explain the new date.'],
      ['Yard health', 'Zones · Plants · Irrigation · Issues · Photo history.'],
    ],
  },
  {
    path: 'wireframes/future/02-multi-vendor-portfolio.svg',
    kind: 'desktop',
    status: 'FUTURE CONCEPT',
    title: 'Multi-vendor property operations',
    subtitle: 'Govern vendor coverage, compliance, evidence, quality, and invoices at portfolio scale.',
    section: 'Portfolio operations',
    navigation: ['Coverage', 'Vendors', 'Work orders', 'Evidence', 'Invoices', 'Performance'],
    metrics: [['Properties', '1,284'], ['Coverage gaps', '17'], ['Compliance risk', '6'], ['Invoice exceptions', '23']],
    cards: [
      ['Coverage and vendors', 'Regions · Eligibility · Capacity · Backup provider · Compliance.'],
      ['Work distribution', 'Standard scopes · Acceptance · Rejection · Escalation.'],
      ['Evidence and quality', 'Automated checks · Sampling · Corrections · Scorecards.'],
      ['Invoice matching', 'Contract/PO + validated work + invoice · Tolerance review.'],
    ],
  },
];

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function rect(x, y, width, height, options = {}) {
  const { fill = palette.surface, stroke = palette.line, radius = 14, dash = '' } = options;
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="2"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
}

function text(x, y, value, size = 16, weight = 500, fill = palette.text, anchor = 'start') {
  return `<text x="${x}" y="${y}" font-family="Inter, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(value)}</text>`;
}

function wrappedText(x, y, value, width, size = 15, lineHeight = 21, fill = palette.muted, weight = 500) {
  const maxChars = Math.max(12, Math.floor(width / (size * 0.54)));
  const words = value.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    if (`${line} ${word}`.trim().length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = `${line} ${word}`.trim();
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4).map((item, index) => text(x, y + index * lineHeight, item, size, weight, fill)).join('');
}

function badge(x, y, value, fill = palette.soft) {
  const width = Math.max(96, value.length * 8 + 26);
  return `${rect(x, y, width, 30, { fill, stroke: fill, radius: 15 })}${text(x + width / 2, y + 20, value, 12, 800, palette.accent, 'middle')}`;
}

function card(x, y, width, height, titleValue, detail, index) {
  return [
    rect(x, y, width, height),
    `<circle cx="${x + 28}" cy="${y + 31}" r="15" fill="${palette.soft}" stroke="${palette.accent}" stroke-width="2"/>`,
    text(x + 28, y + 36, index, 12, 800, palette.accent, 'middle'),
    text(x + 54, y + 36, titleValue, 17, 800, palette.ink),
    wrappedText(x + 22, y + 68, detail, width - 44, 14, 20),
  ].join('');
}

function shell(width, height, page, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${esc(page.title)} wireframe</title>
  <desc id="desc">${esc(page.subtitle)}</desc>
  <rect width="${width}" height="${height}" fill="${palette.paper}"/>
  ${body}
  ${text(28, height - 22, `Grover design study · ${page.status} · low fidelity`, 12, 700, palette.muted)}
</svg>\n`;
}

function renderMobile(page) {
  const width = 390;
  const height = 844;
  const nav = page.navigation ?? ['Home', 'Work'];
  const cardHeight = page.cards.length > 4 ? 80 : 104;
  const cardGap = page.cards.length > 4 ? 8 : 10;
  const startY = 210;
  let body = [
    rect(12, 12, 366, 68, { radius: 18 }),
    text(28, 38, 'GROVER', 12, 900, palette.accent),
    text(28, 62, page.eyebrow ?? 'WORKSPACE', 11, 800, palette.muted),
    rect(320, 26, 40, 40, { fill: palette.soft, stroke: palette.soft, radius: 20 }),
    text(340, 51, 'ME', 10, 900, palette.accent, 'middle'),
    text(22, 117, page.title, 27, 900, palette.ink),
    wrappedText(22, 144, page.subtitle, 346, 14, 20),
    badge(22, 178, page.status),
  ].join('');
  page.cards.forEach(([titleValue, detail], index) => {
    body += card(18, startY + index * (cardHeight + cardGap), 354, cardHeight, titleValue, detail, index + 1);
  });
  body += rect(10, 770, 370, 58, { radius: 18 });
  const navWidth = 350 / nav.length;
  nav.forEach((item, index) => {
    const x = 20 + navWidth * index;
    if (index === 0) body += rect(x, 780, navWidth - 6, 38, { fill: palette.accent, stroke: palette.accent, radius: 12 });
    body += text(x + (navWidth - 6) / 2, 804, item, 11, 800, index === 0 ? '#ffffff' : palette.muted, 'middle');
  });
  return shell(width, height, page, body);
}

function desktopChrome(page) {
  const nav = page.navigation ?? [];
  let body = rect(22, 20, 1396, 72, { radius: 18 });
  body += text(48, 55, 'GROVER', 19, 900, palette.accent);
  body += text(48, 76, 'Plan · Care · Proof', 11, 700, palette.muted);
  body += badge(1190, 40, page.status);
  body += rect(22, 108, 220, 870, { radius: 18 });
  body += text(46, 144, page.section ?? 'Workspace', 13, 900, palette.accent);
  nav.forEach((item, index) => {
    const active = item === page.section || index === 0;
    body += rect(38, 166 + index * 58, 188, 44, { fill: active ? palette.accent : palette.surface, stroke: active ? palette.accent : palette.line, radius: 11 });
    body += text(54, 194 + index * 58, item, 14, 800, active ? '#ffffff' : palette.text);
  });
  body += text(274, 142, page.title, 31, 900, palette.ink);
  body += wrappedText(274, 170, page.subtitle, 980, 15, 21);
  return body;
}

function renderDesktop(page) {
  const width = 1440;
  const height = 1024;
  let body = desktopChrome(page);
  const metrics = page.metrics ?? [];
  metrics.forEach(([label, value], index) => {
    const x = 274 + index * 274;
    body += rect(x, 224, 254, 92, { fill: index === 2 ? palette.warning : palette.surface });
    body += text(x + 18, 252, label.toUpperCase(), 11, 800, palette.muted);
    body += text(x + 18, 293, value, 28, 900, palette.ink);
  });
  page.cards.forEach(([titleValue, detail], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    body += card(274 + column * 558, 344 + row * 240, 530, 214, titleValue, detail, index + 1);
    if (row === 0) {
      body += rect(296 + column * 558, 460, 486, 70, { fill: palette.soft, stroke: palette.soft, radius: 10, dash: '7 7' });
      body += text(539 + column * 558, 501, 'PRIMARY CONTENT / TABLE / BOARD', 12, 800, palette.muted, 'middle');
    }
  });
  return shell(width, height, page, body);
}

function renderMarketing(page) {
  const width = 1440;
  const height = 1100;
  let body = [
    rect(24, 20, 1392, 70, { radius: 18 }),
    text(52, 62, 'GROVER', 20, 900, palette.accent),
    text(252, 62, 'Product', 14, 700), text(338, 62, 'How it works', 14, 700), text(457, 62, 'Who it helps', 14, 700),
    rect(1186, 34, 96, 42, { fill: palette.surface, stroke: palette.accent, radius: 12 }), text(1234, 60, 'Sign in', 13, 800, palette.accent, 'middle'),
    rect(1294, 34, 98, 42, { fill: palette.accent, stroke: palette.accent, radius: 12 }), text(1343, 60, 'Get started', 13, 800, '#ffffff', 'middle'),
    rect(24, 108, 1392, 332, { fill: palette.soft, stroke: palette.soft, radius: 22 }),
    badge(56, 138, page.status),
    text(56, 207, 'Plan every visit.', 41, 900, palette.ink),
    text(56, 256, 'Care with confidence.', 41, 900, palette.ink),
    text(56, 305, 'Prove the work.', 41, 900, palette.ink),
    wrappedText(58, 342, page.subtitle, 520, 16, 23),
    rect(58, 382, 154, 42, { fill: palette.accent, stroke: palette.accent, radius: 12 }), text(135, 408, 'Request a demo', 13, 800, '#ffffff', 'middle'),
    rect(764, 142, 596, 260, { fill: palette.surface, stroke: palette.line, radius: 18 }),
    rect(790, 170, 544, 34, { fill: palette.soft, stroke: palette.soft, radius: 8 }),
    text(806, 192, 'PRODUCT PREVIEW — ROUTE + EVIDENCE + REPORT', 12, 800, palette.muted),
    rect(792, 220, 240, 150, { fill: palette.paper, stroke: palette.line, radius: 10 }),
    rect(1048, 220, 284, 68, { fill: palette.paper, stroke: palette.line, radius: 10 }),
    rect(1048, 302, 284, 68, { fill: palette.paper, stroke: palette.line, radius: 10 }),
    text(44, 483, 'CHOOSE YOUR VIEW', 12, 900, palette.accent),
  ].join('');
  ['Yard owner', 'Property manager', 'Landscaping company', 'Crew lead'].forEach((item, index) => {
    body += rect(44 + index * 340, 500, 322, 52, { fill: index === 2 ? palette.accent : palette.surface, stroke: index === 2 ? palette.accent : palette.line, radius: 12 });
    body += text(205 + index * 340, 532, item, 14, 800, index === 2 ? '#ffffff' : palette.text, 'middle');
  });
  page.cards.forEach(([titleValue, detail], index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    body += card(44 + column * 456, 582 + row * 205, 428, 176, titleValue, detail, index + 1);
  });
  return shell(width, height, page, body);
}

function renderModal(page) {
  const width = 1440;
  const height = 1024;
  let body = renderMarketing({ ...pages[0], status: 'BACKGROUND CONTEXT' }).replace(/^<svg[\s\S]*?<rect width="1440" height="1100" fill="#[^"]+"\/>/, '').replace(/<\/svg>\s*$/, '');
  body = `<g opacity="0.22">${body}</g><rect width="1440" height="1024" fill="#17352f" opacity="0.28"/>`;
  body += rect(390, 86, 660, 842, { fill: palette.surface, stroke: palette.ink, radius: 24 });
  body += badge(430, 122, page.status);
  body += text(430, 181, page.title, 30, 900, palette.ink);
  body += wrappedText(430, 211, page.subtitle, 550, 15, 22);
  page.cards.forEach(([titleValue, detail], index) => {
    body += card(430, 274 + index * 132, 580, 112, titleValue, detail, index + 1);
  });
  body += rect(430, 818, 580, 56, { fill: palette.accent, stroke: palette.accent, radius: 14 });
  body += text(720, 853, 'Send request', 15, 900, '#ffffff', 'middle');
  return shell(width, height, page, body);
}

function renderShared(page) {
  const width = 1200;
  const height = 980;
  let body = rect(24, 20, 1152, 70, { radius: 18 });
  body += text(50, 61, 'GROVER', 19, 900, palette.accent);
  body += text(1148, 61, 'Secure customer link', 12, 800, palette.muted, 'end');
  body += text(48, 140, page.title, 31, 900, palette.ink);
  body += wrappedText(48, 170, page.subtitle, 950, 15, 21);
  body += badge(930, 122, page.status);
  page.cards.forEach(([titleValue, detail], index) => {
    const y = 232 + index * 168;
    body += card(48, y, 1104, 142, titleValue, detail, index + 1);
    if (index === 1) {
      body += rect(630, y + 24, 150, 92, { fill: palette.soft, stroke: palette.soft, radius: 9 });
      body += rect(794, y + 24, 150, 92, { fill: palette.soft, stroke: palette.soft, radius: 9 });
      body += text(705, y + 76, 'BEFORE', 11, 800, palette.muted, 'middle');
      body += text(869, y + 76, 'AFTER', 11, 800, palette.muted, 'middle');
    }
  });
  return shell(width, height, page, body);
}

function renderAuth(page) {
  const width = 1440;
  const height = 1024;
  let body = rect(24, 20, 1392, 958, { radius: 24 });
  body += rect(24, 20, 592, 958, { fill: palette.accent, stroke: palette.accent, radius: 24 });
  body += text(70, 79, 'GROVER', 20, 900, '#ffffff');
  body += text(70, 224, 'Run the day.', 39, 900, '#ffffff');
  body += text(70, 271, 'Prove the work.', 39, 900, '#ffffff');
  body += wrappedText(72, 316, page.subtitle, 450, 17, 25, '#dceae4');
  body += rect(70, 438, 472, 290, { fill: '#3e7664', stroke: '#6a998a', radius: 18 });
  body += text(306, 579, 'BRANDED LANDSCAPE / PRODUCT IMAGE', 13, 800, '#dceae4', 'middle');
  body += badge(670, 74, page.status);
  body += text(670, 139, page.title, 31, 900, palette.ink);
  page.cards.forEach(([titleValue, detail], index) => {
    body += card(670, 190 + index * 166, 686, 138, titleValue, detail, index + 1);
  });
  return shell(width, height, page, body);
}

function render(page) {
  switch (page.kind) {
    case 'mobile': return renderMobile(page);
    case 'desktop': return renderDesktop(page);
    case 'marketing': return renderMarketing(page);
    case 'modal': return renderModal(page);
    case 'shared': return renderShared(page);
    case 'auth': return renderAuth(page);
    default: throw new Error(`Unknown wireframe kind: ${page.kind}`);
  }
}

for (const page of pages) {
  const outputPath = resolve(designRoot, page.path);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, render(page), 'utf8');
}

const manifest = pages.map(({ path, title, status, kind }) => ({ path, title, status, kind }));
await writeFile(resolve(designRoot, 'wireframes/manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(`Rendered ${pages.length} Grover wireframes.`);
