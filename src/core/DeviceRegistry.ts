import { EventBus } from "./EventBus";
import type { IDeviceRegistry } from "./interfaces";
import type { Device } from "./types";

export class DeviceRegistry implements IDeviceRegistry {
  readonly bus: EventBus;
  private devices = new Map<string, Device>();

  constructor(bus: EventBus) {
    this.bus = bus;
  }

  all(): Device[] {
    return [...this.devices.values()];
  }

  get(id: string): Device | undefined {
    return this.devices.get(id);
  }

  upsert(device: Device): void {
    const existed = this.devices.has(device.id);
    const previous = this.devices.get(device.id);
    const changed =
      !previous ||
      previous.state !== device.state ||
      previous.lastSeen !== device.lastSeen ||
      previous.connectionQuality !== device.connectionQuality;
    this.devices.set(device.id, device);
    if (existed && changed) {
      this.bus.emit("device:updated", device);
    } else if (!existed) {
      this.bus.emit("device:discovered", device);
    }
  }

  remove(id: string): void {
    if (!this.devices.delete(id)) return;
    this.bus.emit("device:removed", id);
  }

  clear(): void {
    this.devices.clear();
  }
}
