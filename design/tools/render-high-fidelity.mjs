import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const designRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const c = {
  evergreen: '#173f35',
  evergreen2: '#24594a',
  forest: '#0f2f28',
  sage: '#8ea795',
  sageSoft: '#dce6de',
  bone: '#f6f2e8',
  paper: '#fffdf8',
  white: '#ffffff',
  ink: '#17342d',
  slate: '#5d6e67',
  line: '#d8ddd7',
  sand: '#dec79d',
  gold: '#c99f55',
  clay: '#bd6848',
  claySoft: '#f1ddd4',
  sky: '#dce8eb',
  mint: '#d9eee4',
  amberSoft: '#f8ead0',
};

const sans = "Inter, 'Segoe UI', Arial, sans-serif";
const display = "'Iowan Old Style', 'Palatino Linotype', Georgia, serif";

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function r(x, y, width, height, fill, radius = 16, stroke = 'none', strokeWidth = 1) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
}

function t(x, y, value, size = 16, weight = 500, fill = c.ink, anchor = 'start', family = sans, letterSpacing = 0) {
  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${letterSpacing}">${esc(value)}</text>`;
}

function line(x1, y1, x2, y2, stroke = c.line, width = 1, dash = '') {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
}

function circle(x, y, radius, fill, stroke = 'none', strokeWidth = 1) {
  return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
}

function pill(x, y, label, fill = c.sageSoft, color = c.evergreen, width) {
  const resolvedWidth = width ?? Math.max(68, label.length * 7.1 + 24);
  return `${r(x, y, resolvedWidth, 28, fill, 14)}${t(x + resolvedWidth / 2, y + 18.5, label, 11, 750, color, 'middle', sans, .35)}`;
}

function button(x, y, width, label, primary = true) {
  const fill = primary ? c.evergreen : c.paper;
  const color = primary ? c.white : c.evergreen;
  const stroke = primary ? c.evergreen : c.line;
  return `${r(x, y, width, 46, fill, 12, stroke)}${t(x + width / 2, y + 29, label, 13, 750, color, 'middle')}`;
}

function leafMark(x, y, size = 28, light = false) {
  const color = light ? c.white : c.evergreen;
  return `<g transform="translate(${x} ${y}) scale(${size / 32})">
    <path d="M6 23C7 11 15 4 27 4c0 12-7 21-19 22" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
    <path d="M7 25c5-7 10-12 18-18" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
  </g>`;
}

function checkIcon(x, y, color = c.evergreen) {
  return `<path d="M${x} ${y + 5}l4 4 8-10" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function chevron(x, y, color = c.slate) {
  return `<path d="M${x} ${y}l5 5-5 5" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function svg(width, height, title, description, defs, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${esc(title)}</title>
  <desc id="desc">${esc(description)}</desc>
  <defs>${defs}</defs>
  ${body}
</svg>\n`;
}

function homepage() {
  const width = 1440;
  const height = 1200;
  const defs = `
    <clipPath id="hero-photo"><path d="M718 92h698v614H790c-40 0-72-32-72-72z"/></clipPath>
    <linearGradient id="photo-shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#173f35" stop-opacity=".14"/><stop offset=".55" stop-color="#173f35" stop-opacity="0"/></linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#173f35" flood-opacity=".15"/></filter>
    <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#173f35" flood-opacity=".12"/></filter>`;

  let b = `<rect width="1440" height="1200" fill="${c.bone}"/>`;
  b += r(0, 0, 1440, 92, c.paper, 0);
  b += leafMark(38, 28, 34);
  b += t(83, 55, 'GROVER', 19, 850, c.evergreen, 'start', sans, 2.6);
  b += t(334, 55, 'Product', 14, 650, c.ink);
  b += t(422, 55, 'How it works', 14, 650, c.ink);
  b += t(548, 55, 'Who it helps', 14, 650, c.ink);
  b += t(664, 55, 'Pricing', 14, 650, c.ink);
  b += t(1080, 55, 'Sign in', 14, 700, c.evergreen);
  b += button(1172, 23, 218, 'Request a walkthrough');

  b += r(0, 92, 760, 614, c.bone, 0);
  b += `<image href="../../assets/grover-southwest-sunrise-hero.png" x="718" y="92" width="698" height="614" preserveAspectRatio="xMidYMid slice" clip-path="url(#hero-photo)"/>`;
  b += `<rect x="718" y="92" width="698" height="614" fill="url(#photo-shade)" clip-path="url(#hero-photo)"/>`;
  b += pill(54, 146, 'FIELD OPERATIONS, BEAUTIFULLY CONNECTED', c.sageSoft, c.evergreen, 306);
  b += t(54, 232, 'Plan every visit.', 61, 600, c.ink, 'start', display, -.8);
  b += t(54, 301, 'Care with confidence.', 61, 600, c.ink, 'start', display, -.8);
  b += t(54, 370, 'Prove the work.', 61, 600, c.clay, 'start', display, -.8);
  b += t(58, 426, 'One calm operating system for the office, the field,', 18, 450, c.slate);
  b += t(58, 454, 'and every customer who expects to see the difference.', 18, 450, c.slate);
  b += button(56, 498, 198, 'Request a walkthrough');
  b += button(268, 498, 148, 'Explore the product', false);
  b += circle(66, 586, 18, c.paper, c.line);
  b += checkIcon(60, 580, c.evergreen);
  b += t(94, 581, 'Built for weak-signal field work', 13, 700, c.ink);
  b += t(94, 603, 'Offline-safe progress and evidence', 12, 450, c.slate);
  b += circle(300, 586, 18, c.paper, c.line);
  b += checkIcon(294, 580, c.evergreen);
  b += t(328, 581, 'Customer-ready proof', 13, 700, c.ink);
  b += t(328, 603, 'Reports with a clear audit trail', 12, 450, c.slate);

  b += `<g filter="url(#shadow)">`;
  b += r(772, 466, 430, 176, c.paper, 18);
  b += pill(798, 492, 'TODAY · NORTH CREW', c.mint, c.evergreen, 154);
  b += t(798, 548, '6 of 8 properties complete', 22, 780, c.ink);
  b += r(798, 572, 350, 8, c.sageSoft, 4);
  b += r(798, 572, 263, 8, c.evergreen2, 4);
  b += circle(813, 610, 5, c.evergreen2);
  b += t(829, 615, 'Photos synced', 12, 650, c.slate);
  b += circle(946, 610, 5, c.gold);
  b += t(962, 615, '1 report needs review', 12, 650, c.slate);
  b += `</g>`;

  b += r(0, 706, 1440, 92, c.evergreen, 0);
  b += t(56, 744, 'ONE SHARED VIEW OF THE DAY', 11, 800, c.sand, 'start', sans, 1.6);
  [['Routes published', '12'], ['Stops completed', '46'], ['Proof ready', '18'], ['Exceptions owned', '3']].forEach(([label, value], i) => {
    const x = 376 + i * 252;
    if (i > 0) b += line(x - 28, 728, x - 28, 776, '#456e62');
    b += t(x, 752, value, 25, 760, c.white);
    b += t(x + 48, 752, label, 13, 550, '#d9e6e1');
  });

  b += t(54, 858, 'A complete operating rhythm.', 38, 600, c.ink, 'start', display);
  b += t(54, 895, 'Each step is useful on its own—and stronger because the next team can trust it.', 15, 450, c.slate);
  const rhythm = [
    ['01', 'Plan', 'Balance crews, routes, service scope, and the exceptions that could derail the day.'],
    ['02', 'Care', 'Keep field teams focused on the current stop, required work, and reliable capture.'],
    ['03', 'Proof', 'Turn completed work into reviewable evidence, customer reports, and billing readiness.'],
  ];
  rhythm.forEach(([num, heading, copy], i) => {
    const x = 54 + i * 448;
    b += r(x, 934, 416, 202, i === 1 ? c.evergreen : c.paper, 18, i === 1 ? c.evergreen : c.line);
    b += t(x + 26, 970, num, 12, 800, i === 1 ? c.sand : c.clay, 'start', sans, 1.8);
    b += t(x + 26, 1018, heading, 29, 650, i === 1 ? c.white : c.ink, 'start', display);
    b += t(x + 26, 1054, copy.split(' ').slice(0, 8).join(' '), 14, 450, i === 1 ? '#d8e6e0' : c.slate);
    b += t(x + 26, 1077, copy.split(' ').slice(8, 16).join(' '), 14, 450, i === 1 ? '#d8e6e0' : c.slate);
    b += t(x + 26, 1100, copy.split(' ').slice(16).join(' '), 14, 450, i === 1 ? '#d8e6e0' : c.slate);
    b += circle(x + 374, 1092, 18, i === 1 ? '#315f53' : c.sageSoft);
    b += chevron(x + 371, 1087, i === 1 ? c.white : c.evergreen);
  });

  return svg(width, height, 'Grover public homepage high-fidelity concept', 'Premium Southwestern editorial homepage combining field operations proof with calm product storytelling.', defs, b);
}

function crewRoute() {
  const width = 390;
  const height = 844;
  const defs = `
    <linearGradient id="route-card" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#173f35"/><stop offset="1" stop-color="#285e4e"/></linearGradient>
    <filter id="mobile-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#173f35" flood-opacity=".12"/></filter>`;
  let b = `<rect width="390" height="844" fill="${c.bone}"/>`;
  b += r(0, 0, 390, 82, c.paper, 0);
  b += leafMark(18, 19, 28);
  b += t(55, 37, 'GROVER', 12, 850, c.evergreen, 'start', sans, 1.8);
  b += t(55, 57, 'North crew · Today', 11, 550, c.slate);
  b += pill(280, 24, 'SYNCED', c.mint, c.evergreen, 76);
  b += circle(362, 38, 4, c.evergreen2);

  b += t(20, 118, 'Good morning, Maya.', 25, 620, c.ink, 'start', display);
  b += t(20, 143, 'Friday, August 8 · 8 assigned stops', 12, 520, c.slate);
  b += `<g filter="url(#mobile-shadow)">`;
  b += r(16, 166, 358, 170, 'url(#route-card)', 20);
  b += t(38, 196, 'TODAY’S ROUTE', 10, 800, c.sand, 'start', sans, 1.5);
  b += t(38, 235, '3 of 8', 35, 750, c.white);
  b += t(141, 234, 'stops complete', 14, 550, '#d7e5df');
  b += r(38, 254, 268, 7, '#426f62', 4);
  b += r(38, 254, 101, 7, c.sand, 4);
  b += t(38, 291, '4 hr 10 min remaining', 12, 600, '#e4ece8');
  b += t(218, 291, '22 min drive', 12, 600, '#e4ece8');
  b += circle(327, 230, 26, '#315f53', '#63877d');
  b += `<path d="M318 230h18M330 222l8 8-8 8" fill="none" stroke="${c.white}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  b += `</g>`;

  b += t(20, 372, 'Current stop', 17, 760, c.ink);
  b += pill(275, 353, 'IN PROGRESS', c.amberSoft, '#7f5b22', 99);
  b += r(16, 388, 358, 222, c.paper, 18, c.line);
  b += circle(45, 420, 17, c.evergreen);
  b += t(45, 425, '3', 12, 800, c.white, 'middle');
  b += t(72, 416, 'Oak Street Residence', 17, 760, c.ink);
  b += t(72, 439, '123 Oak Street · Weekly care', 12, 500, c.slate);
  b += line(34, 458, 356, 458);
  b += pill(34, 476, '42 MIN PLANNED', c.sageSoft, c.evergreen, 116);
  b += pill(159, 476, 'ACCESS READY', c.sky, '#35616b', 108);
  b += t(34, 533, '4 of 6 tasks · Before photo ready', 13, 650, c.ink);
  b += r(34, 547, 306, 6, c.sageSoft, 3);
  b += r(34, 547, 204, 6, c.evergreen2, 3);
  b += button(34, 562, 206, 'Open current job');
  b += button(250, 562, 90, 'Options', false);

  b += t(20, 645, 'Up next', 17, 760, c.ink);
  b += r(16, 660, 358, 88, c.paper, 16, c.line);
  b += circle(44, 690, 16, c.sageSoft);
  b += t(44, 695, '4', 11, 800, c.evergreen, 'middle');
  b += t(70, 686, 'Mesa HOA entrance', 14, 750, c.ink);
  b += t(70, 708, '12 min drive · gate instructions ready', 11, 500, c.slate);
  b += pill(270, 681, '10:35 AM', c.bone, c.slate, 78);
  b += chevron(344, 704, c.evergreen);

  b += r(0, 766, 390, 78, c.paper, 0);
  b += line(0, 766, 390, 766, c.line);
  const nav = [['⌂', 'Home'], ['↗', 'Route'], ['☷', 'Jobs'], ['✓', 'Job']];
  nav.forEach(([symbol, label], i) => {
    const x = 49 + i * 97;
    if (i === 1) b += r(x - 34, 776, 68, 54, c.evergreen, 15);
    b += t(x, 797, symbol, 17, 750, i === 1 ? c.white : c.slate, 'middle');
    b += t(x, 818, label, 10, 750, i === 1 ? c.white : c.slate, 'middle');
  });

  return svg(width, height, 'Grover crew route mobile high-fidelity concept', 'Action-focused mobile crew route with sync confidence, current stop priority, and stable navigation.', defs, b);
}

function managerSchedule() {
  const width = 1440;
  const height = 1024;
  const defs = `<filter id="app-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#173f35" flood-opacity=".08"/></filter>`;
  let b = `<rect width="1440" height="1024" fill="#f4f4ef"/>`;
  b += r(0, 0, 232, 1024, c.forest, 0);
  b += leafMark(28, 25, 31, true);
  b += t(70, 50, 'GROVER', 16, 850, c.white, 'start', sans, 2.2);
  b += t(28, 92, 'DESERT BLOOM LANDSCAPING', 9, 750, c.sand, 'start', sans, 1.2);
  const sections = [['⌂', 'Overview'], ['▤', 'Schedule'], ['◇', 'Customers'], ['◎', 'Team'], ['▥', 'Reports'], ['!', 'Recovery']];
  sections.forEach(([icon, label], i) => {
    const y = 124 + i * 58;
    if (i === 1) b += r(18, y - 18, 196, 44, '#2f6154', 11);
    b += t(38, y + 10, icon, 16, 750, i === 1 ? c.white : '#9db4ab', 'middle');
    b += t(66, y + 9, label, 13, 700, i === 1 ? c.white : '#c8d7d1');
    if (i === 5) b += pill(166, y - 9, '3', c.clay, c.white, 28);
  });
  b += line(24, 492, 208, 492, '#31534b');
  b += t(28, 526, 'WORKSPACE', 9, 750, '#819c92', 'start', sans, 1.4);
  b += t(28, 558, 'North Phoenix', 13, 650, c.white);
  b += t(28, 580, 'Friday, August 8', 11, 500, '#9db4ab');
  b += r(18, 922, 196, 76, '#17372f', 14);
  b += circle(47, 953, 18, c.sand);
  b += t(47, 958, 'MR', 10, 850, c.forest, 'middle');
  b += t(76, 949, 'Morgan Reyes', 12, 720, c.white);
  b += t(76, 970, 'Operations manager', 10, 500, '#9db4ab');
  b += chevron(190, 950, '#9db4ab');

  b += r(232, 0, 1208, 78, c.paper, 0);
  b += t(262, 33, 'Schedule', 11, 750, c.evergreen, 'start', sans, 1.3);
  b += t(262, 57, 'Friday dispatch', 19, 760, c.ink);
  b += r(976, 18, 222, 42, c.bone, 12, c.line);
  b += t(998, 44, 'Search crews, jobs, properties', 11, 500, c.slate);
  b += circle(1228, 39, 20, c.sageSoft);
  b += t(1228, 44, '?', 13, 800, c.evergreen, 'middle');
  b += circle(1281, 39, 20, c.claySoft);
  b += t(1281, 44, '3', 11, 800, c.clay, 'middle');
  b += button(1320, 17, 94, 'New plan');

  b += t(262, 126, 'Today’s operation', 29, 620, c.ink, 'start', display);
  b += t(262, 153, 'Balance route progress, available capacity, and the work that still needs an owner.', 13, 500, c.slate);
  b += pill(1142, 112, 'LIVE · 8:42 AM', c.mint, c.evergreen, 118);
  b += button(1274, 103, 140, 'Publish updates', false);

  const metrics = [
    ['CREWS ACTIVE', '8 / 9', 'One crew unavailable', c.sageSoft, c.evergreen],
    ['ROUTE PROGRESS', '46%', '39 of 84 stops', c.sky, '#35616b'],
    ['UNASSIGNED', '7', '3 need attention', c.amberSoft, '#7f5b22'],
    ['AT RISK', '3', 'Review before noon', c.claySoft, c.clay],
  ];
  metrics.forEach(([label, value, note, fill, accent], i) => {
    const x = 262 + i * 278;
    b += r(x, 185, 260, 100, c.paper, 15, c.line);
    b += r(x, 185, 6, 100, accent, 3);
    b += t(x + 22, 213, label, 9, 800, c.slate, 'start', sans, 1.1);
    b += t(x + 22, 251, value, 25, 780, c.ink);
    b += t(x + 102, 249, note, 11, 550, c.slate);
  });

  b += `<g filter="url(#app-shadow)">`;
  b += r(262, 307, 832, 681, c.paper, 18, c.line);
  b += `</g>`;
  b += t(286, 342, 'Crew schedule', 17, 760, c.ink);
  b += pill(438, 325, 'DAY', c.evergreen, c.white, 54);
  b += pill(498, 325, 'WEEK', c.bone, c.slate, 62);
  b += button(898, 320, 84, '‹  Prev', false);
  b += r(990, 320, 80, 42, c.paper, 11, c.line);
  b += t(1030, 346, 'Next  ›', 12, 700, c.evergreen, 'middle');
  b += line(286, 376, 1070, 376);
  b += t(290, 401, 'CREW / CAPACITY', 9, 800, c.slate, 'start', sans, 1.1);
  ['8 AM', '10 AM', '12 PM', '2 PM', '4 PM'].forEach((label, i) => b += t(528 + i * 132, 401, label, 10, 650, c.slate, 'middle'));
  [500, 632, 764, 896, 1028].forEach((x) => b += line(x, 412, x, 954, '#eaede9'));

  const crews = [
    ['North crew', '6 / 8 stops · 82%', 'Maya + 3', 0],
    ['Central crew', '5 / 7 stops · 76%', 'Andre + 2', 1],
    ['South crew', '4 / 9 stops · 93%', 'Elena + 4', 2],
    ['Install crew', '2 / 3 projects · 68%', 'Darius + 3', 3],
  ];
  crews.forEach(([name, note, people], row) => {
    const y = 424 + row * 126;
    if (row > 0) b += line(286, y - 12, 1070, y - 12);
    b += circle(312, y + 29, 18, row === 2 ? c.claySoft : c.sageSoft);
    b += t(312, y + 34, name[0], 11, 800, row === 2 ? c.clay : c.evergreen, 'middle');
    b += t(340, y + 24, name, 13, 740, c.ink);
    b += t(340, y + 45, people, 10, 550, c.slate);
    b += t(340, y + 66, note, 10, 650, row === 2 ? c.clay : c.evergreen2);
    const blocks = row === 0
      ? [[500, 626, 'Oak St · 42m', c.mint], [634, 752, 'Mesa HOA · 55m', c.sky], [778, 902, 'Citrus Grove', c.sageSoft], [920, 1054, 'Arcadia · 48m', c.amberSoft]]
      : row === 1
        ? [[500, 656, 'Stonegate · 1h', c.sky], [670, 770, 'Palm Court', c.mint], [800, 986, 'Roosevelt · 1h', c.sageSoft]]
        : row === 2
          ? [[500, 702, 'Desert Ridge · 1h 20m', c.claySoft], [716, 852, 'Tatum Ranch', c.amberSoft], [876, 1044, 'Cave Creek · 1h', c.claySoft]]
          : [[500, 746, 'Irrigation retrofit · 2h 10m', c.mint], [814, 1010, 'Tree install · 1h 20m', c.sky]];
    blocks.forEach(([x, w, label, fill]) => {
      b += r(x, y + 8, w - x, 58, fill, 10);
      b += t(x + 12, y + 33, label, 10, 720, c.ink);
      b += t(x + 12, y + 51, row === 2 ? 'Capacity risk' : 'On schedule', 9, 550, row === 2 ? c.clay : c.slate);
    });
  });
  b += r(286, 930, 784, 38, c.bone, 10);
  b += t(306, 954, '+  7 unassigned jobs', 11, 750, c.evergreen);
  b += t(1042, 954, 'Review queue →', 11, 750, c.evergreen, 'end');

  b += `<g filter="url(#app-shadow)">`;
  b += r(1114, 307, 300, 681, c.paper, 18, c.line);
  b += `</g>`;
  b += t(1138, 343, 'Dispatch focus', 17, 760, c.ink);
  b += pill(1301, 326, '3 RISKS', c.claySoft, c.clay, 83);
  b += r(1138, 380, 252, 138, c.claySoft, 14);
  b += t(1156, 408, 'CAPACITY RISK', 9, 800, c.clay, 'start', sans, 1.1);
  b += t(1156, 440, 'South crew', 17, 760, c.ink);
  b += t(1156, 464, '62 minutes over target', 12, 550, c.slate);
  b += t(1156, 486, '2 customer windows at risk', 12, 550, c.slate);
  b += t(1156, 505, 'Review reassignment  →', 11, 750, c.clay);
  b += t(1138, 558, 'Unassigned work', 13, 740, c.ink);
  const unassigned = [
    ['Hawthorne HOA', 'Weekly care · 48 min', 'Before 11 AM'],
    ['Pinnacle Offices', 'Irrigation issue · 75 min', 'Urgent'],
    ['Carver Residence', 'Approved add-on · 35 min', 'Flexible'],
  ];
  unassigned.forEach(([name, detail, timing], i) => {
    const y = 580 + i * 86;
    b += r(1138, y, 252, 72, c.bone, 12);
    b += t(1152, y + 24, name, 11, 740, c.ink);
    b += t(1152, y + 43, detail, 9, 500, c.slate);
    b += pill(1294, y + 19, timing, timing === 'Urgent' ? c.claySoft : c.paper, timing === 'Urgent' ? c.clay : c.slate, 82);
    b += chevron(1370, y + 48, c.evergreen);
  });
  b += line(1138, 852, 1390, 852);
  b += t(1138, 883, 'Publish readiness', 13, 740, c.ink);
  b += circle(1150, 908, 7, c.evergreen2); b += t(1168, 912, '8 routes ready', 11, 600, c.slate);
  b += circle(1150, 935, 7, c.gold); b += t(1168, 939, '1 draft has blockers', 11, 600, c.slate);
  b += button(1138, 953, 252, 'Review blocked route');

  return svg(width, height, 'Grover manager schedule high-fidelity concept', 'Professional desktop dispatch command center with realistic schedule lanes, capacity signals, and focused risk review.', defs, b);
}

function visualSystem() {
  const width = 1440;
  const height = 1024;
  const defs = `<filter id="token-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="#173f35" flood-opacity=".10"/></filter>`;
  let b = `<rect width="1440" height="1024" fill="${c.bone}"/>`;
  b += r(0, 0, 1440, 116, c.evergreen, 0);
  b += leafMark(48, 37, 38, true);
  b += t(100, 63, 'GROVER', 18, 850, c.white, 'start', sans, 2.6);
  b += t(100, 84, 'VISUAL FOUNDATION · V1', 9, 750, c.sand, 'start', sans, 1.5);
  b += t(1368, 64, 'Premium landscape character × operational clarity', 13, 550, '#d9e6e0', 'end');

  b += t(52, 164, 'Color', 28, 620, c.ink, 'start', display);
  const swatches = [
    ['Evergreen', c.evergreen, '#FFFFFF'], ['Forest', c.forest, '#FFFFFF'], ['Bone', c.bone, c.ink],
    ['Paper', c.paper, c.ink], ['Sage', c.sage, c.ink], ['Sand', c.sand, c.ink],
    ['Clay', c.clay, '#FFFFFF'], ['Sky', c.sky, c.ink],
  ];
  swatches.forEach(([label, fill, textColor], i) => {
    const x = 52 + i * 166;
    b += r(x, 190, 146, 104, fill, 14, fill === c.bone || fill === c.paper ? c.line : fill);
    b += t(x + 14, 265, label, 12, 750, textColor);
    b += t(x + 14, 283, fill.toUpperCase(), 9, 650, textColor, 'start', sans, .8);
  });

  b += line(52, 330, 1388, 330);
  b += t(52, 377, 'Typography', 28, 620, c.ink, 'start', display);
  b += t(52, 437, 'Care you can see.', 48, 600, c.ink, 'start', display, -.5);
  b += t(52, 474, 'Editorial display · warm, confident, human', 12, 600, c.slate);
  b += t(690, 416, 'Friday dispatch', 28, 760, c.ink);
  b += t(690, 446, 'Operational heading · direct and scannable', 12, 600, c.slate);
  b += t(690, 486, 'Oak Street Residence · 4 of 6 tasks complete', 14, 500, c.ink);
  b += t(690, 510, 'Body copy remains comfortable at field and office densities.', 12, 500, c.slate);

  b += line(52, 546, 1388, 546);
  b += t(52, 594, 'Core components', 28, 620, c.ink, 'start', display);
  b += `<g filter="url(#token-shadow)">`;
  b += r(52, 620, 420, 322, c.paper, 18, c.line);
  b += `</g>`;
  b += t(76, 656, 'Actions', 14, 760, c.ink);
  b += button(76, 678, 172, 'Primary action');
  b += button(260, 678, 164, 'Secondary', false);
  b += t(76, 760, 'Status language', 14, 760, c.ink);
  b += pill(76, 780, 'SYNCED', c.mint, c.evergreen, 76);
  b += pill(160, 780, 'NEEDS REVIEW', c.amberSoft, '#7f5b22', 114);
  b += pill(282, 780, 'AT RISK', c.claySoft, c.clay, 80);
  b += t(76, 852, 'Progress', 14, 760, c.ink);
  b += r(76, 872, 348, 8, c.sageSoft, 4);
  b += r(76, 872, 238, 8, c.evergreen2, 4);
  b += t(76, 905, '6 of 8 stops complete', 12, 650, c.slate);

  b += `<g filter="url(#token-shadow)">`;
  b += r(500, 620, 420, 322, c.paper, 18, c.line);
  b += `</g>`;
  b += t(524, 656, 'Operational record', 14, 760, c.ink);
  b += circle(550, 704, 18, c.sageSoft);
  b += t(550, 709, '3', 11, 800, c.evergreen, 'middle');
  b += t(578, 696, 'Oak Street Residence', 15, 750, c.ink);
  b += t(578, 718, 'In progress · 42 minutes planned', 11, 500, c.slate);
  b += line(524, 744, 896, 744);
  b += t(524, 774, 'Evidence readiness', 11, 700, c.ink);
  b += t(896, 774, '1 of 2', 11, 750, c.evergreen, 'end');
  b += r(524, 792, 372, 6, c.sageSoft, 3);
  b += r(524, 792, 186, 6, c.evergreen2, 3);
  b += r(524, 828, 372, 82, c.bone, 12);
  b += circle(548, 853, 7, c.gold);
  b += t(566, 857, 'After photo required before completion', 11, 650, c.ink);
  b += t(548, 884, 'Keep the recovery path beside the blocker.', 10, 500, c.slate);

  b += `<g filter="url(#token-shadow)">`;
  b += r(948, 620, 440, 322, c.evergreen, 18);
  b += `</g>`;
  b += t(974, 657, 'Material and voice', 14, 760, c.white);
  const principles = [
    ['01', 'Calm before clever', 'Reduce noise; preserve the next useful action.'],
    ['02', 'Proof over promises', 'Use real state, evidence, and accountable outcomes.'],
    ['03', 'Warm, never rustic', 'Natural materials without visual nostalgia or clichés.'],
    ['04', 'Dense when needed', 'Office tools can be rich without becoming chaotic.'],
  ];
  principles.forEach(([num, heading, copy], i) => {
    const y = 692 + i * 58;
    b += t(974, y, num, 9, 800, c.sand, 'start', sans, 1.3);
    b += t(1010, y, heading, 12, 740, c.white);
    b += t(1010, y + 20, copy, 10, 500, '#d4e2dc');
  });

  return svg(width, height, 'Grover visual foundation high-fidelity board', 'Color, typography, components, status language, and experience principles for the professional Grover design system.', defs, b);
}

const outputs = [
  ['foundations/visual-system-v1.svg', visualSystem()],
  ['high-fidelity/public/homepage-desktop-v1.svg', homepage()],
  ['high-fidelity/field/crew-route-mobile-v1.svg', crewRoute()],
  ['high-fidelity/manager/schedule-desktop-v1.svg', managerSchedule()],
];

for (const [relativePath, content] of outputs) {
  const outputPath = resolve(designRoot, relativePath);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, content, 'utf8');
}

console.log(`Rendered ${outputs.length} high-fidelity Grover concepts.`);
