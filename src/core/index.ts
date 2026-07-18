import { EventBus, eventBus } from "./EventBus";
import { DiscoveryService } from "./DiscoveryService";
import { PairingService } from "./PairingService";
import { ConnectionManager } from "./ConnectionManager";
import { DeviceRegistry } from "./DeviceRegistry";
import { TransferManager } from "./TransferManager";
import { ClipboardService } from "./ClipboardService";
import { IpcMdnsTransport } from "./discovery/IpcMdnsTransport";
import { WebMdnsTransport } from "./discovery/WebMdnsTransport";
import { writeToClipboard } from "../shared/utils/clipboard";

import type {
  IClipboardService,
  IConnectionManager,
  IDeviceRegistry,
  IDiscoveryService,
  IPairingService,
  ITransferManager,
} from "./interfaces";

export interface CoreContext {
  bus: EventBus;
  discovery: IDiscoveryService;
  pairing: IPairingService;
  connection: IConnectionManager;
  registry: IDeviceRegistry;
  transfers: ITransferManager;
  clipboard: IClipboardService;
  deviceId?: string;
  setDeviceName?(name: string): void;
  sendSignal?(payload: Record<string, unknown>): void;
}

export function createCore(bus: EventBus = eventBus): CoreContext {
  const registry = new DeviceRegistry(bus);
  const pairing = new PairingService(bus, registry);
  const connection = new ConnectionManager(bus, registry, pairing);
  const clipboardService = new ClipboardService(bus);

  let transport;
  const webTransport: WebMdnsTransport | undefined =
    typeof window !== "undefined" && typeof WebSocket !== "undefined" && !window.relay?.isElectron
      ? new WebMdnsTransport()
      : undefined;
  try {
    const api =
      typeof window !== "undefined" && window.relay
        ? window.relay
        : null;
    if (api?.isElectron) {
      transport = new IpcMdnsTransport();
    }
  } catch {
    /* not in renderer */
  }

  const webDeviceId: string | undefined =
    webTransport ? (() => { try { return localStorage.getItem("relay:webDeviceId") ?? undefined; } catch { return undefined; } })() : undefined;

  if (webTransport) {
    webTransport.setOnSignal((payload) => {
      if (payload.type === "clipboard-sync" && payload.from) {
        if (pairing.isTrusted(payload.from as string)) {
          clipboardService.receive(payload.text as string, payload.from as string);
          if (typeof payload.text === "string") {
            writeToClipboard(payload.text).catch(() => undefined);
          }
        }
      }
    });
  }

  return {
    bus,
    discovery: new DiscoveryService(bus, registry, transport ?? webTransport),
    pairing,
    connection,
    registry,
    transfers: new TransferManager(bus),
    clipboard: clipboardService,
    deviceId: webDeviceId,
    setDeviceName: webTransport ? (name) => webTransport.setDeviceInfo({ name }) : undefined,
    sendSignal: webTransport ? (payload) => webTransport.sendSignal(payload) : undefined,
  };
}
