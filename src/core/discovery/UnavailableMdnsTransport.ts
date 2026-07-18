import type { DiscoveryTransportEvents, MdnsTransport } from "./MdnsTransport";

/**
 * Production-safe default until a native mDNS adapter is supplied by Electron.
 * It deliberately reports no peers rather than inventing LAN devices.
 */
export class UnavailableMdnsTransport implements MdnsTransport {
  start(_handlers: DiscoveryTransportEvents): void {}

  stop(): void {}

  isRunning(): boolean {
    return false;
  }
}
