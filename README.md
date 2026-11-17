# Orbit Hub

Orbit Hub is a browser-based control panel for supported mice and keyboards. Tune your hardware, manage onboard profiles, and run diagnostics from one workspace.

[**Launch Orbit Hub**](https://trashpenguin.github.io/orbit-hub/) · [Report an issue](https://github.com/trashpenguin/orbit-hub/issues) · [Open the legacy Logitech app](https://trashpenguin.github.io/orbit-hub/legacy/)

## Get started

1. Open Orbit Hub in desktop Chrome or Edge.
2. Select **Add device** and choose your mouse or keyboard in the browser prompt.
3. Open the device to see the controls available for your model.

| Area | What you can do |
| --- | --- |
| Mouse tuning | Adjust DPI, polling rate, sensor settings, button mappings, and lighting where supported. |
| Keyboard tuning | Configure keymaps, lighting, and model-specific settings on supported keyboards. |
| Profiles | Manage onboard profiles where supported and share device setups. |
| Diagnostics | Run hardware tests and download reports for troubleshooting. |

Available controls vary by device and connection type. See the [device compatibility list](https://openmouse.app/supported). Existing profiles and backups from the original Logitech app can still be opened in the [legacy workspace](LEGACY.md).

## Desktop companion

Automatic game and app profile switching and devices that require native HID use the [desktop companion](https://github.com/OpenMouse-Project/OpenMouse-Bridge/releases/latest).

1. Install and run the companion.
2. Add `https://trashpenguin.github.io` to `allowedOrigins` in its `config.json`. Use the origin without a path or trailing slash.
3. Restart the companion and reload Orbit Hub. Check the **Bridge** status in the sidebar.

On Windows, the default configuration directory is `%APPDATA%\OpenMouse\OpenMouse Bridge\config`. For local development, allow the exact origin printed by Vite if it differs from the companion’s defaults. [Companion configuration guide](https://github.com/OpenMouse-Project/OpenMouse-Bridge#run-locally)

## Development

Use Node.js 24.

```sh
npm ci
npm run dev
npm run check
```

Append `?preview=list` or `?preview=egg-op1-v2` to the development URL to explore the UI with simulated devices. Preview mode does not write to hardware.

GitHub Pages builds and deploys pushes to `main` under `/orbit-hub/`. To reproduce the production build locally, set `ORBIT_BASE_PATH` to `/orbit-hub/` before running `npm run check`, then serve the output under that path.

## Feedback

Report bugs through [Orbit Hub issues](https://github.com/trashpenguin/orbit-hub/issues). The **Games** page can download a reviewed game or app request as text to attach to an issue.

To enable direct submission on a self-hosted deployment, deploy the included Cloudflare Pages Functions and set the server-side `DISCORD_FEEDBACK_WEBHOOK` secret and `ORBIT_FEEDBACK_ORIGIN`. Configure rate limiting with the `SECURITY_KV` binding or a Cloudflare WAF rule. Then set `VITE_FEEDBACK_URL` to that deployment’s HTTPS `/api/feedback` URL and rebuild.

## License and acknowledgments

Orbit Hub is licensed under [AGPL-3.0-or-later](LICENSE). It builds on the [OpenMouse control panel and driver integration](https://github.com/OpenMouse-Project/openmouse/tree/28f08ddf61ce0bc97a4eaa780b98bfe31a9f39fc). See [upstream credits and hardware notes](OPENMOUSE.md).
