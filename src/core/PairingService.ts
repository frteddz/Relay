import { EventBus } from "./EventBus";
import type { IPairingService } from "./interfaces";
import type { IDeviceRegistry } from "./interfaces";
import type { PairingRequest, StorageAdapter, TrustedDevice } from "./types";
import { LocalStorageAdapter } from "./persistence/LocalStorageAdapter";
import { generatePairingCode } from "../shared/utils/format";
import { uid } from "../shared/utils/format";

const MAX_CODE_ATTEMPTS = 5;
const TRUST_KEY = "trusted-devices";
const REQUEST_EXPIRY_MS = 120_000;

export class PairingService implements IPairingService {
  readonly bus: EventBus;
  private registry: IDeviceRegistry;
  private storage: StorageAdapter;
  private requests = new Map<string, PairingRequest>();
  private failedAttempts = new Map<string, number>();
  private trustedDevices = new Map<string, TrustedDevice>();

  constructor(
    bus: EventBus,
    registry: IDeviceRegistry,
    storage: StorageAdapter = new LocalStorageAdapter()
  ) {
    this.bus = bus;
    this.registry = registry;
    this.storage = storage;
    this.loadTrust();
  }

  async request(deviceId: string): Promise<PairingRequest> {
    const device = this.registry.get(deviceId);
    if (!device) throw new Error("Device is no longer available for pairing");

    const existing = [...this.requests.values()].find(
      (r) => r.deviceId === deviceId && r.expiresAt > Date.now()
    );
    if (existing) return existing;

    const request: PairingRequest = {
      id: uid("pair"),
      code: generatePairingCode(),
      deviceId,
      deviceName: device.name,
      createdAt: Date.now(),
      expiresAt: Date.now() + REQUEST_EXPIRY_MS,
    };

    this.requests.set(request.id, request);
    this.bus.emit("pairing:requested", request);
    this.bus.emit("device:state", { id: deviceId, state: "pairing" });

    setTimeout(() => this.expire(), REQUEST_EXPIRY_MS + 500);

    return request;
  }

  async resolve(requestId: string, accepted: boolean): Promise<boolean> {
    const request = this.requests.get(requestId);
    if (!request) return false;
    if (request.expiresAt <= Date.now()) {
      this.expire();
      return false;
    }
    this.requests.delete(requestId);
    this.failedAttempts.delete(requestId);
    this.bus.emit("pairing:resolved", { id: requestId, deviceId: request.deviceId, accepted });

    if (!accepted) {
      this.bus.emit("device:state", { id: request.deviceId, state: "online" });
      return true;
    }

    this.trust(request.deviceId);
    this.bus.emit("device:state", { id: request.deviceId, state: "paired" });
    return true;
  }

  async confirm(requestId: string, code: string): Promise<boolean> {
    const request = this.requests.get(requestId);
    if (!request || request.expiresAt <= Date.now()) {
      this.expire();
      return false;
    }

    if (!codesMatch(request.code, code)) {
      const attempts = (this.failedAttempts.get(requestId) ?? 0) + 1;
      this.failedAttempts.set(requestId, attempts);
      if (attempts >= MAX_CODE_ATTEMPTS) await this.resolve(requestId, false);
      return false;
    }
    return this.resolve(requestId, true);
  }

  pending(): PairingRequest[] {
    return [...this.requests.values()].filter((r) => r.expiresAt > Date.now());
  }

  trust(id: string): void {
    const device = this.registry.get(id);
    if (!device) return;
    const existing = this.trustedDevices.get(id);
    if (existing) {
      this.trustedDevices.set(id, { ...existing, name: device.name, os: device.os });
      this.persist();
      return;
    }
    const trusted: TrustedDevice = {
      id,
      name: device.name,
      os: device.os,
      pairedAt: Date.now(),
      lastConnected: Date.now(),
    };
    this.trustedDevices.set(id, trusted);
    this.persist();
    this.bus.emit("pairing:trustChanged", { id, trusted: true });
  }

  untrust(id: string): void {
    if (!this.trustedDevices.delete(id)) return;
    this.persist();
    this.bus.emit("pairing:trustChanged", { id, trusted: false });
    this.bus.emit("device:state", { id, state: "online" });
  }

  trusted(): TrustedDevice[] {
    return [...this.trustedDevices.values()];
  }

  isTrusted(id: string): boolean {
    return this.trustedDevices.has(id);
  }

  markConnected(id: string): void {
    const trusted = this.trustedDevices.get(id);
    if (!trusted) return;
    this.trustedDevices.set(id, { ...trusted, lastConnected: Date.now() });
    this.persist();
  }

  private loadTrust(): void {
    const stored = this.storage.read<TrustedDevice[]>(TRUST_KEY);
    if (stored) for (const t of stored) this.trustedDevices.set(t.id, t);
  }

  private persist(): void {
    this.storage.write(TRUST_KEY, [...this.trustedDevices.values()]);
  }

  private expire(): void {
    const now = Date.now();
    for (const [id, req] of this.requests) {
      if (req.expiresAt <= now) {
        this.requests.delete(id);
        this.failedAttempts.delete(id);
        this.bus.emit("pairing:resolved", { id: req.id, deviceId: req.deviceId, accepted: false });
      }
    }
  }
}

function codesMatch(expected: string, actual: string): boolean {
  if (expected.length !== actual.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ actual.charCodeAt(index);
  }
  return difference === 0;
}
