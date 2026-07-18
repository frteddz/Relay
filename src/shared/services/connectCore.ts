import { createCore } from "../../core";
import { eventBus } from "../../core/EventBus";
import type { CoreEvents } from "../../core/EventBus";
import type { CoreContext } from "../../core";
import { useStore } from "../store";
import { getApi } from "../ipc";
import type { Device } from "../../core/types";
import type { NotificationItem } from "../../core/types";
import { writeToClipboard } from "../utils/clipboard";

let initialized = false;
let discoveryStarted = false;
let coreInstance: CoreContext | null = null;
let cleanupFns: Array<() => void> = [];

type Handler<K extends keyof CoreEvents> = (payload: CoreEvents[K]) => void;

export function getCore(): CoreContext {
  if (!coreInstance) {
    const settings = useStore.getState().settings;
    coreInstance = createCore(eventBus, (settings as any).signalingUrl);
  }
  return coreInstance;
}

function mapBeaconToDevice(beacon: Record<string, unknown>): Device {
  return {
    id: beacon.id as string,
    name: beacon.name as string,
    type: (beacon.type as Device["type"]) ?? "unknown",
    os: (beacon.os as Device["os"]) ?? "unknown",
    ip: (beacon.ip as string) ?? "0.0.0.0",
    state: "online",
    lastSeen: (beacon.ts as number) ?? Date.now(),
    version: (beacon.version as string) ?? "0.0.0",
    capabilities: (beacon.capabilities as Device["capabilities"]) ?? {
      clipboard: false,
      fileTransfer: false,
      linkShare: false,
    },
  };
}

export async function sendPairRequest(targetDeviceId: string): Promise<{ ok: boolean; error?: string }> {
  const api = getApi();
  if (!api.pairing || !api.network) return { ok: false, error: "Pairing is not available in this environment." };

  const state = useStore.getState();

  const hasIncoming = state.notifications.some(
    (n) => n.deviceId === targetDeviceId && n.status === "pending" && n.direction === "received"
  );
  if (hasIncoming) {
    return { ok: false, error: "This device has already sent you a pairing request. Use Accept to pair." };
  }

  const existing = state.notifications.find(
    (n) => n.status === "pending" && n.direction === "sent"
  );
  if (existing) {
    return { ok: false, error: "You already have a pending outgoing pairing request. Wait for it to be resolved or expire." };
  }

  const device = state.devices.find((d) => d.id === targetDeviceId);
  if (!device) return { ok: false, error: "Device not found." };

  const deviceName = await api.device?.getName() ?? "Unknown";
  const expiresAt = Date.now() + 60_000;

  const notification: NotificationItem = {
    id: `pair-${Date.now()}-${targetDeviceId}`,
    deviceId: targetDeviceId,
    deviceName: device.name,
    direction: "sent",
    status: "pending",
    createdAt: Date.now(),
    expiresAt,
    fromIp: device.ip,
  };
  state.addNotification(notification);
  state.updateDeviceState(targetDeviceId, "pairing");

  await api.pairing.sendRequest({
    targetIp: device.ip,
    targetId: targetDeviceId,
    requestId: notification.id,
    fromName: deviceName,
    fromOs: device.os,
    expiresAt,
  });

  return { ok: true };
}

export function connectCore(): void {
  if (initialized) return;
  initialized = true;

  const core = getCore();

  const bind = <K extends keyof CoreEvents>(event: K, handler: Handler<K>) => {
    core.bus.on(event, handler);
  };

  bind("device:discovered", (device) => useStore.getState().upsertDevice(device));
  bind("device:updated", (device) => useStore.getState().upsertDevice(device));
  bind("device:removed", (id) => useStore.getState().removeDevice(id));
  bind("device:state", ({ id, state }) =>
    useStore.getState().updateDeviceState(id, state)
  );

  bind("pairing:requested", (request) => {
    useStore.getState().addPairing(request);
    if (core.pairing.isTrusted(request.deviceId)) {
      void core.pairing.resolve(request.id, true);
    }
  });
  bind("pairing:resolved", ({ id }) => useStore.getState().removePairing(id));
  bind("pairing:resolved", ({ deviceId, accepted }) => {
    if (accepted) void core.connection.connect(deviceId);
  });
  bind("pairing:trustChanged", () => {
    useStore.getState().setTrusted(core.pairing.trusted());
  });

  bind("connection:changed", ({ id, connected }) => {
    useStore.getState().setTrusted(core.pairing.trusted());
    if (connected) {
      useStore.getState().updateDeviceState(id, "paired");
    }
  });
  bind("clipboard:received", (entry) => {
    useStore.getState().addClipboardEntry(entry);
  });
  bind("transfer:added", (transfer) => useStore.getState().upsertTransfer(transfer));
  bind("transfer:progress", ({ id, transferred, speed, remaining }) =>
    useStore.getState().updateTransfer(id, { transferred, speed, remaining })
  );
  bind("transfer:status", ({ id, status }) =>
    useStore.getState().updateTransfer(id, { status })
  );

  useStore.getState().setTrusted(core.pairing.trusted());
  useStore.getState().setClipboardHistory(core.clipboard.history());
  useStore.getState().setTransfers(core.transfers.list());

  const api = getApi();
  if (api.isElectron && api.discovery) {
    cleanupFns.push(
      api.discovery.onDeviceFound((beacon) => {
        const device = mapBeaconToDevice(beacon as unknown as Record<string, unknown>);
        useStore.getState().upsertDevice(device);
        core.registry.upsert(device);
        core.bus.emit("device:discovered", device);
      })
    );
    cleanupFns.push(
      api.discovery.onDeviceLost((deviceId) => {
        useStore.getState().removeDevice(deviceId);
        core.registry.remove(deviceId);
        core.bus.emit("device:removed", deviceId);
      })
    );
    cleanupFns.push(
      api.discovery.onDeviceChanged((beacon) => {
        const device = mapBeaconToDevice(beacon as unknown as Record<string, unknown>);
        useStore.getState().upsertDevice(device);
        core.registry.upsert(device);
        core.bus.emit("device:updated", device);
      })
    );

    if (api.network) {
      cleanupFns.push(
        api.network.onLocalIp((ip) => {
          useStore.getState().setLocalIp(ip);
        })
      );
    }

    if (api.pairing) {
      cleanupFns.push(
        api.pairing.onRequestReceived((msg) => {
          const store = useStore.getState();

          if (!store.devices.find((d) => d.id === msg.fromId)) {
            const device = mapBeaconToDevice({
              id: msg.fromId,
              name: msg.fromName,
              type: "unknown",
              os: msg.fromOs ?? "unknown",
              ip: msg.fromIp,
              version: "v0.1.2-A",
              capabilities: { clipboard: true, fileTransfer: true, linkShare: true },
              ts: Date.now(),
            });
            store.upsertDevice(device);
            core.registry.upsert(device);
          }

          if (core.pairing.isTrusted(msg.fromId)) {
            core.pairing.trust(msg.fromId);
            store.setTrusted(core.pairing.trusted());
            store.updateDeviceState(msg.fromId, "paired");

            store.addNotification({
              id: msg.requestId,
              deviceId: msg.fromId,
              deviceName: msg.fromName,
              direction: "received",
              status: "accepted",
              createdAt: Date.now(),
              expiresAt: msg.expiresAt,
              fromIp: msg.fromIp,
            });

            if (api.pairing && api.network) {
              api.pairing.sendResponse({
                targetIp: msg.fromIp,
                targetId: msg.fromId,
                requestId: msg.requestId,
                accepted: true,
              });
            }
            return;
          }

          const notification: NotificationItem = {
            id: msg.requestId,
            deviceId: msg.fromId,
            deviceName: msg.fromName,
            direction: "received",
            status: "pending",
            createdAt: Date.now(),
            expiresAt: msg.expiresAt,
            fromIp: msg.fromIp,
          };
          store.addNotification(notification);
        })
      );

      cleanupFns.push(
        api.pairing.onResponseReceived((msg) => {
          const store = useStore.getState();

          if (msg.accepted) {
            core.pairing.trust(msg.fromId);
            store.setTrusted(core.pairing.trusted());
            store.updateDeviceState(msg.fromId, "paired");

            const existing = store.notifications.find(
              (n) => n.id === msg.requestId
            );
            if (existing) {
              store.updateNotification(msg.requestId, { status: "accepted" });
            } else {
              store.addNotification({
                id: msg.requestId,
                deviceId: msg.fromId,
                deviceName: msg.fromName,
                direction: "sent",
                status: "accepted",
                createdAt: Date.now(),
                expiresAt: Date.now() + 60_000,
              });
            }

            core.connection.connect(msg.fromId);
          } else {
            const existing = store.notifications.find(
              (n) => n.id === msg.requestId
            );
            if (existing) {
              store.updateNotification(msg.requestId, { status: "declined" });
            } else {
              store.addNotification({
                id: msg.requestId,
                deviceId: msg.fromId,
                deviceName: msg.fromName,
                direction: "sent",
                status: "declined",
                createdAt: Date.now(),
                expiresAt: Date.now() + 60_000,
              });
            }
            store.updateDeviceState(msg.fromId, "online");
          }
        })
      );

      if (api.clipboard) {
        cleanupFns.push(
          api.clipboard.onSyncReceived((msg) => {
            if (core.pairing.isTrusted(msg.fromId)) {
              core.clipboard.receive(msg.text, msg.fromId);
              writeToClipboard(msg.text).catch(() => undefined);
            }
          })
        );
      }

      if (api.transfer) {
        cleanupFns.push(
          api.transfer.onRequestReceived((msg) => {
            const store = useStore.getState();
            if (!msg.tcpPort || !msg.fileName || !msg.fileSize) return;

            const id = msg.requestId;
            const existing = store.transfers.find((t) => t.id === id);
            if (existing) return;

            store.upsertTransfer({
              id,
              deviceId: msg.fromId,
              deviceName: msg.fromName,
              fileName: msg.fileName,
              size: msg.fileSize,
              transferred: 0,
              speed: 0,
              remaining: msg.fileSize,
              status: "queued",
              direction: "incoming",
              timestamp: Date.now(),
            });

            void api.transfer!.acceptTransfer({
              transferId: id,
              ip: msg.fromIp,
              port: msg.tcpPort,
              fileName: msg.fileName,
              fileSize: msg.fileSize,
            });
          })
        );

        cleanupFns.push(
          api.transfer.onProgress((msg) => {
            useStore.getState().updateTransfer(msg.transferId, {
              transferred: msg.transferred,
              speed: msg.speed,
              remaining: msg.total - msg.transferred,
            });
          })
        );

        cleanupFns.push(
          api.transfer.onComplete((msg) => {
            useStore.getState().updateTransfer(msg.transferId, {
              status: msg.reason === "completed" ? "completed" : "failed",
              transferred: undefined as unknown as number,
              speed: 0,
              remaining: 0,
            });
          })
        );

        cleanupFns.push(
          api.transfer.onStatus((msg) => {
            useStore.getState().updateTransfer(msg.transferId, {
              status: msg.status as "active" | "queued" | "paused" | "completed" | "failed" | "canceled",
            });
          })
        );

        cleanupFns.push(
          api.transfer.onLocalPath((msg) => {
            useStore.getState().updateTransfer(msg.transferId, {
              localPath: msg.localPath,
            });
          })
        );
      }
    }

    if (useStore.getState().settings.autoDiscovery && !discoveryStarted) {
      discoveryStarted = true;
      const name = useStore.getState().settings.deviceName;
      void api.discovery.start(name);
    }
  } else if (useStore.getState().settings.autoDiscovery && !discoveryStarted) {
    discoveryStarted = true;
    const name = useStore.getState().settings.deviceName;
    if (name && core.setDeviceName) core.setDeviceName(name);
    core.discovery.start({ enabled: true, intervalMs: 4000 });
  }

  core.connection.reconnectTrusted();
}

export function disconnectCore(): void {
  for (const cleanup of cleanupFns) cleanup();
  cleanupFns = [];
  initialized = false;
  discoveryStarted = false;
}

export function useHasPendingRequest(): boolean {
  return useStore.getState().notifications.some(
    (n) => n.status === "pending" && n.direction === "sent"
  );
}

export function hasIncomingPendingRequest(deviceId: string): boolean {
  return useStore.getState().notifications.some(
    (n) => n.deviceId === deviceId && n.status === "pending" && n.direction === "received"
  );
}

export async function acceptIncomingRequest(notificationId: string): Promise<{ ok: boolean; error?: string }> {
  const api = getApi();
  const core = getCore();
  const store = useStore.getState();
  const notification = store.notifications.find((n) => n.id === notificationId);
  if (!notification) return { ok: false, error: "Notification not found." };
  if (!api.pairing) return { ok: false, error: "Pairing is not available." };

  const device = store.devices.find((d) => d.id === notification.deviceId);
  if (!device) return { ok: false, error: "Device not found." };

  core.pairing.trust(notification.deviceId);
  store.setTrusted(core.pairing.trusted());
  store.updateDeviceState(notification.deviceId, "paired");
  store.updateNotification(notification.id, { status: "accepted" });

  await api.pairing.sendResponse({
    targetIp: device.ip,
    targetId: notification.deviceId,
    requestId: notification.id,
    accepted: true,
  });

  core.connection.connect(notification.deviceId);

  return { ok: true };
}

export async function sendClipboardToDevices(text: string): Promise<void> {
  const api = getApi();
  const core = getCore();
  const deviceName = useStore.getState().settings.deviceName || "Relay";
  core.clipboard.publish(text);

  const trustedDevices = core.pairing.trusted();
  if (trustedDevices.length === 0) return;

  if (api.clipboard) {
    try {
      await api.clipboard.sendSync(text, deviceName);
      return;
    } catch {
      // Fall through to signal-based sending
    }
  }

  if (core.sendSignal && core.deviceId) {
    const payload = {
      type: "clipboard-sync",
      fromId: core.deviceId,
      text,
      fromName: deviceName,
      timestamp: Date.now(),
      expiresAt: Date.now() + 10000,
    };

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        core.sendSignal(payload);
        return;
      } catch {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    }
  }
}

export async function sendFileToDevice(
  targetId: string,
  filePath: string,
  fileName: string,
  fileSize: number
): Promise<{ ok: boolean; error?: string }> {
  const api = getApi();
  const store = useStore.getState();
  if (!api.transfer) return { ok: false, error: "File transfer not available." };

  const device = store.devices.find((d) => d.id === targetId);
  if (!device) return { ok: false, error: "Device not found." };

  const transferId = `tf-${Date.now()}-${targetId}`;

  const transferItem = {
    id: transferId,
    deviceId: targetId,
    deviceName: device.name,
    fileName,
    size: fileSize,
    transferred: 0,
    speed: 0,
    remaining: fileSize,
    status: "active" as const,
    direction: "outgoing" as const,
    timestamp: Date.now(),
  };
  store.upsertTransfer(transferItem);

  const result = await api.transfer.sendFile({
    targetIp: device.ip,
    deviceId: targetId,
    filePath,
    fileName,
    fileSize,
    transferId,
  });

  if (!result.ok) {
    store.updateTransfer(transferId, { status: "failed" });
    return { ok: false, error: result.error };
  }

  return { ok: true };
}

export async function saveReceivedFile(
  transferId: string
): Promise<{ ok: boolean; savedPath?: string; error?: string }> {
  const api = getApi();
  if (!api.transfer) return { ok: false, error: "File transfer not available." };

  const transfer = useStore.getState().transfers.find((t) => t.id === transferId);
  if (!transfer) return { ok: false, error: "Transfer not found." };
  if (!transfer.localPath) return { ok: false, error: "File not found on disk." };

  return api.transfer.saveFile({
    fileName: transfer.fileName,
    sourcePath: transfer.localPath,
  });
}
