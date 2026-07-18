import type { ConnectionQuality, Device } from "../../core/types";

export function connectionQuality(device: Device): ConnectionQuality {
  if (device.state === "offline" || device.state === "disconnected") return "offline";
  if (device.connectionQuality) return device.connectionQuality;

  const age = Date.now() - device.lastSeen;
  if (age <= 5_000) return "excellent";
  if (age <= 12_000) return "good";
  if (age <= 30_000) return "fair";
  return "poor";
}

export function qualityLabel(quality: ConnectionQuality): string {
  return quality === "offline" ? "Unavailable" : `${quality[0].toUpperCase()}${quality.slice(1)}`;
}
