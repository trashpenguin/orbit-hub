import { ExternalLink, TriangleAlert, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { subscribeBridgeStatus } from "./bridge-status-store";
import type { BridgeStatus } from "./bridge";
import { BRIDGE_SETUP_URL } from "../../shared/project-links";
import { needsManualBridgeUpdate } from "./manual-update";
import { t } from "../../i18n/index";
import type { InterfaceLocale } from "../settings/interface-preferences";
import { useBridgeActive } from "../games/GamesPage";

/**
 * Shown when the connected Bridge is too old to update itself. Dismissing it
 * lasts until the panel reloads, so it returns while the version is still old.
 */
export function BridgeManualUpdate({ locale }: { locale: InterfaceLocale }): ReactNode {
  const active = useBridgeActive();
  const [status, setStatus] = useState<BridgeStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => (active ? subscribeBridgeStatus(setStatus) : (setStatus(null), undefined)), [active]);

  if (dismissed || !needsManualBridgeUpdate(status?.version)) return null;

  return (
    <div className="news-banner news-banner-warning bridge-manual-update" role="alert">
      <TriangleAlert className="news-banner-icon" size={15} strokeWidth={2.2} aria-hidden="true" />
      <p className="news-banner-link">{t(locale, "bridge.manualBody")}</p>
      <a className="om-btn is-primary" href={BRIDGE_SETUP_URL} target="_blank" rel="noreferrer">
        <ExternalLink strokeWidth={1.9} aria-hidden="true" />
        {t(locale, "nav.docs")}
      </a>
      <button type="button" className="news-banner-dismiss" onClick={() => setDismissed(true)} aria-label={t(locale, "common.close")}>
        <X size={15} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}
