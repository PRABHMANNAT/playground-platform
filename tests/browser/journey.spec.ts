import { test, expect, Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
mkdirSync("docs/verification", { recursive: true });
async function signIn(page: Page, account = "alice") {
  await page.goto("/");
  await page.getByRole("link", { name: "Open your workspace" }).click();
  await page.getByLabel("Test account").selectOption(account);
  await page.getByRole("button", { name: "Sign in locally" }).click();
  await expect(
    page
      .getByRole("heading", { name: "Make your next move with evidence." })
      .or(
        page.getByRole("heading", {
          name: "Every product starts with a question.",
        }),
      ),
  ).toBeVisible();
}
async function nav(page: Page, name: string) {
  if (await page.getByRole("button", { name: "Toggle navigation" }).isVisible())
    await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page.locator("nav").getByRole("button", { name, exact: true }).click();
}
test("complete demo journey, independent test feedback, retest and responsive evidence", async ({
  page,
  context,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await signIn(page);
  await page
    .getByLabel("Select project")
    .selectOption({ label: "HireFlow · Demo" });
  await page.screenshot({
    path: "docs/verification/overview-1440.png",
    fullPage: true,
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Describe & confirm your brief" })
    .click();
  await page
    .getByLabel("Describe your product")
    .fill(
      "We help small teams create roles and organize applications. Validate whether a hiring manager can publish without help.",
    );
  await page.getByRole("button", { name: "Save answer", exact: true }).click();
  await expect(page.locator(".chat.user").last()).toContainText("small teams");
  await page
    .getByRole("button", { name: "Confirm brief", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Give every journey a purpose." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Restore sample defaults", exact: true })
    .click();
  await page.getByLabel("Build reference").selectOption("A");
  await page.getByText("I authorize this target").locator("input").check();
  await page.getByRole("button", { name: "Approve plan", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Launch demo", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Launch demo", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Watch the journey. Find the friction.",
    }),
  ).toBeVisible();
  await expect(page.locator(".timeline button")).toHaveCount(4);
  await page.getByRole("button", { name: "Seek to form", exact: true }).click();
  const stepBefore = new URL(page.url()).searchParams.get("step");
  await page.getByRole("button", { name: "Play replay", exact: true }).click();
  await page.getByRole("button", { name: "Pause replay", exact: true }).click();
  await expect(page.locator(".run-bar")).toContainText("RUNNING");
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  expect(new URL(page.url()).searchParams.get("step")).not.toBe(stepBefore);
  await page
    .getByRole("button", { name: "Seek to submitted", exact: true })
    .click();
  await expect(page.locator(".inspector")).toContainText(
    "Attempted Save; sample server returned 500",
  );
  await expect(page.locator(".viewport img")).toBeVisible();
  await page.getByRole("button", { name: "Notes", exact: true }).click();
  await page
    .getByLabel("Add a note")
    .fill("Local reviewer annotation on the failed Save step.");
  await page.getByRole("button", { name: "Save annotation" }).click();
  await expect(page.locator(".inspector blockquote")).toContainText(
    "failed Save",
  );
  await page.getByRole("button", { name: "Observation", exact: true }).click();
  await page
    .getByRole("button", { name: "Inspect finding", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Save action blocks job creation",
  );
  await page
    .getByRole("button", { name: "Open exact evidence", exact: true })
    .click();
  const evidenceUrl = page.url();
  await page.reload();
  await expect(page.locator(".inspector")).toContainText(
    "Attempted Save; sample server returned 500",
  );
  expect(page.url()).toBe(evidenceUrl);
  await page.screenshot({
    path: "docs/verification/theatre-1440.png",
    fullPage: true,
    animations: "disabled",
  });
  for (const width of [1024, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.screenshot({
      path: `docs/verification/theatre-${width}.png`,
      fullPage: true,
      animations: "disabled",
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByRole("button", { name: "Inspect finding", exact: true })
    .click();
  await page
    .getByLabel("Review note")
    .fill("Local test review; acknowledgment is not resolution.");
  await page.getByRole("button", { name: "acknowledged", exact: true }).click();
  await page
    .getByRole("button", { name: "Verify with humans", exact: true })
    .click();
  await expect(page.getByLabel("Neutral task instructions")).not.toHaveValue(
    /500|failure|blocker/i,
  );
  await page
    .getByRole("button", { name: "Create study draft", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Let real people test the assumption." }),
  ).toBeVisible();
  await page
    .locator(".study-card")
    .last()
    .getByRole("button", { name: "Operations", exact: true })
    .click();
  await page
    .getByLabel("Pseudonymous participant label")
    .fill("Browser test participant");
  await page
    .getByRole("button", { name: "Create scoped invitation", exact: true })
    .click();
  const invite = await page.getByLabel("Invitation URL").inputValue();
  const participant = await context.newPage();
  await participant.goto(invite);
  await expect(
    participant.getByRole("heading", { name: "Your perspective matters." }),
  ).toBeVisible();
  await participant
    .getByText("I consent to the storage")
    .locator("input")
    .check();
  await participant
    .getByRole("button", { name: "Consent & begin", exact: true })
    .click();
  await expect(participant.locator("body")).not.toContainText(
    "Save action blocks job creation",
  );
  await participant.getByLabel("Your task outcome").selectOption("FAIL");
  await participant
    .getByLabel("What happened?")
    .fill("Local test account: the owned form returned an error after Save.");
  await participant
    .getByRole("button", { name: "Submit independent feedback", exact: true })
    .click();
  await expect(
    participant.getByRole("heading", {
      name: "Thank you for your perspective.",
    }),
  ).toBeVisible();
  await participant.screenshot({
    path: "docs/verification/participant.png",
    fullPage: true,
    animations: "disabled",
  });
  await participant.close();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Refresh", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Review independent submission", exact: true })
    .last()
    .click();
  await page
    .getByLabel("Comparison to the linked finding")
    .selectOption("SUPPORTED");
  await page
    .getByLabel("Review rationale")
    .fill(
      "Local test self-report is consistent; no recording or observed moderator outcome.",
    );
  await page
    .getByRole("button", {
      name: "Publish reviewed report version",
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Study operations");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await nav(page, "Theatre");
  await expect(page.locator(".run-bar")).toContainText("COMPLETED", {
    timeout: 50000,
  });
  await nav(page, "Reports");
  await expect(page.locator(".report")).toContainText("LOCAL TEST FEEDBACK");
  await expect(page.getByLabel("Report version").locator("option")).toHaveCount(
    2,
  );
  const exportEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON", exact: true }).click();
  expect((await exportEvent).suggestedFilename()).toContain("v2");
  await page.screenshot({
    path: "docs/verification/report.png",
    fullPage: true,
    animations: "disabled",
  });
  await nav(page, "Theatre");
  const baselineId = await page.getByLabel("Select run").inputValue();
  await page.getByRole("button", { name: "Retest build", exact: true }).click();
  await expect(page.getByLabel("Select run")).not.toHaveValue(baselineId);
  await expect(page.locator(".run-bar")).toContainText("COMPLETED", {
    timeout: 55000,
  });
  await page
    .getByRole("button", { name: "Compare with baseline", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Verify what changed." }),
  ).toBeVisible();
  await expect(page.locator("tbody")).toContainText("untested");
  await expect(page.locator("tbody")).toContainText("fixed in this retest");
  await page.getByRole("button", { name: "form", exact: true }).click();
  await page.screenshot({
    path: "docs/verification/comparison.png",
    fullPage: true,
    animations: "disabled",
  });
  await nav(page, "Research");
  await page.getByLabel("Search research").fill("TalentNest");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Inspect source", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Fictional demo case");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await nav(page, "Settings");
  await expect(page.locator(".integration-list")).toContainText(
    "Browser execution",
  );
  await expect(page.locator(".integration-list")).toContainText("unavailable");
  writeFileSync(
    "docs/verification/browser-errors.json",
    JSON.stringify(errors, null, 2),
  );
  expect(errors).toEqual([]);
});

test("real project CRUD survives refresh and missing execution remains unavailable", async ({
  page,
}) => {
  await signIn(page, "bob");
  await page.getByRole("button", { name: "New project", exact: true }).click();
  const name = "Browser persistence " + Date.now();
  await page.getByLabel("Project name").fill(name);
  await page
    .getByLabel("Product description")
    .fill("A real local project with no worker");
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Start with the right question." }),
  ).toBeVisible();
  await page
    .getByLabel("Intended customer", { exact: true })
    .fill("Hiring teams");
  await page.getByLabel("Problem to solve").fill("Too many manual steps");
  await page.getByLabel("Key workflow").fill("Create a role");
  await page.getByLabel("Current alternative").fill("Spreadsheets");
  await page.getByLabel("Market / geography").fill("India");
  await page
    .getByLabel("Decision to make")
    .fill("Can the workflow be completed?");
  await page
    .getByRole("button", { name: "Confirm brief", exact: true })
    .click();
  await page.getByLabel("Target build").fill("https://staging.example.test");
  await page.getByText("I authorize this target").locator("input").check();
  await page.getByRole("button", { name: "Approve plan", exact: true }).click();
  await page.reload();
  await expect(page.getByLabel("Target build")).toHaveValue(
    "https://staging.example.test",
  );
  await page
    .getByRole("button", { name: "Launch testing", exact: true })
    .click();
  await expect(page.locator(".error-banner")).toContainText(
    "Real execution is unavailable",
  );
  await nav(page, "Overview");
  await page.getByRole("button", { name: "Edit project", exact: true }).click();
  await page
    .getByLabel("Product description")
    .fill("Edited persistent description");
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await nav(page, "Overview");
  await expect(page.locator(".project-card")).toContainText(
    "Edited persistent description",
  );
  await page.reload();
  await expect(page.locator(".project-card")).toContainText(
    "Edited persistent description",
  );
  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
