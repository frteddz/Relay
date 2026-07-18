const items = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    title: "Local-first",
    description: "Everything stays on your network. No data touches external servers — your privacy is built in.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
    title: "Zero config",
    description: "Install and connect. Relay automatically discovers devices on your network — no setup required.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
        <line x1="6" y1="6" x2="6" y2="6"/>
        <line x1="6" y1="18" x2="6" y2="18"/>
      </svg>
    ),
    title: "Multi-platform",
    description: "Windows and Linux, with a consistent experience across every device you own.",
  },
];

export default function Overview() {
  return (
    <section id="overview" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            The private device mesh
          </h2>
          <p className="mt-4 text-zinc-400 text-lg max-w-2xl mx-auto">
            Relay creates a secure peer-to-peer network between your devices,
            enabling seamless communication without relying on any cloud
            infrastructure.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.title}
              className="glass rounded-2xl p-8 glass-hover group"
            >
              <div className="size-12 rounded-xl bg-relay-500/10 text-relay-400 flex items-center justify-center mb-5 group-hover:bg-relay-500/20 transition-colors">
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
