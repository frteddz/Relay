import type { ReactNode } from "react";
import { windowsIcon, linuxIcon, androidIcon } from "./icons";

export interface DownloadEntry {
  platform: string;
  arch: string;
  format: string;
  url: string;
  os: "windows" | "linux" | "android";
  icon: ReactNode;
}

export const downloads: DownloadEntry[] = [
  {
    platform: "Windows 10/11",
    arch: "x64",
    format: ".exe",
    url: "https://github.com/frteddz/Relay/releases/download/v0.1.0/Relay.Setup.0.1.0.exe",
    os: "windows",
    icon: windowsIcon,
  },
  {
    platform: "Linux",
    arch: "x64",
    format: ".deb",
    url: "https://github.com/frteddz/Relay/releases/download/v0.1.0/relay_0.1.0_amd64.deb",
    os: "linux",
    icon: linuxIcon,
  },
  {
    platform: "Android",
    arch: "Universal",
    format: ".apk",
    url: "https://github.com/frteddz/Relay/releases/download/v0.1.1-dev/Relay-v0.1.1-dev.apk",
    os: "android",
    icon: androidIcon,
  },
];

export function detectOS(): "windows" | "linux" | "android" | "macos" | "other" {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return "windows";
  if (/Android/i.test(ua)) return "android";
  if (/Linux|X11/i.test(ua)) return "linux";
  if (/Mac OS/i.test(ua) && !/like Mac/i.test(ua)) return "macos";
  return "other";
}
