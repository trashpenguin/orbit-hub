# Orbit HUB public test

Orbit HUB is an install-free browser prototype for local mouse profiles, DPI control, and limited Logitech RGB lighting. It is independent and is not affiliated with Logitech.

## Run it

Serve this folder from an HTTPS static host. `localhost` is suitable for development; a public deployment must use HTTPS for WebHID. Open the page in desktop Chrome or Edge and select **Add Logitech device** once to grant browser access. USB and supported LIGHTSPEED receivers are the intended connection paths; Bluetooth exposure depends on the browser and device. The browser remembers that permission for this site. Firefox, Safari, mobile browsers, and restricted browser contexts may not provide WebHID, so device controls will not be available there.

There is no account or app server. Profiles are stored in local browser storage and are not uploaded. They do not sync between browsers or devices. Export a JSON backup before clearing browser data or moving to another browser.

## Tested scope

- Logitech G502 HERO over HID++: device detection and DPI reading were verified in the development environment. This is a single-model check, not a compatibility guarantee.
- The connection panel gives a three-step browser setup, checks both advertised HID++ short and long report types, and reports DPI, lighting, and onboard-profile features after a successful connection. Connection errors remain visible until another attempt.
- DPI apply and restore require an explicit confirmation each time. The browser session keeps the starting DPI for restore.
- RGB effects are offered only when the connected device reports the relevant HID++ feature and zones. Some models report write acceptance without supporting readback, so successful response does not independently verify the visible lighting result.
- Button assignments remain local. A read-only probe checks whether the connected device reports HID++ 0x8100 onboard profiles and reads the feature info response. This does not prove the profile data layout, integrity checks, button command IDs, or a safe write and does not send assignments to the mouse.
- Other Logitech models and receiver/Bluetooth combinations are not certified. Device support is feature based and must be checked against each model before making compatibility claims.

## Profile files

Orbit imports only `orbit-profile-v1` JSON files with validated fields, supported commands, and bounded DPI stages. Profile data is treated as untrusted input. The app limits imports to 128 KB and stores up to 50 profiles per browser.

## Public test checklist

Before inviting testers, deploy `index.html` from a static HTTPS origin and verify that the hosting policy permits WebHID for its own origin. Start with a supported mouse and approve the browser device chooser. Hardware assignment writes remain disabled until a real device profile can be read, parsed, preserved, updated, and verified through readback. Do not promise universal Logitech compatibility or hardware button remapping.

The interface uses inline HTML, CSS, and JavaScript and does not fetch fonts, analytics, or profile data from third parties.

The interface font files in `dist/fonts/` are Switzer from [Fontshare](https://www.fontshare.com/fonts/switzer), subject to the [Fontshare license](https://www.fontshare.com/licenses/sil-ofl).

## GitHub Pages

The repository serves the `dist/` folder with GitHub Pages. After publishing, open the Pages URL in desktop Chrome or Edge over HTTPS; WebHID requires a supported browser and the user must select the device in the browser chooser. This static site does not add a backend or send profile data to GitHub.

## Reverse-engineering notes

REA was used against the installed Logitech G HUB 39.1.2 Electron package. Static analysis recovered parts of the renderer IPC surface, but did not establish G HUB's device-write protocol or a browser-accessible equivalent. Orbit implements the documented HID++ features described above; it does not connect to G HUB's local service.

The layout is informed by Logitech's public [HID++ 2.0 documentation](https://github.com/Logitech/cpg-docs/tree/master/hidpp20) and [G HUB feature overview](https://www.logitechg.com/en-sg/software/ghub). Orbit is an independent prototype and is not affiliated with Logitech.
