import type { MouseStatus } from "@openmouse/protocol/drivers/mouse-types";

export const VXE_R1_PRO_READ_ONLY =
  "Saving settings on the VXE R1 Pro requires its verified 1K receiver. Connect that receiver, or use ATK V HUB.";

export function isVxeR1ProReadOnly(status: MouseStatus | null): boolean {
  if (status?.ui?.family !== "atk") return false;
  const isR1Pro = /^(?:vxe\s+)?(?:dragonfly\s+)?r1\s+pro$/i.test(status.name.trim());
  // The patched driver only exposes the R1 stage editor for this model after
  // identifying it on the F58A receiver that supports verified writes.
  return isR1Pro && !(status.connectionType === "Wireless" && status.ui.dpiStageEditor);
}
