import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFileSync } from "node:fs";
test("workspace accessibility and mobile keyboard controls", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Open your workspace" }).click();
  await page.getByRole("button", { name: "Sign in locally" }).click();
  await expect(page.getByLabel("Select project")).toBeVisible();
  const evidence = [];
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const view of ["Overview", "Test Plans", "Theatre", "Settings"]) {
      if (
        await page
          .getByRole("button", { name: "Toggle navigation" })
          .isVisible()
      )
        await page.getByRole("button", { name: "Toggle navigation" }).click();
      await page
        .locator("nav")
        .getByRole("button", { name: view, exact: true })
        .click();
      await page.locator("h1").waitFor();
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      evidence.push({ width, view, violations: result.violations });
    }
  }
  writeFileSync(
    "docs/verification/accessibility.json",
    JSON.stringify(evidence, null, 2),
  );
  expect(
    evidence.flatMap((item) =>
      item.violations.map(
        (v) => `${item.width}/${item.view}: ${v.id} (${v.nodes.length})`,
      ),
    ),
  ).toEqual([]);
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
});
