import type { StorageAdapter } from "../types";

const PREFIX = "relay:";

export class LocalStorageAdapter implements StorageAdapter {
  read<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  write<T>(key: string, value: T): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* storage unavailable (private mode / quota) — ignore */
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      /* ignore */
    }
  }
}

export const memoryAdapter: StorageAdapter = (() => {
  const map = new Map<string, string>();
  return {
    read: (key) => (map.has(key) ? JSON.parse(map.get(key)!) : null),
    write: (key, value) => map.set(key, JSON.stringify(value)),
    remove: (key) => map.delete(key),
  };
})();
