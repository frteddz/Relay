import { useState, useMemo, useEffect } from "react";
import { Card } from "../../shared/components/Card";
import { Button } from "../../shared/components/Button";
import { useStore } from "../../shared/store";
import { ClockIcon } from "../../shared/components/icons";
import { formatRelative } from "../../shared/utils/format";

type HistoryTab = "pairing" | "transfer" | "clipboard";
type FilterDirection = "all" | "sent" | "received";

interface PairingEntry {
  id: string;
  deviceName: string;
  deviceId: string;
  method: string;
  accepted: boolean;
  timestamp: number;
}

interface TransferHistoryEntry {
  id: string;
  fileName: string;
  fileSize: number;
  deviceName: string;
  deviceId: string;
  direction: "incoming" | "outgoing";
  status: string;
  timestamp: number;
}

interface ClipboardHistoryEntry {
  id: string;
  text: string;
  deviceName: string;
  deviceId: string;
  direction: "sent" | "received";
  timestamp: number;
}

const PAIRING_KEY = "relay:history:pairing";
const TRANSFER_KEY = "relay:history:transfer";
const CLIPBOARD_KEY = "relay:history:clipboard";

function loadJson<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveJson<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function HistoryPage() {
  const [tab, setTab] = useState<HistoryTab>("pairing");
  const [search, setSearch] = useState("");
  const [directionFilter, setDirectionFilter] = useState<FilterDirection>("all");
  const [pairingHistory, setPairingHistory] = useState<PairingEntry[]>(() => loadJson(PAIRING_KEY));
  const [transferHistory, setTransferHistory] = useState<TransferHistoryEntry[]>(() => loadJson(TRANSFER_KEY));
  const [clipboardHistoryState, setClipboardHistoryState] = useState<ClipboardHistoryEntry[]>(() => loadJson(CLIPBOARD_KEY));

  const devices = useStore((s) => s.devices);

  useEffect(() => {
    const unsubPair = useStore.subscribe((state) => {
      const notifications = state.notifications;
      const pairs: PairingEntry[] = notifications
        .filter((n) => n.status === "accepted")
        .map((n) => ({
          id: n.id,
          deviceName: n.deviceName,
          deviceId: n.deviceId,
          method: "Discovery",
          accepted: true,
          timestamp: n.createdAt,
        }));
      setPairingHistory((prev) => {
        const merged = [...pairs];
        for (const entry of prev) {
          if (!merged.find((e) => e.id === entry.id)) merged.push(entry);
        }
        merged.sort((a, b) => b.timestamp - a.timestamp);
        saveJson(PAIRING_KEY, merged);
        return merged;
      });
    });

    const unsubTransfer = useStore.subscribe((state) => {
      const transfers = state.transfers;
      const entries: TransferHistoryEntry[] = transfers
        .filter((t) => t.status === "completed" || t.status === "failed" || t.status === "canceled")
        .map((t) => ({
          id: t.id,
          fileName: t.fileName,
          fileSize: t.size,
          deviceName: t.deviceName,
          deviceId: t.deviceId,
          direction: t.direction,
          status: t.status === "canceled" ? "cancelled" : t.status,
          timestamp: t.timestamp,
        }));
      setTransferHistory((prev) => {
        const merged = [...entries];
        for (const entry of prev) {
          if (!merged.find((e) => e.id === entry.id)) merged.push(entry);
        }
        merged.sort((a, b) => b.timestamp - a.timestamp);
        saveJson(TRANSFER_KEY, merged);
        return merged;
      });
    });

    const unsubClip = useStore.subscribe((state) => {
      const clips = state.clipboardHistory;
      const entries: ClipboardHistoryEntry[] = clips.map((c) => ({
        id: c.id,
        text: c.text,
        deviceName: devices.find((d) => d.id === c.sourceDeviceId)?.name ?? "This device",
        deviceId: c.sourceDeviceId,
        direction: c.sourceDeviceId === "local" ? "sent" : "received",
        timestamp: c.timestamp,
      }));
      setClipboardHistoryState((prev) => {
        const merged = [...entries];
        for (const entry of prev) {
          if (!merged.find((e) => e.id === entry.id)) merged.push(entry);
        }
        merged.sort((a, b) => b.timestamp - a.timestamp);
        saveJson(CLIPBOARD_KEY, merged);
        return merged;
      });
    });

    return () => { unsubPair(); unsubTransfer(); unsubClip(); };
  }, [devices]);

  const filteredPairing = useMemo(() => {
    let items = pairingHistory;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((e) => e.deviceName.toLowerCase().includes(q));
    }
    return items;
  }, [pairingHistory, search]);

  const filteredTransfers = useMemo(() => {
    let items = transferHistory;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((e) => e.fileName.toLowerCase().includes(q) || e.deviceName.toLowerCase().includes(q));
    }
    if (directionFilter === "sent") {
      items = items.filter((e) => e.direction === "outgoing");
    } else if (directionFilter === "received") {
      items = items.filter((e) => e.direction === "incoming");
    }
    return items;
  }, [transferHistory, search, directionFilter]);

  const filteredClipboard = useMemo(() => {
    let items = clipboardHistoryState;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((e) => e.text.toLowerCase().includes(q) || e.deviceName.toLowerCase().includes(q));
    }
    if (directionFilter !== "all") {
      items = items.filter((e) => e.direction === directionFilter);
    }
    return items;
  }, [clipboardHistoryState, search, directionFilter]);

  const clearHistory = () => {
    if (tab === "pairing") { setPairingHistory([]); saveJson(PAIRING_KEY, []); }
    else if (tab === "transfer") { setTransferHistory([]); saveJson(TRANSFER_KEY, []); }
    else { setClipboardHistoryState([]); saveJson(CLIPBOARD_KEY, []); }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">History</h1>
        <p className="mt-1 text-sm text-white/50">View past pairing, transfers, and clipboard activity.</p>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === "pairing" ? "primary" : "ghost"} size="sm" onClick={() => { setTab("pairing"); setDirectionFilter("all"); }}>Pairing</Button>
        <Button variant={tab === "transfer" ? "primary" : "ghost"} size="sm" onClick={() => { setTab("transfer"); setDirectionFilter("all"); }}>Transfers</Button>
        <Button variant={tab === "clipboard" ? "primary" : "ghost"} size="sm" onClick={() => { setTab("clipboard"); setDirectionFilter("all"); }}>Clipboard</Button>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-brand-400"
          />
          {tab !== "pairing" && (
            <div className="flex gap-1 rounded-lg border border-white/10 bg-black/20 p-0.5">
              {(["all", "sent", "received"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDirectionFilter(d)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    directionFilter === d ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          )}
          <Button size="sm" variant="ghost" onClick={clearHistory}>Clear</Button>
        </div>
      </Card>

      <Card>
        {tab === "pairing" && (
          filteredPairing.length === 0 ? (
            <EmptyState icon="No pairing history yet." />
          ) : (
            <div className="space-y-2">
              {filteredPairing.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/20 text-brand-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{entry.deviceName}</p>
                    <p className="text-xs text-white/40">Paired via {entry.method}</p>
                  </div>
                  <span className="text-xs text-white/40">{formatRelative(entry.timestamp)}</span>
                </div>
              ))}
            </div>
          )
        )}

        {tab === "transfer" && (
          filteredTransfers.length === 0 ? (
            <EmptyState icon="No transfer history yet." />
          ) : (
            <div className="space-y-2">
              {filteredTransfers.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    entry.direction === "outgoing" ? "bg-sky-500/20 text-sky-400" : "bg-emerald-500/20 text-emerald-400"
                  }`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{entry.fileName}</p>
                    <p className="text-xs text-white/40">
                      {entry.direction === "outgoing" ? "Sent to" : "Received from"} {entry.deviceName} · {formatSize(entry.fileSize)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                      entry.status === "completed" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                    }`}>
                      {entry.status}
                    </span>
                    <p className="text-[10px] text-white/30 mt-0.5">{formatRelative(entry.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === "clipboard" && (
          filteredClipboard.length === 0 ? (
            <EmptyState icon="No clipboard history yet." />
          ) : (
            <div className="space-y-2">
              {filteredClipboard.map((entry) => (
                <div key={entry.id} className="rounded-xl bg-white/5 p-3">
                  <p className="text-sm text-white/85 line-clamp-2">{entry.text}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-white/40">
                    <span>{entry.direction === "sent" ? "Sent to" : "Received from"} {entry.deviceName}</span>
                    <span>·</span>
                    <span>{formatRelative(entry.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </Card>
    </div>
  );
}

function EmptyState({ icon }: { icon: string }) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <ClockIcon className="h-8 w-8 text-white/35" />
      <p className="mt-3 text-sm font-medium text-white/70">{icon}</p>
      <p className="mt-1 text-sm text-white/40">Activity will appear here as you use Relay.</p>
    </div>
  );
}
