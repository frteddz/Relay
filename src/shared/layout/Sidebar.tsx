import { useState, useEffect, useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "../utils/format";
import { useStore } from "../store";
import { BoltIcon, BellIcon, ClipboardIcon, FileIcon, MonitorIcon, SettingsIcon, LinkIcon, ClockIcon } from "../components/icons";

const nav = [
  { to: "/", label: "Dashboard", icon: BoltIcon, end: true },
  { to: "/devices", label: "Devices", icon: MonitorIcon },
  { to: "/pair", label: "Pair", icon: LinkIcon },
  { to: "/notifications", label: "Notifications", icon: BellIcon },
  { to: "/clipboard", label: "Clipboard", icon: ClipboardIcon },
  { to: "/transfer", label: "Transfer", icon: FileIcon },
  { to: "/history", label: "History", icon: ClockIcon },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function Sidebar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const unreadCount = useStore((s) => s.notifications.filter((n) => n.status === "pending").length);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

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

      {/* Mobile hamburger button — rendered in AppShell header */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed left-3 top-[4.25rem] z-40 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur-xl md:hidden"
        aria-label="Open navigation"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-[#0d0f14] backdrop-blur-xl transition-transform duration-300 ease-out md:hidden",
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 shadow-lg shadow-brand-500/30">
              <BoltIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">Relay</span>
          </div>
          <button
            onClick={closeDrawer}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Close navigation"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-1 flex-col items-stretch gap-1 px-3 pb-4">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/55 hover:bg-white/5 hover:text-white/90 active:bg-white/10"
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
              {to === "/notifications" && unreadCount > 0 && (
                <span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-black">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mx-3 mb-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/50">
          <p className="font-medium text-white/70">Local-first</p>
          <p>No cloud. No accounts.</p>
        </div>
      </aside>
    </>
  );
}
