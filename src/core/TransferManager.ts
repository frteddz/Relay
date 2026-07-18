import { EventBus } from "./EventBus";
import type { ITransferManager, TransferOptions } from "./interfaces";
import type { TransferItem } from "./types";
import { uid } from "../shared/utils/format";

export class TransferManager implements ITransferManager {
  readonly bus: EventBus;
  private transfers = new Map<string, TransferItem>();

  constructor(bus: EventBus) {
    this.bus = bus;
  }

  enqueue(options: TransferOptions): string {
    const id = uid("tx");
    const item: TransferItem = {
      id,
      deviceId: options.deviceId,
      deviceName: "",
      fileName: options.fileName,
      size: options.size,
      transferred: 0,
      speed: 0,
      remaining: 0,
      status: "queued",
      direction: options.direction,
      timestamp: Date.now(),
    };
    this.transfers.set(id, item);
    this.bus.emit("transfer:added", item);
    return id;
  }

  pause(id: string): void {
    const t = this.transfers.get(id);
    if (t && t.status === "active") {
      t.status = "paused";
      this.bus.emit("transfer:status", { id, status: "paused" });
    }
  }

  resume(id: string): void {
    const t = this.transfers.get(id);
    if (t && t.status === "paused") {
      t.status = "active";
      this.bus.emit("transfer:status", { id, status: "active" });
    }
  }

  cancel(id: string): void {
    const t = this.transfers.get(id);
    if (t && (t.status === "active" || t.status === "queued" || t.status === "paused")) {
      t.status = "canceled";
      this.bus.emit("transfer:status", { id, status: "canceled" });
    }
  }

  list(): TransferItem[] {
    return [...this.transfers.values()];
  }
}
