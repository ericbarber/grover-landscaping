const personaContent = {
  owner: {
    label: "Yard owner",
    eyebrow: "Confidence after every visit",
    headline: "See the care behind your yard.",
    description: "Know what was planned, what was completed, and what your property may need next—without chasing an update.",
    cta: "Join early access",
    dialogTitle: "Be among the first to experience Grover.",
    conversionTitle: "See the care behind every visit.",
    conversionCopy: "Tell us what would make landscape service feel clearer, from upcoming work to visible proof and useful recommendations.",
    preview: {
      status: "Report ready",
      kicker: "Oak Street residence",
      title: "Your latest service is ready",
      copy: "Completed work, photo evidence, and the next recommendation are together in one update.",
      progress: 100,
      progressLabel: "Latest service report complete",
      metaOne: "Service complete",
      metaTwo: "1 recommendation",
    },
    storyTitle: "See the care behind your yard.",
    storyDescription: "Grover turns the provider’s operational work into a simple customer view without exposing crew assignment, audit details, or internal recovery tools.",
    outcomes: [
      ["Know what’s next", "Upcoming service and property expectations stay easy to find."],
      ["See the care", "Before-and-after evidence makes each visit feel tangible."],
      ["Stay ahead", "Recommendations arrive with the context needed to decide."],
    ],
  },
  property: {
    label: "Property manager",
    eyebrow: "Clarity across every address",
    headline: "Keep every property ready.",
    description: "Track service quality, open needs, and completion evidence across your portfolio from one focused view.",
    cta: "Discuss my portfolio",
    dialogTitle: "Let’s talk about your properties.",
    conversionTitle: "Bring every property into view.",
    conversionCopy: "Show us where status chasing or scattered evidence slows your team down. We’ll tailor the conversation to your portfolio.",
    preview: {
      status: "2 need review",
      kicker: "Portfolio readiness",
      title: "14 of 16 properties on track",
      copy: "The two open needs have owners, due dates, and service evidence ready for review.",
      progress: 88,
      progressLabel: "Fourteen of sixteen properties on track",
      metaOne: "14 on track",
      metaTwo: "2 owned needs",
    },
    storyTitle: "Keep every property ready.",
    storyDescription: "Service progress, open needs, and approved proof stay visible across addresses while vendor-internal tools remain out of view.",
    outcomes: [
      ["See the whole portfolio", "Service progress and open needs stay visible across addresses."],
      ["Replace status chasing", "Shared progress reduces calls between properties and providers."],
      ["Report with confidence", "Property-ready evidence supports owners and stakeholders."],
    ],
  },
  company: {
    label: "Landscaping company",
    eyebrow: "Operations customers can trust",
    headline: "Plan every visit. Care with confidence. Prove the work.",
    description: "Connect scheduling, crews, proof, customer communication, and revenue in one calm operating view.",
    cta: "Request a walkthrough",
    dialogTitle: "See how Grover fits your operation.",
    conversionTitle: "See how Grover fits your operation.",
    conversionCopy: "Bring the workflow that creates the most back-and-forth. We’ll shape the conversation around your team and the result you need.",
    preview: {
      status: "On track",
      kicker: "Today · North crew",
      title: "6 of 8 properties complete",
      copy: "Photos are synced and one completion report is ready for review.",
      progress: 75,
      progressLabel: "Six of eight properties complete",
      metaOne: "Field progress visible",
      metaTwo: "1 review needed",
    },
    storyTitle: "Turn great field work into growth.",
    storyDescription: "Grover keeps the office, field, and customer handoff connected without giving every person the same crowded workspace.",
    outcomes: [
      ["Run a clearer day", "Routes, crews, property context, and exceptions stay connected."],
      ["Move approvals faster", "Evidence and recommendations give customers a complete story."],
      ["Turn work into revenue", "Verified completion keeps approved work moving toward invoice."],
    ],
  },
  crew: {
    label: "Crew lead",
    eyebrow: "A better day in the field",
    headline: "Know the next stop—and what done looks like.",
    description: "Give crews the route, service details, and evidence requirements they need without the office back-and-forth.",
    cta: "Request a field demo",
    dialogTitle: "See a better field day.",
    conversionTitle: "Make every stop field-ready.",
    conversionCopy: "Tell us what crews need to know before arrival and what the office needs back when the work is finished.",
    preview: {
      status: "In progress",
      kicker: "Stop 3 of 8",
      title: "Oak Street residence",
      copy: "Four of six tasks are complete. Required property context is available offline.",
      progress: 67,
      progressLabel: "Four of six tasks complete",
      metaOne: "Details offline-ready",
      metaTwo: "2 tasks remain",
    },
    storyTitle: "Know the next stop—and what done looks like.",
    storyDescription: "Current work stays primary on mobile, with the full route, assigned jobs, and job-level evidence one tap away.",
    outcomes: [
      ["Start field-ready", "Every stop includes the service and property details crews need."],
      ["Keep working offline", "Progress and evidence wait safely when coverage disappears."],
      ["Finish with a clean handoff", "Photos, notes, and exceptions reach the office together."],
    ],
  },
};

const workflowContent = {
  plan: {
    label: "Manager workspace",
    title: "Publish a field-ready plan.",
    description: "Balance crew capacity, service expectations, route time, and the exceptions that could derail the day.",
    outcomes: {
      owner: "Your provider arrives with the right service expectations and property context.",
      property: "Each address has a visible service plan and ownership before work begins.",
      company: "Crews start with an ordered route and property context they can act on.",
      crew: "You start with an ordered route, access notes, service scope, and realistic timing.",
    },
    preview: `
      <div class="preview-toolbar">
        <div><p class="mini-label">Monday route</p><strong>North Phoenix · Crew A</strong></div>
        <span class="status-pill status-positive">Ready to publish</span>
      </div>
      <div class="route-list">
        <div><b>01</b><span><strong>Ocotillo Court</strong><small>Weekly service · access ready</small></span><time>7:30</time></div>
        <div><b>02</b><span><strong>Saguaro Ridge</strong><small>Biweekly service · 55 min</small></span><time>8:25</time></div>
        <div><b>03</b><span><strong>Desert Willow Commons</strong><small>Irrigation check included</small></span><time>9:40</time></div>
      </div>
      <div class="preview-summary"><span>8 properties</span><span>6h 40m planned</span><span>82% capacity</span></div>`,
  },
  care: {
    label: "Field workspace",
    title: "Keep the current stop clear.",
    description: "Put the required work, progress, property instructions, and safe next action ahead of secondary tools.",
    outcomes: {
      owner: "The work completed at your property stays tied to the service you expected.",
      property: "Property-specific instructions and open needs travel with the work, not in a separate thread.",
      company: "The office can see progress without interrupting the crew for a status update.",
      crew: "You can keep working through weak signal and send one clean handoff when coverage returns.",
    },
    preview: `
      <div class="preview-toolbar">
        <div><p class="mini-label">Stop 3 of 8 · current work</p><strong>Desert Willow Commons</strong></div>
        <span class="status-pill status-attention">In progress</span>
      </div>
      <div class="route-list">
        <div><b>✓</b><span><strong>Mow and edge</strong><small>Completed at 9:52 AM</small></span><time>Done</time></div>
        <div><b>02</b><span><strong>Irrigation check</strong><small>Front zone · note low pressure</small></span><time>Now</time></div>
        <div><b>03</b><span><strong>Completion photos</strong><small>Front and courtyard required</small></span><time>Next</time></div>
      </div>
      <div class="preview-summary"><span>Offline changes queued</span><span>4 of 6 tasks</span><span>42 min planned</span></div>`,
  },
  proof: {
    label: "Customer-ready handoff",
    title: "Turn completion into confidence.",
    description: "Bring service steps, evidence, notes, recommendations, review, and delivery into one traceable story.",
    outcomes: {
      owner: "You receive a simple record of what changed and what may need attention next.",
      property: "Stakeholders can review consistent evidence across properties without vendor-internal detail.",
      company: "Approved work moves from completion toward customer communication and billing readiness.",
      crew: "Your completed checklist, photos, and notes reach the office together without re-entry.",
    },
    preview: `
      <div class="preview-toolbar">
        <div><p class="mini-label">Completion review</p><strong>Service story ready</strong></div>
        <span class="status-pill status-positive">Evidence complete</span>
      </div>
      <div class="route-list">
        <div><b>✓</b><span><strong>Required service steps</strong><small>6 of 6 confirmed</small></span><time>Complete</time></div>
        <div><b>✓</b><span><strong>Before and after evidence</strong><small>4 approved photos</small></span><time>Ready</time></div>
        <div><b>↗</b><span><strong>Customer recommendation</strong><small>Irrigation pressure review</small></span><time>Review</time></div>
      </div>
      <div class="preview-summary"><span>Report ready</span><span>Audit trail retained</span><span>Delivery pending</span></div>`,
  },
};

const state = {
  persona: "company",
  workflow: "plan",
  dialogTrigger: null,
};

const selectAll = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function activatePersona(personaId, { focus = false, updateAddress = true } = {}) {
  const content = personaContent[personaId];
  if (!content) return;
  state.persona = personaId;

  selectAll("[data-persona]").forEach((button) => {
    const selected = button.dataset.persona === personaId;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
    if (selected && focus) button.focus();
  });

  setText("[data-hero-eyebrow]", content.eyebrow);
  setText("[data-hero-title]", content.headline);
  setText("[data-hero-description]", content.description);
  selectAll("[data-cta-label]").forEach((element) => { element.textContent = content.cta; });
  setText("[data-preview-status]", content.preview.status);
  setText("[data-preview-kicker]", content.preview.kicker);
  setText("[data-preview-title]", content.preview.title);
  setText("[data-preview-copy]", content.preview.copy);
  setText("[data-preview-meta-one]", content.preview.metaOne);
  setText("[data-preview-meta-two]", content.preview.metaTwo);
  const progress = document.querySelector("[data-preview-progress]");
  progress?.setAttribute("aria-label", content.preview.progressLabel);
  const progressValue = progress?.querySelector("span");
  if (progressValue) progressValue.style.width = `${content.preview.progress}%`;
  setText("[data-audience-title]", content.storyTitle);
  setText("[data-audience-description]", content.storyDescription);
  content.outcomes.forEach(([title, copy], index) => {
    setText(`[data-outcome-title="${index}"]`, title);
    setText(`[data-outcome-copy="${index}"]`, copy);
  });
  setText("[data-conversion-title]", content.conversionTitle);
  setText("[data-conversion-copy]", content.conversionCopy);
  setText("[data-dialog-title]", content.dialogTitle);
  const formPersona = document.querySelector("[data-form-persona]");
  if (formPersona) formPersona.value = personaId;
  const submitButton = document.querySelector("[data-submit-button]");
  if (submitButton) submitButton.textContent = content.cta;
  updateWorkflow(state.workflow);
  document.title = `${content.label} landscape care | Grover working design`;

  if (updateAddress && window.location.protocol !== "file:") {
    const url = new URL(window.location.href);
    url.searchParams.set("audience", personaId);
    window.history.replaceState({}, "", url);
  }
}

function updateWorkflow(workflowId, { focus = false } = {}) {
  const content = workflowContent[workflowId];
  if (!content) return;
  state.workflow = workflowId;

  selectAll("[data-workflow]").forEach((button) => {
    const selected = button.dataset.workflow === workflowId;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
    if (selected && focus) button.focus();
  });

  setText("[data-workflow-label]", content.label);
  setText("[data-workflow-title]", content.title);
  setText("[data-workflow-description]", content.description);
  setText("[data-workflow-outcome]", content.outcomes[state.persona]);
  const panel = document.querySelector("#workflow-panel");
  const selectedTab = document.querySelector(`[data-workflow="${workflowId}"]`);
  panel?.setAttribute("aria-labelledby", selectedTab?.id || "");
  const preview = document.querySelector("[data-workflow-preview]");
  if (preview) preview.innerHTML = content.preview;
}

function handleTabKeys(event, selector, activate) {
  const tabs = selectAll(selector);
  const currentIndex = tabs.indexOf(event.currentTarget);
  if (currentIndex < 0) return;
  let nextIndex;

  if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % tabs.length;
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = tabs.length - 1;
  if (nextIndex === undefined) return;

  event.preventDefault();
  activate(tabs[nextIndex]);
}

function closeNavigation() {
  const button = document.querySelector("[data-menu-button]");
  const navigation = document.querySelector("[data-navigation]");
  button?.setAttribute("aria-expanded", "false");
  navigation?.removeAttribute("data-open");
  const label = button?.querySelector(".sr-only");
  if (label) label.textContent = "Open navigation";
}

function openDialog(trigger) {
  const dialog = document.querySelector("[data-dialog]");
  const form = document.querySelector("[data-request-form]");
  const success = document.querySelector("[data-success-state]");
  if (!dialog || !form || !success) return;
  state.dialogTrigger = trigger;
  form.hidden = false;
  success.hidden = true;
  document.querySelector("[data-form-error]")?.setAttribute("hidden", "");
  activatePersona(state.persona, { updateAddress: false });
  closeNavigation();
  document.body.classList.add("dialog-open");
  dialog.showModal();
  window.requestAnimationFrame(() => dialog.querySelector("[data-form-persona]")?.focus());
}

function closeDialog() {
  document.querySelector("[data-dialog]")?.close();
}

function clearFieldError(field) {
  field.removeAttribute("aria-invalid");
  const error = document.querySelector(`[data-error-for="${field.name}"]`);
  if (error) error.textContent = "";
}

function setFieldError(field, message) {
  field.setAttribute("aria-invalid", "true");
  const error = document.querySelector(`[data-error-for="${field.name}"]`);
  if (error) error.textContent = message;
}

function validateForm(form) {
  const fields = [form.elements.name, form.elements.email, form.elements.consent];
  fields.forEach(clearFieldError);
  let valid = true;
  let firstInvalid = null;

  if (!form.elements.name.value.trim()) {
    setFieldError(form.elements.name, "Enter your name so the conversation has a clear contact.");
    firstInvalid ||= form.elements.name;
    valid = false;
  }

  if (!form.elements.email.value.trim()) {
    setFieldError(form.elements.email, "Enter a work email.");
    firstInvalid ||= form.elements.email;
    valid = false;
  } else if (!form.elements.email.validity.valid) {
    setFieldError(form.elements.email, "Enter an email in the format name@example.com.");
    firstInvalid ||= form.elements.email;
    valid = false;
  }

  if (!form.elements.consent.checked) {
    setFieldError(form.elements.consent, "Confirm contact permission to preview submission.");
    firstInvalid ||= form.elements.consent;
    valid = false;
  }

  firstInvalid?.focus();
  return valid;
}

async function submitRequest(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("[data-submit-button]");
  const error = form.querySelector("[data-form-error]");
  if (!validateForm(form)) return;

  error.hidden = true;
  button.disabled = true;
  button.textContent = "Checking request…";
  await new Promise((resolve) => window.setTimeout(resolve, 550));

  if (form.elements["simulate-error"].checked) {
    error.hidden = false;
    button.disabled = false;
    button.textContent = personaContent[form.elements.persona.value].cta;
    error.focus?.();
    return;
  }

  setText("[data-success-name]", form.elements.name.value.trim().split(/\s+/)[0]);
  form.hidden = true;
  const success = document.querySelector("[data-success-state]");
  success.hidden = false;
  success.focus();
  button.disabled = false;
  button.textContent = personaContent[state.persona].cta;
}

function initialize() {
  const menuButton = document.querySelector("[data-menu-button]");
  const navigation = document.querySelector("[data-navigation]");
  menuButton?.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!open));
    const label = menuButton.querySelector(".sr-only");
    if (label) label.textContent = open ? "Open navigation" : "Close navigation";
    if (open) navigation?.removeAttribute("data-open");
    else navigation?.setAttribute("data-open", "true");
  });

  selectAll("[data-navigation] a").forEach((link) => link.addEventListener("click", closeNavigation));

  selectAll("[data-persona]").forEach((button) => {
    button.addEventListener("click", () => activatePersona(button.dataset.persona));
    button.addEventListener("keydown", (event) => handleTabKeys(event, "[data-persona]", (next) => activatePersona(next.dataset.persona, { focus: true })));
  });

  selectAll("[data-workflow]").forEach((button) => {
    button.addEventListener("click", () => updateWorkflow(button.dataset.workflow));
    button.addEventListener("keydown", (event) => handleTabKeys(event, "[data-workflow]", (next) => updateWorkflow(next.dataset.workflow, { focus: true })));
  });

  selectAll("[data-open-dialog]").forEach((button) => button.addEventListener("click", () => openDialog(button)));
  selectAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", closeDialog));

  const dialog = document.querySelector("[data-dialog]");
  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });
  dialog?.addEventListener("close", () => {
    document.body.classList.remove("dialog-open");
    state.dialogTrigger?.focus();
  });
  dialog?.addEventListener("cancel", () => document.body.classList.remove("dialog-open"));

  const form = document.querySelector("[data-request-form]");
  form?.addEventListener("submit", submitRequest);
  selectAll("input, select", form).forEach((field) => {
    field.addEventListener("input", () => clearFieldError(field));
    field.addEventListener("change", () => clearFieldError(field));
  });
  form?.elements.persona.addEventListener("change", (event) => {
    const content = personaContent[event.target.value];
    setText("[data-dialog-title]", content.dialogTitle);
    const button = form.querySelector("[data-submit-button]");
    if (button) button.textContent = content.cta;
  });

  const initialPersona = new URLSearchParams(window.location.search).get("audience");
  activatePersona(personaContent[initialPersona] ? initialPersona : "company", { updateAddress: false });
  updateWorkflow("plan");
}

initialize();
