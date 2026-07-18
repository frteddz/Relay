import { EventBus, eventBus } from "./EventBus";
import { DiscoveryService } from "./DiscoveryService";
import { PairingService, codesMatch } from "./PairingService";
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
  sendSignal?(payload: Record<string, unknown>, targetId?: string): void;
  activeShortCode?: string;
  setActiveShortCode?(code: string | null): void;
}

export function createCore(bus: EventBus = eventBus, signalingUrl?: string): CoreContext {
  const registry = new DeviceRegistry(bus);
  const pairing = new PairingService(bus, registry);
  const connection = new ConnectionManager(bus, registry, pairing);
  const clipboardService = new ClipboardService(bus);

  let activeShortCode: string | undefined = undefined;

  let transport;
  const webTransport: WebMdnsTransport | undefined =
    typeof window !== "undefined" && typeof WebSocket !== "undefined" && !window.relay?.isElectron
      ? new WebMdnsTransport(signalingUrl)
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
      const fromId = payload.from as string | undefined;
      if (!fromId) return;

      if (payload.type === "clipboard-sync") {
        if (pairing.isTrusted(fromId)) {
          clipboardService.receive(payload.text as string, fromId);
          if (typeof payload.text === "string") {
            writeToClipboard(payload.text).catch(() => undefined);
          }
        }
        return;
      }

      if (payload.type === "pair-verify") {
        const code = payload.code as string;
        if (activeShortCode && code && codesMatch(activeShortCode, code)) {
          pairing.trust(fromId);
          bus.emit("pairing:trustChanged", { id: fromId, trusted: true });
          webTransport.sendSignal(
            { type: "pair-verified", fromId: webDeviceId },
            fromId,
          );
        }
        return;
      }

      if (payload.type === "pair-verified") {
        pairing.trust(fromId);
        bus.emit("pairing:trustChanged", { id: fromId, trusted: true });
        return;
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
    sendSignal: webTransport ? (payload, targetId) => webTransport.sendSignal(payload, targetId) : undefined,
    activeShortCode,
    setActiveShortCode: (code) => { activeShortCode = code ?? undefined; },
  };
}
