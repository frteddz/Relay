import type { Device } from "../types";

export interface DiscoveryTransportEvents {
  found: (device: Device) => void;
  lost: (id: string) => void;
  changed: (device: Device) => void;
}

export interface MdnsTransport {
  start(handlers: DiscoveryTransportEvents): void;
  stop(): void;
  isRunning(): boolean;
}
