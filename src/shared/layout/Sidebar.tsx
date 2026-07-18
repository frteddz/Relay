import { NavLink } from "react-router-dom";
import { cn } from "../utils/format";
import { useStore } from "../store";
import { BoltIcon, BellIcon, ClipboardIcon, FileIcon, MonitorIcon, SettingsIcon, LinkIcon } from "../components/icons";

const nav = [
  { to: "/", label: "Dashboard", icon: BoltIcon, end: true },
  { to: "/devices", label: "Devices", icon: MonitorIcon },
  { to: "/pair", label: "Pair", icon: LinkIcon },
  { to: "/notifications", label: "Notifications", icon: BellIcon },
  { to: "/clipboard", label: "Clipboard", icon: ClipboardIcon },
  { to: "/transfer", label: "Transfer", icon: FileIcon },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function Sidebar() {
  const unreadCount = useStore((s) => s.notifications.filter((n) => n.status === "pending").length);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="z-20 hidden w-60 shrink-0 flex-col items-stretch border-r border-white/10 bg-black/30 p-4 backdrop-blur-xl md:flex">
        <div className="mb-6 flex items-center gap-2 px-2 pt-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 shadow-lg shadow-brand-500/30 transition-transform duration-300 hover:rotate-6">
            <BoltIcon className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">Relay</span>
        </div>

        <nav className="flex flex-col items-stretch gap-1">
          {nav.map(({ to, label, icon: Icon, end }, i) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={{ animationDelay: `${i * 60}ms` }}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 animate-slide-in-left",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/55 hover:bg-white/5 hover:text-white/90"
                )
              }
            >
              <Icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
              <span>{label}</span>
              {to === "/notifications" && unreadCount > 0 && (
                <span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-black">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/50">
          <p className="font-medium text-white/70">Local-first</p>
          <p>No cloud. No accounts.</p>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch justify-around border-t border-white/10 bg-black/80 backdrop-blur-xl md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors duration-200",
                isActive
                  ? "text-brand-400"
                  : "text-white/45 active:text-white/70"
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
            {to === "/notifications" && unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[8px] font-bold text-black">
                {unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
