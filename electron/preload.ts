import { contextBridge, ipcRenderer } from "electron";

const api = {
  isElectron: true,

  discovery: {
    start(deviceName?: string): Promise<boolean> {
      return ipcRenderer.invoke("discovery:start", deviceName);
    },
    stop(): Promise<boolean> {
      return ipcRenderer.invoke("discovery:stop");
    },
    isRunning(): Promise<boolean> {
      return ipcRenderer.invoke("discovery:is-running");
    },
    onDeviceFound(callback: (beacon: unknown) => void): () => void {
      const handler = (_event: unknown, beacon: unknown) => callback(beacon);
      ipcRenderer.on("discovery:device-found", handler);
      return () => ipcRenderer.removeListener("discovery:device-found", handler);
    },
    onDeviceLost(callback: (deviceId: string) => void): () => void {
      const handler = (_event: unknown, deviceId: string) => callback(deviceId);
      ipcRenderer.on("discovery:device-lost", handler);
      return () => ipcRenderer.removeListener("discovery:device-lost", handler);
    },
    onDeviceChanged(callback: (beacon: unknown) => void): () => void {
      const handler = (_event: unknown, beacon: unknown) => callback(beacon);
      ipcRenderer.on("discovery:device-changed", handler);
      return () => ipcRenderer.removeListener("discovery:device-changed", handler);
    },
    onStarted(callback: (data: unknown) => void): () => void {
      const handler = (_event: unknown, data: unknown) => callback(data);
      ipcRenderer.on("discovery:started", handler);
      return () => ipcRenderer.removeListener("discovery:started", handler);
    },
    onStopped(callback: () => void): () => void {
      const handler = () => callback();
      ipcRenderer.on("discovery:stopped", handler);
      return () => ipcRenderer.removeListener("discovery:stopped", handler);
    },
  },

  network: {
    getLocalIp(): Promise<string> {
      return ipcRenderer.invoke("network:get-local-ip");
    },
    getMachineId(): Promise<string> {
      return ipcRenderer.invoke("network:get-machine-id");
    },
    onLocalIp(callback: (ip: string) => void): () => void {
      const handler = (_event: unknown, ip: string) => callback(ip);
      ipcRenderer.on("network:local-ip", handler);
      return () => ipcRenderer.removeListener("network:local-ip", handler);
    },
    onMachineId(callback: (id: string) => void): () => void {
      const handler = (_event: unknown, id: string) => callback(id);
      ipcRenderer.on("network:machine-id", handler);
      return () => ipcRenderer.removeListener("network:machine-id", handler);
    },
  },

  device: {
    getName(): Promise<string> {
      return ipcRenderer.invoke("device:get-name");
    },
  },

  pairing: {
    sendRequest(args: {
      targetIp: string;
      targetId: string;
      requestId: string;
      fromName: string;
      fromOs: string;
      expiresAt: number;
    }): Promise<boolean> {
      return ipcRenderer.invoke("pairing:send-request", args);
    },
    sendResponse(args: {
      targetIp: string;
      targetId: string;
      requestId: string;
      accepted: boolean;
    }): Promise<boolean> {
      return ipcRenderer.invoke("pairing:send-response", args);
    },
    onRequestReceived(
      callback: (msg: {
        requestId: string;
        fromId: string;
        fromName: string;
        fromOs: string;
        fromIp: string;
        expiresAt: number;
        toId: string;
      }) => void
    ): () => void {
      const handler = (_event: unknown, msg: unknown) => callback(msg as never);
      ipcRenderer.on("pairing:request-received", handler);
      return () => ipcRenderer.removeListener("pairing:request-received", handler);
    },
    onResponseReceived(
      callback: (msg: {
        requestId: string;
        fromId: string;
        fromName: string;
        accepted: boolean;
        fromIp: string;
        toId: string;
      }) => void
    ): () => void {
      const handler = (_event: unknown, msg: unknown) => callback(msg as never);
      ipcRenderer.on("pairing:response-received", handler);
      return () => ipcRenderer.removeListener("pairing:response-received", handler);
    },
  },

  clipboard: {
    sendSync(text: string, fromName: string): Promise<boolean> {
      return ipcRenderer.invoke("clipboard:send-sync", { text, fromName });
    },
    onSyncReceived(
      callback: (msg: { text: string; fromId: string; fromName: string; fromIp: string; timestamp: number }) => void
    ): () => void {
      const handler = (_event: unknown, msg: unknown) => callback(msg as never);
      ipcRenderer.on("clipboard:sync-received", handler);
      return () => ipcRenderer.removeListener("clipboard:sync-received", handler);
    },
  },

  transfer: {
    sendFile(args: {
      targetIp: string;
      deviceId: string;
      filePath: string;
      fileName: string;
      fileSize: number;
      transferId: string;
    }): Promise<{ ok: boolean; transferId?: string; error?: string }> {
      return ipcRenderer.invoke("transfer:send-file", args);
    },
    acceptTransfer(args: {
      transferId: string;
      ip: string;
      port: number;
      fileName: string;
      fileSize: number;
    }): Promise<{ ok: boolean }> {
      return ipcRenderer.invoke("transfer:accept", args);
    },
    onRequestReceived(
      callback: (msg: {
        requestId: string;
        fromId: string;
        fromName: string;
        fromIp: string;
        fileName?: string;
        fileSize?: number;
        tcpPort?: number;
      }) => void
    ): () => void {
      const handler = (_event: unknown, msg: unknown) => callback(msg as never);
      ipcRenderer.on("transfer:request-received", handler);
      return () => ipcRenderer.removeListener("transfer:request-received", handler);
    },
    onIncomingFile(
      callback: (msg: {
        transferId: string;
        fileName: string;
        fileSize: number;
        fromIp: string;
      }) => void
    ): () => void {
      const handler = (_event: unknown, msg: unknown) => callback(msg as never);
      ipcRenderer.on("transfer:incoming-file", handler);
      return () => ipcRenderer.removeListener("transfer:incoming-file", handler);
    },
    onProgress(
      callback: (msg: { transferId: string; transferred: number; total: number; speed: number }) => void
    ): () => void {
      const handler = (_event: unknown, msg: unknown) => callback(msg as never);
      ipcRenderer.on("transfer:progress", handler);
      return () => ipcRenderer.removeListener("transfer:progress", handler);
    },
    onComplete(
      callback: (msg: { transferId: string; reason: string; error?: string }) => void
    ): () => void {
      const handler = (_event: unknown, msg: unknown) => callback(msg as never);
      ipcRenderer.on("transfer:complete", handler);
      return () => ipcRenderer.removeListener("transfer:complete", handler);
    },
    onStatus(
      callback: (msg: { transferId: string; status: string }) => void
    ): () => void {
      const handler = (_event: unknown, msg: unknown) => callback(msg as never);
      ipcRenderer.on("transfer:status", handler);
      return () => ipcRenderer.removeListener("transfer:status", handler);
    },
    saveFile(args: { fileName: string; sourcePath: string }): Promise<{ ok: boolean; savedPath?: string; error?: string }> {
      return ipcRenderer.invoke("transfer:save-file", args);
    },
    onLocalPath(
      callback: (msg: { transferId: string; localPath: string }) => void
    ): () => void {
      const handler = (_event: unknown, msg: unknown) => callback(msg as never);
      ipcRenderer.on("transfer:local-path", handler);
      return () => ipcRenderer.removeListener("transfer:local-path", handler);
    },
  },

  app: {
    onNavigate(callback: (route: string) => void): () => void {
      const handler = (_event: unknown, route: unknown) => callback(route as string);
      ipcRenderer.on("navigate", handler);
      return () => ipcRenderer.removeListener("navigate", handler);
    },
  },

  window: {
    minimize(): void {
      ipcRenderer.send("window:minimize");
    },
    maximize(): void {
      ipcRenderer.send("window:maximize");
    },
    close(): void {
      ipcRenderer.send("window:close");
    },
    isMaximized(): Promise<boolean> {
      return ipcRenderer.invoke("window:is-maximized");
    },
  },
};

contextBridge.exposeInMainWorld("relay", api);
