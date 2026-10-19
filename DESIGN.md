# Orbit HUB design direction

## Brief

Orbit HUB is a browser-based control bench for Logitech mice. Visitors need to identify the connected device, set a DPI target, manage local profiles, inspect lighting features, and understand which controls are hardware-backed. Keep the existing single-file HTML, CSS, and JavaScript app and its local-only profile model.

## Concepts considered

| Concept | Rule, signature, anchor | Scores: originality / fit / feasibility / portability |
|---|---|---|
| Sensor plate | Treat the interface like an optical calibration plate: measured DPI is the central reading, stage values are calibration points, and the active target is marked in signal orange. Anchor: this app controls a mouse sensor and exposes HID++ readouts. | 4 / 5 / 5 / 2 |
| Orbit trace | Arrange each profile as a path around the active device, with controls radiating from its current sensor state. Anchor: the Orbit name and the device profile workspace. | 3 / 4 / 4 / 4 |
| Packet bench | Show every control as a request/response strip, with interactions snapping from local draft to device result. Anchor: HID++ packet and feature discovery. | 4 / 4 / 3 / 2 |

**Selected: Sensor plate.** It ties the visual hierarchy to the actual job of the app, and stays clear when the mouse is disconnected.

## Concept card

- **Idea:** Orbit HUB is a calibration plate for mouse settings, with the current sensor target as its primary reading.
- **Metaphor:** A precision optical instrument with a matte measurement surface, ruled marks, and a single signal color.
- **Signature:** Selecting a DPI stage moves the active calibration mark and updates the large numeric reading; hardware status sits beside the measurement.
- **Emotion:** Exact, tactile, and easy to trust.
- **Motion verb:** Snap and settle, like a calibration stop engaging.
- **Screenshot:** The active DPI reading, five stage points, and live device status on one pale instrument surface.

## Visual system

- **Palette:** `ground #dfe3de` (anodized instrument housing), `paper #f5f6f2` (readout surfaces), `ink #171d1a` (controls and text), `muted #58625d` (secondary labels), `line #b8c0b9` (engraved divisions), `signal #e45132` (active target and action).
- **Type:** Switzer 400/500/600/700, self-hosted from Fontshare for display and interface; system monospace for measured values and technical labels.
- **Grid:** 12-column desktop canvas with a 240 px dark instrument rail; main controls align to columns 1, 7, and 10. At 760 px, the rail becomes a compact top bar and content stacks into one column.
- **Rhythm:** Tight 8 px control groupings, 16 px normal gaps, 28 px panel spacing, and one open 48 px device-heading interval.
- **Shape:** 3 px corners for instrument surfaces, 2 px rules, round only the status LEDs and color swatches.
- **Motion:** 160–220 ms ease-out transitions; active stages lift 2 px and show a signal edge. Reduced-motion removes transitions. No ambient animation is used because this is a control surface that should stay still between inputs.

## Composition plan

```text
Devices / calibration dashboard
┌ dark rail ┐  model name, connection / actions
│ nav      │  ┌ DPI measurement + stage points ┐ ┌ active profile ┐
│ device   │  └ mouse sensor actions ─────────┘ └ feature status ┘
│ status   │  ┌ LIGHTSYNC preview ─────────────┐ ┌ button draft ──┐
└──────────┘

Profiles / index
┌ dark rail ┐  title + import / create
│ nav      │  profile rows, each one long measured record
└──────────┘

Assignments / command sheet
┌ dark rail ┐  title + save
│ nav      │  button key | local command, in a two-column grid
└──────────┘

LIGHTSYNC / instrument panel
┌ dark rail ┐  title + apply / save actions
│ nav      │  effect preview field | color and level controls
└──────────┘
```

## Genericness check

The measurement surface, sensor reading, stage marks, and signal-orange active target depend on mouse calibration and the app's actual DPI stages. The interface is not a generic neon gamer dashboard or a product marketing landing page.
