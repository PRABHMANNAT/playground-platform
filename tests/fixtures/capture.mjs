import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
const browser = await chromium.launch({ channel: "chrome", headless: true });
for (const build of ["A", "B"])
  for (const task of ["create-job", "application"])
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      const page = await browser.newPage({ viewport });
      const dir = `.local/artifacts/hireflow/${build}/${task}/${viewport.width}×${viewport.height}`;
      mkdirSync(dir, { recursive: true });
      await page.goto(
        `http://localhost:3000/fixture/hireflow?build=${build}&task=${task}`,
      );
      await page
        .getByRole("button", {
          name: task === "create-job" ? "Create a job" : "Apply for this role",
          exact: true,
        })
        .waitFor();
      await page.screenshot({ path: dir + "/1.png" });
      await page
        .getByRole("button", {
          name: task === "create-job" ? "Create a job" : "Apply for this role",
          exact: true,
        })
        .click();
      await page.screenshot({ path: dir + "/2.png" });
      if (
        task === "create-job" &&
        (await page.locator('label[for="salary"]').count()) !==
          (build === "B" ? 1 : 0)
      )
        throw new Error("Expected fixture visible-label difference");
      await page
        .locator("[name=title]")
        .fill(task === "create-job" ? "Product Designer" : "Sample Candidate");
      await page
        .locator("[name=department]")
        .fill(task === "create-job" ? "Design" : "sample@example.test");
      await page.locator("[name=location]").fill("Remote");
      await page
        .locator("textarea[name=description]")
        .fill(
          task === "create-job"
            ? "Help us make hiring clearer. Design thoughtful product experiences for growing teams."
            : "Sample application from the owned test fixture.",
        );
      if (task === "create-job")
        await page.locator("[name=salary]").fill("₹12–18 lakh / year");
      await page.screenshot({ path: dir + "/3.png" });
      const response = page.waitForResponse((r) =>
        r.url().endsWith("/fixture-api/save"),
      );
      await page
        .getByRole("button", {
          name: task === "create-job" ? "Save job" : "Submit application",
        })
        .click();
      const saved = await response;
      if (build === "A" && task === "create-job") {
        if (saved.status() !== 500) throw new Error("Expected seeded HTTP 500");
        await page.locator(".fixture-error").waitFor();
      } else {
        if (saved.status() !== 201) throw new Error("Expected fixture success");
        await page
          .getByRole("heading", {
            name:
              task === "create-job"
                ? "Your job is saved"
                : "Application received",
          })
          .waitFor();
        if (task === "create-job") {
          await page
            .getByRole("button", { name: "Back to jobs", exact: true })
            .click();
          await page
            .getByTestId("saved-job")
            .getByRole("heading", { name: "Product Designer", exact: true })
            .waitFor();
        }
      }
      await page.screenshot({ path: dir + "/4.png" });
      await page.close();
      console.log(
        `Verified and captured owned fixture ${build}/${task}/${viewport.width}×${viewport.height}`,
      );
    }
await browser.close();
