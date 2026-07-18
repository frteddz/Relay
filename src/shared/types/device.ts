export type OsKind = "windows" | "linux" | "android" | "macos" | "unknown";

export type Theme = "dark" | "light";

export interface Settings {
  theme: Theme;
  deviceName: string;
  autoStart: boolean;
  autoDiscovery: boolean;
}
