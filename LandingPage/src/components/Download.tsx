import { downloads, detectOS } from "../config";

export default function Download() {
  const os = detectOS();

  return (
    <section id="download" className="py-24 sm:py-32 border-t border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Download Relay
          </h2>
          <p className="mt-4 text-zinc-400 text-lg max-w-2xl mx-auto">
            Available for Windows, Linux, and Android. Your download is highlighted below.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
          {downloads.map((dl) => {
            const isDetected = os === dl.os;
            return (
              <a
                key={dl.platform}
                href={dl.url || "#download"}
                aria-label={`Download Relay for ${dl.platform}`}
                className={`relative rounded-2xl p-8 text-center transition-all duration-300 group ${
                  isDetected
                    ? "bg-relay-500/10 border-2 border-relay-500/40 hover:border-relay-500/60"
                    : "glass glass-hover"
                }`}
                style={!dl.url ? { pointerEvents: "none" as const, opacity: 0.7 } : undefined}
              >
                {isDetected && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-medium px-3 py-0.5 rounded-full bg-relay-500 text-white">
                    Recommended
                  </span>
                )}
                <div
                  className={`size-16 mx-auto rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 ${
                    isDetected
                      ? "bg-relay-500/20 text-relay-300"
                      : "bg-relay-500/10 text-relay-400 group-hover:bg-relay-500/20"
                  } group-hover:scale-110`}
                >
                  {dl.icon}
                </div>
                <h3 className="text-lg font-semibold mb-1">{dl.platform}</h3>
                <p className="text-sm text-zinc-500 mb-4">
                  {dl.arch} &middot; {dl.format}
                </p>
                {dl.url ? (
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-relay-400 group-hover:text-relay-300 transition-colors">
                    Download
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </span>
                ) : (
                  <span className="text-sm text-zinc-600">Not yet published</span>
                )}
              </a>
            );
          })}

          <div className="glass rounded-2xl p-8 text-center opacity-50">
            <div className="size-16 mx-auto rounded-2xl bg-zinc-500/10 text-zinc-600 flex items-center justify-center mb-5">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 2v20"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-1 text-zinc-500">macOS</h3>
            <p className="text-sm text-zinc-600">Coming soon</p>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-zinc-600">
          All releases are signed.{" "}
          <a
            href="https://github.com/frteddz/Relay/releases"
            className="underline hover:text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relay-500 rounded"
          >
            View all releases on GitHub
          </a>
        </p>
      </div>
    </section>
  );
}
