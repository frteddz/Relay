import { EventBus } from "./EventBus";
import type { IConnectionManager } from "./interfaces";
import type { IPairingService } from "./interfaces";
import type { IDeviceRegistry } from "./interfaces";

export class ConnectionManager implements IConnectionManager {
  readonly bus: EventBus;
  private registry: IDeviceRegistry;
  private pairing: IPairingService;
  private connected = new Set<string>();

  constructor(
    bus: EventBus,
    registry: IDeviceRegistry,
    pairing: IPairingService
  ) {
    this.bus = bus;
    this.registry = registry;
    this.pairing = pairing;

    this.bus.on("device:state", ({ id, state }) => {
      if ((state === "offline" || state === "disconnected") && this.connected.has(id)) {
        this.connected.delete(id);
        this.bus.emit("connection:changed", { id, connected: false });
      }
    });
    this.bus.on("device:removed", (id) => {
      if (this.connected.delete(id)) {
        this.bus.emit("connection:changed", { id, connected: false });
      }
    });
    this.bus.on("pairing:trustChanged", ({ id, trusted }) => {
      if (!trusted) void this.disconnect(id);
    });
    this.bus.on("device:discovered", (device) => {
      if (this.isTrusted(device.id) && device.state === "online") {
        this.connected.add(device.id);
        this.bus.emit("connection:changed", { id: device.id, connected: true });
        this.bus.emit("device:state", { id: device.id, state: "paired" });
        this.pairing.markConnected(device.id);
      }
    });
  }

  async connect(deviceId: string): Promise<void> {
    const device = this.registry.get(deviceId);
    if (!device || device.state === "offline" || !this.isTrusted(deviceId)) return;
    if (this.connected.has(deviceId)) return;
    this.connected.add(deviceId);
    this.bus.emit("connection:changed", { id: deviceId, connected: true });
    this.bus.emit("device:state", { id: deviceId, state: "paired" });
    this.pairing.markConnected(deviceId);
  }

  async disconnect(deviceId: string): Promise<void> {
    if (!this.connected.delete(deviceId)) return;
    this.bus.emit("connection:changed", { id: deviceId, connected: false });
    this.bus.emit("device:state", { id: deviceId, state: "online" });
  }

  isConnected(deviceId: string): boolean {
    return this.connected.has(deviceId);
  }

  reconnectTrusted(): void {
    const devices = this.registry.all();
    for (const device of devices) {
      if (this.isTrusted(device.id) && device.state === "online") {
        this.connected.add(device.id);
        this.bus.emit("connection:changed", { id: device.id, connected: true });
        this.bus.emit("device:state", { id: device.id, state: "paired" });
      }
    }
  }

  private isTrusted(id: string): boolean {
    return this.pairing.isTrusted(id);
  }
}
