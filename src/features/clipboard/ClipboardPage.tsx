import { useState, useMemo, useEffect } from "react";
import { Card, SectionTitle } from "../../shared/components/Card";
import { ClipboardIcon } from "../../shared/components/icons";
import { Button } from "../../shared/components/Button";
import { useStore } from "../../shared/store";
import { sendClipboardToDevices } from "../../shared/services/connectCore";
import { getCore } from "../../shared/services/connectCore";
import { formatRelative } from "../../shared/utils/format";
import { writeToClipboard } from "../../shared/utils/clipboard";

const LOCAL_DEVICE_ID = "local";

export function ClipboardPage() {
  const [text, setText] = useState("");
  const history = useStore((state) => state.clipboardHistory);
  const devices = useStore((state) => state.devices);
  const trusted = useStore((s) => s.trusted);
  const [sendStatus, setSendStatus] = useState<"" | "sending" | "sent" | "error">("");
  const [saveStatus, setSaveStatus] = useState<"" | "saved">("");
  const pairedCount = useMemo(() => trusted.length, [trusted]);

  useEffect(() => {
    if (saveStatus === "saved") {
      const id = setTimeout(() => setSaveStatus(""), 2000);
      return () => clearTimeout(id);
    }
  }, [saveStatus]);

  useEffect(() => {
    if (sendStatus === "sent" || sendStatus === "error") {
      const id = setTimeout(() => setSendStatus(""), 2000);
      return () => clearTimeout(id);
    }
  }, [sendStatus]);

  const handleSaveLocal = () => {
    if (!text.trim()) return;
    getCore().clipboard.publish(text);
    void writeToClipboard(text).catch(() => undefined);
    setText("");
    setSaveStatus("saved");
  };

  const handleSendToDevice = async () => {
    if (!text.trim() || pairedCount === 0) return;
    setSendStatus("sending");
    try {
      await sendClipboardToDevices(text);
      setText("");
      setSendStatus("sent");
    } catch {
      setSendStatus("error");
    }
  };

  const sourceName = (sourceDeviceId: string) => {
    if (sourceDeviceId === LOCAL_DEVICE_ID) return "This device";
    return devices.find((device) => device.id === sourceDeviceId)?.name ?? "Remote device";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Clipboard</h1>
        <p className="mt-1 text-sm text-white/50">
          {pairedCount > 0
            ? `Send text to ${pairedCount} paired device${pairedCount === 1 ? "" : "s"} or save locally.`
            : "Save text to local clipboard history. Pair a device to enable cross-device sending."}
        </p>
      </div>

      <Card className="hover:border-white/15">
        <SectionTitle title="Clipboard text" />
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={4}
          placeholder="Paste or type text…"
          className="w-full resize-none rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-white/40">
            {sendStatus === "sending" ? "Sending..." : sendStatus === "sent" ? "Sent!" : sendStatus === "error" ? "Failed to send" : saveStatus === "saved" ? "Saved locally" : " "}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="subtle"
              onClick={handleSaveLocal}
              disabled={!text.trim()}
            >
              Save Locally
            </Button>
            <Button
              size="sm"
              onClick={handleSendToDevice}
              disabled={!text.trim() || pairedCount === 0 || sendStatus === "sending"}
            >
              {sendStatus === "sending" ? "Sending..." : "Send to Paired Device"}
            </Button>
          </div>
        </div>
        {pairedCount === 0 && (
          <p className="mt-2 text-xs text-amber-400/70">Pair a device to enable sending.</p>
        )}
      </Card>

      <Card className="hover:border-white/15">
        <SectionTitle title="Clipboard history" subtitle={`${history.length} saved locally`} />
        {history.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <ClipboardIcon className="h-8 w-8 text-white/35" />
            <p className="mt-3 text-sm font-medium text-white/70">No clipboard items yet</p>
            <p className="mt-1 text-sm text-white/40">Type or paste text above to save it to your local history.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((entry) => (
              <button
                key={entry.id}
                className="w-full rounded-xl bg-white/5 p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-400/70"
                onClick={() => {
                  setText(entry.text);
                  void writeToClipboard(entry.text).catch(() => undefined);
                }}
              >
                <p className="line-clamp-2 text-sm text-white/85">{entry.text}</p>
                <p className="mt-1 text-xs text-white/40">
                  {sourceName(entry.sourceDeviceId)} · {formatRelative(entry.timestamp)}
                </p>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
