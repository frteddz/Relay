import { EventBus } from "./EventBus";
import type { IClipboardService } from "./interfaces";
import type { ClipboardEntry, StorageAdapter } from "./types";
import { LocalStorageAdapter } from "./persistence/LocalStorageAdapter";
import { uid } from "../shared/utils/format";

const HISTORY_KEY = "clipboard-history";
const HISTORY_LIMIT = 50;

/** Stores local clipboard history. A peer transport may call receive() later. */
export class ClipboardService implements IClipboardService {
  readonly bus: EventBus;
  private entries: ClipboardEntry[];
  private storage: StorageAdapter;

  constructor(bus: EventBus, storage: StorageAdapter = new LocalStorageAdapter()) {
    this.bus = bus;
    this.storage = storage;
    this.entries = this.storage.read<ClipboardEntry[]>(HISTORY_KEY) ?? [];
  }

  publish(text: string): void {
    const normalized = text.trim();
    if (!normalized || this.entries[0]?.text === normalized) return;
    this.add(normalized, "local");
  }

  receive(text: string, sourceDeviceId: string): void {
    const normalized = text.trim();
    if (!normalized || !sourceDeviceId) return;
    this.add(normalized, sourceDeviceId);
  }

  history(): ClipboardEntry[] {
    return [...this.entries];
  }

  private add(text: string, sourceDeviceId: string): void {
    const entry: ClipboardEntry = { id: uid("clip"), text, sourceDeviceId, timestamp: Date.now() };
    this.entries = [entry, ...this.entries].slice(0, HISTORY_LIMIT);
    this.storage.write(HISTORY_KEY, this.entries);
    this.bus.emit("clipboard:received", entry);
  }
}
