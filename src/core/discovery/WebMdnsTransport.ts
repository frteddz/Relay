import type { Device } from "../types";
import type { DiscoveryTransportEvents, MdnsTransport } from "./MdnsTransport";

const SAVED_URL_KEY = "relay:signalingUrl";

function getDeviceId(): string {
  const key = "relay:webDeviceId";
  try {
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function getSavedUrl(): string | null {
  try {
    return localStorage.getItem(SAVED_URL_KEY);
  } catch {
    return null;
  }
}

function saveUrl(url: string): void {
  try {
    localStorage.setItem(SAVED_URL_KEY, url);
  } catch { /* ignore */ }
}

function detectOsType(): { os: Device["os"]; type: Device["type"] } {
  const ua = navigator.userAgent;
  let os: Device["os"] = "unknown";
  if (/Windows/i.test(ua)) os = "windows";
  else if (/Linux|X11/i.test(ua) && !/Android/i.test(ua)) os = "linux";
  else if (/Mac OS/i.test(ua) && !/like Mac/i.test(ua)) os = "macos";
  else if (/Android/i.test(ua)) os = "android";

  let type: Device["type"] = "desktop";
  if (/Mobi|Android.*Mobile|iPhone|iPod|BlackBerry/i.test(ua)) type = "phone";
  else if (/Tablet|iPad|Android(?!.*Mobile)/i.test(ua)) type = "tablet";

  return { os, type };
}

function buildDevice(name: string): Device {
  const { os, type } = detectOsType();
  return {
    id: getDeviceId(),
    name,
    type,
    os,
    ip: "0.0.0.0",
    state: "online",
    lastSeen: Date.now(),
    version: "v0.1.3-A",
    capabilities: { clipboard: false, fileTransfer: false, linkShare: false },
  };
}

export interface SignalCallback {
  (payload: Record<string, unknown>): void;
}

export class WebMdnsTransport implements MdnsTransport {
  private handlers: DiscoveryTransportEvents | null = null;
  private running = false;
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private announceTimer: ReturnType<typeof setInterval> | null = null;
  private device: Device;
  private url: string;
  private onSignal: SignalCallback | null = null;
  private connectionStatusCallback: ((connected: boolean) => void) | null = null;

  constructor(url?: string) {
    const saved = getSavedUrl();
    this.url = url && url !== "ws://localhost:4001" ? url : saved ?? url ?? "ws://localhost:4001";
    this.device = buildDevice("Web Browser");
  }

  setDeviceInfo(partial: { name?: string }): void {
    if (partial.name) this.device.name = partial.name;
    this.device.lastSeen = Date.now();
    this.sendJoin();
  }

  setOnSignal(cb: SignalCallback): void {
    this.onSignal = cb;
  }

  setOnConnectionStatus(cb: (connected: boolean) => void): void {
    this.connectionStatusCallback = cb;
  }

  sendSignal(payload: Record<string, unknown>, targetId?: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: "signal", payload, target: targetId }));
  }

  getUrl(): string {
    return this.url;
  }

  updateUrl(url: string): void {
    if (url === this.url) return;
    this.url = url;
    saveUrl(url);
    if (this.running) {
      this.closeWs();
      this.connect();
    }
  }

  start(handlers: DiscoveryTransportEvents): void {
    if (this.running) return;
    this.running = true;
    this.handlers = handlers;
    this.connect();
  }

  stop(): void {
    this.running = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.announceTimer) {
      clearInterval(this.announceTimer);
      this.announceTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.handlers = null;
  }

  isRunning(): boolean {
    return this.running;
  }

  private closeWs(): void {
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    if (this.announceTimer) { clearInterval(this.announceTimer); this.announceTimer = null; }
    if (this.ws) { this.ws.onclose = null; this.ws.close(); this.ws = null; }
  }

  private connect(): void {
    if (!this.running || !this.handlers) return;

    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this.connectionStatusCallback?.(false);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.connectionStatusCallback?.(true);
      this.sendJoin();
      this.announceTimer = setInterval(() => this.sendJoin(), 30000);
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.handleMessage(msg);
      } catch {
        /* ignore malformed */
      }
    };

    this.ws.onclose = () => {
      this.ws = null;
      this.connectionStatusCallback?.(false);
      if (this.announceTimer) {
        clearInterval(this.announceTimer);
        this.announceTimer = null;
      }
      if (this.running) this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private handleMessage(msg: {
    type: string;
    list?: Device[];
    peer?: Device;
    id?: string;
    from?: string;
    payload?: Record<string, unknown>;
  }): void {
    if (!this.handlers) return;
    switch (msg.type) {
      case "peers":
        for (const peer of msg.list ?? []) {
          this.handlers.found(peer);
        }
        break;
      case "peer-joined":
        if (msg.peer) this.handlers.found(msg.peer);
        break;
      case "peer-left":
        if (msg.id) this.handlers.lost(msg.id);
        break;
      case "signal":
        if (msg.from && msg.payload && this.onSignal) {
          this.onSignal({ ...msg.payload, from: msg.from });
        }
        break;
    }
  }

  private sendJoin(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.device.lastSeen = Date.now();
    this.ws.send(
      JSON.stringify({
        type: "join",
        room: "default",
        device: this.device,
      })
    );
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }
}
