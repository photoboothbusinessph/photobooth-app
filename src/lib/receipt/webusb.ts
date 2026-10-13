// Minimal structural WebUSB types; no runtime dependency or global DOM overrides.
type Alternate = {
  alternateSetting: number;
  interfaceClass: number;
  endpoints: { direction: string; type: string; endpointNumber: number }[];
};
type Configuration = {
  configurationValue: number;
  interfaces: { interfaceNumber: number; alternates: Alternate[] }[];
};
export interface ReceiptUsbDevice {
  opened: boolean;
  configurations: Configuration[];
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(value: number): Promise<void>;
  claimInterface(value: number): Promise<void>;
  releaseInterface(value: number): Promise<void>;
  selectAlternateInterface(value: number, alternate: number): Promise<void>;
  transferOut(
    endpoint: number,
    data: Uint8Array,
  ): Promise<{ status: string; bytesWritten: number }>;
}
interface ReceiptUsb {
  requestDevice(options: { filters: { classCode: number }[] }): Promise<ReceiptUsbDevice>;
}
let selectedDevice: ReceiptUsbDevice | null = null;

export class UsbPrintError extends Error {
  constructor(
    message: string,
    public readonly mayHavePrinted: boolean,
  ) {
    super(message);
  }
}

// Must be called directly inside the Print click, before persistence/network awaits.
export function selectReceiptPrinter(): Promise<ReceiptUsbDevice> {
  const usb = (navigator as Navigator & { usb?: ReceiptUsb }).usb;
  if (!usb || !window.isSecureContext)
    return Promise.reject(
      new UsbPrintError("WebUSB is unavailable. Use Android Chrome over HTTPS.", false),
    );
  if (selectedDevice) return Promise.resolve(selectedDevice);
  return usb.requestDevice({ filters: [{ classCode: 7 }] }).then((device) => {
    selectedDevice = device;
    return device;
  });
}

async function bounded<T>(promise: Promise<T>, milliseconds = 15000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("USB operation timed out.")), milliseconds);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function sendUsbReceipt(device: ReceiptUsbDevice, job: Uint8Array): Promise<void> {
  let started = false;
  let claimed: number | undefined;
  try {
    const targets = device.configurations.flatMap((configuration) =>
      configuration.interfaces.flatMap((usbInterface) =>
        usbInterface.alternates.flatMap((alternate) =>
          alternate.interfaceClass === 7
            ? alternate.endpoints
                .filter((endpoint) => endpoint.direction === "out" && endpoint.type === "bulk")
                .map((endpoint) => ({ configuration, usbInterface, alternate, endpoint }))
            : [],
        ),
      ),
    );
    if (targets.length !== 1)
      throw new Error(
        "A single compatible USB printer interface was not found. Use RawBT for this printer.",
      );
    const target = targets[0];
    if (!device.opened) await bounded(device.open());
    await bounded(device.selectConfiguration(target.configuration.configurationValue));
    await bounded(device.claimInterface(target.usbInterface.interfaceNumber));
    claimed = target.usbInterface.interfaceNumber;
    await bounded(device.selectAlternateInterface(claimed, target.alternate.alternateSetting));
    for (let offset = 0; offset < job.length; offset += 4096) {
      const chunk = job.slice(offset, offset + 4096);
      // A rejected transfer may still have reached the printer. Never auto-resend.
      started = true;
      const result = await bounded(device.transferOut(target.endpoint.endpointNumber, chunk));
      if (result.status !== "ok" || result.bytesWritten !== chunk.length)
        throw new Error("USB transfer was interrupted.");
    }
  } catch (error) {
    selectedDevice = null;
    throw new UsbPrintError(
      error instanceof Error ? error.message : "USB printing failed.",
      started,
    );
  } finally {
    if (claimed !== undefined)
      await bounded(device.releaseInterface(claimed), 2000).catch(() => undefined);
    await bounded(device.close(), 2000).catch(() => undefined);
  }
}
