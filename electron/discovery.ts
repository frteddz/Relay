import dgram from "node:dgram";
import os from "node:os";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import WebSocket from "ws";

const MULTICAST_ADDR = "239.255.224.111";
const MULTICAST_PORT = 41234;
const BROADCAST_INTERVAL_MS = 2000;
const LOST_TIMEOUT_MS = 8000;
const BEACON_VERSION = 1;

export interface DeviceBeacon {
  v: number;
  id: string;
  name: string;
  type: "desktop" | "phone" | "tablet" | "unknown";
  os: "windows" | "linux" | "android" | "macos" | "unknown";
  ip: string;
  version: string;
  capabilities: { clipboard: boolean; fileTransfer: boolean; linkShare: boolean };
  ts: number;
  serverUrl?: string;
}

export interface SignalingMessage {
  type: "pair-request" | "pair-response" | "clipboard-sync" | "transfer-request" | "pair-verify" | "pair-verified";
  requestId: string;
  fromId: string;
  fromName: string;
  fromOs?: DeviceBeacon["os"];
  toId?: string;
  accepted?: boolean;
  code?: string;
  text?: string;
  timestamp?: number;
  fileName?: string;
  fileSize?: number;
  tcpPort?: number;
  expiresAt: number;
}

interface MulticastEnvelope {
  _type: "signal";
  payload: SignalingMessage;
}

export interface DiscoveryCallbacks {
  onDeviceFound: (beacon: DeviceBeacon) => void;
  onDeviceLost: (deviceId: string) => void;
  onDeviceChanged: (beacon: DeviceBeacon) => void;
}

export interface SignalingCallbacks {
  onPairRequest: (msg: SignalingMessage, fromIp: string) => void;
  onPairResponse: (msg: SignalingMessage, fromIp: string) => void;
  onClipboardSync?: (msg: SignalingMessage, fromIp: string) => void;
  onTransferRequest?: (msg: SignalingMessage, fromIp: string) => void;
  onPairVerify?: (msg: SignalingMessage, fromIp: string) => void;
  onPairVerified?: (msg: SignalingMessage, fromIp: string) => void;
}

function getMachineId(devMode: boolean): string {
  if (devMode && process.env.RELAY_INSTANCE_ID) {
    return `mi_${process.env.RELAY_INSTANCE_ID}`;
  }
  if (devMode) {
    return crypto.randomUUID();
  }
  const configDir = path.join(process.env.HOME ?? process.env.USERPROFILE ?? ".", ".relay");
  const idFile = path.join(configDir, "machine-id");
  try {
    if (fs.existsSync(idFile)) return fs.readFileSync(idFile, "utf-8").trim();
  } catch { /* ignore */ }
  const id = crypto.randomUUID();
  try {
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(idFile, id, "utf-8");
  } catch { /* ignore */ }
  return id;
}

function getLocalIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const list = interfaces[name];
    if (!list) continue;
    for (const iface of list) {
      if (iface.family === "IPv4" && !iface.internal) return iface.address;
    }
  }
  return "127.0.0.1";
}

function detectOs(): DeviceBeacon["os"] {
  switch (os.platform()) {
    case "win32": return "windows";
    case "linux": return "linux";
    case "darwin": return "macos";
    default: return "unknown";
  }
}

export class RelayDiscovery {
  private socket: dgram.Socket | null = null;
  private broadcastTimer: ReturnType<typeof setInterval> | null = null;
  private callbacks: DiscoveryCallbacks | null = null;
  private signalCallbacks: SignalingCallbacks | null = null;
  private running = false;
  private machineId: string;
  private localIp: string;
  private beacon: DeviceBeacon;
  private lastSeen = new Map<string, number>();
  private knownDevices = new Map<string, DeviceBeacon>();
  private wsUrl: string;
  private ws: WebSocket | null = null;
  private wsReconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private wsAnnounceTimer: ReturnType<typeof setInterval> | null = null;
  private wsDeviceList = new Map<string, DeviceBeacon>();

  constructor(opts: { name: string; version?: string; devMode?: boolean; signalingUrl?: string; serverUrl?: string }) {
    this.machineId = getMachineId(opts.devMode ?? false);
    this.localIp = getLocalIp();
    this.wsUrl = opts.signalingUrl ?? process.env.SIGNALING_URL ?? "ws://localhost:4001";
    this.beacon = {
      v: BEACON_VERSION,
      id: this.machineId,
      name: opts.name,
      type: "desktop",
      os: detectOs(),
      ip: this.localIp,
      version: opts.version ?? "v0.1.3-A",
      capabilities: { clipboard: true, fileTransfer: true, linkShare: true },
      ts: Date.now(),
      serverUrl: opts.serverUrl,
    };
  }

  updateName(name: string): void { this.beacon.name = name; }
  getLocalIp(): string { return this.localIp; }
  getMachineId(): string { return this.machineId; }

  start(callbacks: DiscoveryCallbacks, signalCallbacks?: SignalingCallbacks): void {
    if (this.running) return;
    this.running = true;
    this.callbacks = callbacks;
    this.signalCallbacks = signalCallbacks ?? null;
    this.localIp = getLocalIp();
    this.beacon.ip = this.localIp;

    this.socket = dgram.createSocket({ type: "udp4", reuseAddr: true });
    this.socket.on("message", (msg, rinfo) => {
      try {
        const data = JSON.parse(msg.toString("utf-8"));
        if (data._type === "signal") {
          const sig = data.payload as SignalingMessage;
          if (sig.toId && sig.toId !== this.machineId) return;
          if (sig.fromId === this.machineId) return;
          if (sig.type === "pair-request") {
            this.signalCallbacks?.onPairRequest(sig, rinfo.address);
          } else if (sig.type === "pair-response") {
            this.signalCallbacks?.onPairResponse(sig, rinfo.address);
          } else if (sig.type === "clipboard-sync") {
            this.signalCallbacks?.onClipboardSync?.(sig, rinfo.address);
          } else if (sig.type === "transfer-request") {
            this.signalCallbacks?.onTransferRequest?.(sig, rinfo.address);
          } else if (sig.type === "pair-verify") {
            this.signalCallbacks?.onPairVerify?.(sig, rinfo.address);
          } else if (sig.type === "pair-verified") {
            this.signalCallbacks?.onPairVerified?.(sig, rinfo.address);
          }
          return;
        }
        const beacon = data as DeviceBeacon;
        if (beacon.v !== BEACON_VERSION || !beacon.id || beacon.id === this.machineId) return;
        this.handleBeacon(beacon, rinfo.address);
      } catch { /* malformed */ }
    });
    this.socket.on("error", () => {});
    this.socket.on("listening", () => {
      try {
        this.socket!.setBroadcast(true);
        this.socket!.setMulticastTTL(4);
        this.socket!.addMembership(MULTICAST_ADDR);
      } catch { /* multicast failed */ }
      this.sendBeacon();
    });
    this.socket.bind(MULTICAST_PORT);

    this.broadcastTimer = setInterval(() => {
      this.beacon.ts = Date.now();
      this.beacon.ip = getLocalIp();
      this.sendBeacon();
      this.checkLost();
    }, BROADCAST_INTERVAL_MS);

    this.connectWs();
  }

  stop(): void {
    this.running = false;
    if (this.broadcastTimer) { clearInterval(this.broadcastTimer); this.broadcastTimer = null; }
    if (this.socket) {
      try { this.socket.dropMembership(MULTICAST_ADDR); } catch { /* */ }
      try { this.socket.close(); } catch { /* */ }
      this.socket = null;
    }
    this.closeWs();
    this.knownDevices.clear();
    this.lastSeen.clear();
    this.wsDeviceList.clear();
    this.callbacks = null;
    this.signalCallbacks = null;
  }

  isRunning(): boolean { return this.running; }

  sendSignal(_targetIp: string, msg: SignalingMessage): void {
    const wrapped: MulticastEnvelope = { _type: "signal", payload: msg };
    const buf = Buffer.from(JSON.stringify(wrapped), "utf-8");
    if (this.socket) {
      try { this.socket.send(buf, 0, buf.length, MULTICAST_PORT, MULTICAST_ADDR); } catch { /* */ }
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      if (msg.toId) {
        this.ws.send(JSON.stringify({ type: "signal", target: msg.toId, payload: msg }));
      } else {
        this.ws.send(JSON.stringify({ type: "signal", payload: msg }));
      }
    }
  }

  private connectWs(): void {
    if (!this.running) return;
    try {
      this.ws = new WebSocket(this.wsUrl);
    } catch {
      this.scheduleWsReconnect();
      return;
    }
    this.ws.on("open", () => {
      this.sendWsJoin();
      this.wsAnnounceTimer = setInterval(() => this.sendWsJoin(), 30000);
    });
    this.ws.on("message", (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "peers") {
          for (const peer of msg.list ?? []) this.handleWsPeer(peer);
        } else if (msg.type === "peer-joined") {
          if (msg.peer) this.handleWsPeer(msg.peer);
        } else if (msg.type === "peer-left") {
          if (msg.id && msg.id !== this.machineId) {
            this.wsDeviceList.delete(msg.id);
            this.callbacks?.onDeviceLost(msg.id);
          }
        } else if (msg.type === "signal") {
          this.handleWsSignal(msg);
        }
      } catch { /* malformed */ }
    });
    this.ws.on("close", () => {
      this.ws = null;
      if (this.wsAnnounceTimer) { clearInterval(this.wsAnnounceTimer); this.wsAnnounceTimer = null; }
      if (this.running) this.scheduleWsReconnect();
    });
    this.ws.on("error", () => { this.ws?.close(); });
  }

  private closeWs(): void {
    if (this.wsReconnectTimer) { clearTimeout(this.wsReconnectTimer); this.wsReconnectTimer = null; }
    if (this.wsAnnounceTimer) { clearInterval(this.wsAnnounceTimer); this.wsAnnounceTimer = null; }
    if (this.ws) { this.ws.removeAllListeners(); this.ws.close(); this.ws = null; }
  }

  private scheduleWsReconnect(): void {
    if (this.wsReconnectTimer) return;
    this.wsReconnectTimer = setTimeout(() => {
      this.wsReconnectTimer = null;
      this.connectWs();
    }, 5000);
  }

  private sendWsJoin(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      type: "join",
      room: "default",
      device: {
        id: this.machineId,
        name: this.beacon.name,
        os: this.beacon.os,
        type: this.beacon.type,
        ip: this.localIp,
        version: this.beacon.version,
        capabilities: this.beacon.capabilities,
      },
    }));
  }

  private handleWsPeer(peer: DeviceBeacon): void {
    if (peer.id === this.machineId) return;
    if (this.wsDeviceList.has(peer.id)) return;
    this.wsDeviceList.set(peer.id, peer);
    this.callbacks?.onDeviceFound(peer);
  }

  private handleWsSignal(msg: { from: string; payload: SignalingMessage }): void {
    if (msg.from === this.machineId) return;
    const sig = msg.payload;
    if (sig.type === "pair-request") {
      this.signalCallbacks?.onPairRequest(sig, "0.0.0.0");
    } else if (sig.type === "pair-response") {
      this.signalCallbacks?.onPairResponse(sig, "0.0.0.0");
    } else if (sig.type === "clipboard-sync") {
      this.signalCallbacks?.onClipboardSync?.(sig, "0.0.0.0");
    } else if (sig.type === "transfer-request") {
      this.signalCallbacks?.onTransferRequest?.(sig, "0.0.0.0");
    } else if (sig.type === "pair-verify") {
      this.signalCallbacks?.onPairVerify?.(sig, "0.0.0.0");
    } else if (sig.type === "pair-verified") {
      this.signalCallbacks?.onPairVerified?.(sig, "0.0.0.0");
    }
  }

  private sendBeacon(): void {
    if (!this.socket) return;
    const buf = Buffer.from(JSON.stringify(this.beacon), "utf-8");
    try { this.socket.send(buf, 0, buf.length, MULTICAST_PORT, MULTICAST_ADDR); } catch { /* */ }
  }

  private handleBeacon(beacon: DeviceBeacon, fromIp: string): void {
    const beaconWithIp = { ...beacon, ip: fromIp };
    const prev = this.knownDevices.get(beacon.id);
    this.knownDevices.set(beacon.id, beaconWithIp);
    this.lastSeen.set(beacon.id, Date.now());
    if (!prev) {
      this.callbacks?.onDeviceFound(beaconWithIp);
    } else if (prev.name !== beacon.name || prev.ts !== beacon.ts || prev.ip !== fromIp) {
      this.callbacks?.onDeviceChanged(beaconWithIp);
    }
  }

  private checkLost(): void {
    const now = Date.now();
    for (const [id, last] of this.lastSeen) {
      if (now - last > LOST_TIMEOUT_MS) {
        this.knownDevices.delete(id);
        this.lastSeen.delete(id);
        this.callbacks?.onDeviceLost(id);
      }
    }
  }
}
