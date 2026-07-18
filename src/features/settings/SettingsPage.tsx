import { useStore } from "../../shared/store";
import { Card, SectionTitle } from "../../shared/components/Card";
import { Button } from "../../shared/components/Button";
import { EmptyState } from "../../shared/components/EmptyState";
import { DeviceKindIcon } from "../../shared/components/icons";
import { formatRelative } from "../../shared/utils/format";
import { usePairing } from "../pairing/usePairing";
import type { Theme } from "../../shared/types/device";

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between border-b border-white/5 py-3 last:border-0">
      <span className="text-sm text-white/75">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        aria-label={`${label}: ${checked ? "on" : "off"}`}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 ${
          checked ? "bg-brand-500" : "bg-white/15"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-[22px]" : "translate-x-[2px]"
          }`}
        />
      </button>
    </label>
  );
}

export function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const { trusted, forget } = usePairing();

  const set = (patch: Parameters<typeof updateSettings>[0]) => updateSettings(patch);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-sm text-white/50">Personalize Relay.</p>
      </div>

      <Card className="hover:border-white/15">
        <SectionTitle title="Appearance" />
        <div className="grid grid-cols-2 gap-3">
          {(["dark", "light"] as Theme[]).map((theme) => (
            <button
              key={theme}
              onClick={() => set({ theme })}
              className={`rounded-xl border p-4 text-sm font-medium capitalize transition-all duration-200 hover:-translate-y-0.5 ${
                settings.theme === theme
                  ? "border-brand-400 bg-brand-500/15 text-white"
                  : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {theme} mode
            </button>
          ))}
        </div>
      </Card>

      <Card className="hover:border-white/15">
        <SectionTitle title="Device" />
        <label className="block border-b border-white/5 py-3">
          <span className="text-sm text-white/75">Device name</span>
          <input
            value={settings.deviceName}
            onChange={(e) => set({ deviceName: e.target.value })}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white transition focus:border-brand-400 focus:outline-none"
          />
        </label>
        <label className="block border-b border-white/5 py-3">
          <span className="text-sm text-white/75">Signaling server</span>
          <p className="mt-1 text-xs text-white/40">WebSocket URL for device discovery (e.g., ws://192.168.1.5:4001)</p>
          <input
            value={(settings as any).signalingUrl ?? "ws://localhost:4001"}
            onChange={(e) => set({ signalingUrl: e.target.value } as any)}
            placeholder="ws://localhost:4001"
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white transition focus:border-brand-400 focus:outline-none"
          />
        </label>
        <Toggle
          label="Auto start"
          checked={settings.autoStart}
          onChange={(v) => set({ autoStart: v })}
        />
        <Toggle
          label="Auto discovery (mDNS)"
          checked={settings.autoDiscovery}
          onChange={(v) => set({ autoDiscovery: v })}
        />
      </Card>

      <Card className="hover:border-white/15">
        <SectionTitle
          title="Trusted devices"
          subtitle="Stored locally · auto-reconnect enabled"
        />
        {trusted.length === 0 ? (
          <EmptyState
            title="No trusted devices"
            description="Pair a device to add it to your trusted list."
          />
        ) : (
          <div className="space-y-2">
            {trusted.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/80">
                    <DeviceKindIcon os={t.os} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{t.name}</p>
                    <p className="text-xs text-white/45">
                      Paired {formatRelative(t.pairedAt)}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => forget(t.id)}>
                  Forget
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="hover:border-white/15">
        <SectionTitle title="About Relay" />
        <div className="space-y-1 text-sm text-white/55">
          <p>Relay v0.1.3-A</p>
          <p>Local-first · Privacy-first · Open source</p>
          <p className="text-white/35">No telemetry. No ads. No accounts.</p>
        </div>
      </Card>
    </div>
  );
}
