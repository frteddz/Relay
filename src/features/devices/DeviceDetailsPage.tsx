import { useParams, Link } from "react-router-dom";
import { useStore } from "../../shared/store";
import { Card, SectionTitle } from "../../shared/components/Card";
import { Button } from "../../shared/components/Button";
import { EmptyState } from "../../shared/components/EmptyState";
import { DeviceKindIcon } from "../../shared/components/icons";
import { formatRelative } from "../../shared/utils/format";
import { connectionQuality, qualityLabel } from "../../shared/utils/device";
import { sendPairRequest, acceptIncomingRequest, hasIncomingPendingRequest } from "../../shared/services/connectCore";
import { getCore } from "../../shared/services/connectCore";
import { useState, useEffect } from "react";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-3 text-sm last:border-0">
      <span className="text-white/45">{label}</span>
      <span className="font-medium text-white/85">{value}</span>
    </div>
  );
}

export function DeviceDetailsPage() {
  const { id } = useParams();
  const device = useStore((s) => s.devices.find((d) => d.id === id));
  const trusted = useStore((s) => s.trusted);
  const notifications = useStore((s) => s.notifications);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const trustedEntry = trusted.find((t) => t.id === id);
  const hasActiveRequest = notifications.some(
    (n) => n.status === "pending" && n.direction === "sent"
  );
  const hasIncoming = id ? hasIncomingPendingRequest(id) : false;
  const incomingNotif = id
    ? notifications.find(
        (n) => n.deviceId === id && n.status === "pending" && n.direction === "received"
      )
    : undefined;

  const handlePair = async () => {
    if (!id || hasActiveRequest) return;
    setError("");
    const result = await sendPairRequest(id);
    if (!result.ok && result.error) {
      setError(result.error);
    } else {
      setCooldown(60);
    }
  };

  const handleAccept = async () => {
    if (!incomingNotif) return;
    setLoading(true);
    setError("");
    const result = await acceptIncomingRequest(incomingNotif.id);
    setLoading(false);
    if (!result.ok && result.error) setError(result.error);
  };

  const handleDecline = () => {
    if (!incomingNotif) return;
    useStore.getState().updateNotification(incomingNotif.id, { status: "declined" });
  };

  const handleForget = () => {
    if (!id) return;
    getCore().pairing.untrust(id);
    useStore.getState().setTrusted(getCore().pairing.trusted());
  };

  if (!device) {
    return (
      <div className="space-y-6">
        <Link to="/devices" className="text-sm text-white/50 hover:text-white">
          ← Devices
        </Link>
        <Card>
          <EmptyState
            title="Device not found"
            description="This device may have gone offline or is no longer on the network."
          />
        </Card>
      </div>
    );
  }

  const online = device.state === "online" || device.state === "paired";
  const quality = connectionQuality(device);

  return (
    <div className="space-y-6">
      <Link to="/devices" className="text-sm text-white/50 hover:text-white">
        ← Devices
      </Link>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-white/80">
          <DeviceKindIcon os={device.os} className="h-8 w-8" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {device.name}
          </h1>
          <p className="mt-1 text-xs text-white/45">
            {online ? "Online" : "Offline"} · {device.ip}
          </p>
        </div>
        <div className="ml-auto w-full sm:w-auto">
          {trustedEntry ? (
            <div className="flex flex-col items-end gap-1">
              <Button variant="subtle" size="sm" onClick={handleForget}>
                Forget device
              </Button>
            </div>
          ) : hasIncoming && incomingNotif ? (
            <div className="flex flex-col items-end gap-1">
              <div className="flex gap-1">
                <Button size="sm" variant="subtle" onClick={handleDecline}>
                  Decline
                </Button>
                <Button size="sm" onClick={() => void handleAccept()} disabled={loading}>
                  {loading ? "..." : "Accept"}
                </Button>
              </div>
              {error && <p className="text-xs text-rose-300">{error}</p>}
            </div>
          ) : hasActiveRequest ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-300">
              Request pending
            </span>
          ) : (
            <div className="flex flex-col items-end gap-1">
              <Button size="sm" onClick={() => void handlePair()}>
                Pair
              </Button>
              {error && <p className="text-xs text-rose-300">{error}</p>}
              {cooldown > 0 && <p className="text-xs text-white/40">{cooldown}s</p>}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Details" />
          <Field label="Name" value={device.name} />
          <Field label="Operating system" value={device.os} />
          <Field label="Device type" value={device.type} />
          <Field label="IP address" value={device.ip} />
          <Field
            label="Status"
            value={<span className="capitalize">{device.state}</span>}
          />
          <Field label="Last seen" value={formatRelative(device.lastSeen)} />
          <Field
            label="Connection quality"
            value={<span className={quality === "excellent" ? "text-emerald-300" : quality === "good" ? "text-sky-300" : quality === "fair" ? "text-amber-300" : "text-white/45"}>{qualityLabel(quality)}</span>}
          />
        </Card>

        <Card>
          <SectionTitle title="Trust" />
          {trustedEntry ? (
            <>
              <Field label="Trusted" value="Yes" />
              <Field label="Paired" value={formatRelative(trustedEntry.pairedAt)} />
              <Field
                label="Last connected"
                value={formatRelative(trustedEntry.lastConnected)}
              />
            </>
          ) : (
            <EmptyState
              title="Not paired"
              description="Pair this device to establish a trusted, auto-reconnecting connection."
            />
          )}
        </Card>
      </div>
    </div>
  );
}
