# Orbit HUB public test

[Open the live app](https://trashpenguin.github.io/orbit-hub/) · [Pages deployment status](https://github.com/trashpenguin/orbit-hub/actions/workflows/pages.yml)

Orbit HUB is an install-free browser prototype for local mouse profiles, DPI control, and limited Logitech RGB lighting. It is independent and is not affiliated with Logitech.

## Run it

Serve this folder from an HTTPS static host. `localhost` is suitable for development; a public deployment must use HTTPS for WebHID. Open the page in desktop Chrome or Edge and select **Add Logitech device** once to grant browser access. USB and supported LIGHTSPEED receivers are the intended connection paths; Bluetooth exposure depends on the browser and device. The browser remembers that permission for this site. Firefox, Safari, mobile browsers, and restricted browser contexts may not provide WebHID, so device controls will not be available there.

There is no account or app server. Profiles are stored in local browser storage and are not uploaded. They do not sync between browsers or devices. Export a JSON backup before clearing browser data or moving to another browser.

## Tested scope

- Logitech G502 HERO over HID++: device detection and DPI reading were verified in the development environment. This is a single-model check, not a compatibility guarantee.
- Recorded G502 HERO hardware results (USB ID `046D:C08B`): DPI read succeeded; two LIGHTSYNC zones were reported and acknowledged a lighting write, but the device did not provide readback and the visible LED change was not confirmed; no compatible onboard button profile was reported.
- The connection panel gives a three-step browser setup, checks both advertised HID++ short and long report types, and reports DPI, lighting, and onboard-profile features after a successful connection. Connection errors remain visible until another attempt.
- DPI apply and restore require an explicit confirmation each time. The browser session keeps the starting DPI for restore.
- RGB effects are offered only when the connected device reports the relevant HID++ feature and zones. Some models report write acceptance without supporting readback, so successful response does not independently verify the visible lighting result.
- Experimental hardware assignments are enabled for Logitech devices (VID `046D`) that report HID++ onboard-profile feature `0x8100`, memory model 1, profile format 1, 2, 3, 5, or 7, and a valid 255-byte sector checksum. The button-record base is selected by profile format and entries are bounded by the device-reported button count. Orbit downloads and stores a full slot backup before Apply, changes only exposed button records, recomputes the checksum, reads the full profile back, and attempts to restore the original sector if verification fails. Unsupported game-specific actions remain local.
- This does not cover every Logitech mouse: many non-gaming models have no onboard assignment profiles, and some use other protocols or formats. Feature detection confirms the advertised feature and layout, not that every model's button labels or actions behave like G HUB. Hardware writes still require real-device verification per model.

## Profile files

Orbit imports only `orbit-profile-v1` JSON files with validated fields, supported commands, and bounded DPI stages. Profile data is treated as untrusted input. The app limits imports to 128 KB and stores up to 50 profiles per browser.

## Public test checklist

Before inviting testers, deploy `index.html` from a static HTTPS origin and verify that the hosting policy permits WebHID for its own origin. Approve the browser device chooser and use the explicit Apply action only when Orbit identifies a supported onboard format. Each write is experimental and asks for confirmation. Verify each mouse model physically before claiming G HUB-level compatibility; unsupported devices remain local-only for button assignments.

The interface uses inline HTML, CSS, and JavaScript and does not fetch fonts, analytics, or profile data from third parties.

The interface font files in `dist/fonts/` are Switzer from [Fontshare](https://www.fontshare.com/fonts/switzer), subject to the [Fontshare license](https://www.fontshare.com/licenses/sil-ofl).

## GitHub Pages

The repository serves the `dist/` folder with GitHub Pages. After publishing, open the Pages URL in desktop Chrome or Edge over HTTPS; WebHID requires a supported browser and the user must select the device in the browser chooser. This static site does not add a backend or send profile data to GitHub.

## Reverse-engineering notes

REA was used against the installed Logitech G HUB 39.1.2 Electron package. Static analysis recovered parts of the renderer IPC surface, but did not establish G HUB's own write path. Orbit uses the publicly exposed HID++ 0x8100 onboard-profile feature directly through browser WebHID; it does not connect to G HUB's local service. Orbit supports the shared button-record layouts for formats 1, 2, 3, 5, and 7 when the device reports compatible geometry. This provides broader support for Logitech gaming mice with compatible onboard profiles; it is not equivalent to all G HUB device support.

Profile-sector framing and layout references: [Logitech HID++ documentation](https://github.com/Logitech/cpg-docs/tree/master/hidpp20), [Solaar profile support work](https://github.com/pwr-Solaar/Solaar/pull/3345), and [OpenMouse profile-format notes](https://github.com/OpenMouse-Project/mouse-protocol/blob/main/docs/logitech-onboard-profiles.md). Formats are device-specific, so Orbit enables writes only for recognized layouts with valid checksums and bounded button entries.

The layout is informed by Logitech's public [HID++ 2.0 documentation](https://github.com/Logitech/cpg-docs/tree/master/hidpp20) and [G HUB feature overview](https://www.logitechg.com/en-sg/software/ghub). Orbit is an independent prototype and is not affiliated with Logitech.
