const roles = {
  owner: {
    label: "Yard Owner",
    eyebrow: "YARD OWNER · SERVICE VIEW",
    title: "Your yard, clearly cared for.",
    summary:
      "See what happens next at Mesa Court, what needs your response, and what the provider will do after that.",
    stage: "Decision",
    task: "Review the recommended care plan",
    copy: "The provider has shared an exact care recommendation for the next visit. Review its scope before service is planned.",
    facts: [
      ["Property", "Mesa Court"],
      ["Recommendation", "Version 3"],
      ["Next owner", "You"],
    ],
    queue: [
      "Visit preparation follows your response",
      "Reviewed proof appears after provider approval",
    ],
    scope:
      "Provider route, crew assignment, and internal recovery stay outside your view.",
    owner: "Your response is next",
    timeline: [
      ["Today", "Recommendation ready for your review"],
      ["Next", "Provider plans the accepted work"],
      ["After care", "Reviewed proof becomes available"],
    ],
    dialog: "Inspect the exact recommendation",
    detail:
      "In the real application, this decision requires the exact current recommendation and an authorized customer response. This concept shows the context only.",
  },
  property: {
    label: "Property Manager",
    eyebrow: "PROPERTY MANAGER · PORTFOLIO VIEW",
    title: "Every property, one clear priority.",
    summary:
      "Find the one authorized property that needs a response while the rest of the portfolio stays in view.",
    stage: "Decision",
    task: "Mesa Court needs your decision",
    copy: "An updated care recommendation is waiting at this property. Open its exact scope before approving or requesting a change.",
    facts: [
      ["Property", "Mesa Court"],
      ["Decision", "Version 3"],
      ["Portfolio", "One needs review"],
    ],
    queue: [
      "Four authorized properties are on track",
      "Proof for Oak Lane is ready to review",
    ],
    scope:
      "Provider dispatch, team access, and other customers’ properties are excluded.",
    owner: "Your property decision is next",
    timeline: [
      ["Today", "Mesa Court recommendation updated"],
      ["Next", "Provider receives the exact response"],
      ["After care", "Customer-safe proof joins the property history"],
    ],
    dialog: "Inspect the property decision",
    detail:
      "A production response would be bound to this property and the exact recommendation version. This concept does not record an approval.",
  },
  company: {
    label: "Company Owner",
    eyebrow: "COMPANY OWNER · BUSINESS VIEW",
    title: "The business, ready for the day.",
    summary:
      "A concise view of operating readiness points to the accountable person for each risk.",
    stage: "Plan",
    task: "Clear one team access gap",
    copy: "One assigned team member cannot access today’s work. Resolve the company-level blocker so the office can release service confidently.",
    facts: [
      ["Readiness", "One blocker"],
      ["Owner", "Company owner"],
      ["Next handoff", "Company Manager"],
    ],
    queue: [
      "Service commitments remain visible",
      "Manager owns the exact release decision",
    ],
    scope:
      "Field task edits and exact route corrections stay with authorized operations roles.",
    owner: "You own the access blocker",
    timeline: [
      ["Today", "Team access gap surfaced"],
      ["Next", "Owner resolves membership"],
      ["Then", "Manager verifies the service release"],
    ],
    dialog: "Inspect the readiness blocker",
    detail:
      "The owner can review organization access in production. This preview does not change a membership or release a service.",
  },
  manager: {
    label: "Company Manager",
    eyebrow: "COMPANY MANAGER · OPERATIONS VIEW",
    title: "Keep every handoff in context.",
    summary:
      "The office can see the accepted work, exact plan, field response, and customer outcome as one service.",
    stage: "Plan",
    task: "Release the exact service plan",
    copy: "Mesa Court is ready for an office check. Confirm the accepted scope and crew fit before publishing the next plan.",
    facts: [
      ["Service", "Mesa Court"],
      ["Draft", "Plan 8"],
      ["Next owner", "Crew Lead after release"],
    ],
    queue: [
      "One field request needs a manager response",
      "Proof review follows crew completion",
    ],
    scope:
      "Publishing requires the real versioned workflow; this preview cannot release work.",
    owner: "Office review is next",
    timeline: [
      ["Earlier", "Customer accepted exact scope"],
      ["Today", "Plan 8 prepared for review"],
      ["Next", "Released work reaches the Crew Lead"],
    ],
    dialog: "Inspect the release decision",
    detail:
      "A real release checks the accepted scope, crew fit, and exact draft version. Nothing is published from this preview.",
  },
  lead: {
    label: "Crew Lead",
    eyebrow: "CREW LEAD · FIELD VIEW",
    title: "The right stop. The right context.",
    summary:
      "A phone-first view keeps released work, access, saved progress, and office recovery close to the current stop.",
    stage: "Field work",
    task: "Confirm the released stop",
    copy: "Check the assigned work, property access, and safety notes before starting care at Mesa Court.",
    facts: [
      ["Stop", "Mesa Court"],
      ["Release", "Plan 8"],
      ["Connection", "Ready to sync"],
    ],
    queue: [
      "Photo evidence follows task completion",
      "Office owns plan changes after a field request",
    ],
    scope:
      "Customer price and office plan publication are outside the field view.",
    owner: "You own stop readiness",
    timeline: [
      ["Earlier", "Office released assigned work"],
      ["Now", "Confirm access, scope, and safety"],
      ["Next", "Complete work or request an office correction"],
    ],
    dialog: "Inspect stop readiness",
    detail:
      "The real field flow checks assignment, access, safety, and device-held work. This preview does not start a job or alter a released route.",
  },
};

const audiences = {
  customer: {
    eyebrow: "FOR THE PEOPLE WHO CARE ABOUT THE PLACE",
    title: "Know what your yard needs. See what was done.",
    lede: "Your next step, your visit, and your finished care belong in one understandable story.",
    cta: "Preview the Yard Owner view",
    role: "owner",
    artLabel: "CUSTOMER-SAFE VIEW",
    artTitle: "A service that makes sense at a glance.",
    artCopy:
      "An exact decision leads to a clear visit and provider-reviewed proof.",
    detailTitle: "The answers you need, when you need them.",
    points: [
      [
        "Understand the next step",
        "See whether a decision, preparation, or provider action comes next.",
      ],
      [
        "Follow the visit",
        "Read customer-relevant timing and status without the provider’s private route details.",
      ],
      [
        "Review the result",
        "See delivered proof after the provider has reviewed it.",
      ],
    ],
  },
  provider: {
    eyebrow: "FOR THE TEAM DOING THE WORK",
    title: "A better line from office to field.",
    lede: "Keep the customer decision, released plan, field request, and finished work attached to the same service.",
    cta: "Preview the Company Manager view",
    role: "manager",
    artLabel: "PROVIDER OPERATIONS VIEW",
    artTitle: "The next handoff is always clear.",
    artCopy:
      "Office and field see the same service through their own authorized work.",
    detailTitle: "Less context lost between people.",
    points: [
      [
        "Plan with confidence",
        "Check accepted scope and crew fit before an exact version is released.",
      ],
      [
        "Give the field clarity",
        "Put access, safety, assigned work, and saved progress near the current stop.",
      ],
      [
        "Close the loop",
        "Review submitted evidence before customer-safe proof is delivered.",
      ],
    ],
  },
};

const $ = (selector) => document.querySelector(selector);
const main = $("#main");
const dialog = $("#preview-dialog");
let dialogTrigger = null;

function setText(selector, value) {
  $(selector).textContent = value;
}
function fillList(selector, items, makeItem) {
  const list = $(selector);
  list.replaceChildren(...items.map(makeItem));
}
function routeParts() {
  const parts = location.hash.replace(/^#/, "").split("/");
  if (parts[0] === "workspace")
    return {
      page: "workspace",
      role: roles[parts[1]] ? parts[1] : "owner",
      state: ["attention", "on-track", "unavailable"].includes(parts[2])
        ? parts[2]
        : "attention",
    };
  return {
    page: ["home", "customer", "provider"].includes(parts[0])
      ? parts[0]
      : "home",
  };
}
function goWorkspace(role, state) {
  location.hash = `workspace/${role}${state === "attention" ? "" : `/${state}`}`;
}
function showScreen(page) {
  ["home", "audience", "workspace"].forEach((name) => {
    $(`#${name}-screen`).hidden = name !== page;
  });
  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === page) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}
function renderAudience(page) {
  const data = audiences[page];
  setText("#audience-eyebrow", data.eyebrow);
  setText("#audience-title", data.title);
  setText("#audience-lede", data.lede);
  setText("#audience-art-label", data.artLabel);
  setText("#audience-art-title", data.artTitle);
  setText("#audience-art-copy", data.artCopy);
  setText("#audience-detail-title", data.detailTitle);
  const cta = $("#audience-cta");
  cta.href = `#workspace/${data.role}`;
  cta.textContent = `${data.cta} ↗`;
  $("#audience-secondary").href = cta.href;
  fillList("#audience-points", data.points, ([title, copy], index) => {
    const item = document.createElement("article");
    item.className = "point";
    const number = document.createElement("span");
    number.textContent = `0${index + 1}`;
    const body = document.createElement("div");
    const heading = document.createElement("h3");
    heading.textContent = title;
    const text = document.createElement("p");
    text.textContent = copy;
    body.append(heading, text);
    item.append(number, body);
    return item;
  });
}
function clearServiceText() {
  [
    "#service-stage",
    "#task-kicker",
    "#task-status",
    "#task-title",
    "#task-copy",
    "#task-owner",
    "#scope-copy",
  ].forEach((selector) => setText(selector, ""));
  ["#task-facts", "#queue-list", "#timeline-list"].forEach((selector) =>
    $(selector).replaceChildren(),
  );
}
function renderWorkspace(role, state) {
  const data = roles[role];
  document.body.dataset.persona = role;
  document.body.dataset.reviewState = state;
  $("#role-select").value = role;
  $("#state-select").value = state;
  setText("#toolbar-role", data.label);
  document.querySelectorAll("[data-workspace-link]").forEach((link) => {
    if (link.dataset.workspaceLink === role)
      link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  setText(
    "#workspace-eyebrow",
    state === "unavailable" ? "WORKSPACE · READ STATE" : data.eyebrow,
  );
  setText(
    "#workspace-title",
    state === "unavailable"
      ? "We cannot confirm this service yet."
      : data.title,
  );
  setText(
    "#workspace-summary",
    state === "unavailable"
      ? "Try again from an authorized workspace when the service is available."
      : data.summary,
  );
  $("#service-content").hidden = state === "unavailable";
  $("#unavailable-content").hidden = state !== "unavailable";
  $(".date-chip").hidden = state === "unavailable";
  setText(".date-chip strong", state === "unavailable" ? "" : "Mesa Court");
  setText(".date-chip span", state === "unavailable" ? "" : "September 16");
  if (state === "unavailable") {
    clearServiceText();
    return;
  }
  setText("#service-stage", data.stage);
  const current = ["Decision", "Plan", "Field work", "Reviewed proof"].indexOf(
    data.stage,
  );
  document.querySelectorAll(".progress-rail li").forEach((item, index) => {
    item.classList.toggle("done", index < current);
    item.classList.toggle("current", index === current);
    if (index === current) item.setAttribute("aria-current", "step");
    else item.removeAttribute("aria-current");
  });
  const onTrack = state === "on-track";
  setText("#task-kicker", onTrack ? "CURRENT STATUS" : "YOUR NEXT STEP");
  setText("#task-status", onTrack ? "On track" : "Needs attention");
  $("#task-status").classList.toggle("track", onTrack);
  setText("#task-title", onTrack ? "No action needed right now." : data.task);
  setText(
    "#task-copy",
    onTrack
      ? `The next step in this service is owned by ${role === "lead" ? "the office" : "the responsible team"}. You can still inspect the current context and timeline.`
      : data.copy,
  );
  setText(
    "#task-owner",
    onTrack ? "The next update has an assigned owner" : data.owner,
  );
  $("#task-action").firstChild.textContent = onTrack
    ? "Inspect service context "
    : "Inspect task ";
  fillList("#task-facts", data.facts, ([label, value]) => {
    const item = document.createElement("div");
    const small = document.createElement("small");
    small.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = value;
    item.append(small, strong);
    return item;
  });
  fillList("#queue-list", data.queue, (value) => {
    const item = document.createElement("li");
    item.textContent = value;
    return item;
  });
  setText("#scope-copy", data.scope);
  fillList("#timeline-list", data.timeline, ([when, what]) => {
    const item = document.createElement("li");
    const time = document.createElement("span");
    time.textContent = when;
    const text = document.createElement("strong");
    text.textContent = what;
    item.append(time, text);
    return item;
  });
}
function render(focus = false) {
  const route = routeParts();
  showScreen(
    route.page === "workspace"
      ? "workspace"
      : route.page === "home"
        ? "home"
        : "audience",
  );
  if (route.page === "workspace") renderWorkspace(route.role, route.state);
  else if (route.page !== "home") renderAudience(route.page);
  document.title =
    route.page === "workspace"
      ? `${roles[route.role].label} preview · Grover`
      : route.page === "home"
        ? "Grover · Modern website concept"
        : `${route.page === "customer" ? "Yard Owner" : "Provider"} path · Grover`;
  if (focus) {
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }
}
function openDialog(recovery = false) {
  const { role, state } = routeParts();
  const data = roles[role];
  dialogTrigger = document.activeElement;
  setText(
    "#dialog-title",
    recovery
      ? "When the service cannot be confirmed"
      : state === "on-track"
        ? "Inspect the current service"
        : data.dialog,
  );
  setText(
    "#dialog-copy",
    recovery
      ? "The live application must show a safe retry or support path without displaying stale protected data."
      : "This is the context behind the next step. The live application would require authorization and current data before action.",
  );
  setText(
    "#dialog-detail",
    recovery
      ? "Return to the workspace and retry the authorized read. If the problem continues, use the named support path in the live product."
      : data.detail,
  );
  dialog.showModal();
  $("#dialog-close").focus();
}
function closeDialog() {
  dialog.close();
}

window.addEventListener("hashchange", () => render(true));
$("#role-select").addEventListener("change", (event) =>
  goWorkspace(event.target.value, $("#state-select").value),
);
$("#state-select").addEventListener("change", (event) =>
  goWorkspace($("#role-select").value, event.target.value),
);
$("#task-action").addEventListener("click", () => openDialog());
$("#recovery-action").addEventListener("click", () => openDialog(true));
$("#dialog-close").addEventListener("click", closeDialog);
$("#dialog-return").addEventListener("click", closeDialog);
dialog.addEventListener("close", () => {
  if (dialogTrigger instanceof HTMLElement) dialogTrigger.focus();
  dialogTrigger = null;
});
$(".skip-link").addEventListener("click", (event) => {
  event.preventDefault();
  main.focus();
});
render();
