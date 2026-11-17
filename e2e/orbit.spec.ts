import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Keep browser tests independent of hardware and the permissions on the host.
  await page.addInitScript(() => {
    const hid = new EventTarget();
    Object.defineProperties(hid, {
      getDevices: { value: async () => [] },
      requestDevice: { value: async ({ filters }: HIDDeviceRequestOptions) => {
        if (new URL(location.href).searchParams.has("pg1-fixture")) {
          if (!filters.some((filter) => filter.vendorId === 0x30fa && filter.productId === 0x1440)) {
            throw new Error("The diagnostic USB ID is missing from the chooser.");
          }
          return [{ vendorId: 0x30fa, productId: 0x1440, productName: "USB GAMING MOUSE",
            collections: [{ featureReports: [{ reportId: 7 }], children: [] }] }];
        }
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

test("the mouse demo applies simulated settings without contacting hardware or Bridge", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hid", {
      get() { throw new Error("The demo accessed WebHID"); },
      configurable: true,
    });
  });
  const bridgeRequests: string[] = [];
  const isBridgeUrl = (url: string) => new URL(url).port === "17846";
  page.on("request", (request) => {
    if (isBridgeUrl(request.url())) bridgeRequests.push(request.url());
  });
  page.on("websocket", (socket) => {
    if (isBridgeUrl(socket.url())) bridgeRequests.push(socket.url());
  });
  await page.goto("./?demo=1");
  await expect(page.getByRole("heading", { name: "Mouse demo" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Attack Shark V5" })).not.toHaveJSProperty("naturalWidth", 0);
  await page.getByRole("combobox").first().selectOption("1600");
  await expect(page.getByRole("status").filter({ hasText: "800" })).toBeVisible();
  await page.getByRole("button", { name: "Apply changes" }).click();
  await expect(page.getByRole("status").filter({ hasText: /Applied in demo.*1600/ })).toBeVisible();
  expect(bridgeRequests).toEqual([]);
});

test("a profile backup loads into the review field and rejects an invalid file", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("banner").getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Profile key", exact: true }).click();
  const input = page.getByLabel("Open profile backup");
  const review = page.getByLabel("Import a key");
  const key = "OMK1:" + Buffer.from(JSON.stringify({ v: 1, brand: "Pulsar", name: "Fixture", dpi: 800 })).toString("base64");
  await input.setInputFiles({ name: "orbit-hub-profile.txt", mimeType: "text/plain", buffer: Buffer.from(key) });
  await expect(review).toHaveValue(key);
  await expect(page.getByRole("button", { name: "Import", exact: true })).toBeDisabled();
  await input.setInputFiles({ name: "bad.txt", mimeType: "text/plain", buffer: Buffer.from("invalid") });
  await expect(page.getByRole("alert").filter({ hasText: "This profile backup could not be read." })).toBeVisible();
  await expect(review).toHaveValue("");
});

test("the Bridge release check can retry and the panel returns keyboard focus", async ({ page }) => {
  let attempts = 0;
  await page.route("https://api.github.com/repos/OpenMouse-Project/OpenMouse-Bridge/releases/latest", async (route) => {
    attempts++;
    await route.fulfill(attempts === 1 ? { status: 503 } : {
      json: { tag_name: "v1.2.3", name: "Bridge", body: "", html_url: "", published_at: "", assets: [] },
    });
  });
  await page.goto("./");
  const trigger = page.getByRole("button", { name: "Bridge not running" });
  await trigger.click();
  const panel = page.getByRole("dialog", { name: "Bridge" });
  await expect(panel.getByRole("button", { name: "Close" })).toBeFocused();
  await expect(panel.getByText("Release check unavailable")).toBeVisible();
  await panel.getByRole("button", { name: "Retry" }).click();
  await expect(panel.getByText("1.2.3", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("the mouse activity lab samples browser events without a connected device", async ({ page }) => {
  await page.clock.install();
  await page.goto("./");
  await page.getByRole("banner").getByRole("button", { name: "Hardware test" }).click();
  const lab = page.locator(".orbit-activity-lab");
  await lab.getByRole("button", { name: "Start sample" }).click();
  const target = lab.locator(".orbit-activity-target");
  await expect(target.getByText("Sampling mouse activity…")).toBeVisible();
  await target.evaluate((element) => {
    for (const time of [10, 20, 30]) {
      const movement = new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" });
      Object.defineProperty(movement, "timeStamp", { value: time });
      element.dispatchEvent(movement);
    }
  });
  await target.dispatchEvent("pointerdown", { pointerType: "mouse", button: 0 });
  await target.dispatchEvent("pointerdown", { pointerType: "mouse", button: 2 });
  await target.dispatchEvent("wheel", { deltaY: 120 });
  await page.clock.runFor(5_100);
  const stats = lab.locator(".orbit-activity-results");
  await expect(stats.getByText("100 Hz", { exact: true })).toBeVisible();
  await expect(stats.getByText("Button presses").locator("..").locator("dd")).toHaveText("2");
  await expect(stats.getByText("Scroll events").locator("..").locator("dd")).toHaveText("1");
  await expect(lab.getByRole("button", { name: "Start sample" })).toBeEnabled();
});

const fixtureBase = `http://localhost:${Number(process.env.ORBIT_BROWSER_PORT ?? "4178") + 1}/orbit-hub/`;

test("a failed polling write has an inline explanation and can be retried by keyboard", async ({ page }) => {
  await page.goto(fixtureBase + "?preview=steelseries-gen2&fault=write");
  const polling = page.locator("#polling-card");
  await expect(page.locator("#workspace-tab-performance")).toHaveAttribute("aria-selected", "true");
  const option = polling.getByRole("button", { name: "500", exact: true });
  await option.focus();
  await page.keyboard.press("Enter");
  const apply = page.locator("#pending-flash");
  await apply.focus();
  await page.keyboard.press("Enter");
  const feedback = polling.locator(".setting-write-status");
  await expect(feedback).toHaveAttribute("role", "status");
  await expect(feedback).toContainText("Simulated polling write failed.");
  await expect(feedback).toContainText("Choose Apply changes to retry.");
  await expect(apply).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(feedback).toContainText("Sent, readback unavailable");
  await expect(apply).toBeHidden();
  await expect(page.locator("#workspace-tab-performance")).toBeFocused();
});

for (const locale of ["en", "ar"]) {
  for (const theme of ["Emerald", "Light"]) {
    test(`device controls reflow at 320 px with ${locale} and ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 650 });
      await page.addInitScript(({ locale, theme }) => {
        localStorage.setItem("openmouse-interface-settings-v1", JSON.stringify({ locale, theme, colorMode: theme === "Light" ? "Light" : "Dark", reducedMotion: true }));
      }, { locale, theme });
      await page.goto(fixtureBase + "?preview=steelseries-gen2");
      const root = page.locator("html");
      await expect(root).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
      await expect(root).toHaveAttribute("data-interface-theme", theme === "Light" ? "light" : "emerald");
      await expect(root).toHaveAttribute("data-color-scheme", theme === "Light" ? "light" : "dark");
      const rate = page.locator("#host-rate-slider button[aria-pressed=false]").first();
      await rate.focus();
      await page.keyboard.press("Enter");
      const apply = page.locator("#pending-flash");
      await expect(apply).toBeVisible();
      const overflow = await page.locator(".om-content").evaluate((content) => ({
        width: content.scrollWidth,
        outside: [...content.querySelectorAll<HTMLElement>("*")]
          .filter((node) => {
            const bounds = node.getBoundingClientRect();
            return bounds.width > 0 && (bounds.right > innerWidth + 1 || bounds.left < -1)
              && !node.closest(".om-device-tabs, .sr-only, .app-live-region");
          })
          .slice(0, 8).map((node) => node.id || node.getAttribute("class") || node.tagName),
      }));
      expect(overflow.width, overflow.outside.join(", ")).toBe(320);
      await expect(root).toHaveJSProperty("scrollWidth", 320);
      // Tab into a neighboring control after staging and confirm the bar sits
      // below the scroll viewport instead of overlaying the keyboard focus.
      await rate.focus();
      await page.keyboard.press("Tab");
      const geometry = await page.evaluate(() => {
        const target = document.activeElement!.getBoundingClientRect();
        const bar = document.querySelector("#pending-changes-bar")!.getBoundingClientRect();
        const apply = document.querySelector("#pending-flash")!.getBoundingClientRect();
        return { bottom: target.bottom, barTop: bar.top, applyWidth: apply.width, applyHeight: apply.height };
      });
      expect(geometry.bottom).toBeLessThanOrEqual(geometry.barTop);
      expect(geometry.applyWidth).toBeGreaterThanOrEqual(24);
      expect(geometry.applyHeight).toBeGreaterThanOrEqual(24);
      await apply.focus();
      await expect(apply).toBeFocused();
      await expect(apply).toHaveCSS("outline-style", "solid");
    });
  }
}

test("shared PG1 USB ID returns configuration-interface diagnostics", async ({ page }) => {
  await page.goto("./?pg1-fixture");
  await page.getByRole("button", { name: "Add device", exact: true }).click();
  const issue = page.locator(".orbit-connection-notice");
  await expect(issue.getByText(/Orbit Hub found USB device 30FA:1440/)).toBeVisible();
  const download = page.waitForEvent("download");
  await issue.getByRole("button", { name: "Download diagnostics" }).click();
  const file = await (await download).path();
  expect(JSON.parse(await readFile(file!, "utf8"))).toEqual({
    stage: "identification",
    device: { vendorId: 0x30fa, productId: 0x1440 },
    configurationReport7: true,
  });
});
