import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { WebSocketServer } from "ws";
import os from "node:os";

export interface SignalingServerOptions {
  port?: number;
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

export function startSignalingServer(opts?: SignalingServerOptions): { port: number; url: string; stop: () => void } {
  const port = opts?.port ?? 4001;
  const localIp = getLocalIp();
  const serverUrl = `ws://${localIp}:${port}`;

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.url === "/discovery") {
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify({ serverUrl, ip: localIp, port }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  const wss = new WebSocketServer({ server });
  const rooms = new Map<string, Map<string, { ws: import("ws").WebSocket; device: Record<string, unknown> }>>();

  function broadcast(room: string, msg: Record<string, unknown>, exclude: import("ws").WebSocket | null): void {
    const peers = rooms.get(room);
    if (!peers) return;
    const data = JSON.stringify(msg);
    for (const [, { ws }] of peers) {
      if (ws !== exclude && ws.readyState === 1) {
        ws.send(data);
      }
    }
  }

  wss.on("connection", (ws) => {
    let currentRoom: string | null = null;
    let deviceId: string | null = null;

    ws.on("message", (raw) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      switch (msg.type) {
        case "join": {
          const room = (msg.room as string) || "default";
          const device = msg.device as Record<string, unknown> | undefined;
          if (!device || !device.id) return;

          if (currentRoom && deviceId) {
            const prev = rooms.get(currentRoom);
            if (prev) {
              prev.delete(deviceId);
              if (prev.size === 0) rooms.delete(currentRoom);
              broadcast(currentRoom, { type: "peer-left", id: deviceId }, null);
            }
          }

          currentRoom = room;
          deviceId = device.id as string;

          if (!rooms.has(room)) rooms.set(room, new Map());
          const peers = rooms.get(room)!;
          peers.set(device.id as string, { ws, device });

          const list: Record<string, unknown>[] = [];
          for (const [id, { device: d }] of peers) {
            if (id !== device.id) list.push(d);
          }
          ws.send(JSON.stringify({ type: "peers", list }));

          broadcast(room, { type: "peer-joined", peer: device }, ws);
          break;
        }

        case "signal": {
          if (!currentRoom || !deviceId) return;
          const peers = rooms.get(currentRoom);
          if (!peers) return;
          const data = JSON.stringify({
            type: "signal",
            from: deviceId,
            payload: msg.payload,
          });
          if (msg.target) {
            const target = peers.get(msg.target as string);
            if (target && target.ws.readyState === 1) {
              target.ws.send(data);
            }
          } else {
            for (const [id, { ws: peerWs }] of peers) {
              if (id !== deviceId && peerWs.readyState === 1) {
                peerWs.send(data);
              }
            }
          }
          break;
        }
      }
    });

    ws.on("close", () => {
      if (currentRoom && deviceId) {
        const peers = rooms.get(currentRoom);
        if (peers) {
          peers.delete(deviceId);
          if (peers.size === 0) rooms.delete(currentRoom);
          broadcast(currentRoom, { type: "peer-left", id: deviceId }, null);
        }
      }
    });
  });

  server.listen(port, "0.0.0.0");

  return {
    port,
    url: serverUrl,
    stop: () => {
      wss.close();
      server.close();
    },
  };
}
