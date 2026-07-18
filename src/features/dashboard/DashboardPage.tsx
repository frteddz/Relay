import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../../shared/store";
import { Card, SectionTitle } from "../../shared/components/Card";
import { Button } from "../../shared/components/Button";
import { EmptyState } from "../../shared/components/EmptyState";
import { OnlineBadge } from "../../shared/components/OnlineBadge";
import { sendPairRequest, acceptIncomingRequest, hasIncomingPendingRequest } from "../../shared/services/connectCore";
import {
  BoltIcon,
  ClipboardIcon,
  FileIcon,
  MonitorIcon,
  DeviceKindIcon,
} from "../../shared/components/icons";

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
      <div className="flex flex-col items-end gap-0.5">
        <div className="flex gap-1">
          <Button size="sm" variant="subtle" onClick={handleDecline}>
            Decline
          </Button>
          <Button size="sm" onClick={handleAccept} disabled={loading}>
            {loading ? "..." : "Accept"}
          </Button>
        </div>
        {error && <p className="text-[10px] text-rose-300">{error}</p>}
      </div>
    );
  }

  if (hasActiveRequest) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-300">
        Pending
      </span>
    );
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading || cooldown > 0 || hasActiveRequest) return;
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
    <div className="flex flex-col items-end gap-0.5">
      <Button size="sm" onClick={handleClick} disabled={loading}>
        {loading ? "..." : "Pair"}
      </Button>
      {error && <p className="text-[10px] text-rose-300">{error}</p>}
      {cooldown > 0 && <p className="text-[10px] text-white/40">{cooldown}s</p>}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="flex items-center gap-4 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08] animate-slide-up">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-300">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold text-white">{value}</p>
        <p className="text-xs uppercase tracking-wide text-white/45">{label}</p>
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const devices = useStore((s) => s.devices);
  const transfers = useStore((s) => s.transfers);
  const clipboardHistory = useStore((s) => s.clipboardHistory);
  const trusted = useStore((s) => s.trusted);
  const trustedIds = useMemo(() => new Set(trusted.map((t) => t.id)), [trusted]);
  const onlineCount = useMemo(
    () => devices.filter((d) => d.state === "online" || d.state === "paired").length,
    [devices]
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-white/50">
          Your local device network at a glance.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Connected" value={onlineCount} icon={<MonitorIcon />} />
        <StatCard label="Discovered" value={devices.length} icon={<BoltIcon />} />
        <StatCard label="Transfers" value={transfers.length} icon={<FileIcon />} />
        <StatCard label="Clipboard" value={clipboardHistory.length} icon={<ClipboardIcon />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle title="Connected devices" subtitle="Discovered on your local network" />
          {devices.length === 0 ? (
            <EmptyState
              icon={<MonitorIcon className="h-8 w-8" />}
              title="Searching for devices"
              description="Relay is scanning your local network for other devices. Make sure other instances are running on the same network."
            />
          ) : (
            <div className="space-y-2">
              {devices.map((d) => (
                <Link
                  key={d.id}
                  to={`/devices/${d.id}`}
                  className="group flex items-center justify-between rounded-xl bg-white/5 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/80 transition-transform duration-200 group-hover:scale-105">
                      <DeviceKindIcon os={d.os} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{d.name}</p>
                      <p className="text-xs text-white/45">{d.ip}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <OnlineBadge state={d.state} />
                    {trustedIds.has(d.id) ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/15 px-2 py-0.5 text-[11px] font-medium text-brand-300">
                        Trusted
                      </span>
                    ) : (
                      <PairButton deviceId={d.id} />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle title="Recent activity" subtitle="Live" />
          {transfers.length || clipboardHistory.length ? (
            <div className="space-y-3 text-sm text-white/55">
              {transfers.length > 0 && <p>{transfers.length} file transfer{transfers.length === 1 ? "" : "s"}</p>}
              {clipboardHistory.length > 0 && <p>{clipboardHistory.length} clipboard item{clipboardHistory.length === 1 ? "" : "s"}</p>}
            </div>
          ) : (
            <EmptyState title="Nothing yet" description="Your local activity will appear here." className="py-7" />
          )}
        </Card>
      </div>
    </div>
  );
}
