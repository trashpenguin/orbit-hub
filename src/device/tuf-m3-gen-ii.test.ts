import assert from "node:assert/strict";
import { test } from "node:test";
import { createMouseClient, deviceBrand, pickLogicalDevice } from "./device-clients.ts";
import { HID_FILTERS } from "./hid-filters.ts";
import { TUF_M3_GEN_II_FILTER, TufM3GenIIClient } from "./tuf-m3-gen-ii.ts";

class FakeTufMouse extends EventTarget {
  vendorId = 0x0b05;
  productId = 0x1a9b;
  productName = "TUF GAMING M3 GEN II";
  collections = [{
    usagePage: 0xff01, usage: 1, children: [], featureReports: [],
    inputReports: [{ reportId: 0, items: [] }], outputReports: [{ reportId: 0, items: [] }],
  }];
  opened = false;
  stage = 0;
  rate = 3;
  stages = [400, 800, 1600, 3200];
  refuseDpi = false;
  sent: number[][] = [];

  async open() { this.opened = true; }
  async close() { this.opened = false; }

  async sendReport(reportId: number, payload: Uint8Array) {
    assert.equal(reportId, 0);
    assert.equal(payload.byteLength, 64);
    this.sent.push([...payload.subarray(0, 9)]);
    const reply = payload.slice();
    const [kind, property, field] = payload;
    if (kind === 0x12 && property === 0x00) reply[11] = this.stage;
    if (kind === 0x12 && property === 0x04 && field === 0x00) {
      const view = new DataView(reply.buffer);
      this.stages.forEach((dpi, index) => view.setUint16(4 + 2 * index, dpi / 50 - 1, true));
      reply[12] = this.rate;
    }
    if (kind === 0x12 && property === 0x04 && field === 0x03) reply.set([12, 34, 56], 4);
    if (kind === 0x51 && property === 0x31 && field !== undefined) {
      if (field < 4 && !this.refuseDpi) this.stages[field] = (payload[4]! + 256 * payload[5]! + 1) * 50;
      if (field === 4) this.rate = payload[4]!;
      if (field === 9) this.stage = payload[4]!;
    }
    this.dispatchEvent(Object.assign(new Event("inputreport"), { reportId, data: new DataView(reply.buffer) }));
  }
}

test("only the TUF Gen II configuration collection is selected", async () => {
  assert.ok(HID_FILTERS.some((filter) => filter === TUF_M3_GEN_II_FILTER));
  const mouse = new FakeTufMouse();
  const configuration = mouse as unknown as HIDDevice;
  const pointing = Object.assign(new FakeTufMouse(), { collections: [{ ...mouse.collections[0]!, usagePage: 1, usage: 2 }] }) as unknown as HIDDevice;
  assert.equal(await createMouseClient(pointing), null);
  assert.equal(await pickLogicalDevice([pointing, configuration]), configuration);
  const client = await createMouseClient(configuration);
  assert.ok(client instanceof TufM3GenIIClient);
  assert.equal(await deviceBrand(client), "ASUS");
});

test("TUF Gen II uses zero-based stages, preserves DPI colors and checks reads after writes", async () => {
  const mouse = new FakeTufMouse();
  const client = new TufM3GenIIClient(mouse as unknown as HIDDevice);
  const initial = await client.readStatus();
  assert.equal(initial.dpi, 400);
  assert.equal(initial.activeDpiStage, 0);
  assert.equal(initial.pollingRateHz, 1000);

  assert.equal(await client.setDpi(950), 950);
  assert.deepEqual(mouse.sent.find(([kind]) => kind === 0x51), [0x51, 0x31, 0, 0, 18, 0, 12, 34, 56]);
  assert.equal(await client.setActiveDpiStage(3), 3);
  assert.equal(await client.setPollingRate(500), 500);
  assert.equal((await client.readStatus()).dpi, 3200);
  mouse.refuseDpi = true;
  await assert.rejects(client.setDpiStageValue(0, 800), /reported 950 DPI/);
  assert.equal((await client.readStatus()).pollingRateHz, 500);
  await client.close();
  assert.equal(mouse.opened, false);
});
