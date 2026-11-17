import { displayText } from "../../i18n/index";
import { analyticsAvailable, analyticsEnabled, ANALYTICS_READY_EVENT, setAnalyticsEnabled, track } from "../../platform/analytics";
import { ChevronRight, FlaskConical, Globe, KeyRound, Palette, RotateCcw, SlidersHorizontal, Info } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import * as control from "../../device/controller";
import type { ControlSnapshot } from "../../device/types";
import { LOCALE_NAME_KEYS, t } from "../../i18n/index";
import { interfaceThemeSlug, type InterfaceTheme } from "./interface-preferences";
import { PROJECT_URL } from "../../shared/project-links";
import { OptionMenu, SwitchButton } from "../../shared/ui";

const THEME_ORDER: readonly InterfaceTheme[] = [
  "Emerald",
  "Matt",
  "Violet",
  "Ice",
  "Ember",
  "Mono",
  "Miku",
  "Catppuccin Mocha",
  "Catppuccin Macchiato",
  "Catppuccin Frappé",
  "NieR: Automata",
  "Light",
];

const SECTIONS = [
  { id: "settings-appearance", label: "set.groupAppearance", icon: Palette },
  { id: "settings-behaviour", label: "set.groupBehaviour", icon: SlidersHorizontal },
  { id: "settings-profile-key", label: "set.profileKey", icon: KeyRound },
  { id: "settings-previews", label: "set.previewsTitle", icon: FlaskConical },
  { id: "settings-about", label: "set.groupAbout", icon: Info },
] as const;

type SettingsSection = typeof SECTIONS[number]["id"];

function themeName(theme: InterfaceTheme): string {
  return theme === "Emerald" ? "Orbit" : theme;
}

export function ProfileKeyFields({ snapshot }: { snapshot: ControlSnapshot }): ReactNode {
  const [importText, setImportText] = useState("");
  const [copied, setCopied] = useState(false);
  const locale = snapshot.preferences.locale;
  const key = snapshot.hasActiveDevice ? control.exportProfileKey() : null;

  return (
    <div className="profile-key-fields">
      <label className="profile-key-field">
        <span className="om-label">{t(locale, "set.yourKey")}</span>
        <textarea
          readOnly
          rows={3}
          value={key ?? t(locale, "set.noKey")}
          onFocus={(event) => event.currentTarget.select()}
        />
      </label>
      <div className="profile-key-actions">
        <button
          type="button"
          className="om-btn"
          disabled={!key}
          onClick={() => {
            if (!key) return;
            void navigator.clipboard.writeText(key).then(() => {
              track("profile_key_copied");
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
        >
          {displayText(locale, copied ? t(locale, "set.copied") : t(locale, "set.copyKey"))}
        </button>
      </div>
      <label className="profile-key-field">
        <span className="om-label">{t(locale, "set.importKey")}</span>
        <textarea
          rows={3}
          placeholder={t(locale, "set.importPlaceholder")}
          value={importText}
          onChange={(event) => setImportText(event.currentTarget.value)}
        />
      </label>
      <div className="profile-key-actions">
        <button
          type="button"
          className="om-btn"
          disabled={!importText.trim() || !snapshot.hasActiveDevice}
          onClick={() => {
            control.importProfileKey(importText);
            setImportText("");
          }}
        >
          {t(locale, "set.import")}
        </button>
        <small className="setting-description">{t(locale, "set.importNote")}</small>
      </div>
    </div>
  );
}

function SettingRow({ title, description, children, block = false }: {
  title?: string;
  description?: string;
  children: ReactNode;
  block?: boolean;
}): ReactNode {
  return (
    <div className={`setting-row${block ? " setting-row-block" : ""}`}>
      {title || description ? (
        <div className="setting-label">
          {title ? <span className="setting-title">{title}</span> : null}
          {description ? <span className="setting-description">{description}</span> : null}
        </div>
      ) : null}
      <div className="setting-control">{children}</div>
    </div>
  );
}

function SettingsGroup({ id, title, selected, children }: { id: SettingsSection; title: string; selected: SettingsSection; children: ReactNode }): ReactNode {
  return (
    <section id={id} className="om-settings-group" hidden={selected !== id} aria-labelledby={`${id}-title`}>
      <header className="om-panel-head">
        <h2 id={`${id}-title`}>{title}</h2>
      </header>
      <div className="om-settings-rows">{children}</div>
    </section>
  );
}

export function InterfaceSettings({ snapshot }: { snapshot: ControlSnapshot }): ReactNode {
  const preferences = snapshot.preferences;
  const locale = preferences.locale;
  const [section, setSection] = useState<SettingsSection>("settings-appearance");
  const showPreviews = snapshot.previewEnabled && snapshot.previewEntries.length > 0;
  const selected = section === "settings-previews" && !showPreviews ? "settings-appearance" : section;
  const [analyticsOn, setAnalyticsOn] = useState(analyticsEnabled);
  // posthog loads in the background; the switch appears once it is ready.
  const [analyticsReady, setAnalyticsReady] = useState(analyticsAvailable());
  useEffect(() => {
    const update = (): void => {
      setAnalyticsReady(analyticsAvailable());
      setAnalyticsOn(analyticsEnabled());
    };
    window.addEventListener(ANALYTICS_READY_EVENT, update);
    return () => window.removeEventListener(ANALYTICS_READY_EVENT, update);
  }, []);
  const set = <K extends keyof typeof preferences>(key: K) => (value: (typeof preferences)[K]): void =>
    control.setPreference(key, value);

  const toggle = (id: string, title: string, description: string, checked: boolean, onChange: (next: boolean) => void): ReactNode => (
    <SettingRow title={title} description={description}>
      <SwitchButton id={id} label={title} value={checked} onChange={onChange} />
    </SettingRow>
  );

  return (
    <section
      id="interface-settings-page"
      className={`page om-page om-settings${snapshot.interfaceSettingsOpen ? " is-open" : ""}`}
      aria-labelledby="interface-settings-title"
    >
      <header className="om-page-head">
        <div>
          <h1 id="interface-settings-title">{t(locale, "set.title")}</h1>
          <p className="om-meta">{t(locale, "set.subtitle")}</p>
        </div>
      </header>

      <div className="orbit-settings-layout">
        <nav className="orbit-settings-index" aria-label={t(locale, "set.title")}>
          {SECTIONS.filter(({ id }) => id !== "settings-previews" || showPreviews).map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" aria-controls={id} aria-current={selected === id ? "true" : undefined}
              onClick={() => setSection(id)}>
              <Icon aria-hidden="true" />
              <span>{t(locale, label)}</span>
              <ChevronRight className="orbit-index-arrow" aria-hidden="true" />
            </button>
          ))}
        </nav>
        <div className="orbit-settings-content">
          <SettingsGroup selected={selected} id="settings-appearance" title={t(locale, "set.groupAppearance")}>
            <SettingRow title={t(locale, "set.themeTitle")} description={t(locale, "set.themeBody")} block>
              <div className="orbit-theme-studio">
                <div className="orbit-theme-spotlight">
                  <span className="orbit-theme-design" aria-hidden="true"><i /><i /><i /></span>
                  <strong>{displayText(locale, themeName(preferences.theme))}</strong>
                </div>
                <fieldset id="interface-theme" className="om-theme-grid" aria-label={t(locale, "set.themeTitle")}>
                  {THEME_ORDER.map((name) => (
                    <button key={name} type="button" className="om-theme-tile"
                      aria-pressed={preferences.theme === name}
                      onClick={() => control.setInterfaceTheme(name)}>
                      <span className="orbit-theme-swatch" data-interface-theme={interfaceThemeSlug(name)} aria-hidden="true" />
                      <span className="om-theme-name">{displayText(locale, themeName(name))}</span>
                    </button>
                  ))}
                </fieldset>
              </div>
            </SettingRow>
            <SettingRow title={t(locale, "set.languageTitle")} description={t(locale, "set.languageBody")}>
              <span className="om-language-picker">
                <Globe strokeWidth={1.8} aria-hidden="true" />
                <OptionMenu
                  id="interface-locale"
                  ariaLabel={t(locale, "set.languageTitle")}
                  value={preferences.locale}
                  onChange={set("locale")}
                  options={LOCALE_NAME_KEYS.map(([value, nameKey]) => ({ value, label: t(locale, nameKey) }))}
                />
              </span>
            </SettingRow>
            {toggle(
              "interface-reduced-motion",
              t(locale, "set.animations"),
              t(locale, "set.animationsBody"),
              !preferences.reducedMotion,
              (next) => set("reducedMotion")(!next),
            )}
          </SettingsGroup>

          <SettingsGroup selected={selected} id="settings-behaviour" title={t(locale, "set.groupBehaviour")}>
            {toggle("interface-instant-flash", t(locale, "set.instantFlash"), t(locale, "set.instantFlashBody"), preferences.instantFlash, set("instantFlash"))}
            {toggle("interface-sounds", t(locale, "set.soundTitle"), t(locale, "set.soundDescription"), preferences.enabledSounds, set("enabledSounds"))}
            {toggle("interface-expand-sections", t(locale, "set.advancedEditors"), t(locale, "set.advancedEditorsBody"), preferences.expandSections, set("expandSections"))}
            {toggle("interface-show-experimental", t(locale, "set.experimentalTitle"), t(locale, "set.experimentalBody"), preferences.showExperimental, set("showExperimental"))}
            {analyticsReady
              ? toggle("interface-analytics", t(locale, "set.analytics"), t(locale, "set.analyticsBody"), analyticsOn, (next) => {
                  setAnalyticsEnabled(next);
                  setAnalyticsOn(next);
                })
              : null}
          </SettingsGroup>

          <SettingsGroup selected={selected} id="settings-profile-key" title={t(locale, "set.profileKey")}>
            <SettingRow description={t(locale, "set.profileKeyBody")} block>
              <ProfileKeyFields snapshot={snapshot} />
            </SettingRow>
          </SettingsGroup>

          {showPreviews ? (
            <SettingsGroup selected={selected} id="settings-previews" title={t(locale, "set.previewsTitle")}>
              <SettingRow description={t(locale, "set.previewsBody")} block>
                <div id="preview-launcher-list" className="preview-launcher-list">
                  {snapshot.previewEntries.map(([key, label]) => (
                    <a
                      key={key}
                      className={`preview-launcher-link${snapshot.previewMode === key ? " is-active" : ""}`}
                      href={`?preview=${key}`}
                    >
                      <span>{displayText(locale, label)}</span>
                      <small>{displayText(locale, key)}</small>
                    </a>
                  ))}
                </div>
              </SettingRow>
            </SettingsGroup>
          ) : null}

          <SettingsGroup selected={selected} id="settings-about" title={t(locale, "set.groupAbout")}>
            <SettingRow title={t(locale, "set.version")} description={t(locale, "set.supportBody")}>
              <span className="om-badge">{displayText(locale, snapshot.buildLabel)}</span>
            </SettingRow>
            <SettingRow title={t(locale, "set.supportTitle")}>
              <span className="om-about-links">
                <a className="om-btn is-sm" href={PROJECT_URL + "#readme"} target="_blank" rel="noreferrer">{t(locale, "nav.docs")}</a>
                <a className="om-btn is-sm" href={PROJECT_URL} target="_blank" rel="noreferrer">{displayText(locale, "GitHub")}</a>
              </span>
            </SettingRow>
            <SettingRow title={t(locale, "set.reset")} description={t(locale, "set.resetBody")}>
              <button id="reset-interface-settings" className="om-btn is-danger" type="button" onClick={control.resetInterfacePreferences}>
                <RotateCcw strokeWidth={1.9} aria-hidden="true" />
                {t(locale, "set.resetShort")}
              </button>
            </SettingRow>
          </SettingsGroup>
        </div>
      </div>
    </section>
  );
}
