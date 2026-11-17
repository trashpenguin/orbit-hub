import { PROJECT_URL } from "../shared/project-links";
import { displayText, t } from "../i18n/index";
import {
  Activity,
  BookOpen,
  Gamepad2,
  LayoutGrid,
  Megaphone,
  Settings as SettingsIcon,
  type LucideIcon,
} from "lucide-react";
import { memo, useCallback, type ReactNode } from "react";
import type { ControlSnapshot, SidebarDevice } from "../device/types";
import type { MouseStatus } from "@openmouse/protocol/drivers/mouse-types";
import { deviceImage, placeholderImage } from "../shared/device-images";
import { BridgeStatusButton } from "../features/bridge/BridgeStatus";
import { BatteryIcon } from "../shared/ui";
import { useUiLocale } from "../shared/ui-locale";


export type DesktopPage = "home" | "dashboard" | "hardware-test" | "games" | "settings";

const NavItem = memo(function NavItem({
  icon: Icon,
  label,
  active = false,
  external = false,
  href,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  external?: boolean;
  href?: string;
  onClick?: () => void;
}): ReactNode {
  const body = (
    <>
      <Icon className="om-nav-icon" strokeWidth={1.8} aria-hidden="true" />
      <span className="om-nav-label">{label}</span>
      {external ? <span className="om-nav-ext" aria-hidden="true">↗</span> : null}
    </>
  );
  const className = `om-nav-item${active ? " is-active" : ""}`;
  const title = label;
  if (href) {
    return (
      <a className={className} title={title} href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
        {body}
      </a>
    );
  }
  return (
    <button className={className} title={title} aria-current={active ? "page" : undefined} type="button" onClick={onClick}>
      {body}
    </button>
  );
});

const DeviceStripRow = memo(function DeviceStripRow({
  device,
  live,
  batteryPercent,
  batteryState,
  open,
}: {
  device: SidebarDevice;
  live: boolean;
  batteryPercent: number | null;
  batteryState: MouseStatus["batteryState"];
  open: (index: number) => void;
  // Bumps when a lazy locale table resolves; row text otherwise keeps the
  // English fallback because no other prop changes on table load.
  localeTableRevision: number;
}): ReactNode {
  const locale = useUiLocale();
  const image = deviceImage({ vendorId: device.vendorId, productId: device.productId } as HIDDevice, device.name, device.kind);
  const openDevice = useCallback(() => open(device.index), [open, device.index]);
  return (
    <li>
      <button
        type="button"
        className={`om-side-device${live ? " is-active" : ""}`}
        title={device.name}
        onClick={openDevice}
      >
        <span className="om-side-device-art" aria-hidden="true">
          <img
            src={image}
            alt=""
            loading="lazy"
            draggable={false}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = placeholderImage(device.kind);
            }}
          />
          {live ? <span className="om-side-device-live" /> : null}
        </span>
        <span className="om-side-device-text">
          <span className="om-side-device-name">{device.name}</span>
          <span className="om-side-device-sub">
            {batteryPercent != null ? (
              <>
                <BatteryIcon percent={batteryPercent} state={batteryState} />
                <span>{batteryPercent}%</span>
              </>
            ) : (
              <span>{live ? t(locale, "side.connected") : t(locale, "home.notConnected")}</span>
            )}
          </span>
        </span>
      </button>
    </li>
  );
});

function DeviceStripRowOutlet({
  snapshot,
  index,
  open,
}: {
  snapshot: ControlSnapshot;
  index: number;
  open: (index: number) => void;
}): ReactNode {
  const device = snapshot.devices.find((entry) => entry.index === index);
  if (!device) return null;
  const live = device.selected && (snapshot.deviceStatus !== null || snapshot.keyboard !== null);
  const status = live ? snapshot.deviceStatus : null;
  return (
    <DeviceStripRow
      device={device}
      live={live}
      batteryPercent={status?.batteryPercent ?? null}
      batteryState={status?.batteryState ?? "Unknown"}
      open={open}
      localeTableRevision={snapshot.localeTableRevision}
    />
  );
}

export function AppHeader({
  snapshot,
  page,
  onNavigate,
  onOpenWhatsNew,
  onOpenDevice,
}: {
  snapshot: ControlSnapshot;
  page: DesktopPage;
  onNavigate: (page: DesktopPage) => void;
  onOpenWhatsNew: () => void;
  onOpenDevice: (index: number) => void;
}): ReactNode {
  const locale = snapshot.preferences.locale;
  const devices = snapshot.devices;
  const goHome = useCallback(() => onNavigate("home"), [onNavigate]);
  const goHardwareTest = useCallback(() => onNavigate("hardware-test"), [onNavigate]);
  const goGames = useCallback(() => onNavigate("games"), [onNavigate]);
  const goSettings = useCallback(() => onNavigate("settings"), [onNavigate]);

  return (
    <header className="orbit-header">
      <div className="orbit-toolbar">
        <a className="om-brand" href={PROJECT_URL} target="_blank" rel="noreferrer"
          title={displayText(locale, "Orbit Hub on GitHub")}>
          <img className="om-brand-mark" src={import.meta.env.BASE_URL + "logo.png"} alt="" width={36} height={36} />
          <span className="om-brand-name">{displayText(locale, "Orbit Hub")}</span>
        </a>

        <nav className="om-nav orbit-primary-nav" aria-label={t(locale, "nav.main")}>
          <NavItem icon={LayoutGrid} label={t(locale, "nav.devices")}
            active={page === "home" || page === "dashboard"} onClick={goHome} />
          <NavItem icon={Activity} label={t(locale, "nav.hardwareTest")}
            active={page === "hardware-test"} onClick={goHardwareTest} />
          <NavItem icon={Gamepad2} label={t(locale, "nav.games")} active={page === "games"} onClick={goGames} />
          <NavItem icon={SettingsIcon} label={t(locale, "nav.settings")} active={page === "settings"} onClick={goSettings} />
        </nav>

        <nav className="om-nav orbit-utility-nav" aria-label={t(locale, "nav.more")}>
          <NavItem icon={BookOpen} label={t(locale, "nav.docs")} href={PROJECT_URL + "#readme"} external />
          <NavItem icon={Megaphone} label={t(locale, "nav.whatsNew")} onClick={onOpenWhatsNew} />
          <BridgeStatusButton locale={locale} />
        </nav>
      </div>

      {devices.length > 0 ? (
        <section className="orbit-device-strip" aria-labelledby="orbit-device-strip-title">
          <h2 id="orbit-device-strip-title">{t(locale, "nav.yourDevices")}</h2>
          <ul>
            {devices.map((device) => (
              <DeviceStripRowOutlet key={device.index} snapshot={snapshot} index={device.index} open={onOpenDevice} />
            ))}
          </ul>
        </section>
      ) : null}
    </header>
  );
}
