# Orbit Hub design

The single source of truth for how Orbit Hub looks. Read it before touching any UI.
Values live in code: `src/styles/tokens.css`. When this file and the code disagree, the code
wins; fix this file.

Orbit Hub uses a midnight-blue workspace, a warm accent, and an orbital stage for device artwork. The default Orbit theme retains the existing saved theme identifier.

## Principles

- **The device is the hero.** On its settings page, simple name and connection information sit
  above the contained mouse image and its orbit outline.
  Device-shelf blocks retain their own existing artwork treatment.
- **Numbers first.** Settings read as figures: label above, value, unit after, meta under. All
  numbers are tabular.
- **Colour means something.** The accent (from the user's theme) marks the active place, the
  primary action, focus, slider fills and the active stage. `--ok` / `--bad` / `--warn` mark real
  states only. Everything else is ink.
- **Real data only.** Every value comes from the device or this browser. A value the device does
  not report is left out or shown as "–". Empty states say why and what fills them.
- **One idea per block.** Short titles, sentence case, no category overlines, no uppercase micro
  labels, no decorative dots, stripes or glows.

## Structure

| Layer | Recipe |
|---|---|
| Ground | `--ground`: dark page ink with a quiet surface under the device artwork. |
| Chrome | App bar on `--ink-0` with a hairline edge. |
| Panel | `.om-panel` (or the legacy `.setting-card`): `--sheen` over `--surface-1` over `--ink-1` , `--lit` edge, `--r-md`. Featured panel: `.om-panel.is-lit` (one or two per page). |
| Row | Inside a panel: hairline `--line-1` separators. Don't nest panels. |
| Well | Inset areas (segmented controls, inputs, render stages): `--well` + `--inset-shadow`. |
| Raised | Buttons, the selected segment key, switch thumb: `--btn` / `--key`. |
| Floating | Menus, dialogs, toasts, the pending bar, help: opaque `--solid-2` + `--shadow-float`. |

## App layout

- **App bar** (`AppHeader.tsx`): Orbit Hub’s mark, four primary destinations and project utilities share a horizontal toolbar. Authorized devices appear in a separate scrollable switcher with their connection or battery status. The Bridge button opens a popover below its trigger.
- **Main column**: news strip on top, then the scrolling page (`.om-content` > `.om-page`: 36px
  top and 40px side padding around a content box of at most 1260px). The pending-changes bar floats at the bottom of the main column.
- **Devices home** (`features/devices/DevicesHome.tsx`): a swipeable shelf of device blocks, each
  one surface (render on a stage, name, connection badge, live stats with icons, Configure/Open,
  and a ⋯ menu to remove the device) ending in an Add device block with the supported mice
  crossfading. Drag, swipe, arrow buttons, dots and arrow keys all move it. The shelf aligns with the page title. With no devices, the pairing panel puts the action on the leading side and the device artwork on the trailing side.
- **Device page** (`features/devices/DeviceHero.tsx`): a full-width identity panel pairs the device name, connection and contained artwork. An underline navigation row leads into the full-width control area.
- **Setting cards** flow in a masonry column layout (`CardSlot`, `styles/instrument.css`) so there
  are no holes; every card heading carries a glyph, and feature switches are tiles
  (`SwitchRow` in `shared/ui.tsx`).
- **Settings** (`features/settings/InterfaceSettings.tsx`): a section index opens one category at a time. Appearance pairs an active-theme preview with named swatches. Other categories retain their setting rows and the same interaction states.

## Tokens

Use tokens only; no hex in components or area CSS. Alpha mixes use the `-rgb` triples:
`rgb(var(--accent-rgb) / 0.12)`.

| Token | Use |
|---|---|
| `--ink-0`, `--ink-1`, `--ground` | Chrome, page |
| `--surface-1..4` | Panel, hover/selected, pressed/strong, rare |
| `--solid-1`, `--solid-2` | Opaque surfaces (menus, dialogs, sticky heads) |
| `--well`, `--glint` | Inset areas, hover wash |
| `--line-1..3` | Hairlines: divider, input edge, emphasis |
| `--text-1..4` | Values/titles, body, labels/meta, disabled/placeholder only |
| `--accent`, `--accent-rgb`, `--on-accent`, `--accent-soft`, `--accent-line` | Active place, primary action, focus, fills |
| `--ok`, `--bad`, `--warn`, `--info` | Real states only |
| `--stage-light` | The light behind a device render |

Themes: all 12 (Orbit default, Matt, Violet, Ice, Ember, Mono, Miku, Catppuccin Mocha /
Macchiato / Frappé, NieR: Automata, Light) are full token sets in `tokens.css`, selected by
`data-interface-theme` on the shell (and mirrored on `<html>`). Derived tokens are declared on every
themed element, so any element carrying `data-interface-theme` paints itself in that theme.
No component may fork on a theme name.

## Type

- DM Sans for everything, self-hosted from `public/fonts/DMSans-Variable.ttf` (SIL OFL 1.1, licence
  and source record beside it), pinned to optical size 14 (`--font-opsz`) so it renders the same
  named instance as the Desktop app. JetBrains Mono only for raw identifiers, hex and HID logs.
- Scale: page title 27, panel title 15, body 13, meta 12, small 11. Figures 30 at 600.
- Sentence case everywhere. No uppercase tracked labels. Weights 400–600 (the Desktop renderer
  only has the 100-step named instances), no negative tracking on titles or figures.

## Shape and space

- Radii: 3 (chips), 6 (controls, rows), 10 (panels, wells), 14 (hero, device blocks, dialogs).
- Spacing on a 4px grid. Panel padding 16px; gaps between panels 16px; rows ≥ 40px; buttons 32px;
  switches 36×20 with a 16px thumb. Tabs: a 40px well (4px padding and gap, radius 10) holding
  32px keys (radius 6).
- These numbers are shared with the Desktop app: `src/styles/visual-contract.json` is checked
  against `tokens.css` by `visual-contract.test.ts`, and the same file is checked against the
  Desktop constants.
- Device renders: always `object-fit: contain`, absolutely positioned inside their stage, never
  cropped.

## Controls

`.om-btn` (default raised), `.is-primary` (one per view), `.is-ghost`, `.is-danger`, `.is-sm`,
`.is-lg`, `.is-icon`; `.om-icon-btn`; `.om-badge` (`.is-ok/.is-bad/.is-warn/.is-accent`);
`.segmented` and `.rate-slider-buttons` (well + raised key); `SwitchButton`; `OptionMenu`;
`StepperSlider`; range inputs with an accent fill. Focus is the accent gap ring (`--focus`), never
removed.

## Icons

lucide-react at stroke 1.8, `currentColor`, `--text-3` at rest, accent when active. Icons sit next
to text that says the same thing (battery icon + percent, connection icon + "Wireless"). The battery
is the custom `BatteryIcon` (fill tracks the level; low and charging change its colour).

## Motion

120–260ms washes and fades. The device page body fades in; panels and bars rise 8px once. The
The pairing artwork crossfades when motion is enabled. No loops except the add-device crossfade, which stops with reduced motion. The Animations
preference and `prefers-reduced-motion` both stop motion.

## Checklist before shipping a page

- [ ] Tokens only; no new radii, shadows or hex.
- [ ] Sentence case, no overlines, no em dashes in copy.
- [ ] One primary button per view.
- [ ] Every number tabular; every value real or "–".
- [ ] Works in Emerald, Light and NieR; RTL (Arabic) mirrors correctly.
- [ ] Keyboard: every control reachable, visible focus, Escape closes dialogs.
