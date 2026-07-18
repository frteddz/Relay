import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TitleBar } from "./TitleBar";
import { connectCore } from "../services/connectCore";
import { useStore } from "../store";

export function AppShell() {
  useEffect(() => {
    const theme = useStore.getState().settings.theme;
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.style.colorScheme = theme;

    connectCore();
  }, []);

  const devices = useStore((s) => s.devices);
  const online = devices.filter((d) => d.state === "online" || d.state === "paired").length;
  const status = online > 0 ? "online" : "offline";

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#0b0d12] text-white">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(99,102,241,0.18),transparent)]" />
      <div className="relative z-10 flex h-full w-full flex-col">
        <TitleBar />
        <div className="flex flex-1 overflow-hidden md:flex-row">
          <Sidebar />
          <main className="relative flex-1 overflow-y-auto">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-black/30 px-4 py-3 backdrop-blur-xl sm:px-6 md:px-8 md:py-4">
              <div className="flex items-center gap-3 text-sm text-white/60">
                <span
                  className={`h-2 w-2 rounded-full ${
                    status === "online"
                      ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                      : "bg-white/30"
                  }`}
                />
                <span>
                  {status === "online"
                    ? `Local network · ${online} online`
                    : "Discovering devices…"}
                </span>
              </div>
              <span className="hidden text-xs text-white/40 sm:inline">v0.1.0 · local-first</span>
            </header>
            <div className="animate-fade-in p-4 sm:p-6 md:p-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
