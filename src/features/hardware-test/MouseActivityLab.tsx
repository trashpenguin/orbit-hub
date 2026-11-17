import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { t } from "../../i18n/index";
import type { InterfaceLocale } from "../settings/interface-preferences";
import { computeResults, formatHz } from "./polling-stats";

const WINDOW_MS = 5_000;

function newSample() {
  return { last: null as number | null, intervals: [] as number[], buttons: 0, scrolls: 0 };
}

export function MouseActivityLab({ locale }: { locale: InterfaceLocale }): ReactNode {
  const titleId = useId();
  const hintId = useId();
  const sample = useRef(newSample());
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ rate: number; buttons: number; scrolls: number } | null>(null);
  const number = new Intl.NumberFormat(locale);

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => {
      const { intervals, buttons, scrolls } = sample.current;
      setResult({ rate: computeResults(intervals, WINDOW_MS).avgHz, buttons, scrolls });
      setRunning(false);
    }, WINDOW_MS);
    return () => window.clearTimeout(timer);
  }, [running]);

  return (
    <section className="om-panel orbit-activity-lab" aria-labelledby={titleId}>
      <div>
        <h2 id={titleId}>{t(locale, "hw.activityTitle")}</h2>
        <p className="om-meta" id={hintId}>{t(locale, "hw.activityHint")}</p>
      </div>
      <button type="button" className="om-btn" disabled={running} onClick={() => {
        sample.current = newSample();
        setResult(null);
        setRunning(true);
      }}>
        {t(locale, "hw.activityStart")}
      </button>
      <div
        role="region"
        aria-labelledby={titleId}
        aria-describedby={hintId}
        className="orbit-activity-target"
        onPointerLeave={() => { sample.current.last = null; }}
        onPointerMove={(nativeEvent) => {
          if (!running || nativeEvent.pointerType !== "mouse") return;
          const current = sample.current;
          const events = nativeEvent.getCoalescedEvents?.();
          for (const event of events?.length ? events : [nativeEvent]) {
            if (current.last !== null && current.intervals.length < 20_000) {
              const interval = event.timeStamp - current.last;
              if (interval > 0.05 && interval <= 1_000) current.intervals.push(interval);
            }
            current.last = event.timeStamp;
          }
        }}
        onPointerDown={(event) => {
          if (running && event.pointerType === "mouse") sample.current.buttons++;
        }}
        onContextMenu={(event) => { if (running) event.preventDefault(); }}
        onWheel={() => { if (running) sample.current.scrolls++; }}
      >
        <p role="status">{running ? t(locale, "hw.activitySampling") : t(locale, "hw.activityArea")}</p>
      </div>
      {result ? (
        <dl className="orbit-activity-results" role="status">
          <div><dt>{t(locale, "hw.activityRate")}</dt><dd>{result.rate > 0 ? formatHz(result.rate) + " Hz" : "—"}</dd></div>
          <div><dt>{t(locale, "hw.activityButtons")}</dt><dd>{number.format(result.buttons)}</dd></div>
          <div><dt>{t(locale, "hw.activityScrolls")}</dt><dd>{number.format(result.scrolls)}</dd></div>
        </dl>
      ) : null}
    </section>
  );
}
