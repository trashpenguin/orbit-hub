import assert from "node:assert/strict";
import { test } from "node:test";
import type { MouseStatus } from "@openmouse/protocol/drivers/mouse-types";
import { isVxeR1ProReadOnly } from "./vxe-r1-pro.ts";

test("the R1 Pro restriction does not affect the R1 Pro Max or other R1 variants", () => {
  const status = (name: string, family = "atk") => ({ name, ui: { family } }) as MouseStatus;
  assert.equal(isVxeR1ProReadOnly(status("VXE R1 PRO")), true);
  assert.equal(isVxeR1ProReadOnly(status("VXE Dragonfly R1 Pro")), true);
  assert.equal(isVxeR1ProReadOnly(status("VXE R1 Pro Max")), false);
  assert.equal(isVxeR1ProReadOnly(status("VXE R1 SE+")), false);
  assert.equal(isVxeR1ProReadOnly(status("VXE R1 Pro", "pulsar")), false);
  assert.equal(isVxeR1ProReadOnly(null), false);
});
