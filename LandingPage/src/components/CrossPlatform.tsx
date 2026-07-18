import { detectOS } from "../config";

const platforms = [
  {
    name: "Windows",
    os: "windows" as const,
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/><path d="M3 12h18"/>
      </svg>
    ),
    supported: true,
  },
  {
    name: "Linux",
    os: "linux" as const,
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
      </svg>
    ),
    supported: true,
  },
  {
    name: "macOS",
    os: "macos" as const,
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 2v20"/>
      </svg>
    ),
    supported: false,
  },
];

export default function CrossPlatform() {
  const currentOS = detectOS();

  return (
    <section className="py-24 sm:py-32 border-t border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Cross-platform by design
          </h2>
          <p className="mt-4 text-zinc-400 text-lg max-w-2xl mx-auto">
            Install Relay on any combination of Windows and Linux machines.
            They will find each other instantly.
          </p>
        </div>

        <div className="mt-16 flex flex-wrap justify-center gap-8 sm:gap-12">
          {platforms.map((platform) => {
            const isDetected = currentOS === platform.os;
            return (
              <div
                key={platform.name}
                className="flex flex-col items-center gap-3"
              >
                <div
                  className={`size-20 sm:size-24 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    !platform.supported
                      ? "bg-white/[0.02] border border-white/[0.04] text-zinc-600 opacity-40"
                      : isDetected
                        ? "bg-relay-500/15 border-2 border-relay-500/30 text-relay-300"
                        : "glass glass-hover text-zinc-300"
                  }`}
                >
                  <div className={platform.supported ? "group-hover:scale-110 transition-transform duration-300" : ""}>
                    {platform.icon}
                  </div>
                </div>
                <span
                  className={`text-sm font-medium ${
                    !platform.supported
                      ? "text-zinc-600"
                      : isDetected
                        ? "text-relay-300"
                        : "text-zinc-300"
                  }`}
                >
                  {platform.name}
                  {!platform.supported && (
                    <span className="block text-xs font-normal text-zinc-600">Coming soon</span>
                  )}
                  {isDetected && platform.supported && (
                    <span className="block text-xs font-normal text-relay-400">Detected</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
