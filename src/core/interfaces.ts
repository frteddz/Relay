import type { EventBus } from "./EventBus";
import type {
  ClipboardEntry,
  Device,
  PairingRequest,
  TransferItem,
  TrustedDevice,
} from "./types";

export interface DiscoveryOptions {
  enabled: boolean;
  intervalMs?: number;
}

export interface IDiscoveryService {
  readonly bus: EventBus;
  start(options?: DiscoveryOptions): void;
  stop(): void;
  isRunning(): boolean;
}

export interface IPairingService {
  readonly bus: EventBus;
  request(deviceId: string): Promise<PairingRequest>;
  resolve(requestId: string, accepted: boolean): Promise<boolean>;
  confirm(requestId: string, code: string): Promise<boolean>;
  pending(): PairingRequest[];
  trust(id: string): void;
  untrust(id: string): void;
  trusted(): TrustedDevice[];
  isTrusted(id: string): boolean;
  markConnected(id: string): void;
}

export interface IConnectionManager {
  readonly bus: EventBus;
  connect(deviceId: string): Promise<void>;
  disconnect(deviceId: string): Promise<void>;
  isConnected(deviceId: string): boolean;
  reconnectTrusted(): void;
}

export interface IDeviceRegistry {
  readonly bus: EventBus;
  all(): Device[];
  get(id: string): Device | undefined;
  upsert(device: Device): void;
  remove(id: string): void;
  clear(): void;
}

export interface TransferOptions {
  deviceId: string;
  fileName: string;
  size: number;
  direction: TransferItem["direction"];
}

export interface ITransferManager {
  readonly bus: EventBus;
  enqueue(options: TransferOptions): string;
  pause(id: string): void;
  resume(id: string): void;
  cancel(id: string): void;
  list(): TransferItem[];
}

export interface IClipboardService {
  readonly bus: EventBus;
  publish(text: string): void;
  receive(text: string, sourceDeviceId: string): void;
  history(): ClipboardEntry[];
}
