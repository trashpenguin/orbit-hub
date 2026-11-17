import type { MouseStatus } from "@openmouse/protocol/drivers/mouse-types";

export const VXE_R1_PRO_READ_ONLY =
  "The VXE R1 Pro is read-only in Orbit Hub. Use ATK V HUB to save settings on this model.";

export function isVxeR1ProReadOnly(status: MouseStatus | null): boolean {
  if (status?.ui?.family !== "atk") return false;
  return /^(?:vxe\s+)?(?:dragonfly\s+)?r1\s+pro$/i.test(status.name.trim());
}
