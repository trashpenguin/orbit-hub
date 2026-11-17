import orbitMark from "../shared/orbit-mark.png";
import { ExternalLink } from "lucide-react";
import { displayText, t } from "../i18n/index";
import { useUiLocale } from "../shared/ui-locale";
import type { ReactNode } from "react";
import type { UnsupportedNotice as Notice } from "../platform/browser-support";
import { BRIDGE_SETUP_URL } from "../shared/project-links";

export function UnsupportedNotice({ notice }: { notice: Notice }): ReactNode {
  const __uiLocale = useUiLocale();
  return (
    <section className="small-screen-blocker">
      <img className="standalone-brand" src={orbitMark} alt="" width={42} height={42} />
      <h1>{displayText(__uiLocale, notice.headline)}</h1>
      <p>{displayText(__uiLocale, notice.detail)}</p>
      {notice.offerBridge ? (
        <a className="om-btn is-primary" href={BRIDGE_SETUP_URL} target="_blank" rel="noreferrer">
          <ExternalLink strokeWidth={1.9} aria-hidden="true" />
          {t(__uiLocale, "nav.docs")}
        </a>
      ) : null}
      <a className="om-btn" href={import.meta.env.BASE_URL + "?demo=1"}>{t(__uiLocale, "demo.try")}</a>
    </section>
  );
}
