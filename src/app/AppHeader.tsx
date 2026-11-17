import orbitMark from "../shared/orbit-mark.png";
import { PROJECT_URL } from "../shared/project-links";
import { displayText, t } from "../i18n/index";
import {
  Activity,
  ChevronDown,
  Mouse,
  Gamepad2,
  LayoutGrid,
  Settings as SettingsIcon,
  type LucideIcon,
} from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
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
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick: () => void;
}): ReactNode {
  const className = `om-nav-item${active ? " is-active" : ""}`;
  return (
    <button className={className} title={label} aria-current={active ? "page" : undefined} type="button" onClick={onClick}>
      <Icon className="om-nav-icon" strokeWidth={1.8} aria-hidden="true" />
      <span className="om-nav-label">{label}</span>
    </button>
  );
});

const DeviceMenuRow = memo(function DeviceMenuRow({
  device,
  live,
  image,
  batteryPercent,
  batteryState,
  open,
}: {
  device: SidebarDevice;
  live: boolean;
  image: string;
  batteryPercent: number | null;
  batteryState: MouseStatus["batteryState"];
  open: (index: number) => void;
  // Bumps when a lazy locale table resolves; row text otherwise keeps the
  // English fallback because no other prop changes on table load.
  localeTableRevision: number;
}): ReactNode {
  const locale = useUiLocale();
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

function DeviceMenuRowOutlet({
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
    <DeviceMenuRow
      device={device}
      image={deviceImage(device, device.name, device.kind)}
      live={live}
      batteryPercent={status?.batteryPercent ?? null}
      batteryState={status?.batteryState ?? "Unknown"}
      open={open}
      localeTableRevision={snapshot.localeTableRevision}
    />
  );
}

function ToolbarDevicePicker({ snapshot, onOpenDevice }: {
  snapshot: ControlSnapshot;
  onOpenDevice: (index: number) => void;
}): ReactNode {
  const locale = snapshot.preferences.locale;
  const devices = snapshot.devices;
  const selected = devices.find((device) => device.selected);
  const battery = selected ? snapshot.deviceStatus?.batteryPercent : null;
  const [expanded, setExpanded] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!expanded) return;
    const closeOutside = (event: PointerEvent): void => {
      if (!root.current?.contains(event.target as Node)) setExpanded(false);
    };
    const closeWithEscape = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      setExpanded(false);
      trigger.current?.focus();
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeWithEscape, true);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeWithEscape, true);
    };
  }, [expanded]);

  const openDevice = useCallback((index: number): void => {
    setExpanded(false);
    trigger.current?.focus();
    onOpenDevice(index);
  }, [onOpenDevice]);

  if (!devices.length) return null;
  return (
    <div className="orbit-toolbar-devices" ref={root}>
      <button ref={trigger} className="orbit-device-trigger" type="button"
        aria-expanded={expanded} aria-controls={expanded ? "orbit-device-menu" : undefined}
        aria-label={t(locale, "nav.yourDevices")} title={selected?.name ?? t(locale, "nav.yourDevices")}
        onClick={() => setExpanded((open) => !open)}>
        {selected ? (
          <img src={deviceImage(selected, selected.name, selected.kind)} alt="" width={22} height={22}
            onError={(event) => {
              const image = event.currentTarget;
              const fallback = placeholderImage(selected.kind);
              if (image.getAttribute("src") !== fallback) image.src = fallback;
            }} />
        ) : <Mouse aria-hidden="true" />}
        <span className="orbit-device-trigger-name">{selected?.name ?? t(locale, "nav.yourDevices")}</span>
        {battery != null ? <span className="orbit-device-trigger-battery">{battery}%</span> : null}
        <ChevronDown aria-hidden="true" className="orbit-device-trigger-chevron" />
      </button>
      {expanded ? (
        <section className="orbit-device-menu" id="orbit-device-menu" aria-labelledby="orbit-device-menu-title">
          <h2 id="orbit-device-menu-title">{t(locale, "nav.yourDevices")}</h2>
          <ul>
            {devices.map((device) => (
              <DeviceMenuRowOutlet key={device.index} snapshot={snapshot} index={device.index} open={openDevice} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export function AppHeader({
  snapshot,
  page,
  onNavigate,
  onOpenDevice,
}: {
  snapshot: ControlSnapshot;
  page: DesktopPage;
  onNavigate: (page: DesktopPage) => void;
  onOpenDevice: (index: number) => void;
}): ReactNode {
  const locale = snapshot.preferences.locale;
  const goHome = useCallback(() => onNavigate("home"), [onNavigate]);
  const goHardwareTest = useCallback(() => onNavigate("hardware-test"), [onNavigate]);
  const goGames = useCallback(() => onNavigate("games"), [onNavigate]);
  const goSettings = useCallback(() => onNavigate("settings"), [onNavigate]);

  return (
    <header className="orbit-header">
      <div className="orbit-toolbar">
        <a className="om-brand" href={PROJECT_URL} target="_blank" rel="noreferrer"
          title={displayText(locale, "Orbit Hub on GitHub")}>
          <img className="om-brand-mark" src={orbitMark} alt="" width={36} height={36} />
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

        <div className="orbit-toolbar-status">
          <ToolbarDevicePicker snapshot={snapshot} onOpenDevice={onOpenDevice} />
          <BridgeStatusButton locale={locale} />
        </div>
      </div>
    </header>
  );
}
