# Hardware verification

Record each connection type separately. A simulated browser test does not count as a physical device check.

| Device | Connection | Firmware | Detection | DPI read | DPI write and readback |
| --- | --- | --- | --- | --- | --- |
| Attack Shark V5 | USB cable | Pending | Pending | Pending | Pending |
| Attack Shark V5 | Wireless receiver | Pending | Pending | Pending | Pending |

## Run the V5 check

1. Connect with one transport and record the reported device name, firmware (if shown), browser, and whether Bridge is active.
2. Record the original DPI stage and value. If Orbit Hub offers a different supported value, stage it and explicitly apply it.
3. Reopen the device or refresh its settings. Record the value reported by the device. If a read is unavailable, record that separately from a matching read.
4. Restore the original value and verify it where possible.
5. Repeat with the other transport. Record any connection failure or unsupported control rather than carrying over a result from the first run.

Optional diagnostics can be attached to a [device report](https://github.com/trashpenguin/orbit-hub/issues/new?template=device-report.yml) after reviewing their contents.
