const screenshots = [
  { label: "Dashboard", color: "from-relay-500/20 to-purple-500/20" },
  { label: "Devices", color: "from-blue-500/20 to-cyan-500/20" },
  { label: "Clipboard", color: "from-purple-500/20 to-pink-500/20" },
  { label: "Transfers", color: "from-emerald-500/20 to-teal-500/20" },
];

export default function Screenshots() {
  return (
    <section className="py-24 sm:py-32 border-t border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            See it in action
          </h2>
          <p className="mt-4 text-zinc-400 text-lg max-w-2xl mx-auto">
            A clean, modern interface designed for productivity.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          {screenshots.map((s) => (
            <div
              key={s.label}
              className="glass rounded-2xl overflow-hidden group cursor-pointer"
            >
              <div
                className={`aspect-video bg-gradient-to-br ${s.color} flex items-center justify-center transition-all duration-500 group-hover:scale-[1.02]`}
              >
                <div className="text-center">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-zinc-500 mx-auto mb-3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <p className="text-zinc-500 text-sm font-medium">{s.label}</p>
                </div>
              </div>
              <div className="px-5 py-4 border-t border-white/[0.06]">
                <p className="text-sm text-zinc-300 font-medium">{s.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Screenshot placeholder
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
