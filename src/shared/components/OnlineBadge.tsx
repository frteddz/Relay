import type { ConnectionState } from "../../core/types";

export function OnlineBadge({ state }: { state: ConnectionState }) {
  const online = state === "online" || state === "paired";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        online ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-white/40"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-400" : "bg-white/30"}`} />
      {online ? "Online" : "Offline"}
    </span>
  );
}
