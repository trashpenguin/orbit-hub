import type { ReactNode } from "react";
import { setMouseArtwork } from "../../device/controller";
import { t } from "../../i18n/index";
import { ATTACK_SHARK_ARTWORK, canChooseMouseArtwork, mouseArtworkChoice } from "../../shared/device-images";
import type { InterfaceLocale } from "../settings/interface-preferences";

export function ArtworkPicker({ device, name, locale }: {
  device: Pick<HIDDevice, "vendorId" | "productId">;
  name: string;
  locale: InterfaceLocale;
}): ReactNode {
  if (!canChooseMouseArtwork(name)) return null;
  return (
    <label className="orbit-artwork-picker">
      <span>{t(locale, "artreq.artwork")}</span>
      <select value={mouseArtworkChoice(device, name)} onChange={(event) => setMouseArtwork(device, name, event.currentTarget.value)}>
        <option value="">{t(locale, "artreq.automatic")}</option>
        {ATTACK_SHARK_ARTWORK.map((option) => (
          <option key={option.file} value={option.file}>
            {"color" in option ? option.label + " · " + t(locale, option.color) : option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
