import { create } from "zustand";
import { defaultSettings } from "../types/config";
import type { AppState } from "../types/store";
import type { Settings } from "../types/device";
import { LocalStorageAdapter } from "../../core/persistence/LocalStorageAdapter";

const THEME_KEY = "relay:theme";
const storage = new LocalStorageAdapter();

function loadTheme(): Settings["theme"] {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* ignore */
  }
  return defaultSettings.theme;
}

function loadSettings(): Settings {
  const saved = storage.read<Settings>("settings");
  if (saved) return { ...defaultSettings, ...saved, theme: loadTheme() };
  return { ...defaultSettings, theme: loadTheme() };
}

export const useStore = create<AppState>((set) => ({
  settings: loadSettings(),
  localIp: "127.0.0.1",
  devices: [],
  pairings: [],
  trusted: [],
  clipboardHistory: [],
  transfers: [],
  notifications: [],

  updateSettings: (patch: Partial<Settings>) =>
    set((s) => {
      const next = { ...s.settings, ...patch };
      storage.write("settings", next);
      if (patch.theme) {
        try {
          localStorage.setItem(THEME_KEY, patch.theme);
        } catch {
          /* ignore */
        }
        document.documentElement.classList.toggle("dark", patch.theme === "dark");
        document.documentElement.classList.toggle("light", patch.theme === "light");
        document.documentElement.style.colorScheme = patch.theme;
      }
      return { settings: next };
    }),

  setLocalIp: (ip) => set({ localIp: ip }),

  setDevices: (devices) => set({ devices }),

  upsertDevice: (device) =>
    set((state) => {
      const idx = state.devices.findIndex((d) => d.id === device.id);
      if (idx === -1) return { devices: [...state.devices, device] };
      const next = state.devices.slice();
      next[idx] = { ...next[idx], ...device };
      return { devices: next };
    }),

  removeDevice: (id) =>
    set((s) => ({ devices: s.devices.filter((d) => d.id !== id) })),

  updateDeviceState: (id, state) =>
    set((s) => ({
      devices: s.devices.map((d) =>
        d.id === id ? { ...d, state, lastSeen: Date.now() } : d
      ),
    })),

  addPairing: (request) =>
    set((s) => ({ pairings: [...s.pairings, request] })),

  removePairing: (id) =>
    set((s) => ({ pairings: s.pairings.filter((p) => p.id !== id) })),

  setTrusted: (devices) => set({ trusted: devices }),

  setClipboardHistory: (entries) => set({ clipboardHistory: entries }),

  addClipboardEntry: (entry) =>
    set((state) => ({
      clipboardHistory: [entry, ...state.clipboardHistory.filter((item) => item.id !== entry.id)],
    })),

  setTransfers: (transfers) => set({ transfers }),

  upsertTransfer: (transfer) =>
    set((state) => {
      const index = state.transfers.findIndex((item) => item.id === transfer.id);
      if (index === -1) return { transfers: [transfer, ...state.transfers] };
      const transfers = state.transfers.slice();
      transfers[index] = transfer;
      return { transfers };
    }),

  updateTransfer: (id, patch) =>
    set((state) => ({
      transfers: state.transfers.map((transfer) =>
        transfer.id === id ? { ...transfer, ...patch } : transfer
      ),
    })),

  addNotification: (item) =>
    set((state) => {
      const exists = state.notifications.some((n) => n.id === item.id);
      if (exists) return { notifications: state.notifications.map((n) => (n.id === item.id ? { ...n, ...item } : n)) };
      return { notifications: [item, ...state.notifications] };
    }),

  updateNotification: (id, patch) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));
