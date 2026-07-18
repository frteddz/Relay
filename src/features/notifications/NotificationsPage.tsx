import { useEffect, useState, useCallback } from "react";
import { useStore } from "../../shared/store";
import { getApi } from "../../shared/ipc";
import { Card, SectionTitle } from "../../shared/components/Card";
import { Button } from "../../shared/components/Button";
import { EmptyState } from "../../shared/components/EmptyState";
import { BellIcon, DeviceKindIcon } from "../../shared/components/icons";
import type { NotificationItem } from "../../core/types";
import { formatRelative } from "../../shared/utils/format";

function NotificationCard({ item }: { item: NotificationItem }) {
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState("");
  const { updateNotification } = useStore.getState();
  const isExpired = item.status === "pending" && item.expiresAt <= now;
  const secondsLeft = item.status === "pending"
    ? Math.max(0, Math.ceil((item.expiresAt - now) / 1000))
    : 0;

  useEffect(() => {
    if (item.status !== "pending") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [item.status]);

  useEffect(() => {
    if (isExpired && item.status === "pending") {
      updateNotification(item.id, { status: "expired" });
    }
  }, [isExpired, item.id, item.status, updateNotification]);

  const handleAccept = useCallback(async () => {
    const api = getApi();
    const store = useStore.getState();
    const device = store.devices.find((d) => d.id === item.deviceId);
    if (!device || !api.pairing) {
      setError("Device not found.");
      return;
    }

    store.setTrusted([...store.trusted, { id: item.deviceId, name: item.deviceName, os: "unknown", pairedAt: Date.now(), lastConnected: Date.now() }]);
    store.updateDeviceState(item.deviceId, "paired");
    store.updateNotification(item.id, { status: "accepted" });

    await api.pairing.sendResponse({
      targetIp: device.ip,
      targetId: item.deviceId,
      requestId: item.id,
      accepted: true,
    });
  }, [item]);

  const handleDecline = useCallback(async () => {
    const api = getApi();
    const store = useStore.getState();
    const device = store.devices.find((d) => d.id === item.deviceId);
    if (!device || !api.pairing) {
      setError("Device not found.");
      return;
    }

    store.updateNotification(item.id, { status: "declined" });

    await api.pairing.sendResponse({
      targetIp: device.ip,
      targetId: item.deviceId,
      requestId: item.id,
      accepted: false,
    });
  }, [item]);

  const statusStyles: Record<string, string> = {
    pending: "text-amber-300 bg-amber-400/15",
    accepted: "text-emerald-300 bg-emerald-400/15",
    declined: "text-rose-300 bg-rose-400/15",
    expired: "text-white/45 bg-white/5",
  };

  const directionLabel = item.direction === "sent" ? "Sent" : "Received";

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 transition-all duration-300 animate-slide-up">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/70">
            <DeviceKindIcon os="linux" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{item.deviceName}</p>
            <p className="text-xs text-white/45">
              {directionLabel} · {formatRelative(item.createdAt)}
            </p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[item.status] ?? ""}`}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </span>
      </div>

      {item.status === "pending" && (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <p className="text-xs text-white/50">
              Expires in {secondsLeft}s
            </p>
            <div className="flex-1" />
            {item.direction === "received" && (
              <>
                <Button size="sm" variant="subtle" onClick={() => void handleDecline()}>
                  Decline
                </Button>
                <Button size="sm" onClick={() => void handleAccept()}>
                  Accept
                </Button>
              </>
            )}
          </div>
          {error && <p className="text-xs text-rose-300">{error}</p>}
        </div>
      )}
    </div>
  );
}

export function NotificationsPage() {
  const notifications = useStore((s) => s.notifications);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Notifications</h1>
        <p className="mt-1 text-sm text-white/50">
          Pairing requests and device activity.
        </p>
      </div>

      <Card>
        <SectionTitle
          title="Pairing requests"
          subtitle={`${notifications.length} total`}
        />
        {notifications.length === 0 ? (
          <EmptyState
            icon={<BellIcon className="h-8 w-8" />}
            title="No notifications yet"
            description="Pairing requests from nearby devices will appear here."
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((n, i) => (
              <div key={n.id} style={{ animationDelay: `${i * 50}ms` }}>
                <NotificationCard item={n} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
