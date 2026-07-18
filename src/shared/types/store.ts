import type { Settings } from "./device";
import type { ClipboardEntry, ConnectionState, Device, NotificationItem, PairingRequest, TransferItem, TrustedDevice } from "../../core/types";

export interface AppState {
  settings: Settings;
  localIp: string;
  devices: Device[];
  pairings: PairingRequest[];
  trusted: TrustedDevice[];
  clipboardHistory: ClipboardEntry[];
  transfers: TransferItem[];
  notifications: NotificationItem[];

  updateSettings: (patch: Partial<Settings>) => void;
  setLocalIp: (ip: string) => void;
  setDevices: (devices: Device[]) => void;
  upsertDevice: (device: Device) => void;
  removeDevice: (id: string) => void;
  updateDeviceState: (id: string, state: ConnectionState) => void;
  addPairing: (request: PairingRequest) => void;
  removePairing: (id: string) => void;
  setTrusted: (devices: TrustedDevice[]) => void;
  setClipboardHistory: (entries: ClipboardEntry[]) => void;
  addClipboardEntry: (entry: ClipboardEntry) => void;
  setTransfers: (transfers: TransferItem[]) => void;
  upsertTransfer: (transfer: TransferItem) => void;
  updateTransfer: (id: string, patch: Partial<TransferItem>) => void;
  addNotification: (item: NotificationItem) => void;
  updateNotification: (id: string, patch: Partial<NotificationItem>) => void;
  removeNotification: (id: string) => void;
}
