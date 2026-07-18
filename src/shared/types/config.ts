import type { Settings } from "./device";

export const defaultSettings: Settings = {
  theme: "dark",
  deviceName: "My Computer",
  autoStart: false,
  autoDiscovery: true,
  signalingUrl: "ws://localhost:4001",
};

export const PLATFORM: NodeJS.Platform | "browser" = (() => {
  try {
    return typeof process !== "undefined" && process.platform
      ? process.platform
      : "browser";
  } catch {
    return "browser";
  }
})();
