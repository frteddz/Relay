import { createServer } from "node:http";
import { WebSocketServer } from "ws";

const PORT = parseInt(process.env.PORT || "4001", 10);

const server = createServer();
const wss = new WebSocketServer({ server });
const rooms = new Map();

wss.on("connection", (ws) => {
  let currentRoom = null;
  let deviceId = null;
  let deviceInfo = null;

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    switch (msg.type) {
      case "join": {
        const room = msg.room || "default";
        const device = msg.device;
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
        deviceId = device.id;
        deviceInfo = device;

        if (!rooms.has(room)) rooms.set(room, new Map());
        const peers = rooms.get(room);
        peers.set(device.id, { ws, device });

        const list = [];
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
          const target = peers.get(msg.target);
          if (target && target.ws.readyState === 1) {
            target.ws.send(data);
          }
        } else {
          for (const [id, { ws }] of peers) {
            if (id !== deviceId && ws.readyState === 1) {
              ws.send(data);
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

function broadcast(room, msg, exclude) {
  const peers = rooms.get(room);
  if (!peers) return;
  const data = JSON.stringify(msg);
  for (const [, { ws }] of peers) {
    if (ws !== exclude && ws.readyState === 1) {
      ws.send(data);
    }
  }
}

server.listen(PORT, () => {
  console.log(`relay-signaling running on port ${PORT}`);
});
