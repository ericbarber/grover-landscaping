import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "../../frontend/node_modules/playwright/index.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const prototype = resolve(
  here,
  "..",
  "prototypes",
  "modern-grover",
  "index.html",
);
const url = pathToFileURL(prototype).href;
const planUrl = pathToFileURL(resolve(prototype, "..", "plan.html")).href;
const roles = ["owner", "property", "company", "manager", "lead"];
const states = ["attention", "on-track", "unavailable"];
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "phone", width: 390, height: 844 },
  { name: "narrow phone", width: 320, height: 720 },
];

function check(condition, message) {
  if (!condition) throw new Error(message);
}
function hash(page) {
  return new URL(page.url()).hash;
}

const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(`${url}#home`);
    check(
      (await page.locator("#home-screen h1:visible").count()) === 1,
      `${viewport.name}: home heading`,
    );
    check(
      (await page.locator(".path-card").count()) === 2,
      `${viewport.name}: audience paths`,
    );
    check(
      (await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      )) <= 1,
      `${viewport.name}: home overflows`,
    );
    await page.getByRole("link", { name: /Read earlier plan/ }).click();
    check(
      new URL(page.url()).pathname.endsWith("/modern-grover/plan.html"),
      `${viewport.name}: review link did not open the styled plan`,
    );
    await page.goto(`${url}#home`);
    await page.getByRole("link", { name: /See the customer journey/ }).click();
    check(
      hash(page) === "#customer",
      `${viewport.name}: customer path did not open`,
    );
    await page.waitForFunction(() =>
      document.querySelector("#audience-title").textContent.includes("yard"),
    );
    check(
      (await page.locator("#audience-title").textContent()).includes("yard"),
      `${viewport.name}: customer content missing`,
    );
    check(
      (await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      )) <= 1,
      `${viewport.name}: customer path overflows`,
    );
    await page
      .getByRole("link", { name: /Preview the Yard Owner view/ })
      .click();
    check(
      hash(page) === "#workspace/owner",
      `${viewport.name}: customer-to-workspace handoff`,
    );
    await page.waitForFunction(() => document.body.dataset.persona === "owner");
    await page.goto(`${url}#provider`);
    await page.waitForFunction(() =>
      document.querySelector("#audience-title").textContent.includes("office"),
    );
    check(
      (await page.locator("#audience-title").textContent()).includes("office"),
      `${viewport.name}: provider content missing`,
    );
    check(
      (await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      )) <= 1,
      `${viewport.name}: provider path overflows`,
    );
    await page
      .getByRole("link", { name: /Preview the Company Manager view/ })
      .click();
    check(
      hash(page) === "#workspace/manager",
      `${viewport.name}: provider-to-workspace handoff`,
    );

    for (const role of roles) {
      for (const state of states) {
        await page.goto(`${url}#workspace/${role}/${state}`);
        check(
          (await page.locator("body").getAttribute("data-persona")) === role,
          `${viewport.name}/${role}: wrong perspective`,
        );
        check(
          (await page.locator("body").getAttribute("data-review-state")) ===
            state,
          `${viewport.name}/${role}: wrong state`,
        );
        check(
          (await page.locator("#workspace-screen h1:visible").count()) === 1,
          `${viewport.name}/${role}/${state}: expected one heading`,
        );
        if (state === "unavailable") {
          check(
            await page.locator("#service-content").isHidden(),
            `${viewport.name}/${role}: unavailable service visible`,
          );
          check(
            !(await page.locator("#workspace-screen").textContent()).includes(
              "Plan 8",
            ),
            `${viewport.name}/${role}: protected plan remains in unavailable DOM`,
          );
          check(
            !(await page.locator("#workspace-screen").textContent()).includes(
              "Mesa Court",
            ),
            `${viewport.name}/${role}: protected property remains in unavailable DOM`,
          );
        } else {
          check(
            (await page.locator("#task-facts div").count()) === 3,
            `${viewport.name}/${role}/${state}: task context missing`,
          );
          check(
            (await page
              .locator('.progress-rail [aria-current="step"]')
              .count()) === 1,
            `${viewport.name}/${role}/${state}: current stage missing`,
          );
          check(
            (await page.locator("#timeline-list li").count()) === 3,
            `${viewport.name}/${role}/${state}: service timeline missing`,
          );
        }
        const overflow = await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        );
        check(
          overflow <= 1,
          `${viewport.name}/${role}/${state}: horizontal overflow ${overflow}px`,
        );
      }
    }

    await page.goto(`${url}#workspace/owner`);
    check(
      !(await page.locator("#workspace-screen").textContent()).includes(
        "Plan 8",
      ),
      `${viewport.name}: provider plan leaked to owner`,
    );
    await page.getByRole("button", { name: /Inspect task/ }).click();
    check(
      await page.locator("#preview-dialog").evaluate((node) => node.open),
      `${viewport.name}: dialog did not open`,
    );
    check(
      (await page.locator("#preview-dialog").textContent()).includes(
        "does not save",
      ),
      `${viewport.name}: non-persistence disclosure missing`,
    );
    await page.keyboard.press("Escape");
    check(
      await page
        .getByRole("button", { name: /Inspect task/ })
        .evaluate((node) => node === document.activeElement),
      `${viewport.name}: focus not restored`,
    );
    await page.selectOption("#role-select", "lead");
    check(
      hash(page).startsWith("#workspace/lead"),
      `${viewport.name}: role selector did not route`,
    );
    check(
      !(await page.locator("#workspace-screen").textContent()).includes("$"),
      `${viewport.name}: customer pricing leaked to field`,
    );
    await page.selectOption("#state-select", "unavailable");
    check(
      hash(page) === "#workspace/lead/unavailable",
      `${viewport.name}: review state URL unstable`,
    );
    await page
      .getByRole("button", { name: /Inspect recovery guidance/ })
      .click();
    check(
      (await page.locator("#dialog-detail").textContent()).includes(
        "authorized read",
      ),
      `${viewport.name}: recovery guidance missing`,
    );
    await page.getByRole("button", { name: "Return to preview" }).click();
    check(
      errors.length === 0,
      `${viewport.name}: browser errors: ${errors.join("; ")}`,
    );
    await page.close();

    const planPage = await browser.newPage({ viewport });
    const planErrors = [];
    planPage.on("pageerror", (error) => planErrors.push(error.message));
    planPage.on("console", (message) => {
      if (message.type() === "error") planErrors.push(message.text());
    });
    await planPage.goto(planUrl);
    check(
      (await planPage.locator("h1:visible").count()) === 1,
      `${viewport.name}: styled plan heading missing`,
    );
    check(
      (await planPage.locator(".plan-surface-list article").count()) === 4,
      `${viewport.name}: plan surfaces missing`,
    );
    check(
      (await planPage.locator(".plan-phase-list li").count()) === 4,
      `${viewport.name}: plan phases missing`,
    );
    check(
      (await planPage
        .locator(".plan-hero")
        .evaluate((element) => getComputedStyle(element).backgroundColor)) ===
        "rgb(15, 47, 40)",
      `${viewport.name}: plan stylesheet did not load`,
    );
    check(
      (await planPage.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      )) <= 1,
      `${viewport.name}: styled plan overflows`,
    );
    await planPage.getByRole("link", { name: /Open prototype/ }).click();
    check(
      hash(planPage) === "#home",
      `${viewport.name}: plan did not return to the prototype`,
    );
    check(
      planErrors.length === 0,
      `${viewport.name}: plan browser errors: ${planErrors.join("; ")}`,
    );
    await planPage.close();
  }
  console.log(
    "Modern Grover prototype: public paths, five roles, three states, styled plan, privacy, dialog, and responsive checks passed.",
  );
} finally {
  await browser.close();
}
