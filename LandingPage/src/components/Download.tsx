const downloads = [
  {
    platform: "Windows 10/11",
    arch: "x64",
    format: ".exe",
    url: "#",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/><path d="M3 12h18"/>
      </svg>
    ),
  },
  {
    platform: "Linux",
    arch: "x64",
    format: ".deb",
    url: "#",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
      </svg>
    ),
  },
  {
    platform: "Web",
    arch: "Browser",
    format: "Web App",
    url: "#",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  },
];

export default function Download() {
  return (
    <section id="download" className="py-24 sm:py-32 border-t border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Download Relay
          </h2>
          <p className="mt-4 text-zinc-400 text-lg max-w-2xl mx-auto">
            Choose your platform. Get started in seconds.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
          {downloads.map((dl) => (
            <a
              key={dl.platform}
              href={dl.url}
              className="glass rounded-2xl p-8 glass-hover group text-center"
            >
              <div className="size-16 mx-auto rounded-2xl bg-relay-500/10 text-relay-400 flex items-center justify-center mb-5 group-hover:bg-relay-500/20 group-hover:scale-110 transition-all duration-300">
                {dl.icon}
              </div>
              <h3 className="text-lg font-semibold mb-1">{dl.platform}</h3>
              <p className="text-sm text-zinc-500 mb-4">{dl.arch} &middot; {dl.format}</p>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-relay-400 group-hover:text-relay-300 transition-colors">
                Download
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </span>
            </a>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-zinc-600">
          All releases are signed. v0.1.0 &middot;{" "}
          <a href="#" className="underline hover:text-zinc-400 transition-colors">View all releases on GitHub</a>
        </p>
      </div>
    </section>
  );
}
