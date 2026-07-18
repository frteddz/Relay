export {};

interface DeviceBeacon {
  v: number;
  id: string;
  name: string;
  type: "desktop" | "phone" | "tablet" | "unknown";
  os: "windows" | "linux" | "android" | "macos" | "unknown";
  ip: string;
  version: string;
  capabilities: { clipboard: boolean; fileTransfer: boolean; linkShare: boolean };
  ts: number;
}

declare global {
  interface Window {
    relay?: {
      isElectron: boolean;
      discovery: {
        start(deviceName?: string): Promise<boolean>;
        stop(): Promise<boolean>;
        isRunning(): Promise<boolean>;
        onDeviceFound(callback: (beacon: DeviceBeacon) => void): () => void;
        onDeviceLost(callback: (deviceId: string) => void): () => void;
        onDeviceChanged(callback: (beacon: DeviceBeacon) => void): () => void;
        onStarted(callback: (data: unknown) => void): () => void;
        onStopped(callback: () => void): () => void;
      };
      network: {
        getLocalIp(): Promise<string>;
        getMachineId(): Promise<string>;
        onLocalIp(callback: (ip: string) => void): () => void;
        onMachineId(callback: (id: string) => void): () => void;
      };
      device: {
        getName(): Promise<string>;
      };
      pairing: {
        sendRequest(args: {
          targetIp: string;
          targetId: string;
          requestId: string;
          fromName: string;
          fromOs: string;
          expiresAt: number;
        }): Promise<boolean>;
        sendResponse(args: {
          targetIp: string;
          targetId: string;
          requestId: string;
          accepted: boolean;
        }): Promise<boolean>;
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
        ): () => void;
        onResponseReceived(
          callback: (msg: {
            requestId: string;
            fromId: string;
            fromName: string;
            accepted: boolean;
            fromIp: string;
            toId: string;
          }) => void
        ): () => void;
      };
      clipboard: {
        sendSync(text: string, fromName: string): Promise<boolean>;
        onSyncReceived(
          callback: (msg: { text: string; fromId: string; fromName: string; fromIp: string; timestamp: number }) => void
        ): () => void;
      };
      transfer: {
        sendFile(args: {
          targetIp: string;
          deviceId: string;
          filePath: string;
          fileName: string;
          fileSize: number;
          transferId: string;
        }): Promise<{ ok: boolean; transferId?: string; error?: string }>;
        acceptTransfer(args: {
          transferId: string;
          ip: string;
          port: number;
          fileName: string;
          fileSize: number;
        }): Promise<{ ok: boolean }>;
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
        ): () => void;
        onIncomingFile(
          callback: (msg: {
            transferId: string;
            fileName: string;
            fileSize: number;
            fromIp: string;
          }) => void
        ): () => void;
        onProgress(
          callback: (msg: { transferId: string; transferred: number; total: number; speed: number }) => void
        ): () => void;
        onComplete(
          callback: (msg: { transferId: string; reason: string; error?: string }) => void
        ): () => void;
        onStatus(
          callback: (msg: { transferId: string; status: string }) => void
        ): () => void;
        saveFile(args: { fileName: string; sourcePath: string }): Promise<{ ok: boolean; savedPath?: string; error?: string }>;
        onLocalPath(
          callback: (msg: { transferId: string; localPath: string }) => void
        ): () => void;
      };
      app: {
        onNavigate(callback: (route: string) => void): () => void;
      };
      signal: {
        send(args: { payload: Record<string, unknown>; targetId?: string }): Promise<boolean>;
        onReceived(
          callback: (msg: { type: string; code?: string; fromId: string; fromName: string; fromIp: string }) => void
        ): () => void;
      };
      window: {
        minimize(): void;
        maximize(): void;
        close(): void;
        isMaximized(): Promise<boolean>;
      };
    };
  }
}
