import type { Device } from "../types";
import type { DiscoveryTransportEvents, MdnsTransport } from "./MdnsTransport";
import { getApi } from "../../shared/ipc";

interface DeviceBeacon {
  v: number;
  id: string;
  name: string;
  type: "desktop" | "phone" | "tablet" | "unknown";
  os: "windows" | "linux" | "android" | "macos" | "unknown";
  ip: string;
  version: string;
  capabilities: { clipboard: boolean; fileTransfer: boolean; linkShare: boolean };
  ts: number;
}

function beaconToDevice(beacon: DeviceBeacon): Device {
  return {
    id: beacon.id,
    name: beacon.name,
    type: beacon.type,
    os: beacon.os,
    ip: beacon.ip,
    state: "online",
    lastSeen: beacon.ts,
    version: beacon.version,
    capabilities: beacon.capabilities,
  };
}

export class IpcMdnsTransport implements MdnsTransport {
  private handlers: DiscoveryTransportEvents | null = null;
  private running = false;
  private cleanups: Array<() => void> = [];
  private signalHandler: ((payload: Record<string, unknown>) => void) | null = null;

  start(handlers: DiscoveryTransportEvents): void {
    if (this.running) return;
    this.running = true;
    this.handlers = handlers;

    const api = getApi();
    if (!api.isElectron || !api.discovery) return;

    this.cleanups.push(
      api.discovery.onDeviceFound((beacon) => {
        this.handlers?.found(beaconToDevice(beacon as DeviceBeacon));
      })
    );

    this.cleanups.push(
      api.discovery.onDeviceLost((deviceId) => {
        this.handlers?.lost(deviceId);
      })
    );

    this.cleanups.push(
      api.discovery.onDeviceChanged((beacon) => {
        this.handlers?.changed(beaconToDevice(beacon as DeviceBeacon));
      })
    );

    if (api.signal) {
      this.cleanups.push(
        api.signal.onReceived((msg) => {
          this.signalHandler?.(msg as Record<string, unknown>);
        })
      );
    }
  }

  sendSignal(payload: Record<string, unknown>, targetId?: string): void {
    const api = getApi();
    if (!api.isElectron || !api.signal) return;
    api.signal.send({ payload, targetId });
  }

  setOnSignal(handler: (payload: Record<string, unknown>) => void): void {
    this.signalHandler = handler;
  }

  stop(): void {
    this.running = false;
    this.handlers = null;
    this.signalHandler = null;
    for (const cleanup of this.cleanups) cleanup();
    this.cleanups = [];
  }

  isRunning(): boolean {
    return this.running;
  }
}
