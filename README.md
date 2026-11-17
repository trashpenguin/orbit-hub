# Orbit Hub

[Open Orbit Hub](https://trashpenguin.github.io/orbit-hub/) · [Open the original Logitech app](https://trashpenguin.github.io/orbit-hub/legacy/)

Orbit Hub is a browser workspace for tuning mice and keyboards. It shows controls for the features each device reports, including DPI, polling rate, sensor settings, button assignments, RGB and onboard profiles. It includes supported keyboard controls, diagnostics, hardware tests, profile sharing, themes and translations. Check the [OpenMouse device list](https://openmouse.app/supported) for model and feature coverage.

Use desktop Chrome or Edge on HTTPS or localhost. Choose **Add device** and approve the browser's device chooser. Keep the [legacy app](LEGACY.md) available for existing Orbit profiles and backups. Its browser data and file format are separate from the current Orbit Hub workspace.

## Development

```sh
npm ci
npm run dev
npm run check
```

Use Node.js 24. The development server supports fixture previews such as `?preview=egg-op1-v2` and `?preview=list`. Fixture previews allow testing the interface without writing settings to hardware.

The GitHub Pages workflow builds the app under `/orbit-hub/` on pushes to `main`. To replicate that build, run `ORBIT_BASE_PATH=/orbit-hub/ npm run check` in a POSIX shell or set `$env:ORBIT_BASE_PATH = '/orbit-hub/'` before `npm run check` in PowerShell. Serve that build under the same path.

## Desktop companion

For automatic game and app profile switching and devices that require native HID, install [OpenMouse Bridge](https://github.com/OpenMouse-Project/OpenMouse-Bridge). Add `https://trashpenguin.github.io` to the `allowedOrigins` array in Bridge's `config.json` and restart Bridge. Use the origin without a path or trailing slash. On Windows the default directory is `%APPDATA%\OpenMouse\OpenMouse Bridge\config`. Add the exact development origin if you use a non-default local port. Refer to the [Bridge configuration guide](https://github.com/OpenMouse-Project/OpenMouse-Bridge#run-locally).

## Game and app requests

On static hosting, the request dialog downloads the reviewed request as text and links to Orbit Hub issues. For direct submission, deploy the included Cloudflare Pages Functions on a separate Pages project and configure the `DISCORD_FEEDBACK_WEBHOOK` secret and `ORBIT_FEEDBACK_ORIGIN=https://trashpenguin.github.io` there. Configure rate limiting on the feedback deployment using the included middleware's `SECURITY_KV` binding or a Cloudflare WAF rule. Set the Orbit Hub GitHub Actions repository variable `VITE_FEEDBACK_URL` to the resulting HTTPS `/api/feedback` endpoint and rebuild. Keep the webhook URL server-side.

## Source and license

Orbit Hub builds on the [upstream control panel and driver integration](https://github.com/OpenMouse-Project/openmouse/tree/28f08ddf61ce0bc97a4eaa780b98bfe31a9f39fc). The app is licensed under [AGPL-3.0-or-later](LICENSE). Upstream credits, hardware notes and documentation are in [OPENMOUSE.md](OPENMOUSE.md). Source for this version is available in [the Orbit Hub repository](https://github.com/trashpenguin/orbit-hub).
