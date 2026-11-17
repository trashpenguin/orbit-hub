import { createRoot } from "react-dom/client";
import "./platform/analytics";
import "./styles/index.css";
import { App } from "./app/App";
import { UnsupportedNotice } from "./app/UnsupportedNotice";
import { installBridgeHid } from "./features/bridge/bridge-hid";
import { unsupportedNotice } from "./platform/browser-support";
import { start } from "./device/controller";
import { mountOfflineBanner } from "./platform/offline-banner";
import { registerServiceWorker } from "./platform/register-sw";
import { startSelfXssGuard } from "./platform/self-xss-guard";
import { ensureDisplayLocale } from "./i18n/index";
import { initialUiLocale } from "./shared/ui-locale";

const controlApp = document.querySelector<HTMLDivElement>("#control-app");

if (!controlApp) {
  throw new Error("Orbit Hub could not find the control application root.");
}

function isChromium(): boolean {
  const brands = (navigator as Navigator & {
    userAgentData?: { brands?: { brand: string }[] };
  }).userAgentData?.brands;
  if (brands) return brands.some((entry) => /chromium/i.test(entry.brand));
  return /Chrom(e|ium)\/|Edg\//.test(navigator.userAgent);
}

registerServiceWorker();
mountOfflineBanner();
if (import.meta.env.PROD) startSelfXssGuard();

const root = createRoot(controlApp);
if (new URLSearchParams(location.search).get("demo") === "1") {
  void Promise.all([ensureDisplayLocale(initialUiLocale()), import("./app/MouseDemo")]).then(([, { MouseDemo }]) => {
    root.render(<MouseDemo />);
  });
} else {
  // Prefer Bridge when it is installed: native HID can reach protected mouse
  // collections that Chrome 153+ correctly withholds from WebHID. If Bridge is
  // absent, installation falls back to the browser's own WebHID implementation.
  void installBridgeHid({ force: true }).then(async (hasHid) => {
    await ensureDisplayLocale(initialUiLocale());
    const notice = unsupportedNotice({
      hasWebHid: hasHid,
      handheld: window.matchMedia("(pointer: coarse) and (hover: none)").matches,
      secureContext: window.isSecureContext,
      chromium: isChromium(),
    });
    if (notice) {
      root.render(<UnsupportedNotice notice={notice} />);
      return;
    }
    if (import.meta.env.DEV) {
      try {
        const { installKeychronPreview } = await import("./device/preview/keychron-preview");
        if (!installKeychronPreview(location.search)) return;
      } catch (error) {
        console.error("Keychron preview unavailable:", error);
      }
    }
    start();
    root.render(<App />);
  });
}
