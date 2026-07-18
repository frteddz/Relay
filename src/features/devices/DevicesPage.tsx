import { Link } from "react-router-dom";
import { useStore } from "../../shared/store";
import { Card, SectionTitle } from "../../shared/components/Card";
import { Button } from "../../shared/components/Button";
import { EmptyState } from "../../shared/components/EmptyState";
import { DeviceKindIcon } from "../../shared/components/icons";
import { OnlineBadge } from "../../shared/components/OnlineBadge";
import { sendPairRequest, acceptIncomingRequest, hasIncomingPendingRequest } from "../../shared/services/connectCore";
import { connectionQuality, qualityLabel } from "../../shared/utils/device";
import { formatRelative } from "../../shared/utils/format";
import { useState, useEffect } from "react";

function PairButton({ deviceId }: { deviceId: string }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const notifications = useStore((s) => s.notifications);
  const hasActiveRequest = notifications.some(
    (n) => n.status === "pending" && n.direction === "sent"
  );
  const hasIncoming = hasIncomingPendingRequest(deviceId);
  const incomingNotif = notifications.find(
    (n) => n.deviceId === deviceId && n.status === "pending" && n.direction === "received"
  );

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  if (hasIncoming && incomingNotif) {
    const handleAccept = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setLoading(true);
      setError("");
      const result = await acceptIncomingRequest(incomingNotif.id);
      setLoading(false);
      if (!result.ok && result.error) setError(result.error);
    };

    const handleDecline = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      useStore.getState().updateNotification(incomingNotif.id, { status: "declined" });
    };

    return (
      <div className="flex flex-col gap-1">
        <div className="flex gap-1">
          <Button size="sm" variant="subtle" onClick={handleDecline}>
            Decline
          </Button>
          <Button size="sm" onClick={handleAccept} disabled={loading}>
            {loading ? "..." : "Accept"}
          </Button>
        </div>
        {error && <p className="text-xs text-rose-300">{error}</p>}
      </div>
    );
  }

  if (hasActiveRequest) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-300">
        Request pending
      </span>
    );
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading || cooldown > 0) return;
    setLoading(true);
    setError("");
    const result = await sendPairRequest(deviceId);
    setLoading(false);
    if (!result.ok && result.error) {
      setError(result.error);
    } else {
      setCooldown(60);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button size="sm" onClick={handleClick} disabled={loading}>
        {loading ? "Sending..." : "Pair"}
      </Button>
      {error && <p className="text-xs text-rose-300">{error}</p>}
      {cooldown > 0 && <p className="text-xs text-white/40">Cooldown: {cooldown}s</p>}
    </div>
  );
}

export function DevicesPage() {
  const devices = useStore((s) => s.devices);
  const trusted = useStore((s) => s.trusted);
  const trustedIds = new Set(trusted.map((t) => t.id));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Devices</h1>
        <p className="mt-1 text-sm text-white/50">
          Discovered nearby Relay devices on your local network.
        </p>
      </div>

      {devices.length === 0 ? (
        <Card>
          <SectionTitle title="Discovered devices" subtitle="Live" />
          <EmptyState
            icon={<DeviceKindIcon os="linux" className="h-8 w-8" />}
            title="Searching for devices"
            description="Relay is scanning your local network. Ensure other Relay instances are running on the same subnet."
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map((d, i) => {
            const isTrusted = trustedIds.has(d.id);
            const quality = connectionQuality(d);
            return (
              <Card key={d.id} className="group relative h-full hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.08] animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                <Link
                  to={`/devices/${d.id}`}
                  aria-label={`View ${d.name} details`}
                  className="absolute inset-0 z-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <div className="relative z-10 pointer-events-none flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white/80">
                    <DeviceKindIcon os={d.os} />
                  </div>
                  <OnlineBadge state={d.state} />
                </div>
                <div className="relative z-10 pointer-events-none mt-3">
                  <h3 className="text-base font-semibold text-white">{d.name}</h3>
                  <p className="text-xs capitalize text-white/45">
                    {d.type} · {d.os}
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <div>
                      <dt className="text-white/35">IP address</dt>
                      <dd className="mt-0.5 text-white/70">{d.ip}</dd>
                    </div>
                    <div>
                      <dt className="text-white/35">Last seen</dt>
                      <dd className="mt-0.5 text-white/70">{formatRelative(d.lastSeen)}</dd>
                    </div>
                    <div className="col-span-2 flex items-center justify-between">
                      <dt className="text-white/35">Connection quality</dt>
                      <dd className={`font-medium ${quality === "excellent" ? "text-emerald-300" : quality === "good" ? "text-sky-300" : quality === "fair" ? "text-amber-300" : "text-white/45"}`}>
                        {qualityLabel(quality)}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="relative z-10 mt-4 pointer-events-auto">
                  {isTrusted ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/15 px-2.5 py-1 text-xs font-medium text-brand-300">
                      Trusted
                    </span>
                  ) : (
                    <PairButton deviceId={d.id} />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
