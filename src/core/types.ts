export type DeviceType = "desktop" | "phone" | "tablet" | "unknown";

export type OsKind = "windows" | "linux" | "android" | "macos" | "unknown";

export type ConnectionState =
  | "disconnected"
  | "discovering"
  | "online"
  | "pairing"
  | "paired"
  | "offline";

export type ConnectionQuality = "excellent" | "good" | "fair" | "poor" | "offline";

export interface DeviceCapabilities {
  clipboard: boolean;
  fileTransfer: boolean;
  linkShare: boolean;
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  os: OsKind;
  ip: string;
  state: ConnectionState;
  lastSeen: number;
  version: string;
  capabilities: DeviceCapabilities;
  connectionQuality?: ConnectionQuality;
}

export interface PairingRequest {
  id: string;
  code: string;
  deviceId: string;
  deviceName: string;
  createdAt: number;
  expiresAt: number;
}

export interface PairingChallenge {
  requestId: string;
  deviceId: string;
  code: string;
  nonce: string;
  expiresAt: number;
}

export interface TrustedDevice {
  id: string;
  name: string;
  os: OsKind;
  pairedAt: number;
  lastConnected: number;
}

export interface StorageAdapter {
  read<T>(key: string): T | null;
  write<T>(key: string, value: T): void;
  remove(key: string): void;
}

export type TransferStatus = "queued" | "active" | "paused" | "completed" | "failed" | "canceled";

export interface TransferItem {
  id: string;
  deviceId: string;
  deviceName: string;
  fileName: string;
  size: number;
  transferred: number;
  speed: number;
  remaining: number;
  status: TransferStatus;
  direction: "incoming" | "outgoing";
  timestamp: number;
  localPath?: string;
}

export interface ClipboardEntry {
  id: string;
  text: string;
  sourceDeviceId: string;
  timestamp: number;
}

export interface ClipboardOutbound {
  deviceId: string;
  entry: ClipboardEntry;
}

export type ActivityKind = "discovery" | "pair" | "connection" | "clipboard" | "transfer";

export interface ActivityItem {
  id: string;
  deviceId: string;
  deviceName: string;
  kind: ActivityKind;
  message: string;
  timestamp: number;
}

export type NotificationDirection = "sent" | "received";
export type NotificationStatus = "pending" | "accepted" | "declined" | "expired";

export interface NotificationItem {
  id: string;
  deviceId: string;
  deviceName: string;
  direction: NotificationDirection;
  status: NotificationStatus;
  createdAt: number;
  expiresAt: number;
  fromIp?: string;
}
