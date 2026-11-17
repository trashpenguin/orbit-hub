import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Keep browser tests independent of hardware and the permissions on the host.
  await page.addInitScript(() => {
    const hid = new EventTarget();
    Object.defineProperties(hid, {
      getDevices: { value: async () => [] },
      requestDevice: { value: async () => {
        if (new URL(location.href).searchParams.has("unsupported-fixture")) {
          return [{ vendorId: 65535, productId: 65534, productName: "Unknown fixture", collections: [] }];
        }
        throw new DOMException("Chooser closed", "NotFoundError");
      } },
    });
    Object.defineProperty(navigator, "hid", { value: hid, configurable: true });
  });
});

test("narrow settings navigation and theme persistence", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 680 });
  await page.goto("./");
  const toolbar = page.getByRole("banner");
  await expect(toolbar.getByRole("button", { name: "Settings" })).toBeVisible();
  await expect(toolbar).toHaveJSProperty("scrollWidth", 320);
  await toolbar.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Glacier", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-interface-theme", "glacier");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-interface-theme", "glacier");
});

test("the Orbit logo loads offline despite a cached legacy URL", async ({ page, context }) => {
  await page.goto("./");
  const logo = page.getByRole("banner").getByRole("link", { name: "Orbit Hub" }).locator("img");
  await expect(logo).toHaveAttribute("src", /\/assets\/orbit-mark-[^/]+\.png$/);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    const cache = await caches.open("orbit-legacy-test");
    await cache.put("/orbit-hub/logo.png", new Response("old asset"));
  });
  await context.setOffline(true);
  await page.reload();
  await expect(logo).toHaveJSProperty("naturalWidth", 128);
});

test("closing the device chooser gives a recoverable status", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Add device", exact: true }).click();
  await expect(page.locator(".orbit-connection-notice").getByText("No device was selected in the browser prompt.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add device", exact: true })).toBeEnabled();
});

test("device identification failure exports a report with the failed stage", async ({ page }) => {
  await page.goto("./?unsupported-fixture");
  await page.getByRole("button", { name: "Add device", exact: true }).click();
  const issue = page.locator(".orbit-connection-notice");
  await expect(issue.getByText("Connection failed", { exact: true })).toBeVisible();
  const download = page.waitForEvent("download");
  await issue.getByRole("button", { name: "Download diagnostics" }).click();
  const file = await (await download).path();
  expect(JSON.parse(await readFile(file!, "utf8"))).toEqual({
    stage: "identification",
    device: { vendorId: 65535, productId: 65534 },
  });
});
