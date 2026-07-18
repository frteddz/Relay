import type { ActivityItem, ClipboardEntry, ClipboardOutbound, Device, PairingRequest, TransferItem } from "./types";

export interface CoreEvents {
  "device:discovered": Device;
  "device:updated": Device;
  "device:removed": string;
  "device:state": { id: string; state: Device["state"] };
  "pairing:requested": PairingRequest;
  "pairing:resolved": { id: string; deviceId: string; accepted: boolean };
  "pairing:trustChanged": { id: string; trusted: boolean };
  "connection:changed": { id: string; connected: boolean };
  "transfer:added": TransferItem;
  "transfer:progress": { id: string; transferred: number; speed: number; remaining: number };
  "transfer:status": { id: string; status: TransferItem["status"] };
  "clipboard:received": ClipboardEntry;
  "clipboard:outbound": ClipboardOutbound;
  "activity:logged": ActivityItem;
}

export type CoreEventHandler<K extends keyof CoreEvents> = (
  payload: CoreEvents[K]
) => void;

export class EventBus {
  private handlers: {
    [K in keyof CoreEvents]?: Set<CoreEventHandler<K>>;
  } = {};

  on<K extends keyof CoreEvents>(
    event: K,
    handler: CoreEventHandler<K>
  ): () => void {
    let set = this.handlers[event] as Set<CoreEventHandler<K>> | undefined;
    if (!set) {
      set = new Set<CoreEventHandler<K>>();
      this.handlers[event] = set as never;
    }
    set.add(handler);
    return () => set!.delete(handler);
  }

  off<K extends keyof CoreEvents>(event: K, handler: CoreEventHandler<K>): void {
    (this.handlers[event] as Set<CoreEventHandler<K>> | undefined)?.delete(handler);
  }

  emit<K extends keyof CoreEvents>(event: K, payload: CoreEvents[K]): void {
    const set = this.handlers[event] as Set<CoreEventHandler<K>> | undefined;
    if (!set) return;
    for (const handler of set) handler(payload);
  }

  clear(): void {
    this.handlers = {};
  }
}

export const eventBus = new EventBus();
