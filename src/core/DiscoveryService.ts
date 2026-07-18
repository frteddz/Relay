import { EventBus } from "./EventBus";
import type {
  IDiscoveryService,
  IDeviceRegistry,
  DiscoveryOptions,
} from "./interfaces";
import type { Device } from "./types";
import type { MdnsTransport } from "./discovery/MdnsTransport";
import { UnavailableMdnsTransport } from "./discovery/UnavailableMdnsTransport";

export class DiscoveryService implements IDiscoveryService {
  readonly bus: EventBus;
  private transport: MdnsTransport;
  private registry: IDeviceRegistry;
  private running = false;

  constructor(
    bus: EventBus,
    registry: IDeviceRegistry,
    transport: MdnsTransport = new UnavailableMdnsTransport()
  ) {
    this.bus = bus;
    this.registry = registry;
    this.transport = transport;
  }

  start(_options?: DiscoveryOptions): void {
    if (this.running) return;
    this.running = true;

    this.transport.start({
      found: (device) => this.handleFound(device),
      changed: (device) => this.handleChanged(device),
      lost: (id) => this.handleLost(id),
    });

  }

  stop(): void {
    this.running = false;
    this.transport.stop();
  }

  isRunning(): boolean {
    return this.running;
  }

  private handleFound(device: Device): void {
    this.registry.upsert(device);
  }

  private handleChanged(device: Device): void {
    this.registry.upsert(device);
  }

  private handleLost(id: string): void {
    if (!this.registry.get(id)) return;
    this.registry.remove(id);
  }

}
