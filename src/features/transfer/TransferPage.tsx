import { useState, useMemo, useRef, useCallback } from "react";
import { Card, SectionTitle } from "../../shared/components/Card";
import { EmptyState } from "../../shared/components/EmptyState";
import { FileIcon } from "../../shared/components/icons";
import { useStore } from "../../shared/store";
import { sendFileToDevice, saveReceivedFile } from "../../shared/services/connectCore";
import { formatBytes } from "../../shared/utils/format";

export function TransferPage() {
  const trusted = useStore((s) => s.trusted);
  const transfers = useStore((s) => s.transfers);
  const paired = trusted.length > 0;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [saveStatus, setSaveStatus] = useState<Record<string, "" | "saving" | "saved" | "error">>({});

  const activeTransfers = useMemo(
    () => transfers.filter((t) => t.status === "active" || t.status === "queued" || t.status === "paused"),
    [transfers]
  );
  const completedTransfers = useMemo(
    () => transfers.filter((t) => t.status === "completed" || t.status === "failed" || t.status === "canceled"),
    [transfers]
  );
  const incomingQueued = useMemo(
    () => transfers.filter((t) => t.direction === "incoming" && t.status === "queued"),
    [transfers]
  );

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      const filePath = (file as File & { path?: string }).path;
      if (!filePath) continue;

      await sendFileToDevice(
        trusted[0]?.id ?? "",
        filePath,
        file.name,
        file.size
      );
    }
  }, [trusted]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragging(false);
  }, []);

  const handleBrowse = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = "";
    }
  }, [handleFiles]);

  const handleSave = useCallback(async (transferId: string) => {
    setSaveStatus((prev) => ({ ...prev, [transferId]: "saving" }));
    const result = await saveReceivedFile(transferId);
    setSaveStatus((prev) => ({
      ...prev,
      [transferId]: result.ok ? "saved" : "error",
    }));
    setTimeout(() => {
      setSaveStatus((prev) => {
        const next = { ...prev };
        delete next[transferId];
        return next;
      });
    }, 3000);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">File transfer</h1>
        <p className="mt-1 text-sm text-white/50">
          {paired
            ? `Send files to ${trusted.length} paired device${trusted.length === 1 ? "" : "s"}.`
            : "Send and receive files between paired devices."}
        </p>
      </div>

      <Card>
        <SectionTitle
          title="File transfer"
          subtitle={paired ? `${trusted.length} device${trusted.length === 1 ? "" : "s"} paired` : "Requires paired devices"}
        />
        {paired ? (
          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 sm:p-12 ${
                dragging
                  ? "border-brand-400 bg-brand-500/10"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
              }`}
              onClick={handleBrowse}
            >
              <FileIcon className={`mb-3 h-10 w-10 transition-colors ${dragging ? "text-brand-400" : "text-white/30"}`} />
              <p className={`text-sm font-medium transition-colors ${dragging ? "text-brand-300" : "text-white/60"}`}>
                {dragging ? "Drop files to send" : "Drag and drop files here"}
              </p>
              <p className="mt-1 text-xs text-white/40">or click to browse files</p>
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleInputChange}
              />
              <button
                onClick={(e) => { e.stopPropagation(); handleBrowse(); }}
                className="mt-4 rounded-xl bg-brand-500/20 px-5 py-2 text-sm font-medium text-brand-300 transition-all duration-200 hover:bg-brand-500/30"
              >
                Browse Files
              </button>
            </div>

            {incomingQueued.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-brand-300">Incoming files</h3>
                {incomingQueued.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-xl bg-brand-500/10 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FileIcon className="h-5 w-5 text-brand-300" />
                      <div>
                        <p className="text-sm text-white/85">{t.fileName}</p>
                        <p className="text-xs text-white/40">
                          From {t.deviceName} · {formatBytes(t.size)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-brand-300 animate-pulse">Receiving...</span>
                  </div>
                ))}
              </div>
            )}

            {activeTransfers.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white/60">Active transfers</h3>
                {activeTransfers.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FileIcon className="h-5 w-5 text-white/40" />
                      <div>
                        <p className="text-sm text-white/85">{t.fileName}</p>
                        <p className="text-xs text-white/40">
                          {t.status === "active" ? `${formatBytes(t.speed)}/s` : t.status}
                          {" · "}
                          {t.size > 0 ? `${Math.round((t.transferred / t.size) * 100)}%` : "0%"}
                        </p>
                      </div>
                    </div>
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-brand-400 transition-all"
                        style={{ width: `${t.size > 0 ? (t.transferred / t.size) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {completedTransfers.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white/60">History</h3>
                {completedTransfers.map((t) => {
                  const showSave = t.direction === "incoming" && t.status === "completed";
                  const s = saveStatus[t.id];
                  return (
                    <div key={t.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileIcon className="h-5 w-5 shrink-0 text-white/40" />
                        <div className="min-w-0">
                          <p className="text-sm text-white/85 truncate">{t.fileName}</p>
                          <p className="text-xs text-white/40">
                            {t.direction === "incoming" ? "Received" : "Sent"}
                            {" · "}
                            {formatBytes(t.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {showSave && (
                          s === "saved" ? (
                            <span className="text-xs text-emerald-400">Saved</span>
                          ) : s === "error" ? (
                            <span className="text-xs text-rose-400">Error</span>
                          ) : (
                            <button
                              onClick={() => handleSave(t.id)}
                              disabled={s === "saving"}
                              className="rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-white/70 transition-all hover:bg-white/20 hover:text-white disabled:opacity-50"
                            >
                              {s === "saving" ? "Saving..." : "Save"}
                            </button>
                          )
                        )}
                        <span className={`text-xs font-medium ${
                          t.status === "completed" ? "text-emerald-300" : t.status === "failed" ? "text-rose-300" : "text-white/40"
                        }`}>
                          {t.status === "completed" ? "Complete" : t.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {transfers.length === 0 && (
              <div className="flex flex-col items-center py-4 text-center">
                <p className="text-sm text-white/30">No file transfers yet. Drop a file or browse to start.</p>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            icon={<FileIcon className="h-8 w-8" />}
            title="Unavailable"
            description="Pair with another device to enable file transfers."
          />
        )}
      </Card>
    </div>
  );
}
