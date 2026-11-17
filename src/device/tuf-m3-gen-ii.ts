import type { MouseStatus } from "@openmouse/protocol/drivers/mouse-types";

const REPORT_ID = 0;
const REPORT_SIZE = 64;
const STAGE_COUNT = 4;
const MIN_DPI = 100;
const MAX_DPI = 8000;
const DPI_STEP = 50;
const POLLING_RATES = [125, 250, 500, 1000];

function packet(...bytes: number[]): Uint8Array<ArrayBuffer> {
  const data = new Uint8Array(REPORT_SIZE);
  data.set(bytes);
  return data;
}

export const TUF_M3_GEN_II_FILTER = {
  vendorId: 0x0b05,
  productId: 0x1a9b,
  usagePage: 0xff01,
  usage: 0x01,
};

function hasConfigurationReport(collection: HIDCollectionInfo): boolean {
  return (collection.usagePage === TUF_M3_GEN_II_FILTER.usagePage && collection.usage === TUF_M3_GEN_II_FILTER.usage
    && collection.inputReports.some(({ reportId }) => reportId === REPORT_ID)
    && collection.outputReports.some(({ reportId }) => reportId === REPORT_ID))
    || collection.children.some(hasConfigurationReport);
}

export function isTufM3GenII(device: HIDDevice): boolean {
  return device.vendorId === TUF_M3_GEN_II_FILTER.vendorId
    && device.productId === TUF_M3_GEN_II_FILTER.productId
    && device.collections.some(hasConfigurationReport);
}

export class TufM3GenIIClient {
  readonly device: HIDDevice;
  private tail: Promise<unknown> = Promise.resolve();

  constructor(device: HIDDevice) {
    this.device = device;
  }

  async close(): Promise<void> {
    await this.tail;
    if (this.device.opened) await this.device.close();
  }

  getDpiOptions(): number[] {
    return Array.from({ length: (MAX_DPI - MIN_DPI) / DPI_STEP + 1 },
      (_, index) => MIN_DPI + index * DPI_STEP);
  }

  private run<T>(task: () => Promise<T>): Promise<T> {
    const result = this.tail.then(task);
    this.tail = result.catch(() => undefined);
    return result;
  }

  private async exchange(request: Uint8Array<ArrayBuffer>, prefixLength = 3): Promise<Uint8Array> {
    const { device } = this;
    if (!device.opened) await device.open();
    return new Promise((resolve, reject) => {
      const cleanup = (): void => {
        clearTimeout(timer);
        device.removeEventListener("inputreport", listener);
      };
      const listener = (event: HIDInputReportEvent): void => {
        if (event.reportId !== REPORT_ID || event.data.byteLength < REPORT_SIZE) return;
        const data = new Uint8Array(event.data.buffer, event.data.byteOffset, REPORT_SIZE);
        if (data[0] === 0xff && data[1] === 0xaa) {
          cleanup();
          reject(new Error("The TUF Gaming M3 Gen II refused the request."));
          return;
        }
        if (!request.subarray(0, prefixLength).every((byte, index) => byte === data[index])) return;
        cleanup();
        resolve(data.slice());
      };
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error("The TUF Gaming M3 Gen II did not answer its configuration report."));
      }, 1000);
      device.addEventListener("inputreport", listener);
      device.sendReport(REPORT_ID, request).catch((error) => {
        cleanup();
        reject(error);
      });
    });
  }

  private async readStage(): Promise<number> {
    // The Gen II returns a zero-based stage. The older ASUS driver expects
    // a one-based stage. See TUFM3GenII.ParseDPIProfile in G-Helper.
    const reply = await this.exchange(packet(0x12, 0x00, 0x00));
    const stage = reply[11];
    if (stage === undefined || stage >= STAGE_COUNT) throw new Error("The mouse returned an invalid DPI stage.");
    return stage;
  }

  private async readSettings() {
    const data = await this.exchange(packet(0x12, 0x04, 0x00));
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const dpiStages = Array.from({ length: STAGE_COUNT }, (_, stage) =>
      (view.getUint16(4 + 2 * stage, true) + 1) * DPI_STEP);
    const pollingRateHz = POLLING_RATES[view.getUint8(4 + 2 * STAGE_COUNT) & 0x07];
    if (pollingRateHz === undefined || dpiStages.some((dpi) => dpi < MIN_DPI || dpi > MAX_DPI)) {
      throw new Error("The mouse returned an unsupported DPI or polling rate.");
    }
    return { dpiStages, pollingRateHz };
  }

  readStatus(): Promise<MouseStatus> {
    return this.run(async () => {
      const settings = await this.readSettings();
      const stage = await this.readStage();
      return {
        brand: "ASUS",
        name: "TUF Gaming M3 Gen II",
        batteryPercent: null,
        batteryState: "Unknown",
        dpi: settings.dpiStages[stage]!,
        dpiStages: settings.dpiStages,
        activeDpiStage: stage,
        pollingRateHz: settings.pollingRateHz,
        supportedPollingRates: POLLING_RATES,
        activeProfile: 1,
        profileCount: 1,
        connectionType: "Wired",
        liftOffDistance: null,
        firmware: [],
        ui: {
          family: "asus",
          settingsReady: true,
          valuesVerified: true,
          hideSignalCard: true,
          hideSleepCard: true,
          hideProcessingCard: true,
          hideUnsupportedPollingRates: true,
          dpiStageEditor: { maxStages: STAGE_COUNT, countEditable: false,
            minDpi: MIN_DPI, maxDpi: MAX_DPI, stepDpi: DPI_STEP },
          defaultDisplayName: "TUF Gaming M3 Gen II",
        },
      };
    });
  }

  private async writeDpi(stage: number, dpi: number): Promise<number> {
    if (!Number.isInteger(stage) || stage < 0 || stage >= STAGE_COUNT
      || !Number.isInteger(dpi) || dpi < MIN_DPI || dpi > MAX_DPI || dpi % DPI_STEP !== 0) {
      throw new Error("Choose a valid DPI stage and a value from 100 to 8000 DPI in steps of 50.");
    }
    // Keep the stage's current indicator color in the combined DPI/color write.
    const colors = await this.exchange(packet(0x12, 0x04, 0x03));
    const color = colors.subarray(4 + 3 * stage, 7 + 3 * stage);
    const value = dpi / DPI_STEP - 1;
    await this.exchange(packet(0x51, 0x31, stage, 0, value & 0xff, value >> 8, ...color));
    await this.exchange(packet(0x50, 0x03), 2);
    const actual = (await this.readSettings()).dpiStages[stage];
    if (actual !== dpi) throw new Error(`The mouse reported ${actual} DPI after the write.`);
    return actual;
  }

  setDpi(dpi: number): Promise<number> {
    return this.run(async () => this.writeDpi(await this.readStage(), dpi));
  }

  setDpiStageValue(stage: number, dpi: number): Promise<number> {
    return this.run(() => this.writeDpi(stage, dpi));
  }

  setActiveDpiStage(stage: number): Promise<number> {
    return this.run(async () => {
      if (!Number.isInteger(stage) || stage < 0 || stage >= STAGE_COUNT) {
        throw new Error("Choose one of the mouse’s four DPI stages.");
      }
      await this.exchange(packet(0x51, 0x31, 0x09, 0x00, stage));
      await this.exchange(packet(0x50, 0x03), 2);
      const actual = await this.readStage();
      if (actual !== stage) throw new Error(`The mouse reported stage ${actual + 1} after the write.`);
      return actual;
    });
  }

  setPollingRate(rate: number): Promise<number> {
    return this.run(async () => {
      const index = POLLING_RATES.indexOf(rate);
      if (index === -1) throw new Error("Unsupported polling rate.");
      await this.exchange(packet(0x51, 0x31, STAGE_COUNT, 0, index));
      await this.exchange(packet(0x50, 0x03), 2);
      const actual = (await this.readSettings()).pollingRateHz;
      if (actual !== rate) throw new Error(`The mouse reported ${actual} Hz after the write.`);
      return actual;
    });
  }
}
