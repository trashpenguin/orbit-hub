import { flashPendingChanges } from "../../../device/controller";
import { displayText, t } from "../../../i18n/index";
import type { ControlSnapshot } from "../../../device/types";

export function SettingWriteStatus({ snapshot, keyPrefix }: { snapshot: ControlSnapshot; keyPrefix: string }) {
  const locale = snapshot.preferences.locale;
  const entries = snapshot.pending.writeFeedback?.filter(({ key }) => key === keyPrefix || key.startsWith(keyPrefix + "-"));

  return (
    <div className="setting-write-status" role="status" aria-atomic="true">
      {entries?.length ? (
        <ul>
          {entries.map(({ key, label, result, detail }) => {
            const retry = (result === "failed" || result === "mismatch") && snapshot.pending.keys.includes(key);
            return (
              <li key={key}>
                {label}{" · "}{t(locale, result === "confirmed" ? "dpi.readbackConfirmed"
                  : result === "unavailable" ? "dpi.readbackUnavailable"
                  : result === "mismatch" ? "ctl.writeReadbackMismatch" : "ctl.flashFailed")}
                {detail ? <>{" · "}{displayText(locale, detail)}</> : null}
                {retry && !snapshot.pending.suppressed ? <>{" "}{t(locale, "ctl.writeRetry")}</> : null}
                {retry && snapshot.pending.suppressed && !snapshot.gameProfileDraft ? (
                  <button type="button" className="om-btn is-sm" disabled={snapshot.pending.busy}
                    onClick={() => void flashPendingChanges()}>{t(locale, "set.retry")}</button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
