import { useState } from "react";

const versions = [
  {
    version: "0.1.3-A",
    date: "July 19, 2026",
    tag: "Alpha",
    tagColor: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    changes: [
      {
        type: "Added",
        items: [
          "Embedded signaling server — auto-starts on Electron launch",
          "Signaling server URL broadcast in UDP beacons",
          "Mobile slide-out navigation drawer replacing bottom tab bar",
          "History page with pairing, transfer, and clipboard logs",
          "Android camera and network permissions for QR scanning",
          "HTTP discovery endpoint on signaling server",
          "Camera detection, multi-camera selector, and no-camera fallback for desktop QR scanning",
        ],
      },
      {
        type: "Fixed",
        items: [
          "Android cannot discover Desktop (signaling server not auto-started)",
          "Camera permission not requested on Android (missing from manifest)",
          "Signaling not available error on Desktop (server not running)",
          "WebSocket errors silently swallowed — added connection status callback",
          "QR scan not updating signaling URL on target device",
          "Version strings inconsistent across codebase",
          "Android build missing ANDROID_HOME in npm script",
          "Clipboard sync not writing to system clipboard on Electron",
        ],
      },
      {
        type: "Changed",
        items: [
          "DeviceBeacon includes optional serverUrl field",
          "WebMdnsTransport saves/restores signaling URL from localStorage",
          "PairingPage QR scan auto-configures connection URL",
          "CoreContext exposes updateSignalingUrl method",
        ],
      },
    ],
  },
  {
    version: "0.1.2-A",
    date: "July 18, 2026",
    tag: "Alpha",
    tagColor: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    changes: [
      {
        type: "Added",
        items: [
          "Android support via Capacitor with adaptive app icon",
          "QR code pairing — scan to pair instantly",
          "Camera QR scanning with real-time feedback",
          "4-digit numeric pairing code with 60-second expiry",
          "Targeted signal delivery for secure code-based pairing",
          "Configurable signaling server URL in Settings",
          "Landing page Versions link to GitHub Releases",
          "Single-command build for all platforms (deb + exe + APK)",
        ],
      },
      {
        type: "Fixed",
        items: [
          "Clipboard sync not writing to system clipboard on Electron",
          "Clipboard sync Capacitor detection for reliable performance",
          "Clipboard sync retry logic with exponential backoff",
          "Android build missing ANDROID_HOME environment variable",
          "QR codes now include short pairing code for auto-verify",
          "pair-verify signals now have handlers on the receiving device",
          "Landing page download URLs pointing to correct release assets",
        ],
      },
      {
        type: "Changed",
        items: [
          "PairingPage redesigned with three tabs: Show Code, Scan QR, Enter Code",
          "Short code lifecycle managed through CoreContext",
        ],
      },
    ],
  },
  {
    version: "0.1.1-dev",
    date: "July 17, 2026",
    tag: "Dev Build",
    tagColor: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
    note: "Broken on mobile. Never publicly released.",
    changes: [
      {
        type: "Added",
        items: [
          "Capacitor setup for Android builds",
          "Multi-instance dev mode (MI1–MI6)",
          "Custom title bar with window controls",
          "Light/dark theme system with persistence",
          "Animated loading screen on startup",
          "WebSocket signaling server with room management",
          "Cross-platform clipboard sync via IPC and WebSocket",
          "TCP file transfers with real-time progress",
          "Desktop notifications for pairing, files, and clipboard",
          "First-run Terms & Conditions with scroll-to-accept",
          "Pairing state persistence across restarts",
        ],
      },
      {
        type: "Fixed",
        items: [
          "Same-IP device discovery filter",
          "Pairing lifecycle trust propagation",
          "Clipboard sync not writing to system clipboard",
          "Toggle switch thumb alignment",
        ],
      },
      {
        type: "Changed",
        items: [
          "Signaling architecture reworked from unicast to multicast",
          "IPC chain updated with targetId for pairing requests",
        ],
      },
    ],
  },
  {
    version: "0.1.0",
    date: "July 16, 2026",
    tag: "Initial Release",
    tagColor: "bg-relay-500/15 text-relay-400 border-relay-500/20",
    changes: [
      {
        type: "Added",
        items: [
          "Electron desktop app with cross-platform support",
          "UDP multicast LAN device discovery",
          "Full IPC bridge for all core services",
          "Secure code-based pairing with constant-time comparison",
          "File transfer manager with progress tracking",
          "Clipboard sync with local history",
          "Desktop notifications for pairing, files, and clipboard",
          "Settings page with device name, theme, and discovery toggle",
          "Landing page with features, FAQ, and download links",
          "Linux .deb and Windows .exe installers",
        ],
      },
    ],
  },
];

const changeTypeColors: Record<string, string> = {
  Added: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  Fixed: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  Changed: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  Removed: "bg-rose-500/15 text-rose-400 border-rose-500/20",
};

const changeTypeIcons: Record<string, string> = {
  Added: "+",
  Fixed: "\u2713",
  Changed: "~",
  Removed: "\u2013",
};

export default function Changelog() {
  const [expanded, setExpanded] = useState<string | null>(versions[0].version);

  return (
    <section id="changelog" className="py-24 sm:py-32 border-t border-white/[0.06]">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Changelog
          </h2>
          <p className="mt-4 text-zinc-400 text-lg">
            What's new in each release.
          </p>
        </div>

        <div className="mt-16 relative">
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-white/[0.06]" aria-hidden="true" />

          <div className="space-y-2">
            {versions.map((ver) => {
              const isOpen = expanded === ver.version;
              return (
                <div key={ver.version} className="relative pl-12">
                  <div
                    className={`absolute left-2.5 top-5 size-[10px] rounded-full border-2 transition-colors duration-300 ${
                      isOpen
                        ? "bg-relay-500 border-relay-400 shadow-[0_0_8px_rgba(108,99,255,0.4)]"
                        : "bg-[#0a0a0b] border-white/20"
                    }`}
                    aria-hidden="true"
                  />

                  <button
                    onClick={() => setExpanded(isOpen ? null : ver.version)}
                    aria-expanded={isOpen}
                    className="w-full text-left"
                  >
                    <div className="glass rounded-2xl px-6 py-5 glass-hover group">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold">v{ver.version}</h3>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${ver.tagColor}`}>
                          {ver.tag}
                        </span>
                        <span className="text-xs text-zinc-500 ml-auto hidden sm:block">{ver.date}</span>
                      </div>
                      <span className="text-xs text-zinc-500 sm:hidden mt-1 block">{ver.date}</span>
                      {"note" in ver && ver.note && (
                        <p className="mt-2 text-xs text-zinc-500 italic">{ver.note}</p>
                      )}
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${
                      isOpen ? "max-h-[2000px] opacity-100 mt-3" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="glass rounded-2xl p-6 space-y-6">
                      {ver.changes.map((group) => (
                        <div key={group.type}>
                          <div className="flex items-center gap-2 mb-3">
                            <span
                              className={`size-5 rounded-md border text-xs font-bold flex items-center justify-center ${changeTypeColors[group.type]}`}
                              aria-hidden="true"
                            >
                              {changeTypeIcons[group.type]}
                            </span>
                            <span className={`text-sm font-semibold ${changeTypeColors[group.type]?.split(" ").find(c => c.startsWith("text-")) ?? "text-zinc-300"}`}>
                              {group.type}
                            </span>
                          </div>
                          <ul className="space-y-2 pl-7">
                            {group.items.map((item, i) => (
                              <li key={i} className="text-sm text-zinc-400 leading-relaxed relative">
                                <span className="absolute -left-5 top-1.5 w-1 h-1 rounded-full bg-zinc-600" aria-hidden="true" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
