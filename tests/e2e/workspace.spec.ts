import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import { createServer, type Server } from "node:http";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
let server: Server;
let origin: string;
test.beforeAll(async () => {
  // Test real components without creating a production demo route or impersonating a member.
  const bundle = await build({
    entryPoints: ["tests/ui/workspace.tsx"],
    bundle: true,
    write: false,
    jsx: "automatic",
    platform: "browser",
    define: { "process.env.NODE_ENV": '"development"' },
    plugins: [
      {
        name: "isolated-test-boundaries",
        setup(b) {
          b.onResolve({ filter: /^next\/(link|navigation)$/ }, (a) => ({
            path: a.path,
            namespace: "test",
          }));
          b.onResolve({ filter: /app\/actions\// }, (a) => ({
            path: a.path,
            namespace: "test",
          }));
          b.onLoad({ filter: /.*/, namespace: "test" }, (a) => ({
            loader: "jsx",
            contents:
              a.path === "next/link"
                ? 'import React from "react"; export default function Link({prefetch,children,...props}) {return <a {...props}>{children}</a>}'
                : a.path === "next/navigation"
                  ? "export const useRouter = () => ({refresh(){}});"
                  : "const saved = async () => ({success:true}); export { saved as saveDraft, saved as sendLetter, saved as markAsRead, saved as saveCheckin, saved as addLibraryItem, saved as addLibraryNote, saved as updateReading, saved as addPlan, saved as updatePlan };",
            resolveDir: process.cwd(),
          }));
        },
      },
    ],
  });
  const css = readdirSync(".next/static", { recursive: true })
    .filter((p) => typeof p === "string" && p.endsWith(".css"))
    .map((p) => readFileSync(join(".next/static", String(p)), "utf8"))
    .join("\n");
  server = createServer((req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (req.url === "/bundle.js") {
      res.setHeader("Content-Type", "text/javascript");
      res.end(bundle.outputFiles[0].contents);
    } else if (req.url === "/style.css") {
      res.setHeader("Content-Type", "text/css");
      res.end(css);
    } else {
      res.setHeader("Content-Type", "text/html");
      res.end(
        '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>',
      );
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("No test server address");
  origin = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => {
  if (server)
    await new Promise<void>((resolve, reject) =>
      server.close((e) => (e ? reject(e) : resolve())),
    );
});

test("letter reader moves through the archive and supports larger type", async ({
  page,
}) => {
  await page.goto(`${origin}/?page=letters`);
  await page.getByRole("button", { name: "Unopened", exact: true }).click();
  await page.getByRole("button", { name: /First envelope/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Larger type Aa" }).click();
  await expect(page.locator(".letter-body")).toHaveClass(/large-type/);
  await page.getByRole("button", { name: "Next letter" }).click();
  await expect(page.locator("#reader-title")).toHaveText("Second envelope");
  await page.getByRole("button", { name: "Close ×" }).click();
  await expect(page.getByRole("status")).toHaveText("0 LETTERS IN THIS VIEW");
});

test("writer preserves existing words through prompts, preview and private save", async ({
  page,
}) => {
  await page.goto(`${origin}/?page=writer`);
  await page.getByText("A nudge for the blank page +").click();
  await page.getByRole("button", { name: "P.S. One more thing." }).click();
  await expect(page.getByLabel("Your letter", { exact: true })).toHaveValue(
    "Keep these words.\n\nP.S. One more thing.",
  );
  await page.getByRole("button", { name: "Read before sealing" }).click();
  await expect(page.locator(".letter-preview")).toContainText(
    "Keep these words.",
  );
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved privately");
  await page.getByRole("button", { name: "Just me and this letter" }).click();
  await expect(page.getByRole("navigation")).toBeHidden();
  await page.getByRole("button", { name: "Leave writing room" }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
});

test("library separates shared discussion from private notes and opens books across filters", async ({
  page,
}) => {
  await page.goto(`${origin}/?page=library`);
  await page.getByLabel("Search library").fill("Private marginalia");
  await expect(page.locator(".library-item")).toHaveCount(1);
  await page.getByLabel("Search library").fill("");
  await page
    .getByRole("button", { name: "With shared discussion only" })
    .click();
  await expect(page.locator(".library-item")).toHaveCount(1);
  await expect(page.locator(".library-item h3")).toHaveText("Fixture book");
  await page.getByRole("button", { name: "My finds", exact: true }).click();
  await page.getByRole("button", { name: /Test author Fixture book/ }).click();
  await expect(
    page.locator(".library-item").filter({ hasText: "Fixture book" }),
  ).toBeVisible();
  await expect(page.locator("#discussion-book")).toHaveAttribute("open", "");
  await expect(
    page.getByLabel("Keep this note just for me").first(),
  ).toBeChecked();
});

test("check-in previews exactly which optional fields are shared", async ({
  page,
}) => {
  await page.goto(`${origin}/?page=mood`);
  await page.getByRole("button", { name: "Just listen", exact: true }).click();
  await expect(page.getByLabel("What I’d love from you")).toHaveValue(
    "Just listen",
  );
  await expect(page.locator(".sharing-summary")).toContainText(
    "Your reflection stays private",
  );
  await page.getByText("Optional cycle check-in +").click();
  await page
    .getByLabel("My cycle phase", { exact: true })
    .selectOption("Luteal");
  await expect(
    page.getByLabel("Share my cycle phase with Partner"),
  ).not.toBeChecked();
  await page.getByLabel("Share my cycle phase with Partner").check();
  await expect(page.locator(".sharing-summary")).toContainText(
    "Your chosen cycle phase is also shared",
  );
});

test("timeline searches by month and can spread out saved photographs", async ({
  page,
}) => {
  await page.goto(`${origin}/?page=timeline`);
  await page.getByLabel("Jump to month").selectOption("2026-04");
  await expect(page.locator(".timeline-entry")).toHaveCount(1);
  await page.getByLabel("Jump to month").selectOption("");
  await page.getByRole("button", { name: "Spread out the photos" }).click();
  await expect(page.locator(".photo-spread .timeline-entry")).toHaveCount(1);
  await page.getByLabel("Search our story").fill("no match");
  await expect(page.locator(".timeline-entry")).toHaveCount(0);
});

test("plans handle impossible idea filters, repeat days, and download calendars", async ({
  page,
}) => {
  await page.goto(`${origin}/?page=together`);
  await page
    .getByRole("button", { name: "Something new", exact: true })
    .click();
  await page.getByLabel("How long?").selectOption("30");
  await expect(page.getByText("Nothing in this particular hat.")).toBeVisible();
  await page
    .getByRole("button", { name: "Clear time & place filters" })
    .click();
  await page.getByRole("button", { name: "Let’s do this" }).click();
  await expect(page.getByLabel("What shall we do?")).not.toBeEmpty();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Add to my calendar" }).click();
  expect((await download).suggestedFilename()).toBe("letters-date.ics");
  await page.getByRole("button", { name: "Do this again" }).click();
  await expect(page.getByLabel("What shall we do?")).toHaveValue(
    "A day to repeat",
  );
  await expect(page.getByLabel("A day (optional)")).toHaveValue("");
});

test("every workspace fits phone and laptop widths", async ({
  page,
}, testInfo) => {
  for (const width of [320, 390, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    for (const view of [
      "home",
      "letters",
      "writer",
      "timeline",
      "mood",
      "library",
      "together",
    ]) {
      await page.goto(`${origin}/?page=${view}`);
      await expect(page.locator("main")).not.toBeEmpty();
      if (width === 390 || width === 1366)
        await page.screenshot({
          path: testInfo.outputPath(`${view}-${width}.png`),
          fullPage: true,
          animations: "disabled",
        });
      const overflow = await page.locator("body *").evaluateAll((els) =>
        els
          .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
          .map((e) => `${e.tagName}.${e.className}`)
          .slice(0, 12),
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${view} at ${width}px: ${overflow.join(", ")}`,
      ).toBe(true);
    }
  }
});
