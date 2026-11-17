# Orbit Hub

Orbit Hub is a browser-based control panel for supported mice and keyboards. Tune your hardware, manage onboard profiles, and run diagnostics from one workspace.

[**Launch Orbit Hub**](https://trashpenguin.github.io/orbit-hub/) · [Try the demo](https://trashpenguin.github.io/orbit-hub/?demo=1) · [Report an issue](https://github.com/trashpenguin/orbit-hub/issues) · [Open the legacy Logitech app](https://trashpenguin.github.io/orbit-hub/legacy/)

## Get started

1. Open Orbit Hub in desktop Chrome or Edge.
2. Select **Add device** and choose your mouse or keyboard in the browser prompt.
3. Open the device to see the controls available for your model.

| Area | What you can do |
| --- | --- |
| Mouse tuning | Adjust DPI, polling rate, sensor settings, button mappings, and lighting where supported. |
| Keyboard tuning | Configure keymaps, lighting, and model-specific settings on supported keyboards. |
| Profiles | Manage onboard profiles where supported and share device setups. |
| Diagnostics | Sample mouse activity without connecting a device, or run hardware tests and download reports. |

Available controls vary by device and connection type. See the [Orbit Hub device compatibility guide](docs/device-compatibility.md). Existing profiles and backups from the original Logitech app can still be opened in the [legacy workspace](LEGACY.md).

## Desktop companion

Orbit Hub can use a desktop companion for automatic game and app profile switching and for devices that require native HID. Browser-based controls on supported WebHID devices work without it.

1. Download the package for your operating system from the [upstream Bridge releases](https://github.com/OpenMouse-Project/OpenMouse-Bridge/releases/latest). The companion is maintained upstream. Orbit Hub connects to it on your computer.
2. Install and run the companion, then add `https://trashpenguin.github.io` to the `allowedOrigins` array in its `config.json`. Enter the origin without a path or trailing slash.
3. Restart the companion and reload [Orbit Hub](https://trashpenguin.github.io/orbit-hub/). Open **Bridge** in the app bar to check its status.

On Windows the configuration directory is `%APPDATA%\OpenMouse\OpenMouse Bridge\config`. For local development, add the exact origin printed by Vite if needed.

To update an older companion, quit it, install the current package for your platform from the releases above, and launch it again. The release page also has the changelog and platform-specific installation details.

## Back up mouse settings

Open **Settings > Profile key** and select **Download profile backup** while a mouse is connected. On the same model, open that file, review the loaded key, and choose **Import**. With Instant flash enabled, importing can write settings to the mouse immediately. The backup contains the settings supported by profile keys.

## Development

Use Node.js 24.

```sh
npm ci
npm run dev
npm run check
```

To run the browser checks locally, build with `ORBIT_BASE_PATH=/orbit-hub/`, run `npx playwright install chromium`, and run `npm run test:browser`.

Append `?preview=list` or `?preview=egg-op1-v2` to the development URL to explore the UI with simulated devices. Preview mode does not write to hardware.

GitHub Pages builds and deploys pushes to `main` under `/orbit-hub/`. To reproduce the production build locally, set `ORBIT_BASE_PATH` to `/orbit-hub/` before running `npm run check`, then serve the output under that path.

## Feedback

Report bugs through [Orbit Hub issues](https://github.com/trashpenguin/orbit-hub/issues). Use the [device report form](https://github.com/trashpenguin/orbit-hub/issues/new?template=device-report.yml) for hardware and artwork, and see the [hardware verification checklist](docs/hardware-verification.md) for testing a model. The **Games** page can download a reviewed game or app request as text to attach to an issue.

To enable direct submission on a self-hosted deployment, deploy the included Cloudflare Pages Functions and set the server-side `DISCORD_FEEDBACK_WEBHOOK` secret and `ORBIT_FEEDBACK_ORIGIN`. Configure rate limiting with the `SECURITY_KV` binding or a Cloudflare WAF rule. Then set `VITE_FEEDBACK_URL` to that deployment’s HTTPS `/api/feedback` URL and rebuild.

## License and acknowledgments

Orbit Hub is licensed under [AGPL-3.0-or-later](LICENSE). It builds on the [OpenMouse control panel and driver integration](https://github.com/OpenMouse-Project/openmouse/tree/28f08ddf61ce0bc97a4eaa780b98bfe31a9f39fc). See [upstream credits and hardware notes](OPENMOUSE.md).
