import { NavLink } from "react-router-dom";
import { cn } from "../utils/format";
import { useStore } from "../store";
import { BoltIcon, BellIcon, ClipboardIcon, FileIcon, MonitorIcon, SettingsIcon } from "../components/icons";

const nav = [
  { to: "/", label: "Dashboard", icon: BoltIcon, end: true },
  { to: "/devices", label: "Devices", icon: MonitorIcon },
  { to: "/notifications", label: "Notifications", icon: BellIcon },
  { to: "/clipboard", label: "Clipboard", icon: ClipboardIcon },
  { to: "/transfer", label: "Transfer", icon: FileIcon },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function Sidebar() {
  const unreadCount = useStore((s) => s.notifications.filter((n) => n.status === "pending").length);

  return (
    <aside className="z-20 flex w-full shrink-0 flex-row items-center gap-2 border-b border-white/10 bg-black/30 p-3 backdrop-blur-xl md:w-60 md:flex-col md:items-stretch md:border-b-0 md:border-r md:p-4">
      <div className="mr-auto flex items-center gap-2 px-1 md:mb-6 md:px-2 md:pt-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 shadow-lg shadow-brand-500/30 transition-transform duration-300 hover:rotate-6">
          <BoltIcon className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-white">Relay</span>
      </div>

      <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex-col md:items-stretch">
        {nav.map(({ to, label, icon: Icon, end }, i) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={{ animationDelay: `${i * 60}ms` }}
            className={({ isActive }) =>
              cn(
                "group flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 md:gap-3 md:py-2.5 animate-slide-in-left",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/55 hover:bg-white/5 hover:text-white/90"
              )
            }
          >
            <Icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
            <span className="hidden md:inline">{label}</span>
            {to === "/notifications" && unreadCount > 0 && (
              <span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-black md:ml-0">
                {unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto hidden rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/50 md:block">
        <p className="font-medium text-white/70">Local-first</p>
        <p>No cloud. No accounts.</p>
      </div>
    </aside>
  );
}
