import { useState, type ReactNode } from "react";
import { t, tp } from "../i18n/index";
import { initialUiLocale } from "../shared/ui-locale";
import orbitMark from "../shared/orbit-mark.png";

const BRAND = "Orbit Hub";
const DPI = [400, 800, 1200, 1600, 2400, 3200] as const;
const RATES = [125, 250, 500, 1000] as const;
const INITIAL = { dpi: 800, rate: 1000 };

export function MouseDemo(): ReactNode {
  const locale = initialUiLocale();
  const [draft, setDraft] = useState(INITIAL);
  const [applied, setApplied] = useState(INITIAL);
  const [feedback, setFeedback] = useState(false);
  const changed = draft.dpi !== applied.dpi || draft.rate !== applied.rate;

  return (
    <main className="om-page orbit-demo">
      <a href={import.meta.env.BASE_URL} className="om-brand">
        <img src={orbitMark} alt="" width={36} height={36} />
        <span className="om-brand-name">{BRAND}</span>
      </a>
      <header className="om-page-head"><div>
        <h1>{t(locale, "demo.title")}</h1>
        <p className="om-meta">{tp(locale, "ctl.previewLabel", { label: "Attack Shark V5" })}</p>
      </div></header>
      <div className="orbit-demo-workbench">
        <div className="orbit-demo-stage">
          <img src={import.meta.env.BASE_URL + "devices/attackshark-v5.webp"} alt="Attack Shark V5" />
        </div>
        <form className="om-panel orbit-demo-controls" onSubmit={(event) => {
          event.preventDefault();
          setApplied(draft);
          setFeedback(true);
        }}>
          <label>{t(locale, "dpi.value")}
            <select value={draft.dpi} onChange={(event) => {
              setDraft({ ...draft, dpi: Number(event.currentTarget.value) });
              setFeedback(false);
            }}>
              {DPI.map((value) => <option key={value} value={value}>{value}{" DPI"}</option>)}
            </select>
          </label>
          <label>{t(locale, "demo.polling")}
            <select value={draft.rate} onChange={(event) => {
              setDraft({ ...draft, rate: Number(event.currentTarget.value) });
              setFeedback(false);
            }}>
              {RATES.map((value) => <option key={value} value={value}>{value}{" Hz"}</option>)}
            </select>
          </label>
          <div className="orbit-demo-actions">
            <button type="button" className="om-btn is-ghost" disabled={!changed} onClick={() => setDraft(applied)}>
              {t(locale, "pend.revert")}
            </button>
            <button type="submit" className="om-btn is-primary" disabled={!changed}>{t(locale, "pend.apply")}</button>
          </div>
          <p role="status">{feedback ? t(locale, "demo.applied") + ". " : null}
            {tp(locale, "ctl.currentLine", { dpi: applied.dpi, hz: applied.rate })}
          </p>
        </form>
      </div>
    </main>
  );
}
