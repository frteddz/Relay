import { useCallback, useEffect, useState } from "react";
import { useStore } from "../../shared/store";
import { usePairingUi } from "./usePairingUi";
import { usePairing } from "./usePairing";
import { Card } from "../../shared/components/Card";
import { Button } from "../../shared/components/Button";

export function PairingModal() {
  const open = usePairingUi((s) => s.open);
  const targetId = usePairingUi((s) => s.targetId);
  const close = usePairingUi((s) => s.closePairing);
  const pairings = useStore((s) => s.pairings);
  const devices = useStore((s) => s.devices);
  const { confirm, reject } = usePairing();
  const [code, setCode] = useState("");
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState("");

  const target = devices.find((d) => d.id === targetId);
  const request = pairings.find((p) => p.deviceId === targetId) ?? pairings[0];

  const cancel = useCallback(() => {
    if (request) void reject(request.id);
    else close();
  }, [close, reject, request]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cancel, open]);

  useEffect(() => {
    setCode("");
    setError("");
  }, [request?.id]);

  useEffect(() => {
    if (!open) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [open]);

  if (!open) return null;

  const secondsRemaining = request
    ? Math.max(0, Math.ceil((request.expiresAt - now) / 1000))
    : 0;
  const submit = async () => {
    if (!request || code.length !== 6) return;
    const accepted = await confirm(request.id, code);
    if (!accepted) setError("That code is incorrect or has expired.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in" role="presentation">
      <Card className="w-full max-w-md animate-scale-in shadow-2xl shadow-black/40" role="dialog" aria-modal="true" aria-labelledby="pairing-title">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="pairing-title" className="text-lg font-semibold text-white">Pair a device</h2>
          <button
            onClick={cancel}
            className="rounded-lg px-2 py-1 text-white/50 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-400"
            aria-label="Cancel pairing"
          >
            ✕
          </button>
        </div>

        {request ? (
          <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4">
            <p className="text-sm text-white/80">
              Confirm pairing with <span className="font-semibold">{request.deviceName}</span>
            </p>
            <p className="mt-2 text-center font-mono text-3xl font-bold tracking-widest text-amber-200">
              {request.code}
            </p>
            <p className="text-center text-xs text-white/45">
              This temporary code expires in {secondsRemaining}s.
            </p>
            <label className="mt-4 block text-xs font-medium text-white/65" htmlFor="pairing-code">
              Enter the code shown on {request.deviceName}
            </label>
            <input
              id="pairing-code"
              value={code}
              onChange={(event) => {
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                setError("");
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-center font-mono tracking-[0.5em] text-white outline-none transition focus:border-brand-400"
              placeholder="000000"
            />
            {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
            <div className="mt-3 flex gap-2">
              <Button variant="subtle" size="sm" className="flex-1" onClick={cancel}>
                Reject
              </Button>
              <Button
                size="sm"
                className="flex-1"
                disabled={code.length !== 6 || secondsRemaining === 0}
                onClick={() => void submit()}
              >
                Verify & pair
              </Button>
            </div>
          </div>
        ) : (
          <p className="rounded-xl bg-white/5 p-3 text-sm text-white/50">
            No pairing request active. Select a nearby device to start pairing.
          </p>
        )}

        {target && (
          <p className="mt-3 text-center text-xs text-white/40">
            Verify the same code on {target.name} before it expires.
          </p>
        )}
      </Card>
    </div>
  );
}
