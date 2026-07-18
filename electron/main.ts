import { app, BrowserWindow, clipboard, ipcMain, Notification, dialog } from "electron";
import path from "node:path";
import os from "node:os";
import net from "node:net";
import fs from "node:fs";
import { RelayDiscovery } from "./discovery";
import type { SignalingMessage } from "./discovery";
import type { TransferRequestHeader, TransferProgress, TransferEnd } from "./transfer";

const isDev = !app.isPackaged;
const isDevMode = isDev && !process.env.RELAY_PROD_TEST;

if (!isDevMode) {
  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    app.quit();
  } else {
    app.on("second-instance", () => {
      const win = BrowserWindow.getAllWindows()[0];
      if (win) {
        if (win.isMinimized()) win.restore();
        win.focus();
      }
    });
  }
}

let mainWindow: BrowserWindow | null = null;
let discovery: RelayDiscovery | null = null;

function getDeviceName(): string {
  return process.env.RELAY_DEVICE_NAME ?? `Relay (${os.hostname()})`;
}

function createWindow(): BrowserWindow {
  const deviceName = getDeviceName();
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 880,
    minHeight: 600,
    title: deviceName,
    titleBarStyle: "hidden",
    backgroundColor: "#0b0d12",
    icon: app.isPackaged
      ? path.join(process.resourcesPath, "assets/icon.png")
      : path.join(__dirname, "../assets/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(
    isDev ? "http://localhost:5173" : `file://${path.join(__dirname, "../dist/index.html")}`
  );

  if (isDev) win.webContents.openDevTools({ mode: "detach" });

  win.webContents.on("did-finish-load", () => {
    sendToRenderer("network:local-ip", discovery?.getLocalIp() ?? "127.0.0.1");
    sendToRenderer("network:machine-id", discovery?.getMachineId() ?? "");
  });

  return win;
}

function sendToRenderer(channel: string, ...args: unknown[]): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args);
  }
}

function showNotification(title: string, body: string, channel?: string): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const notif = new Notification({ title, body, silent: false });
  notif.on("click", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      if (channel) sendToRenderer("navigate", channel);
    }
  });
  notif.show();
}

function startDiscovery(deviceName: string): void {
  if (discovery?.isRunning()) return;

  discovery = new RelayDiscovery({
    name: deviceName,
    version: "v0.1.2-A",
    devMode: isDevMode,
    signalingUrl: process.env.SIGNALING_URL,
  });

  discovery.start(
    {
      onDeviceFound: (beacon) => sendToRenderer("discovery:device-found", beacon),
      onDeviceLost: (deviceId) => sendToRenderer("discovery:device-lost", deviceId),
      onDeviceChanged: (beacon) => sendToRenderer("discovery:device-changed", beacon),
    },
    {
      onPairRequest: (msg: SignalingMessage, fromIp: string) => {
        sendToRenderer("pairing:request-received", { ...msg, fromIp });
        showNotification(
          "Pairing request",
          `${msg.fromName} wants to pair with you`,
          "/notifications"
        );
      },
      onPairResponse: (msg: SignalingMessage, fromIp: string) => {
        sendToRenderer("pairing:response-received", { ...msg, fromIp });
        if (msg.accepted) {
          showNotification(
            "Device paired",
            `${msg.fromName} accepted your pairing request`,
            "/devices"
          );
        }
      },
      onClipboardSync: (msg: SignalingMessage, fromIp: string) => {
        if (msg.text) {
          try { clipboard.writeText(msg.text); } catch { /* best effort */ }
        }
        sendToRenderer("clipboard:sync-received", { ...msg, fromIp });
        showNotification(
          "Clipboard received",
          `${msg.fromName} sent: ${(msg.text ?? "").substring(0, 60)}${(msg.text ?? "").length > 60 ? "..." : ""}`,
          "/clipboard"
        );
      },
      onTransferRequest: (msg: SignalingMessage, fromIp: string) => {
        sendToRenderer("transfer:request-received", { ...msg, fromIp });
        showNotification(
          "Incoming file",
          `${msg.fromName} is sending: ${msg.fileName ?? "unknown file"}`,
          "/transfer"
        );
      },
    }
  );

  sendToRenderer("discovery:started");
}

function stopDiscovery(): void {
  discovery?.stop();
  discovery = null;
  sendToRenderer("discovery:stopped");
}

function registerIpcHandlers(): void {
  ipcMain.handle("discovery:start", (_event, deviceName?: string) => {
    startDiscovery(deviceName ?? getDeviceName());
    return true;
  });

  ipcMain.handle("discovery:stop", () => {
    stopDiscovery();
    return true;
  });

  ipcMain.handle("discovery:is-running", () => {
    return discovery?.isRunning() ?? false;
  });

  ipcMain.handle("network:get-local-ip", () => {
    return discovery?.getLocalIp() ?? "127.0.0.1";
  });

  ipcMain.handle("network:get-machine-id", () => {
    return discovery?.getMachineId() ?? "";
  });

  ipcMain.handle("device:get-name", () => {
    return getDeviceName();
  });

  ipcMain.handle(
    "pairing:send-request",
    (
      _event,
      args: { targetIp: string; targetId: string; requestId: string; fromName: string; fromOs: string; expiresAt: number }
    ) => {
      if (!discovery) return false;
      const msg: SignalingMessage = {
        type: "pair-request",
        requestId: args.requestId,
        fromId: discovery.getMachineId(),
        fromName: args.fromName,
        fromOs: args.fromOs as SignalingMessage["fromOs"],
        toId: args.targetId,
        expiresAt: args.expiresAt,
      };
      discovery.sendSignal(args.targetIp, msg);
      return true;
    }
  );

  ipcMain.handle(
    "pairing:send-response",
    (
      _event,
      args: { targetIp: string; targetId: string; requestId: string; accepted: boolean }
    ) => {
      if (!discovery) return false;
      const msg: SignalingMessage = {
        type: "pair-response",
        requestId: args.requestId,
        fromId: discovery.getMachineId(),
        fromName: getDeviceName(),
        fromOs: "unknown",
        toId: args.targetId,
        accepted: args.accepted,
        expiresAt: Date.now() + 5000,
      };
      discovery.sendSignal(args.targetIp, msg);
      return true;
    }
  );

  ipcMain.handle(
    "clipboard:send-sync",
    (
      _event,
      args: { text: string; fromName: string }
    ) => {
      if (!discovery) return false;
      const msg: SignalingMessage = {
        type: "clipboard-sync",
        requestId: `clip-${Date.now()}`,
        fromId: discovery.getMachineId(),
        fromName: args.fromName,
        text: args.text,
        timestamp: Date.now(),
        expiresAt: Date.now() + 5000,
      };
      discovery.sendSignal("", msg);
      return true;
    }
  );

  ipcMain.handle(
    "transfer:send-file",
    async (
      _event,
      args: { targetIp: string; deviceId: string; filePath: string; fileName: string; fileSize: number; transferId: string }
    ) => {
      if (!discovery) return { ok: false, error: "Discovery not running" };

      const transferId = args.transferId;

      const server = net.createServer((socket) => {
        const readStream = fs.createReadStream(args.filePath, { highWaterMark: 64 * 1024 });
        let totalSent = 0;
        let startTime = Date.now();
        let lastUpdate = Date.now();

        readStream.on("data", (data) => {
          const canContinue = socket.write(data);
          totalSent += data.length;
          const now = Date.now();
          if (now - lastUpdate >= 200) {
            const elapsed = (now - startTime) / 1000;
            const speed = elapsed > 0 ? totalSent / elapsed : 0;
            sendToRenderer("transfer:progress", {
              transferId, transferred: totalSent, total: args.fileSize, speed
            });
            lastUpdate = now;
          }
          if (!canContinue) readStream.pause();
        });

        socket.on("drain", () => readStream.resume());

        readStream.on("end", () => {
          socket.end();
          sendToRenderer("transfer:complete", {
            transferId, reason: "completed"
          });
        });

        readStream.on("error", (err) => {
          sendToRenderer("transfer:complete", {
            transferId, reason: "failed", error: err.message
          });
          socket.destroy();
        });

        socket.on("error", () => {
          sendToRenderer("transfer:complete", {
            transferId, reason: "failed", error: "Connection lost"
          });
        });
      });

      let connected = false;
      server.on("connection", () => { connected = true; });

      server.listen(0, "0.0.0.0", () => {
        const port = (server.address() as net.AddressInfo).port;

        const msg: SignalingMessage = {
          type: "transfer-request",
          requestId: transferId,
          fromId: discovery!.getMachineId(),
          fromName: getDeviceName(),
          fileName: args.fileName,
          fileSize: args.fileSize,
          tcpPort: port,
          expiresAt: Date.now() + 30000,
        };
        discovery!.sendSignal(args.targetIp, msg);

        setTimeout(() => {
          if (!connected) {
            sendToRenderer("transfer:complete", {
              transferId, reason: "failed", error: "Receiver did not connect"
            });
          }
          try { server.close(); } catch { /* */ }
        }, 35000);
      });

      return { ok: true, transferId };
    }
  );

  ipcMain.handle(
    "transfer:accept",
    async (
      _event,
      args: { transferId: string; ip: string; port: number; fileName: string; fileSize: number }
    ) => {
      const downloadsDir = path.join(os.homedir(), "Downloads", "Relay");
      try { fs.mkdirSync(downloadsDir, { recursive: true }); } catch { /* */ }
      const destPath = path.join(downloadsDir, args.fileName);
      sendToRenderer("transfer:local-path", { transferId: args.transferId, localPath: destPath });

      const client = new net.Socket();
      let received = 0;
      let startTime = Date.now();
      let lastUpdate = Date.now();
      let fileStream: fs.WriteStream | null = null;

      client.connect(args.port, args.ip, () => {
        sendToRenderer("transfer:status", { transferId: args.transferId, status: "active" });
      });

      client.on("data", (chunk) => {
        if (!fileStream) {
          fileStream = fs.createWriteStream(destPath);
        }
        fileStream.write(chunk);
        received += chunk.length;
        const now = Date.now();
        if (now - lastUpdate >= 200) {
          const elapsed = (now - startTime) / 1000;
          const speed = elapsed > 0 ? received / elapsed : 0;
          sendToRenderer("transfer:progress", {
            transferId: args.transferId, transferred: received, total: args.fileSize, speed
          });
          lastUpdate = now;
        }
      });

      client.on("close", () => {
        if (fileStream) fileStream.end();
        const ok = received >= args.fileSize;
        sendToRenderer("transfer:complete", {
          transferId: args.transferId,
          reason: ok ? "completed" : "failed",
          error: ok ? undefined : "Connection closed before transfer completed",
        });
      });

      client.on("error", (err) => {
        if (fileStream) fileStream.end();
        sendToRenderer("transfer:complete", {
          transferId: args.transferId, reason: "failed", error: err.message
        });
      });

      return { ok: true };
    }
  );

  ipcMain.handle(
    "transfer:save-file",
    async (
      _event,
      args: { fileName: string; sourcePath: string }
    ) => {
      try {
        if (!fs.existsSync(args.sourcePath)) {
          return { ok: false, error: "File not found. The transfer may have been cleaned up." };
        }

        const result = await dialog.showSaveDialog(mainWindow!, {
          defaultPath: args.fileName,
          filters: [{ name: "All Files", extensions: ["*"] }],
        });

        if (result.canceled || !result.filePath) {
          return { ok: false, error: "Save cancelled" };
        }

        fs.copyFileSync(args.sourcePath, result.filePath);
        return { ok: true, savedPath: result.filePath };
      } catch (err) {
        return { ok: false, error: (err as Error).message };
      }
    }
  );

  ipcMain.on("window:minimize", () => {
    mainWindow?.minimize();
  });

  ipcMain.on("window:maximize", () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.on("window:close", () => {
    mainWindow?.close();
  });

  ipcMain.handle("window:is-maximized", () => {
    return mainWindow?.isMaximized() ?? false;
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  mainWindow = createWindow();
  startDiscovery(getDeviceName());

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  stopDiscovery();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  stopDiscovery();
});
