import { displayText } from "../i18n/index";
import { PenLine } from "lucide-react";
import { memo, useLayoutEffect, useRef, type ReactNode } from "react";
import * as control from "../device/controller";
import { t } from "../i18n/index";
import { useControlSelector } from "./useControl";
import { useUiLocale } from "../shared/ui-locale";

export const PendingBar = memo(function PendingBar(): ReactNode {
  const count = useControlSelector((snapshot) => snapshot.pending.count);
  const suppressed = useControlSelector((snapshot) => snapshot.pending.suppressed);
  const busy = useControlSelector((snapshot) => snapshot.pending.busy);
  const labelsKey = useControlSelector((snapshot) => snapshot.pending.labels.join(" · "));
  const locale = useUiLocale();
  // Text comes from the lazy locale table, not just the locale code.
  useControlSelector((snapshot) => snapshot.localeTableRevision);
  const status = useControlSelector((snapshot) => snapshot.pending.statusText);
  const returnFocus = useRef(false);
  const visible = !suppressed && count > 0;
  useLayoutEffect(() => {
    if (visible || !returnFocus.current) return;
    returnFocus.current = false;
    if (document.activeElement === document.body) {
      const tab = document.querySelector<HTMLElement>('.om-device-page [role="tab"][aria-selected="true"]');
      (tab ?? document.querySelector<HTMLElement>(".om-content"))?.focus();
    }
  }, [visible]);
  if (!visible) return null;
  const label = count === 1
    ? t(locale, "pend.one")
    : `${count} ${t(locale, "pend.many")}`;
  return (
    <div
      id="pending-changes-bar"
      className={`apply-bar${busy ? " is-applying" : ""}`}
      role="region"
      aria-label={t(locale, "pend.region")}
    >
      <span className="apply-bar-label">
        <PenLine strokeWidth={1.8} aria-hidden="true" />
        {displayText(locale, label)}
        {labelsKey.length > 0 ? <em className="apply-bar-summary">{displayText(locale, labelsKey)}</em> : null}
      </span>
      {status ? <span className="apply-bar-status">{displayText(locale, status)}</span> : null}
      <div className="apply-bar-actions">
        <button
          id="pending-revert"
          className="apply-bar-revert"
          type="button"
          aria-disabled={busy}
          onClick={(event) => {
            if (busy) return;
            returnFocus.current = document.activeElement === event.currentTarget;
            control.revertPendingChanges();
          }}
        >
          {t(locale, "pend.revert")}
        </button>
        <button
          id="pending-flash"
          className="apply-bar-apply"
          type="button"
          aria-disabled={busy}
          onClick={(event) => {
            if (busy) return;
            returnFocus.current = document.activeElement === event.currentTarget;
            void control.flashPendingChanges();
          }}
        >
          {displayText(locale, busy ? t(locale, "pend.applying") : t(locale, "pend.apply"))}
        </button>
      </div>
    </div>
  );
});