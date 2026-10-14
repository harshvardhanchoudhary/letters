import { test, expect } from "@playwright/test";
test("every private journal route requires a real sign-in", async ({
  page,
}) => {
  for (const path of [
    "/",
    "/letters",
    "/letters/write",
    "/timeline",
    "/mood",
    "/library",
    "/together",
    "/postcards/send",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByLabel("Your email")).toBeVisible();
  }
});
test("login has no sample journal and fits the viewport", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("link", { name: /sample journal/i })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("heading", { name: "Oh, hello you." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
  ).toBe(false);
});

test("login remains usable at compact phone, tablet and laptop widths", async ({
  page,
}) => {
  for (const width of [320, 375, 768, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/login");
    const email = page.getByLabel("Your email");
    await email.fill("member@example.test");
    await expect(email).toHaveValue("member@example.test");
    await expect(
      page.getByRole("button", { name: /Send me a sign-in link/ }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      ),
    ).toBe(false);
  }
});
